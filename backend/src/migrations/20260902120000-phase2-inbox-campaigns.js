"use strict";

const { DataTypes } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    await queryInterface.addColumn("conversations", "unread_count", {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn("templates", "sample_values", {
      type: DataTypes.JSON,
      allowNull: true,
    });
    await queryInterface.addColumn("campaigns", "recipient_group_id", {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("campaigns", "recipient_group_id");
    await queryInterface.removeColumn("templates", "sample_values");
    await queryInterface.removeColumn("conversations", "unread_count");
  },
};
