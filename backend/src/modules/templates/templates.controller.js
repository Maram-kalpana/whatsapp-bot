const { asyncHandler, HttpError } = require("../../utils/httpError");
const templatesService = require("./templates.service");

const templatesController = {
  list: asyncHandler(async (req, res) => {
    const templates = await templatesService.list(req.business.id);
    res.json({ templates });
  }),

  create: asyncHandler(async (req, res) => {
    try {
      const template = await templatesService.create(req.business.id, req.body, req.file);
      res.status(201).json({ template });
    } catch (err) {
      if (err.template) {
        res.status(201).json({
          template: err.template,
          warning: err.message,
          meta_submitted: false,
        });
        return;
      }
      throw err;
    }
  }),
};

module.exports = { templatesController };
