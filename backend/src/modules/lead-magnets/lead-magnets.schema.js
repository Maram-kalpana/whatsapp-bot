const Joi = require("joi");

const formField = Joi.object({
  id: Joi.string().optional(),
  type: Joi.string()
    .valid("text", "email", "phone", "textarea", "select", "checkbox")
    .required(),
  label: Joi.string().trim().min(1).max(191).required(),
  required: Joi.boolean().default(false),
  placeholder: Joi.string().allow("", null).max(191),
  options: Joi.array()
    .items(Joi.object({ label: Joi.string().required(), value: Joi.string().required() }))
    .optional(),
});

const createBody = Joi.object({
  name: Joi.string().trim().min(1).max(191).required(),
  form_fields: Joi.array().items(formField).min(1).required(),
  thank_you_message: Joi.string().allow("", null).max(4096),
  linked_bot_id: Joi.number().integer().allow(null),
});

const updateBody = createBody.fork(["name", "form_fields"], (s) => s.optional());

const publicSubmitBody = Joi.object({
  name: Joi.string().trim().min(1).max(191).required(),
  phone: Joi.string().trim().min(6).max(32).required(),
  email: Joi.string().email().allow("", null),
  fields: Joi.object().default({}),
});

module.exports = { createBody, updateBody, publicSubmitBody };
