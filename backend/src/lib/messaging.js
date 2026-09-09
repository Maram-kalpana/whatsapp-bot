const { Op } = require("sequelize");
const {
  Contact,
  Conversation,
  Message,
  WhatsappNumber,
  BusinessUser,
  Campaign,
} = require("../models");
const { emitToBusiness } = require("../lib/realtime");
const { digitsPhone } = require("../lib/csv");
const { HttpError } = require("../utils/httpError");
const { graphPost, graphPostForm, accessToken } = require("../lib/meta");
const { markConnected } = require("../modules/whatsapp-numbers/whatsapp-numbers.service");

function publicMessage(row) {
  return {
    id: row.id,
    conversation_id: row.conversation_id,
    direction: row.direction,
    type: row.type,
    content: row.content,
    meta_message_id: row.meta_message_id,
    campaign_id: row.campaign_id,
    status: row.status,
    created_at: row.created_at,
  };
}

async function findWaNumber(businessId, phoneNumberId) {
  const where = { business_id: businessId };
  if (phoneNumberId) where.phone_number_id = phoneNumberId;
  const row = await WhatsappNumber.findOne({
    where: businessId ? where : { phone_number_id: phoneNumberId },
    order: [["id", "ASC"]],
  });
  return row;
}

async function resolveWaNumber({ businessId, phoneNumberId }) {
  if (phoneNumberId) {
    const byMeta = await WhatsappNumber.findOne({ where: { phone_number_id: String(phoneNumberId) } });
    if (byMeta) return byMeta;
  }
  if (businessId) {
    const first = await WhatsappNumber.findOne({ where: { business_id: businessId }, order: [["id", "ASC"]] });
    if (first) return first;
    return WhatsappNumber.create({
      business_id: businessId,
      phone_number: "0000000000",
      display_name: "Local WhatsApp",
      phone_number_id: "local",
      waba_id: "local",
      status: "pending",
      is_live: false,
    });
  }
  throw new HttpError(400, "Connect a WhatsApp number in Account settings first");
}

async function findOrCreateContact(businessId, { name, phone, waId }) {
  const phone_number = digitsPhone(phone || waId);
  if (!phone_number) throw new HttpError(400, "Contact phone is required");
  let contact = await Contact.findOne({ where: { business_id: businessId, phone_number } });
  if (!contact) {
    contact = await Contact.create({
      business_id: businessId,
      name: name || phone_number,
      phone_number,
      source: "whatsapp",
    });
  } else if (name && contact.name === contact.phone_number) {
    contact.name = name;
    await contact.save();
  }
  return contact;
}

async function findOrCreateConversation(businessId, contact, waNumber) {
  let conversation = await Conversation.findOne({
    where: {
      business_id: businessId,
      contact_id: contact.id,
      whatsapp_number_id: waNumber.id,
    },
  });
  if (!conversation) {
    conversation = await Conversation.create({
      business_id: businessId,
      contact_id: contact.id,
      whatsapp_number_id: waNumber.id,
      last_message_at: new Date(),
      status: "open",
      unread_count: 0,
    });
  }
  return conversation;
}

async function addMessage(conversation, payload) {
  const message = await Message.create({
    conversation_id: conversation.id,
    direction: payload.direction,
    type: payload.type,
    content: payload.content || {},
    meta_message_id: payload.meta_message_id || null,
    campaign_id: payload.campaign_id || null,
    status: payload.status || "sent",
  });
  conversation.last_message_at = new Date();
  if (payload.direction === "inbound") {
    conversation.unread_count = (conversation.unread_count || 0) + 1;
    conversation.status = "open";
  }
  await conversation.save();
  const dto = publicMessage(message);
  emitToBusiness(conversation.business_id, payload.direction === "inbound" || payload.emitNew !== false ? "message:new" : "message:status", {
    conversationId: conversation.id,
    message: dto,
    unread_count: conversation.unread_count,
  });
  return message;
}

async function applyCampaignStats(message, fromStatus, toStatus) {
  if (!message.campaign_id) return;
  const campaign = await Campaign.findByPk(message.campaign_id);
  if (!campaign) return;
  const from = fromStatus;
  const to = toStatus;
  if (to === "delivered" && from !== "delivered" && from !== "read") {
    campaign.delivered_count += 1;
  }
  if (to === "read" && from !== "read") {
    campaign.read_count += 1;
    if (from !== "delivered") campaign.delivered_count += 1;
  }
  if (to === "failed" && from !== "failed") {
    campaign.failed_count += 1;
  }
  await campaign.save();
  emitToBusiness(campaign.business_id, "campaign:updated", {
    campaignId: campaign.id,
    sent_count: campaign.sent_count,
    delivered_count: campaign.delivered_count,
    read_count: campaign.read_count,
    failed_count: campaign.failed_count,
    status: campaign.status,
  });
}

