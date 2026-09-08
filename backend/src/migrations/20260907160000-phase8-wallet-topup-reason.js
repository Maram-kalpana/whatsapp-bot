"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE wallet_transactions
      MODIFY reason ENUM('message_send','template_fee','plan_upgrade','order_payment','wallet_topup') NOT NULL
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE wallet_transactions
      MODIFY reason ENUM('message_send','template_fee','plan_upgrade','order_payment') NOT NULL
    `);
  },
};
