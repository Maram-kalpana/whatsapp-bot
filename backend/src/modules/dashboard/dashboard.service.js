const { Op, fn, col, literal } = require("sequelize");
const { Business, Campaign, Contact, Lead, WhatsappNumber, WebhookLog } = require("../../models");
const { countSentToday } = require("../../lib/messaging");
const { messageCost } = require("../../lib/wallet");

const TIERS = [
  { key: "250", label: "250", cap: 250 },
  { key: "1k", label: "1K", cap: 1000 },
  { key: "10k", label: "10K", cap: 10000 },
  { key: "100k", label: "100K", cap: 100000 },
  { key: "unlimited", label: "Unlimited", cap: null },
];

function tierCap(tier) {
  const row = TIERS.find((t) => t.key === tier);
  if (!row) return 250;
  return row.cap ?? Number.MAX_SAFE_INTEGER;
}

function qualityLabel(score) {
  if (score === "high") return { label: "Excellent", pct: 92, color: "#10b981" };
  if (score === "medium") return { label: "Good", pct: 68, color: "#f59e0b" };
  return { label: "Low", pct: 38, color: "#ef4444" };
}

function fillTrend(rows, days = 30) {
  const map = Object.fromEntries(rows.map((r) => [String(r.date), Number(r.count)]));
  const out = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() - (days - 1));

  for (let i = 0; i < days; i += 1) {
    const key = cursor.toISOString().slice(0, 10);
    out.push({ date: key, count: map[key] || 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

async function dailyTrend(Model, businessId, days = 30) {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const rows = await Model.findAll({
    where: { business_id: businessId, created_at: { [Op.gte]: since } },
    attributes: [[fn("DATE", col("created_at")), "date"], [fn("COUNT", col("id")), "count"]],
    group: [literal("DATE(created_at)")],
    raw: true,
  });

  return fillTrend(rows, days);
}

async function getSummary(businessId) {
  const business = await Business.findByPk(businessId);
  if (!business) return null;

  const cost = messageCost();
  const wa = await WhatsappNumber.findOne({ where: { business_id: businessId }, order: [["id", "ASC"]] });
  const sentToday = wa ? await countSentToday(wa.id) : 0;
  const cap = tierCap(business.daily_limit_tier);

  const [recentCampaigns, latestBroadcast, leadsTotal, contactsTotal, leadsTrend, contactsTrend] =
    await Promise.all([
      Campaign.findAll({
        where: { business_id: businessId },
        order: [["id", "DESC"]],
        limit: 6,
      }),
      Campaign.findOne({
        where: { business_id: businessId, type: "broadcast" },
        order: [["id", "DESC"]],
      }),
      Lead.count({ where: { business_id: businessId } }),
      Contact.count({ where: { business_id: businessId } }),
      dailyTrend(Lead, businessId),
      dailyTrend(Contact, businessId),
    ]);

  const trialEnds = business.trial_ends_at
    ? new Date(business.trial_ends_at)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return {
    phase: 8,
    wallet_balance: Number(business.wallet_balance || 0),
    message_cost: cost,
    quality: qualityLabel(business.quality_score),
    quality_score: business.quality_score,
    daily_limits: {
      tiers: TIERS.map((t) => ({
        key: t.key,
        label: t.label,
        cap: t.cap,
        active: t.key === business.daily_limit_tier,
      })),
      current_tier: business.daily_limit_tier,
      sent_today: sentToday,
      cap: cap === Number.MAX_SAFE_INTEGER ? null : cap,
    },
    plan: business.plan,
    trial_ends_at: trialEnds.toISOString(),
    business: {
      id: business.id,
      name: business.name,
      logo_url: business.logo_url,
      industry: business.industry,
      plan: business.plan,
    },
    recent_campaigns: recentCampaigns.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      status: c.status,
      recipients: c.recipient_count,
      delivered: c.delivered_count,
      amount: Number((c.sent_count * cost).toFixed(2)),
    })),
    latest_broadcast: latestBroadcast
      ? {
          id: latestBroadcast.id,
          name: latestBroadcast.name,
          sent: latestBroadcast.sent_count,
          delivered: latestBroadcast.delivered_count,
          failed: latestBroadcast.failed_count,
          read: latestBroadcast.read_count,
          total: latestBroadcast.recipient_count,
        }
      : null,
    totals: { leads: leadsTotal, contacts: contactsTotal },
    leads_trend: leadsTrend,
    contacts_trend: contactsTrend,
  };
}

async function getWebhookLogs(businessId) {
  const rows = await WebhookLog.findAll({
    where: { business_id: businessId },
    order: [["received_at", "DESC"]],
    limit: 100,
  });
  return rows.map((r) => ({
    id: r.id,
    event_type: r.event_type,
    received_at: r.received_at,
    payload: r.payload,
  }));
}

module.exports = { getSummary, getWebhookLogs };
