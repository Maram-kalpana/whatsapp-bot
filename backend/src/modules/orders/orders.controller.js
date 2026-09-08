const { asyncHandler } = require("../../utils/httpError");
const ordersService = require("./orders.service");
const paymentsService = require("../payments/payments.service");

const ordersController = {
  list: asyncHandler(async (req, res) => {
    const orders = await ordersService.listOrders(req.business.id, req.query);
    res.json({ orders });
  }),

  get: asyncHandler(async (req, res) => {
    const order = await ordersService.getOrder(req.business.id, Number(req.params.id));
    res.json({ order });
  }),

  create: asyncHandler(async (req, res) => {
    const order = await ordersService.createOrder(req.business.id, req.body);
    res.status(201).json({ order });
  }),

  updateStatus: asyncHandler(async (req, res) => {
    const order = await ordersService.updateStatus(req.business.id, Number(req.params.id), req.body.status);
    res.json({ order });
  }),

  createCheckout: asyncHandler(async (req, res) => {
    const checkout = await paymentsService.createRazorpayCheckout(req.business.id, Number(req.params.id));
    res.json(checkout);
  }),

  verifyPayment: asyncHandler(async (req, res) => {
    const order = await paymentsService.verifyCheckout(req.business.id, Number(req.params.id), req.body);
    res.json({ order });
  }),
};

module.exports = { ordersController };
