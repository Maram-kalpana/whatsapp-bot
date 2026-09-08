const Joi = require("joi");

const razorpayConfigBody = Joi.object({
  key_id: Joi.string().trim().min(8).required(),
  key_secret: Joi.string().trim().min(8).required(),
  webhook_secret: Joi.string().allow("", null),
});

const walletTopupBody = Joi.object({
  amount: Joi.number().min(1).max(1000000).required(),
});

const verifyWalletTopupBody = Joi.object({
  amount: Joi.number().min(1).required(),
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
});

module.exports = { razorpayConfigBody, walletTopupBody, verifyWalletTopupBody };
