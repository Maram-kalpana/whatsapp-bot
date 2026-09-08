const { Router } = require("express");
const { leadMagnetsController } = require("./lead-magnets.controller");
const { validate } = require("../../middleware/validate");
const { createBody, updateBody, publicSubmitBody } = require("./lead-magnets.schema");

const leadMagnetsPublicRouter = Router();
leadMagnetsPublicRouter.get("/:slug", leadMagnetsController.getPublic);
leadMagnetsPublicRouter.post("/:slug/submit", validate(publicSubmitBody), leadMagnetsController.submitPublic);

const leadmagnetsRouter = Router();
leadmagnetsRouter.get("/", leadMagnetsController.list);
leadmagnetsRouter.post("/", validate(createBody), leadMagnetsController.create);
leadmagnetsRouter.get("/:id", leadMagnetsController.get);
leadmagnetsRouter.put("/:id", validate(updateBody), leadMagnetsController.update);
leadmagnetsRouter.delete("/:id", leadMagnetsController.remove);

module.exports = { leadmagnetsRouter, leadMagnetsPublicRouter };
