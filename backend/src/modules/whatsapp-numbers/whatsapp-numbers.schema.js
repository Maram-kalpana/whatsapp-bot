const Joi = require("joi");

const upsertNumberSchema = Joi.object({
  phone_number: Joi.string().trim().max(32).allow("", null),
  phone_number_id: Joi.string().trim().max(64).required(),
  waba_id: Joi.string().trim().max(64).required(),
  display_name: Joi.string().trim().max(191).required(),
  status: Joi.string().valid("connected", "pending").default("pending"),
  is_live: Joi.boolean().default(false),
});

module.exports = { upsertNumberSchema };
