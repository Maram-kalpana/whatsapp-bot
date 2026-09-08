const { Router } = require("express");
const { flowsController } = require("./flows.controller");
const { validate } = require("../../middleware/validate");
const { createBody, updateBody, saveStructureBody } = require("./flows.schema");

const flowsRouter = Router();
flowsRouter.get("/", flowsController.list);
flowsRouter.get("/published", flowsController.listPublished);
flowsRouter.post("/", validate(createBody), flowsController.create);
flowsRouter.get("/:id", flowsController.get);
flowsRouter.put("/:id", validate(updateBody), flowsController.update);
flowsRouter.put("/:id/structure", validate(saveStructureBody), flowsController.saveStructure);
flowsRouter.post("/:id/publish", flowsController.publish);
flowsRouter.delete("/:id", flowsController.remove);

module.exports = { flowsRouter };
