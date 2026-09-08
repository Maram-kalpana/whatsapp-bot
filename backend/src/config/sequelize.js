const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const password = process.env.DB_PASSWORD ?? "";

const shared = {
  username: process.env.DB_USER || "root",
  password,
  database: process.env.DB_NAME || "whatsapp_saas",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  dialect: "mysql",
  logging: false,
};

module.exports = {
  development: shared,
  test: shared,
  production: shared,
};
