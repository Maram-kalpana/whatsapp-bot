const Joi = require("joi");

const assignBody = Joi.object({
  assigned_agent_id: Joi.number().integer().allow(null),
  status: Joi.string().valid("open", "resolved"),
});

const openBody = Joi.object({
  contact_id: Joi.number().integer().required(),
});

module.exports = { assignBody, openBody };
