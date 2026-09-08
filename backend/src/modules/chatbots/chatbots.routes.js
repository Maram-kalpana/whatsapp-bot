const { Router } = require("express");
const { chatbotsController } = require("./chatbots.controller");
const { validate } = require("../../middleware/validate");
const { createBody, updateBody, saveFlowBody, toggleActiveBody } = require("./chatbots.schema");

const chatbotsRouter = Router();
chatbotsRouter.get("/", chatbotsController.list);
chatbotsRouter.post("/", validate(createBody), chatbotsController.create);
chatbotsRouter.get("/:id", chatbotsController.get);
chatbotsRouter.put("/:id", validate(updateBody), chatbotsController.update);
chatbotsRouter.patch("/:id/active", validate(toggleActiveBody), chatbotsController.toggleActive);
chatbotsRouter.put("/:id/flow", validate(saveFlowBody), chatbotsController.saveFlow);
chatbotsRouter.delete("/:id", chatbotsController.remove);

module.exports = { chatbotsRouter };
