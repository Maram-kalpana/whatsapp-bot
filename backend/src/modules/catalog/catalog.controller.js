const { asyncHandler } = require("../../utils/httpError");
const catalogService = require("./catalog.service");

const catalogController = {
  listProducts: asyncHandler(async (req, res) => {
    const products = await catalogService.listProducts(req.business.id, req.query);
    res.json({ products });
  }),

  listSyncedProducts: asyncHandler(async (req, res) => {
    const products = await catalogService.listSyncedProducts(req.business.id);
    res.json({ products });
  }),

  getProduct: asyncHandler(async (req, res) => {
    const product = await catalogService.getProduct(req.business.id, Number(req.params.id));
    res.json({ product });
  }),

  createProduct: asyncHandler(async (req, res) => {
    const product = await catalogService.createProduct(req.business.id, req.body, req.file);
    res.status(201).json({ product });
  }),

  updateProduct: asyncHandler(async (req, res) => {
    const product = await catalogService.updateProduct(
      req.business.id,
      Number(req.params.id),
      req.body,
      req.file,
    );
    res.json({ product });
  }),

  toggleActive: asyncHandler(async (req, res) => {
    const product = await catalogService.toggleActive(
      req.business.id,
      Number(req.params.id),
      req.body.is_active,
    );
    res.json({ product });
  }),

  removeProduct: asyncHandler(async (req, res) => {
    await catalogService.removeProduct(req.business.id, Number(req.params.id));
    res.json({ ok: true });
  }),

  getSettings: asyncHandler(async (req, res) => {
    const settings = await catalogService.getCatalogSettings(req.business.id);
    res.json({ settings });
  }),

  updateSettings: asyncHandler(async (req, res) => {
    const settings = await catalogService.updateCatalogSettings(req.business.id, req.body);
    res.json({ settings });
  }),

  syncToMeta: asyncHandler(async (req, res) => {
    const result = await catalogService.syncToMeta(req.business.id);
    res.json(result);
  }),
};

module.exports = { catalogController };
