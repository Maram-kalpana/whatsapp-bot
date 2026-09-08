const { asyncHandler } = require("../../utils/httpError");
const whatsappNumbersService = require("./whatsapp-numbers.service");

const whatsappnumbersController = {
  list: asyncHandler(async (req, res) => {
    const numbers = await whatsappNumbersService.list(req.business.id);
    res.json({ numbers });
  }),

  upsert: asyncHandler(async (req, res) => {
    const number = await whatsappNumbersService.upsert(req.business.id, req.body);
    res.status(201).json({ number });
  }),

  update: asyncHandler(async (req, res) => {
    const number = await whatsappNumbersService.update(req.business.id, Number(req.params.id), req.body);
    res.json({ number });
  }),
};

module.exports = { whatsappnumbersController };
