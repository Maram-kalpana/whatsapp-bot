const { asyncHandler } = require("../../utils/httpError");
const contactsService = require("./contacts.service");

const contactsController = {
  list: asyncHandler(async (req, res) => {
    const data = await contactsService.list({
      businessId: req.business.id,
      q: req.query.q,
      group_id: req.query.group_id,
      page: req.query.page,
      pageSize: req.query.pageSize,
    });
    res.json(data);
  }),

  create: asyncHandler(async (req, res) => {
    const contact = await contactsService.create(req.business.id, req.body);
    res.status(201).json({ contact });
  }),

  update: asyncHandler(async (req, res) => {
    const contact = await contactsService.update(req.business.id, Number(req.params.id), req.body);
    res.json({ contact });
  }),

  remove: asyncHandler(async (req, res) => {
    await contactsService.remove(req.business.id, Number(req.params.id));
    res.json({ ok: true });
  }),

  groups: asyncHandler(async (req, res) => {
    const groups = await contactsService.listGroups(req.business.id);
    res.json({ groups });
  }),

  createGroup: asyncHandler(async (req, res) => {
    const group = await contactsService.createGroup(req.business.id, req.body.name);
    res.status(201).json({ group });
  }),

  importRows: asyncHandler(async (req, res) => {
    const result = await contactsService.importRows(req.business.id, req.body);
    res.json(result);
  }),

  exportCsv: asyncHandler(async (req, res) => {
    const csv = await contactsService.exportCsv(req.business.id);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=contacts.csv");
    res.send(csv);
  }),
};

module.exports = { contactsController };
