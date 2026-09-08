const {
  Chatbot,
  ChatbotNode,
  ChatbotEdge,
  ChatbotSession,
  Contact,
  Conversation,
  WhatsappNumber,
  WhatsappFlow,
  FlowScreen,
} = require("../../models");
const {
  sendText,
  sendTemplate,
  sendInteractive,
  sendMediaByUrl,
  sendCtaUrl,
  sendFlow,
} = require("../../lib/messaging");

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function inboundText(msg) {
  if (!msg) return "";
  if (msg.type === "text") return msg.text?.body || "";
  if (msg.type === "button") return msg.button?.text || msg.button?.payload || "";
  if (msg.type === "interactive") {
    return (
      msg.interactive?.button_reply?.title ||
      msg.interactive?.button_reply?.id ||
      msg.interactive?.list_reply?.title ||
      msg.interactive?.list_reply?.id ||
      ""
    );
  }
  return "";
}

function matchesTrigger(keywords, text) {
  const normalized = normalizeText(text);
  if (!normalized) return false;
  for (const kw of keywords || []) {
    const value = normalizeText(kw.value || kw.text || kw);
    const type = kw.type || "text";
    if (!value) continue;
    if (type === "text" && normalized === value) return true;
    if (type === "contains" && normalized.includes(value)) return true;
    if (type === "regex") {
      try {
        if (new RegExp(kw.value || kw.text, "i").test(text)) return true;
      } catch {
        /* ignore invalid regex */
      }
    }
  }
  return false;
}

function isWaitingNode(node) {
  return node && (node.node_type === "button" || node.node_type === "list" || node.node_type === "flow");
}

async function loadGraph(chatbotId) {
  const [nodes, edges] = await Promise.all([
    ChatbotNode.findAll({ where: { chatbot_id: chatbotId } }),
    ChatbotEdge.findAll({ where: { chatbot_id: chatbotId } }),
  ]);
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const outEdges = new Map();
  for (const edge of edges) {
    if (!outEdges.has(edge.source_node_id)) outEdges.set(edge.source_node_id, []);
    outEdges.get(edge.source_node_id).push(edge);
  }
  const targetIds = new Set(edges.map((e) => e.target_node_id));
  const entryNodes = nodes.filter((n) => !targetIds.has(n.id));
  return { nodes, edges, nodeMap, outEdges, entryNodes };
}

function findEntryNode(entryNodes, nodes) {
  if (entryNodes.length) return entryNodes[0];
  return nodes[0] || null;
}

function pickEdge(edges, replyText, currentNode) {
  if (!edges?.length) return null;
  const normalized = normalizeText(replyText);
  const config = currentNode?.config || {};

  if (currentNode?.node_type === "button") {
    const buttons = config.buttons || [];
    const matchBtn = buttons.find(
      (b) =>
        normalizeText(b.title) === normalized ||
        normalizeText(b.id) === normalized ||
        normalizeText(b.title).includes(normalized),
    );
    if (matchBtn) {
      const byHandle = edges.find((e) => e.source_handle === String(matchBtn.id));
      if (byHandle) return byHandle;
    }
  }

  if (currentNode?.node_type === "list") {
    const rows = (config.sections || []).flatMap((s) => s.rows || []);
    const matchRow = rows.find(
      (r) =>
        normalizeText(r.title) === normalized ||
        normalizeText(r.id) === normalized ||
        normalizeText(r.title).includes(normalized),
    );
    if (matchRow) {
      const byHandle = edges.find((e) => e.source_handle === String(matchRow.id));
      if (byHandle) return byHandle;
    }
  }

  const byHandle = edges.find((e) => normalizeText(e.source_handle) === normalized);
  if (byHandle) return byHandle;

  return edges.find((e) => !e.source_handle) || edges[0];
}

function defaultNextEdge(edges) {
  if (!edges?.length) return null;
  return edges.find((e) => !e.source_handle) || edges[0];
}

