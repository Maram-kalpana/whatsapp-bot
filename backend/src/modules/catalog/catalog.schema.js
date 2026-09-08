const Joi = require("joi");

const createProductBody = Joi.object({
  name: Joi.string().trim().min(1).max(191).required(),
  description: Joi.string().allow("", null).max(4096),
  price: Joi.number().min(0).required(),
  sku: Joi.string().allow("", null).max(64),
  category: Joi.string().allow("", null).max(128),
  is_active: Joi.boolean().truthy("true").falsy("false").default(true),
});

const updateProductBody = createProductBody.fork(["name", "price"], (s) => s.optional());

const toggleActiveBody = Joi.object({
  is_active: Joi.boolean().required(),
});

const catalogSettingsBody = Joi.object({
  meta_catalog_id: Joi.string().allow("", null).max(128),
});

module.exports = { createProductBody, updateProductBody, toggleActiveBody, catalogSettingsBody };
