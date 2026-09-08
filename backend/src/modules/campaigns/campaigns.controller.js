const { asyncHandler } = require("../../utils/httpError");
const campaignsService = require("./campaigns.service");

const campaignsController = {
  list: asyncHandler(async (req, res) => {
    const campaigns = await campaignsService.list(req.business.id, {
      type: req.query.type,
      q: req.query.q,
    });
    res.json({ campaigns });
  }),

  get: asyncHandler(async (req, res) => {
    const campaign = await campaignsService.getById(req.business.id, Number(req.params.id));
    res.json({ campaign });
  }),

  createBroadcast: asyncHandler(async (req, res) => {
    const campaign = await campaignsService.createBroadcast(req.business.id, req.body, req.file);
    res.status(201).json({ campaign });
  }),

  createDrip: asyncHandler(async (req, res) => {
    const campaign = await campaignsService.createDrip(req.business.id, req.body, req.file);
    res.status(201).json({ campaign });
  }),

  remove: asyncHandler(async (req, res) => {
    await campaignsService.remove(req.business.id, Number(req.params.id));
    res.json({ ok: true });
  }),
};

module.exports = { campaignsController };
