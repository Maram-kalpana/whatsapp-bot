const constants = {
  BUSINESS_HEADER: "X-Business-Id",
  QUALITY_SCORES: ["high", "medium", "low"],
  DAILY_LIMIT_TIERS: ["250", "1k", "10k", "100k", "unlimited"],
  TEMPLATE_CATEGORIES: ["marketing", "utility", "authentication"],
  TEMPLATE_TYPES: ["default", "catalogue", "flow", "order_details", "carousel"],
  TEMPLATE_STATUSES: ["draft", "pending", "approved", "rejected"],
  CAMPAIGN_TYPES: ["broadcast", "drip"],
  CHATBOT_NODE_TYPES: [
    "text", "image", "video", "document", "button",
    "list", "template", "flow", "cta_url", "catalogue",
  ],
};

export default constants;