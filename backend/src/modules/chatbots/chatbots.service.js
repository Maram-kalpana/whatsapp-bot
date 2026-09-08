const { Op } = require("sequelize");
const {
  sequelize,
  Chatbot,
  ChatbotNode,
  ChatbotEdge,
  ChatbotSession,
} = require("../../models");
const { HttpError } = require("../../utils/httpError");

function publicBot(row, sessionCount = 0) {
  return {
    id: row.id,
    name: row.name,
    timeout_minutes: row.timeout_minutes,
    fallback_message: row.fallback_message || "",
    is_active: row.is_active,
    trigger_keywords: row.trigger_keywords || [],
    session_count: sessionCount,
  };
}

function publicNode(row) {
  return {
    id: row.id,
    chatbot_id: row.chatbot_id,
    node_type: row.node_type,
    position_x: row.position_x,
    position_y: row.position_y,
    config: row.config || {},
  };
}

function publicEdge(row) {
  return {
    id: row.id,
    chatbot_id: row.chatbot_id,
    source_node_id: row.source_node_id,
    target_node_id: row.target_node_id,
    source_handle: row.source_handle || null,
  };
}

async function getBotOrThrow(businessId, id) {
  const bot = await Chatbot.findOne({ where: { id, business_id: businessId } });
  if (!bot) throw new HttpError(404, "Chatbot not found");
  return bot;
}

async function sessionCounts(businessId, botIds) {
  if (!botIds.length) return {};
  const rows = await ChatbotSession.findAll({
    attributes: ["chatbot_id", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
    where: { business_id: businessId, chatbot_id: { [Op.in]: botIds } },
    group: ["chatbot_id"],
    raw: true,
  });
  return Object.fromEntries(rows.map((r) => [r.chatbot_id, Number(r.count)]));
}

async function list(businessId) {
  const bots = await Chatbot.findAll({
    where: { business_id: businessId },
    order: [["id", "DESC"]],
  });
  const counts = await sessionCounts(
    businessId,
    bots.map((b) => b.id),
  );
  return bots.map((b) => publicBot(b, counts[b.id] || 0));
}

async function getById(businessId, id) {
  const bot = await getBotOrThrow(businessId, id);
  const [nodes, edges] = await Promise.all([
    ChatbotNode.findAll({ where: { chatbot_id: id }, order: [["id", "ASC"]] }),
    ChatbotEdge.findAll({ where: { chatbot_id: id }, order: [["id", "ASC"]] }),
  ]);
  const counts = await sessionCounts(businessId, [id]);
  return {
    chatbot: publicBot(bot, counts[id] || 0),
    nodes: nodes.map(publicNode),
    edges: edges.map(publicEdge),
  };
}

async function create(businessId, body) {
  const bot = await Chatbot.create({
    business_id: businessId,
    name: body.name,
    timeout_minutes: body.timeout_minutes ?? 30,
    fallback_message: body.fallback_message || null,
    trigger_keywords: body.trigger_keywords || [],
    is_active: Boolean(body.is_active),
  });
  return publicBot(bot, 0);
}

async function update(businessId, id, body) {
  const bot = await getBotOrThrow(businessId, id);
  if (body.name !== undefined) bot.name = body.name;
  if (body.timeout_minutes !== undefined) bot.timeout_minutes = body.timeout_minutes;
  if (body.fallback_message !== undefined) bot.fallback_message = body.fallback_message || null;
  if (body.trigger_keywords !== undefined) bot.trigger_keywords = body.trigger_keywords;
  if (body.is_active !== undefined) bot.is_active = body.is_active;
  await bot.save();
  const counts = await sessionCounts(businessId, [id]);
  return publicBot(bot, counts[id] || 0);
}

async function toggleActive(businessId, id, isActive) {
  const bot = await getBotOrThrow(businessId, id);
  bot.is_active = isActive;
  await bot.save();
  const counts = await sessionCounts(businessId, [id]);
  return publicBot(bot, counts[id] || 0);
}

async function remove(businessId, id) {
  const bot = await getBotOrThrow(businessId, id);
  await bot.destroy();
}

async function saveFlow(businessId, id, { nodes, edges }) {
  await getBotOrThrow(businessId, id);

  return sequelize.transaction(async (tx) => {
    await ChatbotEdge.destroy({ where: { chatbot_id: id }, transaction: tx });
    await ChatbotNode.destroy({ where: { chatbot_id: id }, transaction: tx });

    const idMap = new Map();
    const createdNodes = [];

    for (const node of nodes) {
      const created = await ChatbotNode.create(
        {
          chatbot_id: id,
          node_type: node.node_type,
          position_x: node.position_x,
          position_y: node.position_y,
          config: node.config,
        },
        { transaction: tx },
      );
      idMap.set(String(node.id), created.id);
      createdNodes.push(created);
    }

    const createdEdges = [];
    for (const edge of edges) {
      const sourceId = idMap.get(String(edge.source_node_id));
      const targetId = idMap.get(String(edge.target_node_id));
      if (!sourceId || !targetId) continue;
      const created = await ChatbotEdge.create(
        {
          chatbot_id: id,
          source_node_id: sourceId,
          target_node_id: targetId,
          source_handle: edge.source_handle || null,
        },
        { transaction: tx },
      );
      createdEdges.push(created);
    }

    return {
      nodes: createdNodes.map(publicNode),
      edges: createdEdges.map(publicEdge),
    };
  });
}

module.exports = {
  list,
  getById,
  create,
  update,
  toggleActive,
  remove,
  saveFlow,
};
