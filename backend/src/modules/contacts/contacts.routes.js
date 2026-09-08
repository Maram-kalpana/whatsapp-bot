const { Router } = require("express");
const { contactsController } = require("./contacts.controller");
const { validate } = require("../../middleware/validate");
const { contactBody, updateContactBody, groupBody, importBody } = require("./contacts.schema");

const contactsRouter = Router();
contactsRouter.get("/", contactsController.list);
contactsRouter.post("/", validate(contactBody), contactsController.create);
contactsRouter.get("/export", contactsController.exportCsv);
contactsRouter.post("/import", validate(importBody), contactsController.importRows);
contactsRouter.get("/groups", contactsController.groups);
contactsRouter.post("/groups", validate(groupBody), contactsController.createGroup);
contactsRouter.patch("/:id", validate(updateContactBody), contactsController.update);
contactsRouter.delete("/:id", contactsController.remove);

module.exports = { contactsRouter };
