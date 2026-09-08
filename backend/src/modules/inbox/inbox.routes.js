const { Router } = require("express");
const { inboxController } = require("./inbox.controller");
const { validate } = require("../../middleware/validate");
const { uploadMedia } = require("../../middleware/upload");
const { assignBody, openBody } = require("./inbox.schema");

const inboxRouter = Router();
inboxRouter.get("/", inboxController.list);
inboxRouter.post("/open", validate(openBody), inboxController.open);
inboxRouter.get("/:id/messages", inboxController.messages);
inboxRouter.post("/:id/read", inboxController.read);
inboxRouter.patch("/:id", validate(assignBody), inboxController.assign);
inboxRouter.post("/:id/messages", uploadMedia.single("media"), inboxController.send);

module.exports = { inboxRouter };
