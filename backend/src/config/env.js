const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../../../../.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

module.exports = {
  port: Number(process.env.PORT || 4000),
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    name: process.env.DB_NAME || "whatsapp_saas",
  },
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "dev-access-secret",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  metaGraphApiVersion: process.env.META_GRAPH_API_VERSION || "v18.0",
  metaWebhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN || "dev-verify-token",
  metaAccessToken: process.env.META_ACCESS_TOKEN || "",
  metaAppSecret: process.env.META_APP_SECRET || "",
  messageCost: Number(process.env.MESSAGE_COST || 1),
};
