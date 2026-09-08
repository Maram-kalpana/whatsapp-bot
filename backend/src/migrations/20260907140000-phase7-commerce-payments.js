"use strict";

const { DataTypes } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    const describe = async (table) => queryInterface.describeTable(table).catch(() => ({}));

    const businesses = await describe("businesses");
    if (!businesses.meta_catalog_id) {
      await queryInterface.addColumn("businesses", "meta_catalog_id", {
        type: DataTypes.STRING(128),
        allowNull: true,
      });
    }

    const products = await describe("products");
    if (!products.meta_product_id) {
      await queryInterface.addColumn("products", "meta_product_id", {
        type: DataTypes.STRING(128),
        allowNull: true,
      });
    }

    const orders = await describe("orders");
    if (!orders.razorpay_order_id) {
      await queryInterface.addColumn("orders", "razorpay_order_id", { type: DataTypes.STRING(64), allowNull: true });
    }
    if (!orders.razorpay_payment_id) {
      await queryInterface.addColumn("orders", "razorpay_payment_id", { type: DataTypes.STRING(64), allowNull: true });
    }
    if (!orders.payment_link) {
      await queryInterface.addColumn("orders", "payment_link", { type: DataTypes.STRING(512), allowNull: true });
    }

    const wallet = await describe("wallet_transactions");
    if (!wallet.order_id) {
      await queryInterface.addColumn("wallet_transactions", "order_id", {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: "orders", key: "id" },
        onDelete: "SET NULL",
      });
    }

    const templates = await describe("templates");
    if (!templates.linked_product_ids) {
      await queryInterface.addColumn("templates", "linked_product_ids", {
        type: DataTypes.JSON,
        allowNull: true,
      });
    }

    try {
      await queryInterface.changeColumn("wallet_transactions", "reason", {
        type: DataTypes.ENUM("message_send", "template_fee", "plan_upgrade", "order_payment"),
        allowNull: false,
      });
    } catch {
      /* enum may already include value */
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("templates", "linked_product_ids");
    await queryInterface.removeColumn("wallet_transactions", "order_id");
    await queryInterface.removeColumn("orders", "payment_link");
    await queryInterface.removeColumn("orders", "razorpay_payment_id");
    await queryInterface.removeColumn("orders", "razorpay_order_id");
    await queryInterface.removeColumn("products", "meta_product_id");
    await queryInterface.removeColumn("businesses", "meta_catalog_id");
  },
};
