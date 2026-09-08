const { Op } = require("sequelize");
const { Conversation, Contact, Message, User, Template, WhatsappNumber } = require("../../models");
const { HttpError } = require("../../utils/httpError");
const {
  publicMessage,
  sendText,
  sendMedia,
  sendTemplate,
  assertAgent,
  findOrCreateConversation,
  resolveWaNumber,
} = require("../../lib/messaging");
const { languageCode, extractVars, graphPost } = require("../../lib/meta");

function publicConversation(row) {
  return {
    id: row.id,
    business_id: row.business_id,
    contact: row.Contact
      ? { id: row.Contact.id, name: row.Contact.name, phone_number: row.Contact.phone_number }
      : null,
    last_message_at: row.last_message_at,
    status: row.status,
    assigned_agent_id: row.assigned_agent_id,
    assigned_agent: row.assignedAgent ? { id: row.assignedAgent.id, name: row.assignedAgent.name } : null,
    unread_count: row.unread_count,
  };
}

async function listConversations(businessId, { q }) {
  const where = { business_id: businessId };
  const include = [
    { model: Contact, required: true },
    { model: User, as: "assignedAgent", required: false, attributes: ["id", "name", "email"] },
  ];
  if (q) {
    include[0].where = {
      [Op.or]: [{ name: { [Op.like]: `%${q}%` } }, { phone_number: { [Op.like]: `%${q}%` } }],
    };
  }
  const rows = await Conversation.findAll({
    where,
    include,
    order: [["last_message_at", "DESC"]],
    limit: 200,
  });
  const lastMap = {};
  if (rows.length) {
    const messages = await Message.findAll({
      where: { conversation_id: rows.map((r) => r.id) },
      order: [["id", "DESC"]],
    });
    messages.forEach((m) => {
      if (!lastMap[m.conversation_id]) lastMap[m.conversation_id] = publicMessage(m);
    });
  }
  return rows.map((row) => ({
    ...publicConversation(row),
    last_message: lastMap[row.id] || null,
  }));
}

async function getMessages(businessId, conversationId) {
  const conversation = await Conversation.findOne({
    where: { id: conversationId, business_id: businessId },
    include: [Contact, { model: User, as: "assignedAgent", required: false, attributes: ["id", "name"] }],
  });
  if (!conversation) throw new HttpError(404, "Conversation not found");
  const messages = await Message.findAll({
    where: { conversation_id: conversationId },
    order: [["id", "ASC"]],
    limit: 500,
  });
  return { conversation: publicConversation(conversation), messages: messages.map(publicMessage) };
}

async function markRead(businessId, conversationId) {
  const conversation = await Conversation.findOne({ where: { id: conversationId, business_id: businessId } });
  if (!conversation) throw new HttpError(404, "Conversation not found");
  conversation.unread_count = 0;
  await conversation.save();
  const lastInbound = await Message.findOne({
    where: { conversation_id: conversationId, direction: "inbound" },
    order: [["id", "DESC"]],
  });
  if (lastInbound?.meta_message_id) {
    const wa = await WhatsappNumber.findByPk(conversation.whatsapp_number_id);
    if (wa?.phone_number_id) {
      try {
        await graphPost(`${wa.phone_number_id}/messages`, {
          messaging_product: "whatsapp",
          status: "read",
          message_id: lastInbound.meta_message_id,
        });
      } catch {
        /* Meta read receipt is best-effort */
      }
    }
  }
  return publicConversation(conversation);
}

async function openConversation(businessId, contactId) {
  const contact = await Contact.findOne({ where: { id: contactId, business_id: businessId } });
  if (!contact) throw new HttpError(404, "Contact not found");
  const wa = await resolveWaNumber({ businessId, phoneNumberId: null });
  const conversation = await findOrCreateConversation(businessId, contact, wa);
  const withContact = await Conversation.findByPk(conversation.id, {
    include: [Contact, { model: User, as: "assignedAgent", required: false, attributes: ["id", "name"] }],
  });
  return publicConversation(withContact);
}

function bodyComponents(template, contact) {
  const vars = extractVars(template.body);
  if (!vars.length) return [];
  const samples = template.sample_values || {};
  return [
    {
      type: "body",
      parameters: vars.map((n, i) => ({
        type: "text",
        text: (i === 0 && contact?.name) || samples[String(n)] || samples[`b${n}`] || contact?.name || "there",
      })),
    },
  ];
}

async function assign(businessId, conversationId, { assigned_agent_id, status }) {
  const conversation = await Conversation.findOne({ where: { id: conversationId, business_id: businessId } });
  if (!conversation) throw new HttpError(404, "Conversation not found");
  if (assigned_agent_id !== undefined) {
    await assertAgent(businessId, assigned_agent_id);
    conversation.assigned_agent_id = assigned_agent_id || null;
  }
  if (status) conversation.status = status;
  await conversation.save();
  return publicConversation(conversation);
}

async function send(businessId, conversationId, body, file) {
  if (file) {
    const type = (file.mimetype || "").startsWith("video") ? "video" : (file.mimetype || "").includes("pdf") ? "document" : "image";
    const msg = await sendMedia({ businessId, conversationId, file, caption: body.caption, type });
    return publicMessage(msg);
  }
  if (body.template_id || body.template_name) {
    const conversation = await Conversation.findOne({ where: { id: conversationId, business_id: businessId } });
    if (!conversation) throw new HttpError(404, "Conversation not found");
    const contact = await Contact.findByPk(conversation.contact_id);
    const wa = await resolveWaNumber({ businessId, phoneNumberId: null });
    let templateName = body.template_name;
    let language = body.language;
    let tpl = null;
    if (body.template_id) {
      tpl = await Template.findOne({ where: { id: body.template_id, business_id: businessId } });
      if (!tpl) throw new HttpError(404, "Template not found");
      templateName = tpl.name;
      language = language || tpl.language;
    }
      const msg = await sendTemplate({
        businessId,
        conversation,
        contact,
        wa,
        templateName,
        language: languageCode(language),
        components: tpl ? bodyComponents(tpl, contact) : [],
      });
    return publicMessage(msg);
  }
  if (!body.text) throw new HttpError(400, "Message text is required");
  const msg = await sendText({ businessId, conversationId, text: body.text });
  return publicMessage(msg);
}

module.exports = {
  listConversations,
  getMessages,
  markRead,
  assign,
  send,
  openConversation,
  findOrCreateConversation,
  bodyComponents,
};
