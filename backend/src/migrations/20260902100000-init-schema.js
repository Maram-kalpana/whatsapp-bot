"use strict";

const { DataTypes } = require("sequelize");

function idCol() {
  return { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false };
}

function bizFk() {
  return {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: "businesses", key: "id" },
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  };
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable("users", {
      id: idCol(),
      name: { type: DataTypes.STRING(191), allowNull: false },
      email: { type: DataTypes.STRING(191), allowNull: false, unique: true },
      password_hash: { type: DataTypes.STRING(191), allowNull: false },
      role: { type: DataTypes.ENUM("owner", "agent", "admin"), allowNull: false, defaultValue: "owner" },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    await queryInterface.createTable("businesses", {
      id: idCol(),
      name: { type: DataTypes.STRING(191), allowNull: false },
      logo_url: DataTypes.STRING(512),
      industry: DataTypes.STRING(191),
      owner_user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "users", key: "id" },
      },
      wallet_balance: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      quality_score: { type: DataTypes.ENUM("high", "medium", "low"), allowNull: false, defaultValue: "high" },
      daily_limit_tier: {
        type: DataTypes.ENUM("250", "1k", "10k", "100k", "unlimited"),
        allowNull: false,
        defaultValue: "250",
      },
      trial_ends_at: DataTypes.DATE,
      plan: { type: DataTypes.ENUM("trial", "advanced_lifetime", "free", "pro"), allowNull: false, defaultValue: "trial" },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex("businesses", ["owner_user_id"]);

    await queryInterface.createTable("business_users", {
      business_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        references: { model: "businesses", key: "id" },
        onDelete: "CASCADE",
      },
      user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      role: { type: DataTypes.ENUM("owner", "admin", "agent"), allowNull: false, defaultValue: "agent" },
    });
    await queryInterface.addIndex("business_users", ["business_id"]);
    await queryInterface.addIndex("business_users", ["user_id"]);

    await queryInterface.createTable("whatsapp_numbers", {
      id: idCol(),
      business_id: bizFk(),
      phone_number: { type: DataTypes.STRING(32), allowNull: false },
      waba_id: DataTypes.STRING(64),
      phone_number_id: DataTypes.STRING(64),
      display_name: DataTypes.STRING(191),
      status: { type: DataTypes.ENUM("connected", "pending"), allowNull: false, defaultValue: "pending" },
      is_live: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    });
    await queryInterface.addIndex("whatsapp_numbers", ["business_id"]);
    await queryInterface.addIndex("whatsapp_numbers", ["phone_number"]);

    await queryInterface.createTable("contacts", {
      id: idCol(),
      business_id: bizFk(),
      name: { type: DataTypes.STRING(191), allowNull: false },
      phone_number: { type: DataTypes.STRING(32), allowNull: false },
      email: DataTypes.STRING(191),
      tags: DataTypes.JSON,
      source: DataTypes.STRING(64),
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex("contacts", ["business_id"]);
    await queryInterface.addIndex("contacts", ["phone_number"]);
    await queryInterface.addIndex("contacts", ["business_id", "phone_number"]);

    await queryInterface.createTable("contact_groups", {
      id: idCol(),
      business_id: bizFk(),
      name: { type: DataTypes.STRING(191), allowNull: false },
    });
    await queryInterface.addIndex("contact_groups", ["business_id"]);

    await queryInterface.createTable("contact_group_members", {
      group_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        references: { model: "contact_groups", key: "id" },
        onDelete: "CASCADE",
      },
      contact_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        references: { model: "contacts", key: "id" },
        onDelete: "CASCADE",
      },
    });

    await queryInterface.createTable("templates", {
      id: idCol(),
      business_id: bizFk(),
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
      meta_template_id: DataTypes.STRING(128),
      status: {
        type: DataTypes.ENUM("draft", "pending", "approved", "rejected"),
        allowNull: false,
        defaultValue: "draft",
      },
    });
    await queryInterface.addIndex("templates", ["business_id"]);
    await queryInterface.addIndex("templates", ["status"]);

    await queryInterface.createTable("campaigns", {
      id: idCol(),
      business_id: bizFk(),
      name: { type: DataTypes.STRING(191), allowNull: false },
      type: { type: DataTypes.ENUM("broadcast", "drip"), allowNull: false },
      template_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        references: { model: "templates", key: "id" },
      },
      recipient_source: { type: DataTypes.ENUM("all_contacts", "group", "csv_upload"), allowNull: false },
      schedule_type: { type: DataTypes.ENUM("send_now", "scheduled"), allowNull: false },
      scheduled_at: DataTypes.DATE,
      status: {
        type: DataTypes.ENUM("draft", "sending", "completed", "failed"),
        allowNull: false,
        defaultValue: "draft",
      },
      sent_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      delivered_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      read_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      failed_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    });
    await queryInterface.addIndex("campaigns", ["business_id"]);

    await queryInterface.createTable("drip_steps", {
      id: idCol(),
      campaign_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "campaigns", key: "id" },
        onDelete: "CASCADE",
      },
      step_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      delay_minutes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      template_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "templates", key: "id" },
      },
    });
    await queryInterface.addIndex("drip_steps", ["campaign_id"]);

    await queryInterface.createTable("chatbots", {
      id: idCol(),
      business_id: bizFk(),
      name: { type: DataTypes.STRING(191), allowNull: false },
      timeout_minutes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 30 },
      fallback_message: DataTypes.TEXT,
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      trigger_keywords: DataTypes.JSON,
    });
    await queryInterface.addIndex("chatbots", ["business_id"]);

    await queryInterface.createTable("lead_magnets", {
      id: idCol(),
      business_id: bizFk(),
      name: { type: DataTypes.STRING(191), allowNull: false },
      form_fields: { type: DataTypes.JSON, allowNull: false },
      thank_you_message: DataTypes.TEXT,
      linked_bot_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        references: { model: "chatbots", key: "id" },
        onDelete: "SET NULL",
      },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex("lead_magnets", ["business_id"]);

    await queryInterface.createTable("leads", {
      id: idCol(),
      business_id: bizFk(),
      lead_magnet_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "lead_magnets", key: "id" },
        onDelete: "CASCADE",
      },
      contact_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "contacts", key: "id" },
        onDelete: "CASCADE",
      },
      submitted_data: { type: DataTypes.JSON, allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex("leads", ["business_id"]);
    await queryInterface.addIndex("leads", ["lead_magnet_id"]);

    await queryInterface.createTable("chatbot_nodes", {
      id: idCol(),
      chatbot_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "chatbots", key: "id" },
        onDelete: "CASCADE",
      },
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
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex("chatbot_nodes", ["chatbot_id"]);

    await queryInterface.createTable("chatbot_edges", {
      id: idCol(),
      chatbot_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "chatbots", key: "id" },
        onDelete: "CASCADE",
      },
      source_node_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "chatbot_nodes", key: "id" },
        onDelete: "CASCADE",
      },
      target_node_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "chatbot_nodes", key: "id" },
        onDelete: "CASCADE",
      },
      source_handle: DataTypes.STRING(64),
    });
    await queryInterface.addIndex("chatbot_edges", ["chatbot_id"]);

    await queryInterface.createTable("whatsapp_flows", {
      id: idCol(),
      business_id: bizFk(),
      name: { type: DataTypes.STRING(191), allowNull: false },
      status: { type: DataTypes.ENUM("draft", "published"), allowNull: false, defaultValue: "draft" },
      meta_flow_id: DataTypes.STRING(128),
    });
    await queryInterface.addIndex("whatsapp_flows", ["business_id"]);

    await queryInterface.createTable("flow_screens", {
      id: idCol(),
      flow_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "whatsapp_flows", key: "id" },
        onDelete: "CASCADE",
      },
      screen_key: { type: DataTypes.STRING(64), allowNull: false },
      title: { type: DataTypes.STRING(191), allowNull: false },
      screen_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    });
    await queryInterface.addIndex("flow_screens", ["flow_id"]);

    await queryInterface.createTable("flow_components", {
      id: idCol(),
      screen_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "flow_screens", key: "id" },
        onDelete: "CASCADE",
      },
      component_type: { type: DataTypes.STRING(64), allowNull: false },
      label: { type: DataTypes.STRING(191), allowNull: false },
      config: { type: DataTypes.JSON, allowNull: false },
      component_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    });
    await queryInterface.addIndex("flow_components", ["screen_id"]);

    await queryInterface.createTable("conversations", {
      id: idCol(),
      business_id: bizFk(),
      contact_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "contacts", key: "id" },
        onDelete: "CASCADE",
      },
      whatsapp_number_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "whatsapp_numbers", key: "id" },
      },
      last_message_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      status: { type: DataTypes.ENUM("open", "resolved"), allowNull: false, defaultValue: "open" },
      assigned_agent_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        references: { model: "users", key: "id" },
      },
    });
    await queryInterface.addIndex("conversations", ["business_id"]);
    await queryInterface.addIndex("conversations", ["contact_id"]);
    await queryInterface.addIndex("conversations", ["last_message_at"]);

    await queryInterface.createTable("messages", {
      id: idCol(),
      conversation_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "conversations", key: "id" },
        onDelete: "CASCADE",
      },
      direction: { type: DataTypes.ENUM("inbound", "outbound"), allowNull: false },
      type: { type: DataTypes.STRING(32), allowNull: false },
      content: { type: DataTypes.JSON, allowNull: false },
      meta_message_id: DataTypes.STRING(128),
      status: {
        type: DataTypes.ENUM("sent", "delivered", "read", "failed"),
        allowNull: false,
        defaultValue: "sent",
      },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex("messages", ["conversation_id"]);
    await queryInterface.addIndex("messages", ["created_at"]);
    await queryInterface.addIndex("messages", ["meta_message_id"]);

    await queryInterface.createTable("products", {
      id: idCol(),
      business_id: bizFk(),
      name: { type: DataTypes.STRING(191), allowNull: false },
      description: DataTypes.TEXT,
      price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      image_url: DataTypes.STRING(512),
      sku: DataTypes.STRING(64),
      category: DataTypes.STRING(128),
      meta_catalog_id: DataTypes.STRING(128),
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    });
    await queryInterface.addIndex("products", ["business_id"]);

    await queryInterface.createTable("orders", {
      id: idCol(),
      business_id: bizFk(),
      contact_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "contacts", key: "id" },
      },
      items: { type: DataTypes.JSON, allowNull: false },
      total_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      status: {
        type: DataTypes.ENUM("pending", "paid", "shipped", "cancelled"),
        allowNull: false,
        defaultValue: "pending",
      },
      payment_provider: { type: DataTypes.ENUM("razorpay", "stripe", "cod"), allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex("orders", ["business_id"]);
    await queryInterface.addIndex("orders", ["created_at"]);

    await queryInterface.createTable("payment_settings", {
      id: idCol(),
      business_id: bizFk(),
      provider: { type: DataTypes.ENUM("razorpay", "stripe", "cod"), allowNull: false },
      config: { type: DataTypes.JSON, allowNull: false },
    });
    await queryInterface.addIndex("payment_settings", ["business_id"]);
    await queryInterface.addConstraint("payment_settings", {
      fields: ["business_id", "provider"],
      type: "unique",
      name: "payment_settings_business_provider_unique",
    });

    await queryInterface.createTable("wallet_transactions", {
      id: idCol(),
      business_id: bizFk(),
      type: { type: DataTypes.ENUM("topup", "deduction"), allowNull: false },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      reason: { type: DataTypes.ENUM("message_send", "template_fee", "plan_upgrade"), allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex("wallet_transactions", ["business_id"]);
    await queryInterface.addIndex("wallet_transactions", ["created_at"]);

    await queryInterface.createTable("webhook_logs", {
      id: idCol(),
      business_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        references: { model: "businesses", key: "id" },
        onDelete: "SET NULL",
      },
      event_type: { type: DataTypes.STRING(128), allowNull: false },
      payload: { type: DataTypes.JSON, allowNull: false },
      received_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex("webhook_logs", ["business_id"]);
    await queryInterface.addIndex("webhook_logs", ["received_at"]);

    await queryInterface.createTable("jobs", {
      id: idCol(),
      type: { type: DataTypes.STRING(64), allowNull: false },
      payload: { type: DataTypes.JSON, allowNull: false },
      status: {
        type: DataTypes.ENUM("pending", "processing", "done", "failed"),
        allowNull: false,
        defaultValue: "pending",
      },
      run_after: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      attempts: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex("jobs", ["status", "run_after"]);
  },

  async down(queryInterface) {
    const tables = [
      "jobs",
      "webhook_logs",
      "wallet_transactions",
      "payment_settings",
      "orders",
      "products",
      "messages",
      "conversations",
      "flow_components",
      "flow_screens",
      "whatsapp_flows",
      "chatbot_edges",
      "chatbot_nodes",
      "leads",
      "lead_magnets",
      "drip_steps",
      "campaigns",
      "templates",
      "contact_group_members",
      "contact_groups",
      "contacts",
      "whatsapp_numbers",
      "business_users",
      "chatbots",
      "businesses",
      "users",
    ];
    for (const table of tables) {
      await queryInterface.dropTable(table);
    }
  },
};
