const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");
const { requireBusiness } = require("../middleware/tenant");
const { authRouter } = require("./auth/auth.routes");
const { businessesRouter } = require("./businesses/businesses.routes");
const { whatsappnumbersRouter } = require("./whatsapp-numbers/whatsapp-numbers.routes");
const { contactsRouter } = require("./contacts/contacts.routes");
const { templatesRouter } = require("./templates/templates.routes");
const { campaignsRouter } = require("./campaigns/campaigns.routes");
const { leadmagnetsRouter, leadMagnetsPublicRouter } = require("./lead-magnets/lead-magnets.routes");
const { chatbotsRouter } = require("./chatbots/chatbots.routes");
const { flowsRouter } = require("./flows/flows.routes");
const { inboxRouter } = require("./inbox/inbox.routes");
const { catalogRouter } = require("./catalog/catalog.routes");
const { ordersRouter } = require("./orders/orders.routes");
const { paymentsRouter, paymentsPublicRouter } = require("./payments/payments.routes");
const { webhooksRouter } = require("./webhooks/webhooks.routes");
const { dashboardRouter } = require("./dashboard/dashboard.routes");

function registerModuleRoutes() {
  const router = Router();
  router.use("/auth", authRouter);
  router.use("/webhooks", webhooksRouter);
  router.use("/public/lead-magnets", leadMagnetsPublicRouter);
  router.use("/public/payments", paymentsPublicRouter);

  router.use(requireAuth);
  router.use("/businesses", businessesRouter);

  router.use(requireBusiness);
  router.use("/whatsapp-numbers", whatsappnumbersRouter);
  router.use("/contacts", contactsRouter);
  router.use("/templates", templatesRouter);
  router.use("/campaigns", campaignsRouter);
  router.use("/lead-magnets", leadmagnetsRouter);
  router.use("/chatbots", chatbotsRouter);
  router.use("/flows", flowsRouter);
  router.use("/inbox", inboxRouter);
  router.use("/catalog", catalogRouter);
  router.use("/orders", ordersRouter);
  router.use("/payments", paymentsRouter);
  router.use("/dashboard", dashboardRouter);
  return router;
}

module.exports = { registerModuleRoutes };
