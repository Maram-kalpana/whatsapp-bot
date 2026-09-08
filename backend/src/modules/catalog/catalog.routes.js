const { Router } = require("express");
const { catalogController } = require("./catalog.controller");
const { validate } = require("../../middleware/validate");
const { uploadProduct } = require("../../middleware/upload");
const {
  createProductBody,
  updateProductBody,
  toggleActiveBody,
  catalogSettingsBody,
} = require("./catalog.schema");

const catalogRouter = Router();
catalogRouter.get("/products", catalogController.listProducts);
catalogRouter.get("/products/synced", catalogController.listSyncedProducts);
catalogRouter.post("/products", uploadProduct.single("image"), validate(createProductBody), catalogController.createProduct);
catalogRouter.get("/products/:id", catalogController.getProduct);
catalogRouter.put("/products/:id", uploadProduct.single("image"), validate(updateProductBody), catalogController.updateProduct);
catalogRouter.patch("/products/:id/active", validate(toggleActiveBody), catalogController.toggleActive);
catalogRouter.delete("/products/:id", catalogController.removeProduct);
catalogRouter.get("/settings", catalogController.getSettings);
catalogRouter.put("/settings", validate(catalogSettingsBody), catalogController.updateSettings);
catalogRouter.post("/sync", catalogController.syncToMeta);

module.exports = { catalogRouter };
