const { asyncHandler } = require("../../utils/httpError");
const flowsService = require("./flows.service");

const flowsController = {
  list: asyncHandler(async (req, res) => {
    const flows = await flowsService.list(req.business.id);
    res.json({ flows });
  }),

  listPublished: asyncHandler(async (req, res) => {
    const flows = await flowsService.listPublished(req.business.id);
    res.json({ flows });
  }),

  get: asyncHandler(async (req, res) => {
    const data = await flowsService.getById(req.business.id, Number(req.params.id));
    res.json(data);
  }),

  create: asyncHandler(async (req, res) => {
    const data = await flowsService.create(req.business.id, req.body);
    res.status(201).json(data);
  }),

  update: asyncHandler(async (req, res) => {
    const data = await flowsService.update(req.business.id, Number(req.params.id), req.body);
    res.json(data);
  }),

  saveStructure: asyncHandler(async (req, res) => {
    const data = await flowsService.saveStructure(req.business.id, Number(req.params.id), req.body);
    res.json(data);
  }),

  publish: asyncHandler(async (req, res) => {
    const data = await flowsService.publish(req.business.id, Number(req.params.id));
    res.json(data);
  }),

  remove: asyncHandler(async (req, res) => {
    await flowsService.remove(req.business.id, Number(req.params.id));
    res.json({ ok: true });
  }),
};

module.exports = { flowsController };
