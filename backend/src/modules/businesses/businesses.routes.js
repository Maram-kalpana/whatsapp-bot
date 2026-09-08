const { Router } = require("express");
const { businessesController } = require("./businesses.controller");
const { validate } = require("../../middleware/validate");
const { uploadLogo } = require("../../middleware/upload");
const { createBusinessSchema, updateBusinessSchema, addMemberSchema } = require("./businesses.schema");

const businessesRouter = Router();
businessesRouter.get("/", businessesController.list);
businessesRouter.post("/", uploadLogo.single("logo"), validate(createBusinessSchema), businessesController.create);
businessesRouter.patch("/:id", uploadLogo.single("logo"), validate(updateBusinessSchema), businessesController.update);
businessesRouter.get("/:id/members", businessesController.members);
businessesRouter.post("/:id/members", validate(addMemberSchema), businessesController.addMember);
businessesRouter.delete("/:id/members/:userId", businessesController.removeMember);

module.exports = { businessesRouter };
