const { Router } = require("express");
const { paymentsController } = require("./payments.controller");
const { validate } = require("../../middleware/validate");
const { razorpayConfigBody, walletTopupBody, verifyWalletTopupBody } = require("./payments.schema");

const paymentsPublicRouter = Router();
paymentsPublicRouter.post("/razorpay/:businessId/webhook", paymentsController.razorpayWebhook);

const paymentsRouter = Router();
paymentsRouter.get("/settings/razorpay", paymentsController.getRazorpay);
paymentsRouter.put("/settings/razorpay", validate(razorpayConfigBody), paymentsController.saveRazorpay);
paymentsRouter.get("/wallet/transactions", paymentsController.listTransactions);
paymentsRouter.post("/wallet/topup", validate(walletTopupBody), paymentsController.createWalletTopup);
paymentsRouter.post("/wallet/verify", validate(verifyWalletTopupBody), paymentsController.verifyWalletTopup);

module.exports = { paymentsRouter, paymentsPublicRouter };
