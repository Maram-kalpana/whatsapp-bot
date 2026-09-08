const { Op } = require("sequelize");
const {
  sequelize,
  Contact,
  ContactGroup,
  ContactGroupMember,
} = require("../../models");
const { HttpError } = require("../../utils/httpError");
const { digitsPhone, toCsv } = require("../../lib/csv");

function publicContact(row, groupIds = []) {
  return {
    id: row.id,
    name: row.name,
    phone_number: row.phone_number,
    email: row.email,
    tags: row.tags || [],
    source: row.source,
    created_at: row.created_at,
    group_ids: groupIds,
  };
}

async function groupsFor(contactIds) {
  if (!contactIds.length) return {};
  const members = await ContactGroupMember.findAll({ where: { contact_id: contactIds } });
  const map = {};
  members.forEach((m) => {
    map[m.contact_id] = map[m.contact_id] || [];
    map[m.contact_id].push(m.group_id);
  });
  return map;
}

async function setGroups(contactId, groupIds) {
  await ContactGroupMember.destroy({ where: { contact_id: contactId } });
  if (groupIds?.length) {
    await ContactGroupMember.bulkCreate(
      groupIds.map((group_id) => ({ group_id, contact_id: contactId })),
      { ignoreDuplicates: true },
    );
  }
}

async function list({ businessId, q, group_id, page = 1, pageSize = 10 }) {
  const where = { business_id: businessId };
  if (q) {
    where[Op.or] = [
      { name: { [Op.like]: `%${q}%` } },
      { phone_number: { [Op.like]: `%${q}%` } },
      { email: { [Op.like]: `%${q}%` } },
    ];
  }
  let idFilter = null;
  if (group_id) {
    const members = await ContactGroupMember.findAll({ where: { group_id } });
    idFilter = members.map((m) => m.contact_id);
    where.id = { [Op.in]: idFilter.length ? idFilter : [0] };
  }
  const limit = Math.min(100, Number(pageSize) || 10);
  const offset = (Math.max(1, Number(page) || 1) - 1) * limit;
  const { rows, count } = await Contact.findAndCountAll({
    where,
    order: [["id", "DESC"]],
    limit,
    offset,
  });
  const gmap = await groupsFor(rows.map((r) => r.id));
  return {
    items: rows.map((r) => publicContact(r, gmap[r.id] || [])),
    total: count,
    page: Math.max(1, Number(page) || 1),
    pageSize: limit,
  };
}

async function create(businessId, payload) {
  const phone_number = digitsPhone(payload.phone_number);
  const existing = await Contact.findOne({ where: { business_id: businessId, phone_number } });
  if (existing) throw new HttpError(409, "A contact with this phone already exists");
  const contact = await Contact.create({
    business_id: businessId,
    name: payload.name,
    phone_number,
    email: payload.email || null,
    tags: payload.tags || [],
    source: payload.source || "manual",
  });
  await setGroups(contact.id, payload.group_ids);
  return publicContact(contact, payload.group_ids || []);
}

async function update(businessId, id, payload) {
  const contact = await Contact.findOne({ where: { id, business_id: businessId } });
  if (!contact) throw new HttpError(404, "Contact not found");
  if (payload.phone_number) contact.phone_number = digitsPhone(payload.phone_number);
  if (payload.name) contact.name = payload.name;
  if (payload.email !== undefined) contact.email = payload.email || null;
  if (payload.tags) contact.tags = payload.tags;
  if (payload.source !== undefined) contact.source = payload.source;
  await contact.save();
  if (payload.group_ids) await setGroups(contact.id, payload.group_ids);
  const gmap = await groupsFor([contact.id]);
  return publicContact(contact, gmap[contact.id] || []);
}

async function remove(businessId, id) {
  const contact = await Contact.findOne({ where: { id, business_id: businessId } });
  if (!contact) throw new HttpError(404, "Contact not found");
  await ContactGroupMember.destroy({ where: { contact_id: id } });
  await contact.destroy();
  return { ok: true };
}

async function listGroups(businessId) {
  return ContactGroup.findAll({ where: { business_id: businessId }, order: [["name", "ASC"]] });
}

async function createGroup(businessId, name) {
  const existing = await ContactGroup.findOne({ where: { business_id: businessId, name } });
  if (existing) return existing;
  return ContactGroup.create({ business_id: businessId, name });
}

async function importRows(businessId, { mapping, rows, group_id, group_name }) {
  let group = null;
  if (group_id) group = await ContactGroup.findOne({ where: { id: group_id, business_id: businessId } });
  if (!group && group_name) group = await createGroup(businessId, group_name);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  await sequelize.transaction(async (t) => {
    for (const row of rows) {
      const phone_number = digitsPhone(row[mapping.phone_number]);
      const name = String(row[mapping.name] || "").trim();
      if (!phone_number || !name) {
        skipped += 1;
        continue;
      }
      const email = mapping.email ? String(row[mapping.email] || "").trim() || null : null;
      let contact = await Contact.findOne({
        where: { business_id: businessId, phone_number },
        transaction: t,
      });
      if (contact) {
        contact.name = name;
        if (email) contact.email = email;
        contact.source = contact.source || "csv";
        await contact.save({ transaction: t });
        updated += 1;
      } else {
        contact = await Contact.create(
          { business_id: businessId, name, phone_number, email, tags: [], source: "csv" },
          { transaction: t },
        );
        created += 1;
      }
      if (group) {
        await ContactGroupMember.findOrCreate({
          where: { group_id: group.id, contact_id: contact.id },
          defaults: { group_id: group.id, contact_id: contact.id },
          transaction: t,
        });
      }
    }
  });
  return { created, updated, skipped, group_id: group?.id || null };
}

async function exportCsv(businessId) {
  const rows = await Contact.findAll({ where: { business_id: businessId }, order: [["id", "ASC"]] });
  const gmap = await groupsFor(rows.map((r) => r.id));
  const groups = await listGroups(businessId);
  const names = Object.fromEntries(groups.map((g) => [g.id, g.name]));
  const csv = toCsv(
    ["Name", "Phone Number", "Email", "Groups"],
    rows.map((r) => ({
      Name: r.name,
      "Phone Number": r.phone_number,
      Email: r.email || "",
      Groups: (gmap[r.id] || []).map((id) => names[id]).filter(Boolean).join("|"),
    })),
  );
  return csv;
}

module.exports = {
  list,
  create,
  update,
  remove,
  listGroups,
  createGroup,
  importRows,
  exportCsv,
};
