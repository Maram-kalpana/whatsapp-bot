const { Op } = require("sequelize");
const { Job, Campaign, Contact, Template, DripStep, WhatsappNumber, Business } = require("../models");
const {
  sendTemplate,
  findOrCreateConversation,
  countSentToday,
  resolveWaNumber,
} = require("../lib/messaging");
const { bodyComponents } = require("../modules/inbox/inbox.service");
const { languageCode } = require("../lib/meta");
const { emitToBusiness } = require("../lib/realtime");
const { assertCanSend, deductForMessage } = require("../lib/wallet");

const POLL_MS = 4000;
const BATCH = 15;

function dailyCap(tier) {
  if (tier === "unlimited") return Number.MAX_SAFE_INTEGER;
  if (tier === "1k") return 1000;
  if (tier === "10k") return 10000;
  if (tier === "100k") return 100000;
  const n = Number(tier);
  return Number.isFinite(n) && n > 0 ? n : 250;
}

function nextMidnight() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 1, 0, 0);
  return d;
}

async function maybeCompleteCampaign(campaignId) {
  if (!campaignId) return;
  const open = await Job.count({
    where: { campaign_id: campaignId, status: { [Op.in]: ["pending", "processing"] } },
  });
  if (open > 0) return;
  const campaign = await Campaign.findByPk(campaignId);
  if (!campaign || campaign.status === "completed") return;
  campaign.status = campaign.sent_count === 0 ? "failed" : "completed";
  await campaign.save();
  emitToBusiness(campaign.business_id, "campaign:updated", { campaignId: campaign.id, status: campaign.status });
}

async function chainNextDripStep(job, campaign) {
  const payload = job.payload || {};
  const currentOrder = Number(payload.step_order) || 1;
  const next = await DripStep.findOne({
    where: { campaign_id: campaign.id, step_order: currentOrder + 1 },
  });
  if (!next) return;
  const runAfter = new Date(Date.now() + (next.delay_minutes || 0) * 60 * 1000);
  await Job.create({
    type: "send_drip_message",
    campaign_id: campaign.id,
    payload: {
      ...payload,
      template_id: next.template_id,
      drip_step_id: next.id,
      step_order: next.step_order,
    },
    status: "pending",
    run_after: runAfter,
    attempts: 0,
  });
}

async function dispatchSend(job) {
  const payload = job.payload || {};
  const campaign = await Campaign.findByPk(payload.campaign_id || job.campaign_id);
  if (!campaign) throw new Error("Campaign not found");

  const business = await Business.findByPk(campaign.business_id);
  const wa =
    (payload.whatsapp_number_id && (await WhatsappNumber.findByPk(payload.whatsapp_number_id))) ||
    (await resolveWaNumber({ businessId: campaign.business_id }));

  const cap = dailyCap(business?.daily_limit_tier);
  const sentToday = await countSentToday(wa.id);
  if (sentToday >= cap) {
    await job.update({
      status: "pending",
      run_after: nextMidnight(),
      attempts: job.attempts + 1,
    });
    return;
  }

  const contact = await Contact.findByPk(payload.contact_id);
  const template = await Template.findByPk(payload.template_id || campaign.template_id);
  if (!contact || !template) throw new Error("Contact or template missing");

  await assertCanSend(campaign.business_id);

  const conversation = await findOrCreateConversation(campaign.business_id, contact, wa);
  await sendTemplate({
    businessId: campaign.business_id,
    conversation,
    contact,
    wa,
    templateName: template.name,
    language: languageCode(template.language),
    components: bodyComponents(template, contact),
    extraContent: { campaign_id: campaign.id, drip_step_id: payload.drip_step_id || null },
    campaign_id: campaign.id,
  });

  await deductForMessage(campaign.business_id);
  emitToBusiness(campaign.business_id, "wallet:updated", {});

  campaign.sent_count += 1;
  await campaign.save();
  emitToBusiness(campaign.business_id, "campaign:updated", {
    campaignId: campaign.id,
    sent_count: campaign.sent_count,
    status: campaign.status,
  });

  await job.update({ status: "done", attempts: job.attempts + 1 });

  if (job.type === "send_drip_message") {
    await chainNextDripStep(job, campaign);
  }

  await maybeCompleteCampaign(campaign.id);
}

async function processJob(job) {
  if (job.type === "send_broadcast_message" || job.type === "send_drip_message") {
    await dispatchSend(job);
    return;
  }
  await job.update({ status: "done", attempts: job.attempts + 1 });
}

async function pollJobs() {
  const due = await Job.findAll({
    where: {
      status: "pending",
      run_after: { [Op.lte]: new Date() },
    },
    limit: BATCH,
    order: [["id", "ASC"]],
  });

  for (const job of due) {
    const [claimed] = await Job.update(
      { status: "processing" },
      { where: { id: job.id, status: "pending" } },
    );
    if (!claimed) continue;
    await job.reload();
    try {
      await processJob(job);
    } catch (err) {
      await job.update({ status: "failed", attempts: job.attempts + 1 });
      if (job.campaign_id) {
        const campaign = await Campaign.findByPk(job.campaign_id);
        if (campaign) {
          campaign.failed_count += 1;
          await campaign.save();
          emitToBusiness(campaign.business_id, "campaign:updated", {
            campaignId: campaign.id,
            failed_count: campaign.failed_count,
          });
          await maybeCompleteCampaign(campaign.id);
        }
      }
      console.error("Job failed", job.id, err.message);
    }
  }
}

function isMissingTable(err) {
  const msg = String(err?.message || "");
  return err?.original?.code === "ER_NO_SUCH_TABLE" || msg.includes("doesn't exist");
}

let missingTableLogged = false;

function startJobWorker() {
  const tick = () =>
    pollJobs().catch((err) => {
      if (isMissingTable(err)) {
        if (!missingTableLogged) {
          missingTableLogged = true;
          console.error("Job worker waiting: run `npm run db:migrate` in backend (jobs table missing).");
        }
        return;
      }
      console.error("Job poll error", err.message);
    });
  setInterval(tick, POLL_MS);
  tick();
}

module.exports = { startJobWorker, pollJobs };
