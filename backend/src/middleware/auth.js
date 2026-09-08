const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { User } = require("../models");
const { HttpError } = require("../utils/httpError");

function readAccessToken(req) {
  const header = req.header("Authorization") || "";
  if (header.startsWith("Bearer ")) return header.slice(7);
  return null;
}

async function requireAuth(req, _res, next) {
  try {
    const token = readAccessToken(req);
    if (!token) throw new HttpError(401, "Authentication required");
    let payload;
    try {
      payload = jwt.verify(token, env.jwtAccessSecret);
    } catch {
      throw new HttpError(401, "Invalid or expired access token");
    }
    if (payload.typ && payload.typ !== "access") {
      throw new HttpError(401, "Invalid access token");
    }
    const user = await User.findByPk(payload.sub);
    if (!user) throw new HttpError(401, "User not found");
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAuth, readAccessToken };
