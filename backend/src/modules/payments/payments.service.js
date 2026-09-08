const crypto = require("crypto");
const { Op } = require("sequelize");
const { PaymentSetting, Order, Business, WalletTransaction, WebhookLog, sequelize } = require("../../models");
const { HttpError } = require("../../utils/httpError");
const { encrypt, decrypt } = require("../../lib/crypto");
const { clientFromConfig, verifyWebhookSignature } = require("../../lib/razorpay");
const { topUpWallet } = require("../../lib/wallet");
const ordersService = require("../orders/orders.service");

function publicSetting(row) {
  return {
    id: row.id,
    provider: row.provider,
    key_id: row.config?.key_id || "",
    configured: Boolean(row.config?.key_id && row.config?.key_secret_enc),
    has_webhook_secret: Boolean(row.config?.webhook_secret_enc),
  };
}

async function getRazorpaySetting(businessId) {
  const row = await PaymentSetting.findOne({ where: { business_id: businessId, provider: "razorpay" } });
  return row ? publicSetting(row) : { provider: "razorpay", configured: false, key_id: "" };
}

async function saveRazorpaySetting(businessId, body) {
  const config = {
    key_id: body.key_id,
    key_secret_enc: encrypt(body.key_secret),
    webhook_secret_enc: body.webhook_secret ? encrypt(body.webhook_secret) : null,
  };

  let row = await PaymentSetting.findOne({ where: { business_id: businessId, provider: "razorpay" } });
  if (row) {
    row.config = config;
    await row.save();
  } else {
    row = await PaymentSetting.create({ business_id: businessId, provider: "razorpay", config });
  }
  return publicSetting(row);
}

async function getRazorpayConfig(businessId) {
  const row = await PaymentSetting.findOne({ where: { business_id: businessId, provider: "razorpay" } });
  if (!row?.config?.key_id || !row.config?.key_secret_enc) {
    throw new HttpError(400, "Configure Razorpay keys in Payment Setup first");
  }
  return row.config;
}

async function createRazorpayCheckout(businessId, orderId) {
  const order = await ordersService.getOrderOrThrow(businessId, orderId);
  if (order.status === "paid") throw new HttpError(400, "Order is already paid");

  const config = await getRazorpayConfig(businessId);
  const razorpay = clientFromConfig(config);
  const amountPaise = Math.round(Number(order.total_amount) * 100);

  const rpOrder = await razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: `order_${order.id}`,
    notes: { business_id: String(businessId), order_id: String(order.id) },
  });

  order.razorpay_order_id = rpOrder.id;
  order.payment_link = null;
  await order.save();

  return {
    order_id: order.id,
    razorpay_order_id: rpOrder.id,
    amount: amountPaise,
    currency: "INR",
    key_id: config.key_id,
  };
}

async function markOrderPaid({ businessId, orderId, razorpayPaymentId, razorpayOrderId, amount }) {
  const order = await ordersService.getOrderOrThrow(businessId, orderId);
  if (order.status === "paid") return order;

  order.status = "paid";
  order.razorpay_payment_id = razorpayPaymentId || order.razorpay_payment_id;
  order.razorpay_order_id = razorpayOrderId || order.razorpay_order_id;
  await order.save();

  await WalletTransaction.create({
    business_id: businessId,
    type: "topup",
    amount: amount || order.total_amount,
    reason: "order_payment",
    order_id: order.id,
  });

  const business = await Business.findByPk(businessId);
  if (business) {
    business.wallet_balance = Number(business.wallet_balance || 0) + Number(amount || order.total_amount);
    await business.save();
  }

  return order;
}

async function isDuplicateRazorpayPayment(businessId, paymentId) {
  if (!paymentId) return false;
  const [rows] = await sequelize.query(
    `SELECT id FROM webhook_logs
     WHERE business_id = :businessId
       AND JSON_UNQUOTE(JSON_EXTRACT(payload, '$.payload.payment.entity.id')) = :paymentId
     LIMIT 1`,
    { replacements: { businessId, paymentId: String(paymentId) } },
  );
  return rows.length > 0;
}

