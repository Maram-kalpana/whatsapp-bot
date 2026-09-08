const Joi = require("joi");

const createBusinessSchema = Joi.object({
  name: Joi.string().trim().min(2).max(191).required(),
  industry: Joi.string().trim().max(191).allow("", null),
});

const updateBusinessSchema = Joi.object({
  name: Joi.string().trim().min(2).max(191),
  industry: Joi.string().trim().max(191).allow("", null),
});

const addMemberSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  role: Joi.string().valid("owner", "admin", "agent").default("agent"),
});

module.exports = { createBusinessSchema, updateBusinessSchema, addMemberSchema };
