const Joi = require("joi");

const createTemplateSchema = Joi.object({
  name: Joi.string().trim().min(1).max(512).required(),
  category: Joi.string().valid("marketing", "utility", "authentication").required(),
  type: Joi.string().valid("default", "catalogue", "flow", "order_details", "carousel").default("default"),
  language: Joi.string().trim().max(32).default("en_US"),
  header_type: Joi.string().valid("none", "text", "image", "video", "document").allow("", null),
  header_content: Joi.string().allow("", null),
  body: Joi.string().allow("").default(""),
  footer: Joi.string().allow("", null),
  buttons: Joi.alternatives().try(Joi.array(), Joi.string()).default([]),
  sample_values: Joi.alternatives().try(Joi.object(), Joi.string()).default({}),
  linked_product_ids: Joi.alternatives().try(Joi.array().items(Joi.number().integer()), Joi.string()).default([]),
});

module.exports = { createTemplateSchema };