async function handleRazorpayWebhook(businessId, rawBody, signature) {
  const row = await PaymentSetting.findOne({ where: { business_id: businessId, provider: "razorpay" } });
  if (!row) throw new HttpError(404, "Payment settings not found");

  const webhookSecret = decrypt(row.config?.webhook_secret_enc) || decrypt(row.config?.key_secret_enc);
  if (webhookSecret && signature) {
    const valid = verifyWebhookSignature(rawBody, signature, webhookSecret);
    if (!valid) throw new HttpError(401, "Invalid webhook signature");
  }

  const payload = JSON.parse(rawBody);
  const entity = payload.payload?.payment?.entity || payload.payload?.order?.entity;
  const paymentId = entity?.id;

  if (paymentId && (await isDuplicateRazorpayPayment(businessId, paymentId))) {
    return { ok: true, duplicate: true };
  }

  await WebhookLog.create({
    business_id: businessId,
    event_type: payload.event || "razorpay",
    payload,
  });

  const event = payload.event;

  if (event === "payment.captured" && entity) {
    const notes = entity.notes || {};
    if (notes.type === "wallet_topup") {
      const amount = Number(notes.amount) || Number(entity.amount) / 100;
      await topUpWallet(businessId, amount, "wallet_topup");
    } else {
      const orderId = Number(notes.order_id);
      if (orderId) {
        await markOrderPaid({
          businessId,
          orderId,
          razorpayPaymentId: entity.id,
          razorpayOrderId: entity.order_id,
          amount: Number(entity.amount) / 100,
        });
      }
    }
  }

  if (event === "order.paid" && entity?.notes?.order_id) {
    await markOrderPaid({
      businessId,
      orderId: Number(entity.notes.order_id),
      razorpayOrderId: entity.id,
      amount: Number(entity.amount) / 100,
    });
  }

  return { ok: true };
}

function verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature, secret }) {
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return expected === razorpay_signature;
}

async function verifyCheckout(businessId, orderId, body) {
  const config = await getRazorpayConfig(businessId);
  const secret = decrypt(config.key_secret_enc);
  const valid = verifyPaymentSignature({
    razorpay_order_id: body.razorpay_order_id,
    razorpay_payment_id: body.razorpay_payment_id,
    razorpay_signature: body.razorpay_signature,
    secret,
  });
  if (!valid) throw new HttpError(400, "Invalid payment signature");

  const order = await markOrderPaid({
    businessId,
    orderId,
    razorpayPaymentId: body.razorpay_payment_id,
    razorpayOrderId: body.razorpay_order_id,
  });

  return ordersService.getOrder(businessId, order.id);
}

async function createWalletTopup(businessId, amount) {
  const credit = Number(amount);
  if (!Number.isFinite(credit) || credit < 1) {
    throw new HttpError(400, "Minimum top-up amount is ₹1");
  }

  const config = await getRazorpayConfig(businessId);
  const razorpay = clientFromConfig(config);
  const amountPaise = Math.round(credit * 100);

  const rpOrder = await razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: `wallet_${businessId}_${Date.now()}`,
    notes: {
      business_id: String(businessId),
      type: "wallet_topup",
      amount: String(credit),
    },
  });

  return {
    razorpay_order_id: rpOrder.id,
    amount: amountPaise,
    currency: "INR",
    key_id: config.key_id,
    credit,
  };
}

async function verifyWalletTopup(businessId, body) {
  const config = await getRazorpayConfig(businessId);
  const secret = decrypt(config.key_secret_enc);
  const valid = verifyPaymentSignature({
    razorpay_order_id: body.razorpay_order_id,
    razorpay_payment_id: body.razorpay_payment_id,
    razorpay_signature: body.razorpay_signature,
    secret,
  });
  if (!valid) throw new HttpError(400, "Invalid payment signature");

  const credit = Number(body.amount);
  if (!Number.isFinite(credit) || credit <= 0) {
    throw new HttpError(400, "Invalid top-up amount");
  }

  const result = await topUpWallet(businessId, credit, "wallet_topup");
  return { wallet_balance: result.wallet_balance };
}

async function listWalletTransactions(businessId, { from, to, type } = {}) {
  const where = { business_id: businessId };
  if (type) where.type = type;
  if (from || to) {
    where.created_at = {};
    if (from) where.created_at[Op.gte] = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      where.created_at[Op.lte] = end;
    }
  }

  const rows = await WalletTransaction.findAll({
    where,
    order: [["created_at", "DESC"]],
    limit: 200,
  });

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    amount: Number(r.amount),
    reason: r.reason,
    order_id: r.order_id || null,
    created_at: r.created_at,
  }));
}

module.exports = {
  getRazorpaySetting,
  saveRazorpaySetting,
  createRazorpayCheckout,
  createWalletTopup,
  verifyWalletTopup,
  listWalletTransactions,
  handleRazorpayWebhook,
  markOrderPaid,
  verifyCheckout,
};
