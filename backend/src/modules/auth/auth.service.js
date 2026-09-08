const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const env = require("../../config/env");
const { User } = require("../../models");
const { HttpError } = require("../../utils/httpError");

const ACCESS_TTL = "15m";
const REFRESH_TTL = "7d";
const REFRESH_COOKIE = "refresh_token";
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
  };
}

function signAccessToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, typ: "access" }, env.jwtAccessSecret, {
    expiresIn: ACCESS_TTL,
  });
}

function signRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, typ: "refresh", ver: user.refresh_token_version || 0 },
    env.jwtRefreshSecret,
    { expiresIn: REFRESH_TTL },
  );
}

function refreshCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth",
    maxAge: REFRESH_MAX_AGE_MS,
  };
}

function setRefreshCookie(res, user) {
  res.cookie(REFRESH_COOKIE, signRefreshToken(user), refreshCookieOptions());
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth",
  });
}

function tokenPayload(user) {
  return { accessToken: signAccessToken(user), user: publicUser(user) };
}

async function register({ name, email, password }) {
  const normalized = email.toLowerCase();
  const existing = await User.findOne({ where: { email: normalized } });
  if (existing) throw new HttpError(409, "An account with this email already exists");
  const password_hash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: normalized,
    password_hash,
    role: "owner",
  });
  return tokenPayload(user);
}

async function login({ email, password }) {
  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  if (!user) throw new HttpError(401, "Invalid email or password");
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new HttpError(401, "Invalid email or password");
  return tokenPayload(user);
}

async function refreshFromCookie(cookieValue) {
  if (!cookieValue) throw new HttpError(401, "Refresh token missing");
  let payload;
  try {
    payload = jwt.verify(cookieValue, env.jwtRefreshSecret);
  } catch {
    throw new HttpError(401, "Invalid or expired refresh token");
  }
  if (payload.typ !== "refresh") throw new HttpError(401, "Invalid refresh token");
  const user = await User.findByPk(payload.sub);
  if (!user) throw new HttpError(401, "User not found");
  if (Number(payload.ver ?? 0) !== Number(user.refresh_token_version || 0)) {
    throw new HttpError(401, "Refresh token has been revoked");
  }
  return tokenPayload(user);
}

async function logout(user) {
  if (!user) return;
  user.refresh_token_version = Number(user.refresh_token_version || 0) + 1;
  await user.save();
}

async function updateProfile(user, { name, email }) {
  if (email && email.toLowerCase() !== user.email) {
    const taken = await User.findOne({ where: { email: email.toLowerCase() } });
    if (taken) throw new HttpError(409, "That email is already in use");
    user.email = email.toLowerCase();
  }
  if (name) user.name = name;
  await user.save();
  return publicUser(user);
}

module.exports = {
  REFRESH_COOKIE,
  publicUser,
  setRefreshCookie,
  clearRefreshCookie,
  register,
  login,
  refreshFromCookie,
  logout,
  updateProfile,
};
