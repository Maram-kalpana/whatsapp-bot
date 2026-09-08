const { DataTypes } = require("sequelize");

function id() {
  return { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true };
}

function businessId() {
  return { type: DataTypes.INTEGER.UNSIGNED, allowNull: false };
}

module.exports = (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      id: id(),
      name: { type: DataTypes.STRING(191), allowNull: false },
      email: { type: DataTypes.STRING(191), allowNull: false, unique: true },
      password_hash: { type: DataTypes.STRING(191), allowNull: false },
      role: { type: DataTypes.ENUM("owner", "agent", "admin"), allowNull: false, defaultValue: "owner" },
      refresh_token_version: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    },
    { tableName: "users", underscored: true, updatedAt: false },
  );

  const Business = sequelize.define(
    "Business",
    {
      id: id(),
      name: { type: DataTypes.STRING(191), allowNull: false },
      logo_url: DataTypes.STRING(512),
      industry: DataTypes.STRING(191),
      owner_user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      wallet_balance: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      quality_score: { type: DataTypes.ENUM("high", "medium", "low"), allowNull: false, defaultValue: "high" },
      daily_limit_tier: {
        type: DataTypes.ENUM("250", "1k", "10k", "100k", "unlimited"),
        allowNull: false,
        defaultValue: "250",
      },
      trial_ends_at: DataTypes.DATE,
      plan: { type: DataTypes.ENUM("trial", "advanced_lifetime", "free", "pro"), allowNull: false, defaultValue: "trial" },
      meta_catalog_id: DataTypes.STRING(128),
    },
    { tableName: "businesses", underscored: true, updatedAt: false },
  );

  const BusinessUser = sequelize.define(
    "BusinessUser",
    {
      business_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, primaryKey: true },
      user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, primaryKey: true },
      role: { type: DataTypes.ENUM("owner", "admin", "agent"), allowNull: false, defaultValue: "agent" },
    },
    { tableName: "business_users", underscored: true, timestamps: false },
  );

  const WhatsappNumber = sequelize.define(
    "WhatsappNumber",
    {
      id: id(),
      business_id: businessId(),
      phone_number: { type: DataTypes.STRING(32), allowNull: false },
      waba_id: DataTypes.STRING(64),
      phone_number_id: DataTypes.STRING(64),
      display_name: DataTypes.STRING(191),
      status: { type: DataTypes.ENUM("connected", "pending"), allowNull: false, defaultValue: "pending" },
      is_live: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { tableName: "whatsapp_numbers", underscored: true, timestamps: false },
  );

  const Contact = sequelize.define(
    "Contact",
    {
      id: id(),
      business_id: businessId(),
      name: { type: DataTypes.STRING(191), allowNull: false },
      phone_number: { type: DataTypes.STRING(32), allowNull: false },
      email: DataTypes.STRING(191),
      tags: DataTypes.JSON,
      source: DataTypes.STRING(64),
    },
    { tableName: "contacts", underscored: true, updatedAt: false },
  );

  const ContactGroup = sequelize.define(
    "ContactGroup",
    {
      id: id(),
      business_id: businessId(),
      name: { type: DataTypes.STRING(191), allowNull: false },
    },
    { tableName: "contact_groups", underscored: true, timestamps: false },
  );

  const ContactGroupMember = sequelize.define(
    "ContactGroupMember",
    {
      group_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, primaryKey: true },
      contact_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, primaryKey: true },
    },
    { tableName: "contact_group_members", underscored: true, timestamps: false },
  );

  const Template = sequelize.define(
    "Template",
    {
      id: id(),
      business_id: businessId(),
      name: { type: DataTypes.STRING(191), allowNull: false },
      category: { type: DataTypes.ENUM("marketing", "utility", "authentication"), allowNull: false },
      type: {
        type: DataTypes.ENUM("default", "catalogue", "flow", "order_details", "carousel"),
        allowNull: false,
        defaultValue: "default",
      },
      language: { type: DataTypes.STRING(16), allowNull: false, defaultValue: "en" },
      header_type: DataTypes.STRING(32),
      header_content: DataTypes.TEXT,
      body: { type: DataTypes.TEXT, allowNull: false },
      footer: DataTypes.STRING(191),
      buttons: DataTypes.JSON,
      sample_values: DataTypes.JSON,
      linked_product_ids: DataTypes.JSON,
      meta_template_id: DataTypes.STRING(128),
      status: {
        type: DataTypes.ENUM("draft", "pending", "approved", "rejected"),
        allowNull: false,
        defaultValue: "draft",
      },
    },
    { tableName: "templates", underscored: true, timestamps: false },
  );

  const Campaign = sequelize.define(
    "Campaign",
    {
      id: id(),
      business_id: businessId(),
      name: { type: DataTypes.STRING(191), allowNull: false },
      type: { type: DataTypes.ENUM("broadcast", "drip"), allowNull: false },
      template_id: DataTypes.INTEGER.UNSIGNED,
      recipient_source: { type: DataTypes.ENUM("all_contacts", "group", "csv_upload"), allowNull: false },
      recipient_group_id: DataTypes.INTEGER.UNSIGNED,
      schedule_type: { type: DataTypes.ENUM("send_now", "scheduled"), allowNull: false },
      scheduled_at: DataTypes.DATE,
      status: {
        type: DataTypes.ENUM("draft", "sending", "completed", "failed"),
        allowNull: false,
        defaultValue: "draft",
      },
      recipient_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      sent_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      delivered_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      read_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      failed_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    },
    { tableName: "campaigns", underscored: true, timestamps: false },
  );

  const DripStep = sequelize.define(
    "DripStep",
    {
      id: id(),
      campaign_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      step_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      delay_minutes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      template_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    },
    { tableName: "drip_steps", underscored: true, timestamps: false },
  );

  const Chatbot = sequelize.define(
    "Chatbot",
    {
      id: id(),
      business_id: businessId(),
      name: { type: DataTypes.STRING(191), allowNull: false },
      timeout_minutes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 30 },
      fallback_message: DataTypes.TEXT,
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      trigger_keywords: DataTypes.JSON,
    },
    { tableName: "chatbots", underscored: true, timestamps: false },
  );

  const LeadMagnet = sequelize.define(
    "LeadMagnet",
    {
      id: id(),
      business_id: businessId(),
      name: { type: DataTypes.STRING(191), allowNull: false },
      public_slug: { type: DataTypes.STRING(64), unique: true },
      form_fields: { type: DataTypes.JSON, allowNull: false },
      thank_you_message: DataTypes.TEXT,
      linked_bot_id: DataTypes.INTEGER.UNSIGNED,
    },
    { tableName: "lead_magnets", underscored: true, updatedAt: false },
  );

  const Lead = sequelize.define(
    "Lead",
    {
      id: id(),
      business_id: businessId(),
      lead_magnet_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      contact_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      submitted_data: { type: DataTypes.JSON, allowNull: false },
    },
    { tableName: "leads", underscored: true, updatedAt: false },
  );

  const ChatbotNode = sequelize.define(
    "ChatbotNode",
    {
      id: id(),
      chatbot_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      node_type: {
        type: DataTypes.ENUM(
          "text",
          "image",
          "video",
          "document",
          "button",
          "list",
          "template",
          "flow",
          "cta_url",
          "catalogue",
        ),
        allowNull: false,
      },
      position_x: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      position_y: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      config: { type: DataTypes.JSON, allowNull: false },
    },
    { tableName: "chatbot_nodes", underscored: true, updatedAt: false },
  );

  const ChatbotEdge = sequelize.define(
    "ChatbotEdge",
    {
      id: id(),
      chatbot_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      source_node_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      target_node_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      source_handle: DataTypes.STRING(64),
    },
    { tableName: "chatbot_edges", underscored: true, timestamps: false },
  );

  const ChatbotSession = sequelize.define(
    "ChatbotSession",
    {
      id: id(),
      business_id: businessId(),
      chatbot_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      contact_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      conversation_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      current_node_id: DataTypes.INTEGER.UNSIGNED,
      status: {
        type: DataTypes.ENUM("active", "expired", "completed"),
        allowNull: false,
        defaultValue: "active",
      },
      started_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      last_activity_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: "chatbot_sessions", underscored: true, timestamps: false },
  );

  const WhatsappFlow = sequelize.define(
    "WhatsappFlow",
    {
      id: id(),
      business_id: businessId(),
      name: { type: DataTypes.STRING(191), allowNull: false },
      status: { type: DataTypes.ENUM("draft", "published"), allowNull: false, defaultValue: "draft" },
      meta_flow_id: DataTypes.STRING(128),
    },
    { tableName: "whatsapp_flows", underscored: true, timestamps: false },
  );

  const FlowScreen = sequelize.define(
    "FlowScreen",
    {
      id: id(),
      flow_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      screen_key: { type: DataTypes.STRING(64), allowNull: false },
      title: { type: DataTypes.STRING(191), allowNull: false },
      screen_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    },
    { tableName: "flow_screens", underscored: true, timestamps: false },
  );

  const FlowComponent = sequelize.define(
    "FlowComponent",
    {
      id: id(),
      screen_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      component_type: { type: DataTypes.STRING(64), allowNull: false },
      label: { type: DataTypes.STRING(191), allowNull: false },
      config: { type: DataTypes.JSON, allowNull: false },
      component_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    },
    { tableName: "flow_components", underscored: true, timestamps: false },
  );

  const Conversation = sequelize.define(
    "Conversation",
    {
      id: id(),
      business_id: businessId(),
      contact_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      whatsapp_number_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      last_message_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      status: { type: DataTypes.ENUM("open", "resolved"), allowNull: false, defaultValue: "open" },
      assigned_agent_id: DataTypes.INTEGER.UNSIGNED,
      unread_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    },
    { tableName: "conversations", underscored: true, timestamps: false },
  );

  const Message = sequelize.define(
    "Message",
    {
      id: id(),
      conversation_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      direction: { type: DataTypes.ENUM("inbound", "outbound"), allowNull: false },
      type: { type: DataTypes.STRING(32), allowNull: false },
      content: { type: DataTypes.JSON, allowNull: false },
      meta_message_id: DataTypes.STRING(128),
      campaign_id: DataTypes.INTEGER.UNSIGNED,
      status: {
        type: DataTypes.ENUM("sent", "delivered", "read", "failed"),
        allowNull: false,
        defaultValue: "sent",
      },
    },
    { tableName: "messages", underscored: true, updatedAt: false },
  );

  const Product = sequelize.define(
    "Product",
    {
      id: id(),
      business_id: businessId(),
      name: { type: DataTypes.STRING(191), allowNull: false },
      description: DataTypes.TEXT,
      price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      image_url: DataTypes.STRING(512),
      sku: DataTypes.STRING(64),
      category: DataTypes.STRING(128),
      meta_catalog_id: DataTypes.STRING(128),
      meta_product_id: DataTypes.STRING(128),
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: "products", underscored: true, timestamps: false },
  );

  const Order = sequelize.define(
    "Order",
    {
      id: id(),
      business_id: businessId(),
      contact_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      items: { type: DataTypes.JSON, allowNull: false },
      total_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      status: {
        type: DataTypes.ENUM("pending", "paid", "shipped", "cancelled"),
        allowNull: false,
        defaultValue: "pending",
      },
      payment_provider: { type: DataTypes.ENUM("razorpay", "stripe", "cod"), allowNull: false },
      razorpay_order_id: DataTypes.STRING(64),
      razorpay_payment_id: DataTypes.STRING(64),
      payment_link: DataTypes.STRING(512),
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: "orders", underscored: true, updatedAt: false },
  );

  const PaymentSetting = sequelize.define(
    "PaymentSetting",
    {
      id: id(),
      business_id: businessId(),
      provider: { type: DataTypes.ENUM("razorpay", "stripe", "cod"), allowNull: false },
      config: { type: DataTypes.JSON, allowNull: false },
    },
    { tableName: "payment_settings", underscored: true, timestamps: false },
  );

  const WalletTransaction = sequelize.define(
    "WalletTransaction",
    {
      id: id(),
      business_id: businessId(),
      type: { type: DataTypes.ENUM("topup", "deduction"), allowNull: false },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      reason: {
        type: DataTypes.ENUM("message_send", "template_fee", "plan_upgrade", "order_payment", "wallet_topup"),
        allowNull: false,
      },
      order_id: DataTypes.INTEGER.UNSIGNED,
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: "wallet_transactions", underscored: true, updatedAt: false },
  );

  const WebhookLog = sequelize.define(
    "WebhookLog",
    {
      id: id(),
      business_id: DataTypes.INTEGER.UNSIGNED,
      event_type: { type: DataTypes.STRING(128), allowNull: false },
      payload: { type: DataTypes.JSON, allowNull: false },
      received_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: "webhook_logs", underscored: true, timestamps: false },
  );

  const Job = sequelize.define(
    "Job",
    {
      id: id(),
      type: { type: DataTypes.STRING(64), allowNull: false },
      campaign_id: DataTypes.INTEGER.UNSIGNED,
      payload: { type: DataTypes.JSON, allowNull: false },
      status: {
        type: DataTypes.ENUM("pending", "processing", "done", "failed"),
        allowNull: false,
        defaultValue: "pending",
      },
      run_after: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      attempts: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    },
    { tableName: "jobs", underscored: true, updatedAt: false },
  );

  User.hasMany(Business, { foreignKey: "owner_user_id", as: "ownedBusinesses" });
  Business.belongsTo(User, { foreignKey: "owner_user_id", as: "owner" });

  User.belongsToMany(Business, { through: BusinessUser, foreignKey: "user_id", otherKey: "business_id" });
  Business.belongsToMany(User, { through: BusinessUser, foreignKey: "business_id", otherKey: "user_id" });
  BusinessUser.belongsTo(User, { foreignKey: "user_id" });
  BusinessUser.belongsTo(Business, { foreignKey: "business_id" });
  User.hasMany(BusinessUser, { foreignKey: "user_id" });
  Business.hasMany(BusinessUser, { foreignKey: "business_id" });

  Business.hasMany(WhatsappNumber, { foreignKey: "business_id" });
  WhatsappNumber.belongsTo(Business, { foreignKey: "business_id" });

  Business.hasMany(Contact, { foreignKey: "business_id" });
  Contact.belongsTo(Business, { foreignKey: "business_id" });
  Business.hasMany(ContactGroup, { foreignKey: "business_id" });
  ContactGroup.belongsTo(Business, { foreignKey: "business_id" });
  ContactGroup.belongsToMany(Contact, { through: ContactGroupMember, foreignKey: "group_id", otherKey: "contact_id" });
  Contact.belongsToMany(ContactGroup, { through: ContactGroupMember, foreignKey: "contact_id", otherKey: "group_id" });

  Business.hasMany(Template, { foreignKey: "business_id" });
  Template.belongsTo(Business, { foreignKey: "business_id" });
  Business.hasMany(Campaign, { foreignKey: "business_id" });
  Campaign.belongsTo(Business, { foreignKey: "business_id" });
  Campaign.belongsTo(Template, { foreignKey: "template_id" });
  Campaign.hasMany(DripStep, { foreignKey: "campaign_id" });
  DripStep.belongsTo(Campaign, { foreignKey: "campaign_id" });
  DripStep.belongsTo(Template, { foreignKey: "template_id" });

  Business.hasMany(Chatbot, { foreignKey: "business_id" });
  Chatbot.belongsTo(Business, { foreignKey: "business_id" });
  Chatbot.hasMany(ChatbotNode, { foreignKey: "chatbot_id" });
  Chatbot.hasMany(ChatbotEdge, { foreignKey: "chatbot_id" });
  ChatbotNode.belongsTo(Chatbot, { foreignKey: "chatbot_id" });
  ChatbotEdge.belongsTo(Chatbot, { foreignKey: "chatbot_id" });
  ChatbotEdge.belongsTo(ChatbotNode, { foreignKey: "source_node_id", as: "sourceNode" });
  ChatbotEdge.belongsTo(ChatbotNode, { foreignKey: "target_node_id", as: "targetNode" });
  Chatbot.hasMany(ChatbotSession, { foreignKey: "chatbot_id" });
  ChatbotSession.belongsTo(Chatbot, { foreignKey: "chatbot_id" });
  ChatbotSession.belongsTo(Contact, { foreignKey: "contact_id" });
  ChatbotSession.belongsTo(Conversation, { foreignKey: "conversation_id" });
  ChatbotSession.belongsTo(ChatbotNode, { foreignKey: "current_node_id", as: "currentNode" });

  Business.hasMany(LeadMagnet, { foreignKey: "business_id" });
  LeadMagnet.belongsTo(Business, { foreignKey: "business_id" });
  LeadMagnet.belongsTo(Chatbot, { foreignKey: "linked_bot_id" });
  Business.hasMany(Lead, { foreignKey: "business_id" });
  Lead.belongsTo(LeadMagnet, { foreignKey: "lead_magnet_id" });
  Lead.belongsTo(Contact, { foreignKey: "contact_id" });

  Business.hasMany(WhatsappFlow, { foreignKey: "business_id" });
  WhatsappFlow.belongsTo(Business, { foreignKey: "business_id" });
  WhatsappFlow.hasMany(FlowScreen, { foreignKey: "flow_id" });
  FlowScreen.belongsTo(WhatsappFlow, { foreignKey: "flow_id" });
  FlowScreen.hasMany(FlowComponent, { foreignKey: "screen_id" });
  FlowComponent.belongsTo(FlowScreen, { foreignKey: "screen_id" });

  Business.hasMany(Conversation, { foreignKey: "business_id" });
  Conversation.belongsTo(Business, { foreignKey: "business_id" });
  Conversation.belongsTo(Contact, { foreignKey: "contact_id" });
  Conversation.belongsTo(WhatsappNumber, { foreignKey: "whatsapp_number_id" });
  Conversation.belongsTo(User, { foreignKey: "assigned_agent_id", as: "assignedAgent" });
  Conversation.hasMany(Message, { foreignKey: "conversation_id" });
  Message.belongsTo(Conversation, { foreignKey: "conversation_id" });
  Campaign.hasMany(Message, { foreignKey: "campaign_id" });
  Message.belongsTo(Campaign, { foreignKey: "campaign_id" });
  Campaign.hasMany(Job, { foreignKey: "campaign_id" });
  Job.belongsTo(Campaign, { foreignKey: "campaign_id" });

  Business.hasMany(Product, { foreignKey: "business_id" });
  Product.belongsTo(Business, { foreignKey: "business_id" });
  Business.hasMany(Order, { foreignKey: "business_id" });
  Order.belongsTo(Business, { foreignKey: "business_id" });
  Order.belongsTo(Contact, { foreignKey: "contact_id" });
  Business.hasMany(PaymentSetting, { foreignKey: "business_id" });
  PaymentSetting.belongsTo(Business, { foreignKey: "business_id" });
  Business.hasMany(WalletTransaction, { foreignKey: "business_id" });
  WalletTransaction.belongsTo(Business, { foreignKey: "business_id" });
  WalletTransaction.belongsTo(Order, { foreignKey: "order_id" });

  Business.hasMany(WebhookLog, { foreignKey: "business_id" });
  WebhookLog.belongsTo(Business, { foreignKey: "business_id" });

  return {
    User,
    Business,
    BusinessUser,
    WhatsappNumber,
    Contact,
    ContactGroup,
    ContactGroupMember,
    Template,
    Campaign,
    DripStep,
    Chatbot,
    LeadMagnet,
    Lead,
    ChatbotNode,
    ChatbotEdge,
    ChatbotSession,
    WhatsappFlow,
    FlowScreen,
    FlowComponent,
    Conversation,
    Message,
    Product,
    Order,
    PaymentSetting,
    WalletTransaction,
    WebhookLog,
    Job,
  };
};
