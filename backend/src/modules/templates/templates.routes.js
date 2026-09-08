const { Router } = require("express");
const { templatesController } = require("./templates.controller");
const { validate } = require("../../middleware/validate");
const { uploadMedia } = require("../../middleware/upload");
const { createTemplateSchema } = require("./templates.schema");

const templatesRouter = Router();
templatesRouter.get("/", templatesController.list);
templatesRouter.post("/", uploadMedia.single("header"), validate(createTemplateSchema), templatesController.create);

module.exports = { templatesRouter };