async function sendNodeMessage({ businessId, conversation, contact, wa, node }) {
  const config = node.config || {};
  switch (node.node_type) {
    case "text":
      return sendText({ businessId, conversationId: conversation.id, text: config.text || config.body || "Hello" });
    case "image":
    case "video":
    case "document":
      return sendMediaByUrl({
        businessId,
        conversation,
        contact,
        wa,
        type: node.node_type,
        url: config.url || config.media_url,
        caption: config.caption || config.text || "",
      });
    case "button":
      return sendInteractive({
        businessId,
        conversation,
        contact,
        wa,
        kind: "button",
        body: config.body || config.text || "Choose an option",
        header: config.header,
        footer: config.footer,
        buttons: (config.buttons || []).slice(0, 3).map((b, i) => ({
          id: String(b.id || `btn_${i + 1}`),
          title: b.title || `Option ${i + 1}`,
        })),
      });
    case "list":
      return sendInteractive({
        businessId,
        conversation,
        contact,
        wa,
        kind: "list",
        body: config.body || config.text || "Choose an option",
        header: config.header,
        footer: config.footer,
        buttonText: config.button_text || "View options",
        sections: config.sections || [
          {
            title: "Options",
            rows: [{ id: "row_1", title: "Option 1", description: "" }],
          },
        ],
      });
    case "template":
      return sendTemplate({
        businessId,
        conversation,
        contact,
        wa,
        templateName: config.template_name || config.name,
        language: config.language || "en_US",
        components: config.components || [],
      });
    case "cta_url":
      return sendCtaUrl({
        businessId,
        conversation,
        contact,
        wa,
        body: config.body || config.text || "Tap below",
        displayText: config.display_text || config.button_text || "Visit",
        url: config.url || config.cta_url,
        header: config.header,
        footer: config.footer,
      });
    case "flow": {
      const localFlowId = config.flow_id || config.whatsapp_flow_id;
      let metaFlowId = config.meta_flow_id;
      let screenId = config.screen_id;

      if (localFlowId && !metaFlowId) {
        const flow = await WhatsappFlow.findOne({
          where: { id: Number(localFlowId), business_id: businessId, status: "published" },
        });
        if (flow?.meta_flow_id) {
          metaFlowId = flow.meta_flow_id;
          if (!screenId) {
            const firstScreen = await FlowScreen.findOne({
              where: { flow_id: flow.id },
              order: [["screen_order", "ASC"]],
            });
            screenId = firstScreen?.screen_key;
          }
        }
      }

      if (!metaFlowId) {
        return sendText({
          businessId,
          conversationId: conversation.id,
          text: config.text || "Flow is not published yet. Publish it in Flows first.",
        });
      }

      return sendFlow({
        businessId,
        conversation,
        contact,
        wa,
        metaFlowId,
        body: config.body || config.text || "Tap below to open the form",
        cta: config.cta || config.button_text || "Open",
        header: config.header,
        footer: config.footer,
        screenId,
      });
    }
    case "catalogue":
      return sendText({
        businessId,
        conversationId: conversation.id,
        text: config.text || `Catalogue: ${config.catalogue_id || "items"}`,
      });
    default:
      return sendText({ businessId, conversationId: conversation.id, text: config.text || "..." });
  }
}

async function sendFallback({ businessId, conversation, bot }) {
  const text = bot.fallback_message || "Sorry, I didn't understand that.";
  await sendText({ businessId, conversationId: conversation.id, text });
}

async function expireSession(session) {
  session.status = "expired";
  await session.save();
}

async function completeSession(session) {
  session.status = "completed";
  session.current_node_id = null;
  await session.save();
}

async function executeFromNode({
  businessId,
  conversation,
  contact,
  wa,
  bot,
  graph,
  startNode,
  session,
}) {
  let node = startNode;
  let safety = 0;

  while (node && safety < 20) {
    safety += 1;
    await sendNodeMessage({ businessId, conversation, contact, wa, node });

    if (isWaitingNode(node)) {
      session.current_node_id = node.id;
      session.last_activity_at = new Date();
      session.status = "active";
      await session.save();
      return;
    }

    const edges = graph.outEdges.get(node.id) || [];
    const nextEdge = defaultNextEdge(edges);
    if (!nextEdge) {
      await completeSession(session);
      return;
    }
    node = graph.nodeMap.get(nextEdge.target_node_id);
  }

  await completeSession(session);
}

async function handleInbound({ businessId, conversation, contact, wa, msg }) {
  const text = inboundText(msg);
  const now = new Date();

  let session = await ChatbotSession.findOne({
    where: { business_id: businessId, contact_id: contact.id, status: "active" },
    order: [["last_activity_at", "DESC"]],
  });

  if (session) {
    const bot = await Chatbot.findByPk(session.chatbot_id);
    if (!bot || !bot.is_active) {
      await expireSession(session);
      session = null;
    } else {
      const timeoutMs = (bot.timeout_minutes || 30) * 60 * 1000;
      if (now - new Date(session.last_activity_at) > timeoutMs) {
        await sendFallback({ businessId, conversation, bot });
        await expireSession(session);
        session = null;
      } else if (session.current_node_id) {
        const graph = await loadGraph(bot.id);
        const currentNode = graph.nodeMap.get(session.current_node_id);
        const edges = graph.outEdges.get(session.current_node_id) || [];
        const nextEdge = pickEdge(edges, text, currentNode);

        session.last_activity_at = now;
        await session.save();

        if (!nextEdge) {
          await sendFallback({ businessId, conversation, bot });
          await completeSession(session);
          return;
        }

        const nextNode = graph.nodeMap.get(nextEdge.target_node_id);
        if (!nextNode) {
          await completeSession(session);
          return;
        }

        await executeFromNode({
          businessId,
          conversation,
          contact,
          wa,
          bot,
          graph,
          startNode: nextNode,
          session,
        });
        return;
      }
    }
  }

  if (session) return;

  const bots = await Chatbot.findAll({
    where: { business_id: businessId, is_active: true },
    order: [["id", "ASC"]],
  });

  const bot = bots.find((b) => matchesTrigger(b.trigger_keywords, text));
  if (!bot) return;

  const graph = await loadGraph(bot.id);
  const entry = findEntryNode(graph.entryNodes, graph.nodes);
  if (!entry) return;

  session = await ChatbotSession.create({
    business_id: businessId,
    chatbot_id: bot.id,
    contact_id: contact.id,
    conversation_id: conversation.id,
    current_node_id: null,
    status: "active",
    started_at: now,
    last_activity_at: now,
  });

  await executeFromNode({
    businessId,
    conversation,
    contact,
    wa,
    bot,
    graph,
    startNode: entry,
    session,
  });
}

module.exports = { handleInbound, inboundText, matchesTrigger };
