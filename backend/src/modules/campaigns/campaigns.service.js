const fs = require("fs");
const { Op } = require("sequelize");
const {
  Campaign,
  DripStep,
  Template,
  Contact,
  ContactGroup,
  ContactGroupMember,
  Job,
} = require("../../models");
const { HttpError } = require("../../utils/httpError");
const { parseCsv, digitsPhone } = require("../../lib/csv");
const { resolveWaNumber } = require("../../lib/messaging");

function parseSteps(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function publicCampaign(row) {
  const template = row.Template;
  const steps = row.DripSteps || [];
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    template_id: row.template_id,
    template: template ? { id: template.id, name: template.name, status: template.status, body: template.body } : null,
    recipient_source: row.recipient_source,
    recipient_group_id: row.recipient_group_id,
    schedule_type: row.schedule_type,
    scheduled_at: row.scheduled_at,
    status: row.status,
    last_error: row.last_error || null,
    recipient_count: row.recipient_count,
    sent_count: row.sent_count,
    delivered_count: row.delivered_count,
    read_count: row.read_count,
    failed_count: row.failed_count,
    steps: steps
      .slice()
      .sort((a, b) => a.step_order - b.step_order)
      .map((s) => ({
        id: s.id,
        step_order: s.step_order,
        delay_minutes: s.delay_minutes,
        template_id: s.template_id,
        template: s.Template ? { id: s.Template.id, name: s.Template.name } : null,
      })),
  };
}

function runAfterDate(scheduleType, scheduledAt) {
  if (scheduleType === "scheduled") {
    const when = new Date(scheduledAt);
    if (Number.isNaN(when.getTime())) throw new HttpError(400, "Invalid schedule datetime");
    return when;
  }
  return new Date();
}

async function resolveRecipients(businessId, { recipient_source, recipient_group_id, file }) {
  if (recipient_source === "all_contacts") {
    return Contact.findAll({ where: { business_id: businessId }, order: [["id", "ASC"]] });
  }

  if (recipient_source === "group") {
    const group = await ContactGroup.findOne({ where: { id: recipient_group_id, business_id: businessId } });
    if (!group) throw new HttpError(404, "Group not found");
    const members = await ContactGroupMember.findAll({ where: { group_id: group.id } });
    const ids = members.map((m) => m.contact_id);
    if (!ids.length) return [];
    return Contact.findAll({ where: { id: { [Op.in]: ids }, business_id: businessId } });
  }

  if (recipient_source === "csv_upload") {
    if (!file?.path) throw new HttpError(400, "CSV file is required");
    const text = fs.readFileSync(file.path, "utf8");
    const { headers, records } = parseCsv(text);
    const phoneKey =
      headers.find((h) => /phone|whatsapp|mobile|wa/i.test(h)) ||
      headers.find((h) => /number/i.test(h));
    const nameKey = headers.find((h) => /name/i.test(h));
    if (!phoneKey) throw new HttpError(400, "CSV must include a phone / WhatsApp number column");

    const seen = new Map();
    for (const rec of records) {
      const phone_number = digitsPhone(rec[phoneKey]);
      if (!phone_number || seen.has(phone_number)) continue;
      let contact = await Contact.findOne({ where: { business_id: businessId, phone_number } });
      if (!contact) {
        contact = await Contact.create({
          business_id: businessId,
          name: (nameKey && rec[nameKey]) || phone_number,
          phone_number,
          source: "campaign_csv",
        });
      }
      seen.set(phone_number, contact);
    }
    return [...seen.values()];
  }

  throw new HttpError(400, "Invalid recipient source");
}

async function enqueueJobs({ campaign, contacts, wa, type, templateId, firstStep, runAfter }) {
  const rows = contacts.map((contact) => ({
    type,
    campaign_id: campaign.id,
    payload: {
      business_id: campaign.business_id,
      campaign_id: campaign.id,
      contact_id: contact.id,
      template_id: templateId,
      whatsapp_number_id: wa.id,
      drip_step_id: firstStep?.id || null,
      step_order: firstStep?.step_order || 1,
    },
    status: "pending",
    run_after: runAfter,
    attempts: 0,
  }));

  const chunk = 400;
  for (let i = 0; i < rows.length; i += chunk) {
    await Job.bulkCreate(rows.slice(i, i + chunk));
  }
}

