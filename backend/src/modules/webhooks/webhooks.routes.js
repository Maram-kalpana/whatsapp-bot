const { Router } = require("express");
const { webhooksController } = require("./webhooks.controller");

const webhooksRouter = Router();
webhooksRouter.get("/whatsapp", webhooksController.verify);
webhooksRouter.post("/whatsapp", webhooksController.receive);
webhooksRouter.get("/", webhooksController.verify);
webhooksRouter.post("/", webhooksController.receive);

module.exports = { webhooksRouter };
