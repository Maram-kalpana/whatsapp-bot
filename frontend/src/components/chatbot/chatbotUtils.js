export const NODE_PALETTE = [
  { type: "text", label: "Text" },
  { type: "image", label: "Image" },
  { type: "video", label: "Video" },
  { type: "document", label: "Document" },
  { type: "button", label: "Button" },
  { type: "list", label: "List" },
  { type: "template", label: "Template" },
  { type: "flow", label: "Flow" },
  { type: "cta_url", label: "CTA URL" },
  { type: "catalogue", label: "Catalogue" },
];

export function defaultConfig(type) {
  switch (type) {
    case "text":
      return { text: "Hello! Welcome to our bot." };
    case "image":
      return { url: "", caption: "Image message" };
    case "video":
      return { url: "", caption: "Video message" };
    case "document":
      return { url: "", caption: "Document" };
    case "button":
      return {
        body: "Choose an option",
        header: "",
        footer: "",
        buttons: [
          { id: "btn_1", title: "Option 1" },
          { id: "btn_2", title: "Option 2" },
        ],
      };
    case "list":
      return {
        body: "Select from the list",
        header: "",
        footer: "",
        button_text: "View options",
        sections: [
          {
            title: "Options",
            rows: [
              { id: "row_1", title: "Option 1", description: "" },
              { id: "row_2", title: "Option 2", description: "" },
            ],
          },
        ],
      };
    case "template":
      return { template_name: "", language: "en_US", components: [] };
    case "flow":
      return { flow_id: null, body: "Tap below to open the form", cta: "Open", text: "Tap below to open the form" };
    case "cta_url":
      return { body: "Tap below to continue", display_text: "Visit", url: "https://example.com" };
    case "catalogue":
      return { catalogue_id: "", text: "Browse our catalogue" };
    default:
      return { text: "Message" };
  }
}

export function branchHandles(type, config = {}) {
  if (type === "button") return (config.buttons || []).map((b) => String(b.id));
  if (type === "list") {
    return (config.sections || []).flatMap((s) => (s.rows || []).map((r) => String(r.id)));
  }
  return ["default"];
}

export function nodeLabel(type) {
  return NODE_PALETTE.find((n) => n.type === type)?.label || type;
}

export function toFlowNodes(apiNodes) {
  return apiNodes.map((n) => ({
    id: String(n.id),
    type: "chatbot",
    position: { x: n.position_x, y: n.position_y },
    data: { nodeType: n.node_type, config: n.config || {} },
  }));
}

export function toFlowEdges(apiEdges) {
  return apiEdges.map((e) => ({
    id: `e-${e.id}`,
    source: String(e.source_node_id),
    target: String(e.target_node_id),
    sourceHandle: e.source_handle || "default",
    animated: true,
  }));
}

export function toApiFlow(nodes, edges) {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      node_type: n.data.nodeType,
      position_x: n.position.x,
      position_y: n.position.y,
      config: n.data.config || {},
    })),
    edges: edges.map((e) => ({
      source_node_id: e.source,
      target_node_id: e.target,
      source_handle: e.sourceHandle === "default" ? null : e.sourceHandle,
    })),
  };
}
