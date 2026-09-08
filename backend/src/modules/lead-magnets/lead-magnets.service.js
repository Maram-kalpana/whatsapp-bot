const crypto = require("crypto");
const { LeadMagnet, Lead, Contact, Chatbot } = require("../../models");
const { HttpError } = require("../../utils/httpError");
const { findOrCreateContact } = require("../../lib/messaging");
const { digitsPhone } = require("../../lib/csv");

function slugify(name) {
  const base = String(name || "lead")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "lead"}-${crypto.randomBytes(3).toString("hex")}`;
}

function publicMagnet(row) {
  return {
    id: row.id,
    name: row.name,
    public_slug: row.public_slug,
    form_fields: row.form_fields || [],
    thank_you_message: row.thank_you_message || "",
    linked_bot_id: row.linked_bot_id || null,
    created_at: row.created_at,
  };
}

function publicLead(row) {
  return {
    id: row.id,
    lead_magnet_id: row.lead_magnet_id,
    contact_id: row.contact_id,
    submitted_data: row.submitted_data,
    created_at: row.created_at,
  };
}

async function getMagnetOrThrow(businessId, id) {
  const row = await LeadMagnet.findOne({ where: { id, business_id: businessId } });
  if (!row) throw new HttpError(404, "Lead magnet not found");
  return row;
}

async function list(businessId) {
  const rows = await LeadMagnet.findAll({
    where: { business_id: businessId },
    order: [["id", "DESC"]],
  });
  return rows.map(publicMagnet);
}

async function getById(businessId, id) {
  const row = await getMagnetOrThrow(businessId, id);
  return publicMagnet(row);
}

async function create(businessId, body) {
  if (body.linked_bot_id) {
    const bot = await Chatbot.findOne({ where: { id: body.linked_bot_id, business_id: businessId } });
    if (!bot) throw new HttpError(400, "Linked chatbot not found");
  }
  const row = await LeadMagnet.create({
    business_id: businessId,
    name: body.name,
    public_slug: slugify(body.name),
    form_fields: body.form_fields,
    thank_you_message: body.thank_you_message || null,
    linked_bot_id: body.linked_bot_id || null,
  });
  return publicMagnet(row);
}

async function update(businessId, id, body) {
  const row = await getMagnetOrThrow(businessId, id);
  if (body.linked_bot_id) {
    const bot = await Chatbot.findOne({ where: { id: body.linked_bot_id, business_id: businessId } });
    if (!bot) throw new HttpError(400, "Linked chatbot not found");
  }
  if (body.name !== undefined) row.name = body.name;
  if (body.form_fields !== undefined) row.form_fields = body.form_fields;
  if (body.thank_you_message !== undefined) row.thank_you_message = body.thank_you_message || null;
  if (body.linked_bot_id !== undefined) row.linked_bot_id = body.linked_bot_id || null;
  await row.save();
  return publicMagnet(row);
}

async function remove(businessId, id) {
  const row = await getMagnetOrThrow(businessId, id);
  await row.destroy();
}

async function getPublicBySlug(slug) {
  const row = await LeadMagnet.findOne({ where: { public_slug: slug } });
  if (!row) throw new HttpError(404, "Lead form not found");
  return {
    name: row.name,
    form_fields: row.form_fields || [],
    thank_you_message: row.thank_you_message || "Thank you! We will be in touch soon.",
  };
}

async function submitPublic(slug, body) {
  const magnet = await LeadMagnet.findOne({ where: { public_slug: slug } });
  if (!magnet) throw new HttpError(404, "Lead form not found");

  const phone = digitsPhone(body.phone);
  if (!phone) throw new HttpError(400, "Valid phone number is required");

  const contact = await findOrCreateContact(magnet.business_id, {
    name: body.name,
    phone,
  });

  if (body.email && contact.email !== body.email) {
    contact.email = body.email;
    await contact.save();
  }

  const submitted_data = {
    name: body.name,
    phone,
    email: body.email || null,
    ...(body.fields || {}),
  };

  const lead = await Lead.create({
    business_id: magnet.business_id,
    lead_magnet_id: magnet.id,
    contact_id: contact.id,
    submitted_data,
  });

  return {
    ok: true,
    thank_you_message: magnet.thank_you_message || "Thank you! We will be in touch soon.",
    linked_bot_id: magnet.linked_bot_id,
    lead: publicLead(lead),
  };
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  getPublicBySlug,
  submitPublic,
};
