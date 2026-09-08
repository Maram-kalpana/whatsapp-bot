const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const env = require("./config/env");
const { parseBusinessHeader } = require("./middleware/tenant");
const { registerModuleRoutes } = require("./modules");
const { sequelize } = require("./models");
const { errorHandler } = require("./utils/httpError");

function createApp() {
  const app = express();

  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(cookieParser());
  app.use(
    express.json({
      limit: "2mb",
      verify: (req, _res, buf) => {
        req.rawBody = buf.toString("utf8");
      },
    }),
  );
  app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
  app.use(parseBusinessHeader);

  const { webhooksRouter } = require("./modules/webhooks/webhooks.routes");
  app.use("/webhooks", webhooksRouter);

  app.get("/health", async (_req, res) => {
    let db = false;
    try {
      await sequelize.authenticate();
      db = true;
    } catch {
      db = false;
    }
    res.json({ ok: true, service: "whatsapp-saas-api", phase: 8, db });
  });

  app.use("/api", registerModuleRoutes());
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
