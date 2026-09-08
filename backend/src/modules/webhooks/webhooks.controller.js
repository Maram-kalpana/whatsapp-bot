const { asyncHandler } = require("../../utils/httpError");
const webhooksService = require("./webhooks.service");

const webhooksController = {
  verify: asyncHandler(async (req, res) => {
    const result = await webhooksService.verifyGet(req.query);
    if (!result.ok) {
      res.status(403).send("Forbidden");
      return;
    }
    res.status(200).send(result.challenge);
  }),

  receive: asyncHandler(async (req, res) => {
    await webhooksService.handlePayload(req.body);
    res.status(200).json({ ok: true });
  }),
};

module.exports = { webhooksController };
