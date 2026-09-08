const { asyncHandler } = require("../../utils/httpError");
const chatbotsService = require("./chatbots.service");

const chatbotsController = {
  list: asyncHandler(async (req, res) => {
    const chatbots = await chatbotsService.list(req.business.id);
    res.json({ chatbots });
  }),

  get: asyncHandler(async (req, res) => {
    const data = await chatbotsService.getById(req.business.id, Number(req.params.id));
    res.json(data);
  }),

  create: asyncHandler(async (req, res) => {
    const chatbot = await chatbotsService.create(req.business.id, req.body);
    res.status(201).json({ chatbot });
  }),

  update: asyncHandler(async (req, res) => {
    const chatbot = await chatbotsService.update(req.business.id, Number(req.params.id), req.body);
    res.json({ chatbot });
  }),

  toggleActive: asyncHandler(async (req, res) => {
    const chatbot = await chatbotsService.toggleActive(
      req.business.id,
      Number(req.params.id),
      req.body.is_active,
    );
    res.json({ chatbot });
  }),

  saveFlow: asyncHandler(async (req, res) => {
    const flow = await chatbotsService.saveFlow(req.business.id, Number(req.params.id), req.body);
    res.json(flow);
  }),

  remove: asyncHandler(async (req, res) => {
    await chatbotsService.remove(req.business.id, Number(req.params.id));
    res.json({ ok: true });
  }),
};

module.exports = { chatbotsController };
