const { asyncHandler } = require("../../utils/httpError");
const paymentsService = require("./payments.service");

const paymentsController = {
  getRazorpay: asyncHandler(async (req, res) => {
    const setting = await paymentsService.getRazorpaySetting(req.business.id);
    res.json({ setting });
  }),

  saveRazorpay: asyncHandler(async (req, res) => {
    const setting = await paymentsService.saveRazorpaySetting(req.business.id, req.body);
    res.json({ setting });
  }),

  listTransactions: asyncHandler(async (req, res) => {
    const transactions = await paymentsService.listWalletTransactions(req.business.id, req.query);
    res.json({ transactions });
  }),

  createWalletTopup: asyncHandler(async (req, res) => {
    const checkout = await paymentsService.createWalletTopup(req.business.id, req.body.amount);
    res.json(checkout);
  }),

  verifyWalletTopup: asyncHandler(async (req, res) => {
    const result = await paymentsService.verifyWalletTopup(req.business.id, req.body);
    res.json(result);
  }),

  razorpayWebhook: asyncHandler(async (req, res) => {
    const rawBody = req.rawBody || JSON.stringify(req.body || {});
    const signature = req.headers["x-razorpay-signature"];
    const result = await paymentsService.handleRazorpayWebhook(
      Number(req.params.businessId),
      rawBody,
      signature,
    );
    res.json(result);
  }),
};

module.exports = { paymentsController };
