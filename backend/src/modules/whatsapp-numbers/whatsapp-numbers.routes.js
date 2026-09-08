const { Router } = require("express");
const { whatsappnumbersController } = require("./whatsapp-numbers.controller");
const { validate } = require("../../middleware/validate");
const { upsertNumberSchema } = require("./whatsapp-numbers.schema");

const whatsappnumbersRouter = Router();
whatsappnumbersRouter.get("/", whatsappnumbersController.list);
whatsappnumbersRouter.post("/", validate(upsertNumberSchema), whatsappnumbersController.upsert);
whatsappnumbersRouter.patch("/:id", validate(upsertNumberSchema), whatsappnumbersController.update);

module.exports = { whatsappnumbersRouter };
