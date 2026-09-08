"use strict";

const { DataTypes } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    const describe = async (table) => queryInterface.describeTable(table).catch(() => ({}));
    const leadMagnets = await describe("lead_magnets");
    if (!leadMagnets.public_slug) {
      await queryInterface.addColumn("lead_magnets", "public_slug", {
        type: DataTypes.STRING(64),
        allowNull: true,
        unique: true,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("lead_magnets", "public_slug");
  },
};
