const { asyncHandler } = require("../../utils/httpError");
const businessesService = require("./businesses.service");

const businessesController = {
  create: asyncHandler(async (req, res) => {
    const business = await businessesService.createBusiness(req.user, req.body, req.file);
    res.status(201).json({ business });
  }),

  list: asyncHandler(async (req, res) => {
    const businesses = await businessesService.listForUser(req.user.id);
    res.json({ businesses });
  }),

  update: asyncHandler(async (req, res) => {
    const business = await businessesService.updateBusiness(
      Number(req.params.id),
      req.user.id,
      req.body,
      req.file,
    );
    res.json({ business });
  }),

  members: asyncHandler(async (req, res) => {
    const members = await businessesService.listMembers(Number(req.params.id), req.user.id);
    res.json({ members });
  }),

  addMember: asyncHandler(async (req, res) => {
    const member = await businessesService.addMember(Number(req.params.id), req.user.id, req.body);
    res.status(201).json({ member });
  }),

  removeMember: asyncHandler(async (req, res) => {
    await businessesService.removeMember(Number(req.params.id), req.user.id, Number(req.params.userId));
    res.json({ ok: true });
  }),
};

module.exports = { businessesController };
