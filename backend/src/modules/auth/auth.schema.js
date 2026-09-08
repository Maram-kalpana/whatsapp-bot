const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(191).required(),
  email: Joi.string().trim().email().max(191).required(),
  password: Joi.string().min(8).max(128).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required(),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(191),
  email: Joi.string().trim().email().max(191),
}).min(1);

module.exports = { registerSchema, loginSchema, updateProfileSchema };
