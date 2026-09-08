const Joi = require("joi");

const dripStep = Joi.object({
  delay_minutes: Joi.number().integer().min(0).max(525600).required(),
  template_id: Joi.number().integer().required(),
});

const groupId = Joi.when("recipient_source", {
  is: "group",
  then: Joi.number().integer().required(),
  otherwise: Joi.any().empty("").optional().allow(null),
});

const scheduledAt = Joi.when("schedule_type", {
  is: "scheduled",
  then: Joi.date().required(),
  otherwise: Joi.any().empty("").optional().allow(null),
});

const createBroadcastBody = Joi.object({
  name: Joi.string().trim().min(1).max(191).required(),
  recipient_source: Joi.string().valid("all_contacts", "group", "csv_upload").required(),
  recipient_group_id: groupId,
  template_id: Joi.number().integer().required(),
  schedule_type: Joi.string().valid("send_now", "scheduled").required(),
  scheduled_at: scheduledAt,
});

const createDripBody = Joi.object({
  name: Joi.string().trim().min(1).max(191).required(),
  recipient_source: Joi.string().valid("all_contacts", "group", "csv_upload").required(),
  recipient_group_id: groupId,
  schedule_type: Joi.string().valid("send_now", "scheduled").required(),
  scheduled_at: scheduledAt,
  steps: Joi.alternatives()
    .try(Joi.array().items(dripStep).min(1), Joi.string())
    .required(),
});

module.exports = { createBroadcastBody, createDripBody };
