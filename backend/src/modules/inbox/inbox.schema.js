const Joi = require("joi");

const assignBody = Joi.object({
  assigned_agent_id: Joi.number().integer().allow(null),
  status: Joi.string().valid("open", "resolved"),
});

const openBody = Joi.object({
  contact_id: Joi.number().integer(),
  name: Joi.string().trim().max(191).allow("", null),
  phone_number: Joi.string().trim().max(32),
}).or("contact_id", "phone_number");

module.exports = { assignBody, openBody };
