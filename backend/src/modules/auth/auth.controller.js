const jwt = require("jsonwebtoken");
const env = require("../../config/env");
const { asyncHandler } = require("../../utils/httpError");
const authService = require("./auth.service");
const { User } = require("../../models");

const authController = {
  register: asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    authService.setRefreshCookie(res, result.user);
    res.status(201).json(result);
  }),

  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    authService.setRefreshCookie(res, result.user);
    res.json(result);
  }),

  refresh: asyncHandler(async (req, res) => {
    const result = await authService.refreshFromCookie(req.cookies?.[authService.REFRESH_COOKIE]);
    authService.setRefreshCookie(res, result.user);
    res.json(result);
  }),

  logout: asyncHandler(async (req, res) => {
    const cookie = req.cookies?.[authService.REFRESH_COOKIE];
    if (cookie) {
      try {
        const payload = jwt.verify(cookie, env.jwtRefreshSecret);
        const user = await User.findByPk(payload.sub);
        if (user) await authService.logout(user);
      } catch {
        /* cookie already invalid */
      }
    }
    authService.clearRefreshCookie(res);
    res.json({ ok: true });
  }),

  me: asyncHandler(async (req, res) => {
    res.json({ user: authService.publicUser(req.user) });
  }),

  updateMe: asyncHandler(async (req, res) => {
    const user = await authService.updateProfile(req.user, req.body);
    res.json({ user });
  }),
};

module.exports = { authController };
