const { Router } = require("express");
const { dashboardController } = require("./dashboard.controller");

const dashboardRouter = Router();
dashboardRouter.get("/", dashboardController.summary);
dashboardRouter.get("/summary", dashboardController.summary);
dashboardRouter.get("/webhook-logs", dashboardController.webhookLogs);

module.exports = { dashboardRouter };
