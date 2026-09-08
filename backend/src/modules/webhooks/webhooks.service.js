const { WhatsappNumber, WebhookLog, Message } = require("../../models");
const { applyTemplateStatus } = require("../templates/templates.service");
const {
  findOrCreateContact,
  findOrCreateConversation,
  addMessage,
  applyStatusUpdate,
} = require("../../lib/messaging");
const { handleInbound } = require("../chatbots/chatbot-engine.service");
const env = require("../../config/env");

function inboundContent(msg) {
  const type = msg.type || "text";
  if (type === "text") return { text: msg.text?.body || "" };
  if (type === "image" || type === "video" || type === "document" || type === "audio" || type === "sticker") {
    return {
      caption: msg[type]?.caption || "",
      media_id: msg[type]?.id,
      mime_type: msg[type]?.mime_type,
      filename: msg[type]?.filename,
    };
  }
  if (type === "button") return { text: msg.button?.text || msg.button?.payload };
  if (type === "interactive") {
    return {
      text:
        msg.interactive?.button_reply?.title ||
        msg.interactive?.list_reply?.title ||
        JSON.stringify(msg.interactive || {}),
    };
  }
  if (type === "location") {
    return { latitude: msg.location?.latitude, longitude: msg.location?.longitude, name: msg.location?.name };
  }
  return { raw: msg };
}

async function verifyGet(query) {
  const mode = query["hub.mode"];
  const token = query["hub.verify_token"];
  const challenge = query["hub.challenge"];
  if (mode === "subscribe" && token === env.metaWebhookVerifyToken) {
    return { ok: true, challenge };
  }
  return { ok: false };
}

async function handlePayload(body) {
  await WebhookLog.create({
    business_id: null,
    event_type: body?.object || "whatsapp",
    payload: body || {},
  });

  const entries = body?.entry || [];
  for (const entry of entries) {
    for (const change of entry.changes || []) {
      const field = change.field;
      const value = change.value || {};

      if (field === "message_template_status_update") {
        await applyTemplateStatus({
          name: value.message_template_name,
          event: value.event,
          reason: value.reason,
        });
        continue;
      }

      const phoneNumberId = value.metadata?.phone_number_id;
      const wa = phoneNumberId
        ? await WhatsappNumber.findOne({ where: { phone_number_id: String(phoneNumberId) } })
        : null;

      if (wa) {
        await WebhookLog.create({
          business_id: wa.business_id,
          event_type: field || "messages",
          payload: value,
        });
      }

      if (!wa) continue;

      for (const status of value.statuses || []) {
        await applyStatusUpdate({
          metaMessageId: status.id,
          status: status.status,
          errors: status.errors,
        });
      }

      const contacts = value.contacts || [];
      for (const msg of value.messages || []) {
        const profile = contacts.find((c) => c.wa_id === msg.from) || contacts[0];
        const contact = await findOrCreateContact(wa.business_id, {
          name: profile?.profile?.name,
          phone: msg.from,
          waId: msg.from,
        });
        const conversation = await findOrCreateConversation(wa.business_id, contact, wa);
        const existing = msg.id ? await Message.findOne({ where: { meta_message_id: msg.id } }) : null;
        if (existing) continue;
        await addMessage(conversation, {
          direction: "inbound",
          type: msg.type || "text",
          content: inboundContent(msg),
          meta_message_id: msg.id,
          status: "delivered",
        });

        try {
          await handleInbound({
            businessId: wa.business_id,
            conversation,
            contact,
            wa,
            msg,
          });
        } catch (err) {
          console.error("Chatbot engine error:", err.message);
        }
      }
    }
  }

  return { ok: true };
}

module.exports = { verifyGet, handlePayload };
