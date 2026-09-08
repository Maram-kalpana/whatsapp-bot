const { asyncHandler } = require("../../utils/httpError");
const leadMagnetsService = require("./lead-magnets.service");

const leadMagnetsController = {
  list: asyncHandler(async (req, res) => {
    const lead_magnets = await leadMagnetsService.list(req.business.id);
    res.json({ lead_magnets });
  }),

  get: asyncHandler(async (req, res) => {
    const lead_magnet = await leadMagnetsService.getById(req.business.id, Number(req.params.id));
    res.json({ lead_magnet });
  }),

  create: asyncHandler(async (req, res) => {
    const lead_magnet = await leadMagnetsService.create(req.business.id, req.body);
    res.status(201).json({ lead_magnet });
  }),

  update: asyncHandler(async (req, res) => {
    const lead_magnet = await leadMagnetsService.update(req.business.id, Number(req.params.id), req.body);
    res.json({ lead_magnet });
  }),

  remove: asyncHandler(async (req, res) => {
    await leadMagnetsService.remove(req.business.id, Number(req.params.id));
    res.json({ ok: true });
  }),

  getPublic: asyncHandler(async (req, res) => {
    const form = await leadMagnetsService.getPublicBySlug(req.params.slug);
    res.json({ form });
  }),

  submitPublic: asyncHandler(async (req, res) => {
    const result = await leadMagnetsService.submitPublic(req.params.slug, req.body);
    res.status(201).json(result);
  }),
};

module.exports = { leadMagnetsController };
