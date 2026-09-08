const { Router } = require("express");
const { authController } = require("./auth.controller");
const { validate } = require("../../middleware/validate");
const { requireAuth } = require("../../middleware/auth");
const { registerSchema, loginSchema, updateProfileSchema } = require("./auth.schema");

const authRouter = Router();
authRouter.post("/register", validate(registerSchema), authController.register);
authRouter.post("/login", validate(loginSchema), authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", authController.logout);
authRouter.get("/me", requireAuth, authController.me);
authRouter.patch("/me", requireAuth, validate(updateProfileSchema), authController.updateMe);

module.exports = { authRouter };
