const Joi = require("joi");

const orderItem = Joi.object({
  product_id: Joi.number().integer(),
  name: Joi.string().trim().max(191),
  sku: Joi.string().allow("", null),
  price: Joi.number().min(0),
  quantity: Joi.number().integer().min(1).default(1),
}).or("product_id", "name");

const createOrderBody = Joi.object({
  contact_id: Joi.number().integer().required(),
  items: Joi.array().items(orderItem).min(1).required(),
  payment_provider: Joi.string().valid("razorpay", "stripe", "cod").default("razorpay"),
});

const updateStatusBody = Joi.object({
  status: Joi.string().valid("pending", "paid", "shipped", "cancelled").required(),
});

const verifyPaymentBody = Joi.object({
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
});

module.exports = { createOrderBody, updateStatusBody, verifyPaymentBody };