async function applyStatusUpdate({ metaMessageId, status, errors }) {
  if (!metaMessageId) return null;
  const mapped = { sent: "sent", delivered: "delivered", read: "read", failed: "failed" }[status] || status;
  const message = await Message.findOne({ where: { meta_message_id: metaMessageId } });
  if (!message) return null;
  const previous = message.status;
  if (mapped === previous) {
    const conversation = await Conversation.findByPk(message.conversation_id);
    return { message, conversation };
  }
  message.status = mapped;
  if (mapped === "failed" && errors) {
    message.content = { ...(message.content || {}), error: errors };
  }
  await message.save();
  await applyCampaignStats(message, previous, mapped);
  const conversation = await Conversation.findByPk(message.conversation_id);
  if (conversation) {
    emitToBusiness(conversation.business_id, "message:status", {
      conversationId: conversation.id,
      message: publicMessage(message),
      unread_count: conversation.unread_count,
    });
  }
  return { message, conversation };
}

function shouldCallMeta(wa) {
  return Boolean(accessToken()) && wa?.phone_number_id && wa.phone_number_id !== "local";
}

async function postWhatsAppMessage(wa, json) {
  if (!shouldCallMeta(wa)) {
    return { messages: [{ id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` }] };
  }
  return graphPost(`${wa.phone_number_id}/messages`, json);
}

async function sendText({ businessId, conversationId, text }) {
  const conversation = await Conversation.findOne({ where: { id: conversationId, business_id: businessId } });
  if (!conversation) throw new HttpError(404, "Conversation not found");
  const contact = await Contact.findByPk(conversation.contact_id);
  const wa = await WhatsappNumber.findByPk(conversation.whatsapp_number_id);
  const data = await postWhatsAppMessage(wa, {
    messaging_product: "whatsapp",
    to: contact.phone_number,
    type: "text",
    text: { body: text },
  });
  if (shouldCallMeta(wa)) await markConnected(wa.id);
  return addMessage(conversation, {
    direction: "outbound",
    type: "text",
    content: { text },
    meta_message_id: data.messages?.[0]?.id,
    status: "sent",
  });
}

async function sendTemplate({
  businessId,
  conversation,
  contact,
  wa,
  templateName,
  language,
  components,
  extraContent,
  campaign_id,
}) {
  const data = await postWhatsAppMessage(wa, {
    messaging_product: "whatsapp",
    to: contact.phone_number,
    type: "template",
    template: {
      name: templateName,
      language: { code: language || "en_US" },
      components: components || [],
    },
  });
  if (shouldCallMeta(wa)) await markConnected(wa.id);
  return addMessage(conversation, {
    direction: "outbound",
    type: "template",
    content: { template: templateName, language, ...(extraContent || {}) },
    meta_message_id: data.messages?.[0]?.id,
    campaign_id: campaign_id || extraContent?.campaign_id || null,
    status: "sent",
  });
}

async function sendMedia({ businessId, conversationId, file, caption, type }) {
  const conversation = await Conversation.findOne({ where: { id: conversationId, business_id: businessId } });
  if (!conversation) throw new HttpError(404, "Conversation not found");
  const contact = await Contact.findByPk(conversation.contact_id);
  const wa = await WhatsappNumber.findByPk(conversation.whatsapp_number_id);
  let uploaded = { id: `local_media_${Date.now()}` };
  if (shouldCallMeta(wa)) {
    const fs = require("fs");
    const form = new FormData();
    const buf = fs.readFileSync(file.path);
    form.append("messaging_product", "whatsapp");
    form.append("type", type || "image");
    form.append("file", new Blob([buf], { type: file.mimetype }), file.originalname || "upload");
    uploaded = await graphPostForm(`${wa.phone_number_id}/media`, form);
  }
  const mediaType = type || "image";
  const payload = {
    messaging_product: "whatsapp",
    to: contact.phone_number,
    type: mediaType,
    [mediaType]: { id: uploaded.id, caption: caption || undefined },
  };
  const data = await postWhatsAppMessage(wa, payload);
  if (shouldCallMeta(wa)) await markConnected(wa.id);
  return addMessage(conversation, {
    direction: "outbound",
    type: mediaType,
    content: { media_id: uploaded.id, caption, path: `/uploads/media/${require("path").basename(file.path)}` },
    meta_message_id: data.messages?.[0]?.id,
    status: "sent",
  });
}

async function sendMediaByUrl({ businessId, conversation, contact, wa, type, url, caption }) {
  if (!url) {
    return sendText({ businessId, conversationId: conversation.id, text: caption || `[${type} missing URL]` });
  }
  const mediaType = type || "image";
  const payload = {
    messaging_product: "whatsapp",
    to: contact.phone_number,
    type: mediaType,
    [mediaType]: { link: url, caption: caption || undefined },
  };
  const data = await postWhatsAppMessage(wa, payload);
  if (shouldCallMeta(wa)) await markConnected(wa.id);
  return addMessage(conversation, {
    direction: "outbound",
    type: mediaType,
    content: { url, caption },
    meta_message_id: data.messages?.[0]?.id,
    status: "sent",
  });
}

async function sendInteractive({ businessId, conversation, contact, wa, kind, body, header, footer, buttons, buttonText, sections }) {
  const interactive =
    kind === "list"
      ? {
          type: "list",
          body: { text: body },
          action: {
            button: buttonText || "View options",
            sections: (sections || []).map((s) => ({
              title: s.title || "Options",
              rows: (s.rows || []).slice(0, 10).map((r) => ({
                id: String(r.id),
                title: String(r.title || "Option").slice(0, 24),
                description: String(r.description || "").slice(0, 72) || undefined,
              })),
            })),
          },
        }
      : {
          type: "button",
          body: { text: body },
          action: {
            buttons: (buttons || []).slice(0, 3).map((b) => ({
              type: "reply",
              reply: { id: String(b.id), title: String(b.title).slice(0, 20) },
            })),
          },
        };

  if (header) interactive.header = { type: "text", text: header };
  if (footer) interactive.footer = { text: footer };

  const data = await postWhatsAppMessage(wa, {
    messaging_product: "whatsapp",
    to: contact.phone_number,
    type: "interactive",
    interactive,
  });
  if (shouldCallMeta(wa)) await markConnected(wa.id);
  return addMessage(conversation, {
    direction: "outbound",
    type: "interactive",
    content: { kind, body, header, footer, buttons, sections },
    meta_message_id: data.messages?.[0]?.id,
    status: "sent",
  });
}

async function sendCtaUrl({ businessId, conversation, contact, wa, body, displayText, url, header, footer }) {
  const interactive = {
    type: "cta_url",
    body: { text: body },
    action: {
      name: "cta_url",
      parameters: {
        display_text: String(displayText || "Visit").slice(0, 20),
        url,
      },
    },
  };
  if (header) interactive.header = { type: "text", text: header };
  if (footer) interactive.footer = { text: footer };

  const data = await postWhatsAppMessage(wa, {
    messaging_product: "whatsapp",
    to: contact.phone_number,
    type: "interactive",
    interactive,
  });
  if (shouldCallMeta(wa)) await markConnected(wa.id);
  return addMessage(conversation, {
    direction: "outbound",
    type: "interactive",
    content: { kind: "cta_url", body, displayText, url },
    meta_message_id: data.messages?.[0]?.id,
    status: "sent",
  });
}

async function sendFlow({
  businessId,
  conversation,
  contact,
  wa,
  metaFlowId,
  body,
  cta,
  header,
  footer,
  screenId,
  flowToken,
}) {
  const interactive = {
    type: "flow",
    body: { text: body || "Tap below to continue" },
    action: {
      name: "flow",
      parameters: {
        flow_message_version: "3",
        flow_token: flowToken || `flow_${conversation.id}_${Date.now()}`,
        flow_id: String(metaFlowId),
        flow_cta: String(cta || "Open").slice(0, 20),
        flow_action: "navigate",
        flow_action_payload: {
          screen: screenId || undefined,
          data: {},
        },
      },
    },
  };
  if (header) interactive.header = { type: "text", text: header };
  if (footer) interactive.footer = { text: footer };

  const data = await postWhatsAppMessage(wa, {
    messaging_product: "whatsapp",
    to: contact.phone_number,
    type: "interactive",
    interactive,
  });
  if (shouldCallMeta(wa)) await markConnected(wa.id);
  return addMessage(conversation, {
    direction: "outbound",
    type: "interactive",
    content: { kind: "flow", meta_flow_id: metaFlowId, body, cta, screenId },
    meta_message_id: data.messages?.[0]?.id,
    status: "sent",
  });
}

async function countSentToday(whatsappNumberId) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const conversations = await Conversation.findAll({
    where: { whatsapp_number_id: whatsappNumberId },
    attributes: ["id"],
  });
  const ids = conversations.map((c) => c.id);
  if (!ids.length) return 0;
  return Message.count({
    where: {
      conversation_id: { [Op.in]: ids },
      direction: "outbound",
      created_at: { [Op.gte]: start },
    },
  });
}

async function assertAgent(businessId, userId) {
  if (!userId) return;
  const row = await BusinessUser.findOne({ where: { business_id: businessId, user_id: userId } });
  if (!row) throw new HttpError(400, "Assignee is not a team member");
}

module.exports = {
  publicMessage,
  findOrCreateContact,
  findOrCreateConversation,
  resolveWaNumber,
  addMessage,
  applyStatusUpdate,
  sendText,
  sendTemplate,
  sendMedia,
  sendMediaByUrl,
  sendInteractive,
  sendCtaUrl,
  sendFlow,
  countSentToday,
  assertAgent,
  findWaNumber,
};
