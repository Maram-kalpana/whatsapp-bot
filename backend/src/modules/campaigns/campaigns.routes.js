const { Router } = require("express");
const { campaignsController } = require("./campaigns.controller");
const { validate } = require("../../middleware/validate");
const { uploadCsv } = require("../../middleware/upload");
const { createBroadcastBody, createDripBody } = require("./campaigns.schema");

const campaignsRouter = Router();
campaignsRouter.get("/", campaignsController.list);
campaignsRouter.post("/broadcast", uploadCsv.single("csv"), validate(createBroadcastBody), campaignsController.createBroadcast);
campaignsRouter.post("/drip", uploadCsv.single("csv"), validate(createDripBody), campaignsController.createDrip);
campaignsRouter.get("/:id", campaignsController.get);
campaignsRouter.delete("/:id", campaignsController.remove);

module.exports = { campaignsRouter };
