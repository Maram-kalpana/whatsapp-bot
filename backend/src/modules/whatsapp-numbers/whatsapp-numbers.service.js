const { WhatsappNumber } = require("../../models");
const { HttpError } = require("../../utils/httpError");

function publicNumber(row) {
  return {
    id: row.id,
    business_id: row.business_id,
    phone_number: row.phone_number,
    phone_number_id: row.phone_number_id,
    waba_id: row.waba_id,
    display_name: row.display_name,
    status: row.status,
    is_live: row.is_live,
  };
}

async function list(businessId) {
  const rows = await WhatsappNumber.findAll({
    where: { business_id: businessId },
    order: [["id", "ASC"]],
  });
  return rows.map(publicNumber);
}

async function upsert(businessId, payload) {
  const defaults = {
    business_id: businessId,
    phone_number: payload.phone_number || payload.phone_number_id,
    phone_number_id: payload.phone_number_id,
    waba_id: payload.waba_id,
    display_name: payload.display_name,
    status: payload.status === "connected" ? "connected" : "pending",
    is_live: Boolean(payload.is_live),
  };
  const existing = await WhatsappNumber.findOne({ where: { business_id: businessId } });
  if (existing) {
    existing.phone_number = defaults.phone_number;
    existing.phone_number_id = payload.phone_number_id;
    existing.waba_id = payload.waba_id;
    existing.display_name = payload.display_name;
    if (payload.status !== undefined) existing.status = defaults.status;
    if (payload.is_live !== undefined) existing.is_live = defaults.is_live;
    await existing.save();
    return publicNumber(existing);
  }
  const created = await WhatsappNumber.create(defaults);
  return publicNumber(created);
}

async function update(businessId, id, payload) {
  const row = await WhatsappNumber.findOne({ where: { id, business_id: businessId } });
  if (!row) throw new HttpError(404, "WhatsApp number not found");
  if (payload.phone_number !== undefined) row.phone_number = payload.phone_number || row.phone_number;
  row.phone_number_id = payload.phone_number_id;
  row.waba_id = payload.waba_id;
  row.display_name = payload.display_name;
  if (payload.status !== undefined) row.status = payload.status === "connected" ? "connected" : "pending";
  if (payload.is_live !== undefined) row.is_live = Boolean(payload.is_live);
  await row.save();
  return publicNumber(row);
}

/** Called later from send/webhook success — not used in Phase 1 UI. */
async function markConnected(id) {
  const row = await WhatsappNumber.findByPk(id);
  if (!row) return null;
  row.status = "connected";
  await row.save();
  return publicNumber(row);
}

module.exports = { list, upsert, update, markConnected, publicNumber };
