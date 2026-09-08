const { Op } = require("sequelize");
const { sequelize, WhatsappFlow, FlowScreen, FlowComponent, WhatsappNumber } = require("../../models");
const { HttpError } = require("../../utils/httpError");
const { graphPost } = require("../../lib/meta");
const { buildFlowJson, slugKey } = require("./flow-json.builder");

function publicFlow(row) {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    meta_flow_id: row.meta_flow_id || null,
  };
}

function publicScreen(row, components = []) {
  return {
    id: row.id,
    screen_key: row.screen_key,
    title: row.title,
    screen_order: row.screen_order,
    components: components.map(publicComponent),
  };
}

function publicComponent(row) {
  return {
    id: row.id,
    component_type: row.component_type,
    label: row.label,
    config: row.config || {},
    component_order: row.component_order,
  };
}

async function getFlowOrThrow(businessId, id) {
  const flow = await WhatsappFlow.findOne({ where: { id, business_id: businessId } });
  if (!flow) throw new HttpError(404, "Flow not found");
  return flow;
}

async function loadStructure(flowId) {
  const screens = await FlowScreen.findAll({
    where: { flow_id: flowId },
    order: [["screen_order", "ASC"]],
  });
  const screenIds = screens.map((s) => s.id);
  const components = screenIds.length
    ? await FlowComponent.findAll({
        where: { screen_id: screenIds },
        order: [["component_order", "ASC"]],
      })
    : [];
  const byScreen = new Map();
  for (const c of components) {
    if (!byScreen.has(c.screen_id)) byScreen.set(c.screen_id, []);
    byScreen.get(c.screen_id).push(c);
  }
  return screens.map((s) => publicScreen(s, byScreen.get(s.id) || []));
}

async function list(businessId) {
  const rows = await WhatsappFlow.findAll({
    where: { business_id: businessId },
    order: [["id", "DESC"]],
  });
  return rows.map(publicFlow);
}

async function getById(businessId, id) {
  const flow = await getFlowOrThrow(businessId, id);
  const screens = await loadStructure(id);
  return { flow: publicFlow(flow), screens };
}

async function create(businessId, body) {
  const flow = await WhatsappFlow.create({
    business_id: businessId,
    name: body.name,
    status: "draft",
  });

  await FlowScreen.create({
    flow_id: flow.id,
    screen_key: slugKey(body.name, "WELCOME"),
    title: "Welcome",
    screen_order: 0,
  });

  return getById(businessId, flow.id);
}

async function update(businessId, id, body) {
  const flow = await getFlowOrThrow(businessId, id);
  if (body.name !== undefined) flow.name = body.name;
  await flow.save();
  return getById(businessId, id);
}

async function remove(businessId, id) {
  const flow = await getFlowOrThrow(businessId, id);
  await flow.destroy();
}

async function saveStructure(businessId, id, { screens }) {
  await getFlowOrThrow(businessId, id);

  return sequelize.transaction(async (tx) => {
    const existingScreens = await FlowScreen.findAll({ where: { flow_id: id }, transaction: tx });
    const existingIds = existingScreens.map((s) => s.id);
    if (existingIds.length) {
      await FlowComponent.destroy({ where: { screen_id: { [Op.in]: existingIds } }, transaction: tx });
    }
    await FlowScreen.destroy({ where: { flow_id: id }, transaction: tx });

    const createdScreens = [];
    for (const screen of screens) {
      const createdScreen = await FlowScreen.create(
        {
          flow_id: id,
          screen_key: screen.screen_key,
          title: screen.title,
          screen_order: screen.screen_order,
        },
        { transaction: tx },
      );
      const createdComponents = [];
      for (const component of screen.components || []) {
        const createdComponent = await FlowComponent.create(
          {
            screen_id: createdScreen.id,
            component_type: component.component_type,
            label: component.label,
            config: component.config || {},
            component_order: component.component_order,
          },
          { transaction: tx },
        );
        createdComponents.push(createdComponent);
      }
      createdScreens.push(publicScreen(createdScreen, createdComponents));
    }

    return { screens: createdScreens };
  });
}

async function resolveWabaId(businessId) {
  const wa = await WhatsappNumber.findOne({
    where: { business_id: businessId },
    order: [["id", "ASC"]],
  });
  if (!wa?.waba_id) {
    throw new HttpError(400, "Connect a WhatsApp number with WABA ID in Account settings first");
  }
  return wa;
}

async function publish(businessId, id) {
  const flow = await getFlowOrThrow(businessId, id);
  const screens = await loadStructure(id);
  if (!screens.length) throw new HttpError(400, "Add at least one screen before publishing");

  const flowJson = buildFlowJson(
    screens.map((s) => ({
      ...s,
      components: s.components,
    })),
  );

  const wa = await resolveWabaId(businessId);

  const data = await graphPost(`${wa.waba_id}/flows`, {
    name: flow.name,
    categories: ["OTHER"],
    flow_json: JSON.stringify(flowJson),
    publish: true,
  });

  flow.meta_flow_id = String(data.id);
  flow.status = "published";
  await flow.save();

  return {
    flow: publicFlow(flow),
    flow_json: flowJson,
  };
}

async function listPublished(businessId) {
  const rows = await WhatsappFlow.findAll({
    where: { business_id: businessId, status: "published" },
    order: [["id", "DESC"]],
  });
  return rows.map(publicFlow);
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  saveStructure,
  publish,
  listPublished,
};
