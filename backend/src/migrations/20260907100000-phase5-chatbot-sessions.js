"use strict";

const { DataTypes } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes("chatbot_sessions")) {
      await queryInterface.createTable("chatbot_sessions", {
        id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
        business_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
        chatbot_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
        contact_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
        conversation_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
        current_node_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
        status: {
          type: DataTypes.ENUM("active", "expired", "completed"),
          allowNull: false,
          defaultValue: "active",
        },
        started_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        last_activity_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      });
      await queryInterface.addIndex("chatbot_sessions", ["business_id", "contact_id", "status"], {
        name: "chatbot_sessions_contact_status",
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable("chatbot_sessions");
  },
};
