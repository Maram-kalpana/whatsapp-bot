const Joi = require("joi");

const componentInput = Joi.object({
  id: Joi.alternatives().try(Joi.number().integer(), Joi.string()).optional(),
  component_type: Joi.string()
    .valid(
      "short",
      "paragraph",
      "single",
      "multiple",
      "dropdown",
      "text_heading",
      "text_body",
      "date",
      "opt_in",
      "button",
    )
    .required(),
  label: Joi.string().trim().min(1).max(191).required(),
  config: Joi.object().default({}),
  component_order: Joi.number().integer().min(0).required(),
});

const screenInput = Joi.object({
  id: Joi.alternatives().try(Joi.number().integer(), Joi.string()).optional(),
  screen_key: Joi.string().trim().min(1).max(64).required(),
  title: Joi.string().trim().min(1).max(191).required(),
  screen_order: Joi.number().integer().min(0).required(),
  components: Joi.array().items(componentInput).default([]),
});

const createBody = Joi.object({
  name: Joi.string().trim().min(1).max(191).required(),
});

const updateBody = Joi.object({
  name: Joi.string().trim().min(1).max(191).optional(),
});

const saveStructureBody = Joi.object({
  screens: Joi.array().items(screenInput).min(1).required(),
});

module.exports = { createBody, updateBody, saveStructureBody };
