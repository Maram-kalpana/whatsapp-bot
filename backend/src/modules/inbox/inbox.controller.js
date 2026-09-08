const { asyncHandler } = require("../../utils/httpError");
const inboxService = require("./inbox.service");

const inboxController = {
  list: asyncHandler(async (req, res) => {
    const conversations = await inboxService.listConversations(req.business.id, { q: req.query.q });
    res.json({ conversations });
  }),

  messages: asyncHandler(async (req, res) => {
    const data = await inboxService.getMessages(req.business.id, Number(req.params.id));
    res.json(data);
  }),

  read: asyncHandler(async (req, res) => {
    const conversation = await inboxService.markRead(req.business.id, Number(req.params.id));
    res.json({ conversation });
  }),

  assign: asyncHandler(async (req, res) => {
    const conversation = await inboxService.assign(req.business.id, Number(req.params.id), req.body);
    res.json({ conversation });
  }),

  send: asyncHandler(async (req, res) => {
    const message = await inboxService.send(req.business.id, Number(req.params.id), req.body, req.file);
    res.status(201).json({ message });
  }),

  open: asyncHandler(async (req, res) => {
    const conversation = await inboxService.openConversation(req.business.id, Number(req.body.contact_id));
    res.status(201).json({ conversation });
  }),
};

module.exports = { inboxController };
