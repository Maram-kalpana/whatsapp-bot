const Joi = require("joi");

const contactBody = Joi.object({
  name: Joi.string().trim().min(1).max(191).required(),
  phone_number: Joi.string().trim().min(6).max(32).required(),
  email: Joi.string().trim().email().allow("", null),
  tags: Joi.array().items(Joi.string().trim().max(64)).default([]),
  group_ids: Joi.array().items(Joi.number().integer()).default([]),
  source: Joi.string().trim().max(64).allow("", null),
});

const updateContactBody = Joi.object({
  name: Joi.string().trim().min(1).max(191),
  phone_number: Joi.string().trim().min(6).max(32),
  email: Joi.string().trim().email().allow("", null),
  tags: Joi.array().items(Joi.string().trim().max(64)),
  group_ids: Joi.array().items(Joi.number().integer()),
  source: Joi.string().trim().max(64).allow("", null),
}).min(1);

const groupBody = Joi.object({
  name: Joi.string().trim().min(1).max(191).required(),
});

const importBody = Joi.object({
  mapping: Joi.object({
    name: Joi.string().required(),
    phone_number: Joi.string().required(),
    email: Joi.string().allow("", null),
  }).required(),
  rows: Joi.array().items(Joi.object().unknown(true)).min(1).required(),
  group_id: Joi.number().integer().allow(null),
  group_name: Joi.string().trim().allow("", null),
});

module.exports = { contactBody, updateContactBody, groupBody, importBody };
