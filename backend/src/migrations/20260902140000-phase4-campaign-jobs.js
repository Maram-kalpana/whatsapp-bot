"use strict";

const { DataTypes } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    const describe = async (table) => queryInterface.describeTable(table).catch(() => ({}));

    const campaigns = await describe("campaigns");
    if (!campaigns.recipient_count) {
      await queryInterface.addColumn("campaigns", "recipient_count", {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      });
    }

    const messages = await describe("messages");
    if (!messages.campaign_id) {
      await queryInterface.addColumn("messages", "campaign_id", {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      });
    }

    const jobs = await describe("jobs");
    if (!jobs.campaign_id) {
      await queryInterface.addColumn("jobs", "campaign_id", {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("jobs", "campaign_id");
    await queryInterface.removeColumn("messages", "campaign_id");
    await queryInterface.removeColumn("campaigns", "recipient_count");
  },
};
