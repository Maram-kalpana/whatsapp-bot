const Joi = require("joi");
const { CHATBOT_NODE_TYPES } = require("../../shared/constants");

const triggerKeyword = Joi.object({
  type: Joi.string().valid("text", "contains", "regex").default("text"),
  value: Joi.string().trim().min(1).max(191).required(),
});

const createBody = Joi.object({
  name: Joi.string().trim().min(1).max(191).required(),
  timeout_minutes: Joi.number().integer().min(1).max(1440).default(30),
  fallback_message: Joi.string().allow("", null).max(4096),
  trigger_keywords: Joi.array().items(triggerKeyword).default([]),
  is_active: Joi.boolean().default(false),
});

const updateBody = createBody.fork(["name"], (s) => s.optional());

const saveFlowBody = Joi.object({
  nodes: Joi.array()
    .items(
      Joi.object({
        id: Joi.alternatives().try(Joi.number().integer(), Joi.string()).required(),
        node_type: Joi.string()
          .valid(...CHATBOT_NODE_TYPES)
          .required(),
        position_x: Joi.number().required(),
        position_y: Joi.number().required(),
        config: Joi.object().required(),
      }),
    )
    .required(),
  edges: Joi.array()
    .items(
      Joi.object({
        id: Joi.alternatives().try(Joi.number().integer(), Joi.string()).optional(),
        source_node_id: Joi.alternatives().try(Joi.number().integer(), Joi.string()).required(),
        target_node_id: Joi.alternatives().try(Joi.number().integer(), Joi.string()).required(),
        source_handle: Joi.string().max(64).allow(null, ""),
      }),
    )
    .required(),
});

const toggleActiveBody = Joi.object({
  is_active: Joi.boolean().required(),
});

module.exports = { createBody, updateBody, saveFlowBody, toggleActiveBody };
