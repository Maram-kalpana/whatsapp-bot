const { asyncHandler } = require("../../utils/httpError");
const { getSummary, getWebhookLogs } = require("./dashboard.service");

const dashboardController = {
  summary: asyncHandler(async (req, res) => {
    const summary = await getSummary(req.business.id);
    res.json({ summary });
  }),

  webhookLogs: asyncHandler(async (req, res) => {
    const logs = await getWebhookLogs(req.business.id);
    res.json({ logs });
  }),
};

module.exports = { dashboardController };
