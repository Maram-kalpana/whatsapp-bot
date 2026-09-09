"use strict";

const { DataTypes } = require("sequelize");

async function addColumnIfMissing(queryInterface, table, column, spec) {
  const desc = await queryInterface.describeTable(table);
  if (!desc[column]) {
    await queryInterface.addColumn(table, column, spec);
  }
}

module.exports = {
  async up(queryInterface) {
    await addColumnIfMissing(queryInterface, "campaigns", "last_error", { type: DataTypes.TEXT, allowNull: true });
    await addColumnIfMissing(queryInterface, "jobs", "last_error", { type: DataTypes.TEXT, allowNull: true });
    await queryInterface.sequelize.query(
      "UPDATE businesses SET wallet_balance = 1000 WHERE wallet_balance IS NULL OR wallet_balance = 0",
    );
  },

  async down(queryInterface) {
    const campaigns = await queryInterface.describeTable("campaigns");
    if (campaigns.last_error) await queryInterface.removeColumn("campaigns", "last_error");
    const jobs = await queryInterface.describeTable("jobs");
    if (jobs.last_error) await queryInterface.removeColumn("jobs", "last_error");
  },
};
