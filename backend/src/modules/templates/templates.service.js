const { Template, WhatsappNumber } = require("../../models");
const { HttpError } = require("../../utils/httpError");
const {
  graphPost,
  languageCode,
  extractVars,
  sanitizeTemplateName,
} = require("../../lib/meta");

function parseJson(value, fallback) {
  if (value == null || value === "") return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function mapType(type) {
  const key = String(type || "default").toLowerCase().replace(/\s+/g, "_");
  if (key === "flows") return "flow";
  if (key === "order_details" || key === "order-details") return "order_details";
  return ["default", "catalogue", "flow", "order_details", "carousel"].includes(key) ? key : "default";
}

function mapCategory(category) {
  return String(category || "marketing").toLowerCase();
}

function buttonComponents(buttons) {
  if (!buttons?.length) return [];
  const metaButtons = buttons.slice(0, 10).map((b) => {
    const kind = (b.type || b.kind || "Custom").toLowerCase();
    if (kind.includes("website") || kind.includes("url") || kind === "cta") {
      return { type: "URL", text: b.text || "Open", url: b.url || "https://example.com" };
    }
    if (kind.includes("call") || kind.includes("phone")) {
      return { type: "PHONE_NUMBER", text: b.text || "Call", phone_number: String(b.phone || "").replace(/[^\d+]/g, "") };
    }
    return { type: "QUICK_REPLY", text: b.text || "Reply" };
  }).filter((b) => b.text);
  if (!metaButtons.length) return [];
  return [{ type: "BUTTONS", buttons: metaButtons }];
}

function buildMetaComponents({ header_type, header_content, body, footer, buttons, sample_values, type }) {
  const components = [];
  const ht = String(header_type || "none").toLowerCase();
  if (ht === "text" && header_content) {
    const headerVars = extractVars(header_content);
    const header = { type: "HEADER", format: "TEXT", text: header_content };
    if (headerVars.length) {
      header.example = { header_text: headerVars.map((n) => sample_values[`h${n}`] || sample_values[String(n)] || `Sample ${n}`) };
    }
    components.push(header);
  }
  const bodyVars = extractVars(body);
  const bodyComp = { type: "BODY", text: body || "Hello" };
  if (bodyVars.length) {
    bodyComp.example = {
      body_text: [bodyVars.map((n) => sample_values[String(n)] || sample_values[`b${n}`] || `Sample ${n}`)],
    };
  }
  components.push(bodyComp);
  if (footer) components.push({ type: "FOOTER", text: footer });
  if (type === "catalogue") {
    components.push({ type: "BUTTONS", buttons: [{ type: "CATALOG", text: "View catalog" }] });
  } else {
    components.push(...buttonComponents(buttons));
  }
  return components;
}

async function list(businessId) {
  const rows = await Template.findAll({ where: { business_id: businessId }, order: [["id", "DESC"]] });
  return rows;
}

async function create(businessId, payload, file) {
  const name = sanitizeTemplateName(payload.name);
  const category = mapCategory(payload.category);
  const type = mapType(payload.type);
  const language = languageCode(payload.language);
  const buttons = parseJson(payload.buttons, []);
  const sample_values = parseJson(payload.sample_values, {});
  const linked_product_ids = parseJson(payload.linked_product_ids, []);
  const header_type = String(payload.header_type || "none").toLowerCase();
  const header_content = file ? `/uploads/media/${file.filename}` : payload.header_content || null;

  const wa = await WhatsappNumber.findOne({ where: { business_id: businessId }, order: [["id", "ASC"]] });
  if (!wa?.waba_id) throw new HttpError(400, "Save a WABA ID on the WhatsApp number in Account settings first");

  const components = buildMetaComponents({
    header_type: header_type === "image" || header_type === "video" || header_type === "document" ? "none" : header_type,
    header_content: payload.header_content,
    body: payload.body,
    footer: payload.footer,
    buttons,
    sample_values,
    type,
  });

  let meta;
  try {
    meta = await graphPost(`${wa.waba_id}/message_templates`, {
      name,
      language,
      category: category.toUpperCase(),
      components,
    });
  } catch (err) {
    const row = await Template.create({
      business_id: businessId,
      name,
      category,
      type,
      language,
      header_type,
      header_content,
      body: payload.body || "Hello",
      footer: payload.footer || null,
      buttons,
      sample_values,
      linked_product_ids,
      status: "draft",
    });
    err.template = row;
    throw err;
  }

  return Template.create({
    business_id: businessId,
    name,
    category,
    type,
    language,
    header_type,
    header_content,
    body: payload.body || "Hello",
    footer: payload.footer || null,
    buttons,
    sample_values,
    linked_product_ids,
    meta_template_id: meta.id || meta.message_template_id || null,
    status: "pending",
  });
}

async function applyTemplateStatus({ name, event, reason }) {
  const statusMap = {
    APPROVED: "approved",
    REJECTED: "rejected",
    PENDING: "pending",
    PAUSED: "pending",
    DISABLED: "rejected",
  };
  const status = statusMap[String(event || "").toUpperCase()] || null;
  if (!status || !name) return null;
  const rows = await Template.findAll({ where: { name } });
  await Promise.all(rows.map((row) => row.update({ status })));
  return { name, status, reason, count: rows.length };
}

module.exports = { list, create, applyTemplateStatus, mapType, mapCategory };