async function list(businessId, { type, q }) {
  const where = { business_id: businessId };
  if (type) where.type = type;
  if (q) where.name = { [Op.like]: `%${q}%` };
  const rows = await Campaign.findAll({
    where,
    include: [
      { model: Template, required: false },
      { model: DripStep, required: false, separate: true, include: [{ model: Template, required: false }] },
    ],
    order: [["id", "DESC"]],
  });
  return rows.map(publicCampaign);
}

async function getById(businessId, id) {
  const row = await Campaign.findOne({
    where: { id, business_id: businessId },
    include: [
      { model: Template, required: false },
      { model: DripStep, required: false, separate: true, include: [{ model: Template, required: false }] },
    ],
  });
  if (!row) throw new HttpError(404, "Campaign not found");
  return publicCampaign(row);
}

async function createBroadcast(businessId, body, file) {
  const template = await Template.findOne({ where: { id: body.template_id, business_id: businessId } });
  if (!template) throw new HttpError(404, "Template not found");
  const wa = await resolveWaNumber({ businessId });

  const contacts = await resolveRecipients(businessId, body.recipient_source === "csv_upload" ? { ...body, file } : body);
  if (!contacts.length) throw new HttpError(400, "No recipients found");

  const scheduledAt = runAfterDate(body.schedule_type, body.scheduled_at);
  const campaign = await Campaign.create({
    business_id: businessId,
    name: body.name.trim(),
    type: "broadcast",
    template_id: template.id,
    recipient_source: body.recipient_source,
    recipient_group_id: body.recipient_source === "group" ? body.recipient_group_id : null,
    schedule_type: body.schedule_type,
    scheduled_at: scheduledAt,
    status: "sending",
    recipient_count: contacts.length,
  });

  await enqueueJobs({
    campaign,
    contacts,
    wa,
    type: "send_broadcast_message",
    templateId: template.id,
    runAfter: scheduledAt,
  });

  return getById(businessId, campaign.id);
}

async function createDrip(businessId, body, file) {
  const steps = parseSteps(body.steps)
    .map((s) => ({
      delay_minutes: Number(s.delay_minutes) || 0,
      template_id: Number(s.template_id),
    }))
    .filter((s) => s.template_id);
  if (!steps.length) throw new HttpError(400, "Add at least one drip step");

  const templates = await Template.findAll({
    where: { id: { [Op.in]: steps.map((s) => s.template_id) }, business_id: businessId },
  });
  if (templates.length !== new Set(steps.map((s) => s.template_id)).size) {
    throw new HttpError(400, "One or more templates were not found");
  }

  const wa = await resolveWaNumber({ businessId });

  const contacts = await resolveRecipients(businessId, body.recipient_source === "csv_upload" ? { ...body, file } : body);
  if (!contacts.length) throw new HttpError(400, "No recipients found");

  const scheduledAt = runAfterDate(body.schedule_type, body.scheduled_at);
  const campaign = await Campaign.create({
    business_id: businessId,
    name: body.name.trim(),
    type: "drip",
    template_id: steps[0].template_id,
    recipient_source: body.recipient_source,
    recipient_group_id: body.recipient_source === "group" ? body.recipient_group_id : null,
    schedule_type: body.schedule_type,
    scheduled_at: scheduledAt,
    status: "sending",
    recipient_count: contacts.length,
  });

  const createdSteps = [];
  for (let i = 0; i < steps.length; i += 1) {
    const step = await DripStep.create({
      campaign_id: campaign.id,
      step_order: i + 1,
      delay_minutes: steps[i].delay_minutes,
      template_id: steps[i].template_id,
    });
    createdSteps.push(step);
  }

  const first = createdSteps[0];
  const firstRun = new Date(scheduledAt.getTime() + first.delay_minutes * 60 * 1000);
  await enqueueJobs({
    campaign,
    contacts,
    wa,
    type: "send_drip_message",
    templateId: first.template_id,
    firstStep: first,
    runAfter: firstRun,
  });

  return getById(businessId, campaign.id);
}

async function remove(businessId, id) {
  const campaign = await Campaign.findOne({ where: { id, business_id: businessId } });
  if (!campaign) throw new HttpError(404, "Campaign not found");
  await Job.destroy({ where: { campaign_id: id, status: { [Op.in]: ["pending", "processing"] } } });
  await DripStep.destroy({ where: { campaign_id: id } });
  await campaign.destroy();
}

module.exports = {
  list,
  getById,
  createBroadcast,
  createDrip,
  remove,
  publicCampaign,
};
