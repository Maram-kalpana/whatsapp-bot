const { Router } = require("express");
const { ordersController } = require("./orders.controller");
const { validate } = require("../../middleware/validate");
const { createOrderBody, updateStatusBody, verifyPaymentBody } = require("./orders.schema");

const ordersRouter = Router();
ordersRouter.get("/", ordersController.list);
ordersRouter.post("/", validate(createOrderBody), ordersController.create);
ordersRouter.get("/:id", ordersController.get);
ordersRouter.patch("/:id/status", validate(updateStatusBody), ordersController.updateStatus);
ordersRouter.post("/:id/checkout", ordersController.createCheckout);
ordersRouter.post("/:id/verify-payment", validate(verifyPaymentBody), ordersController.verifyPayment);

module.exports = { ordersRouter };
