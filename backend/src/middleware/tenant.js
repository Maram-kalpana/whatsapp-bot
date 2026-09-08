const { BUSINESS_HEADER } = require("../shared/constants");
const { Business, BusinessUser } = require("../models");
const { HttpError } = require("../utils/httpError");

function parseBusinessHeader(req, _res, next) {
  const header = req.header(BUSINESS_HEADER);
  if (header) req.businessId = Number(header) || header;
  next();
}

async function requireBusiness(req, _res, next) {
  try {
    const raw = req.header(BUSINESS_HEADER) || req.businessId;
    const businessId = Number(raw);
    if (!businessId) {
      throw new HttpError(400, `${BUSINESS_HEADER} header is required`);
    }
    const membership = await BusinessUser.findOne({
      where: { business_id: businessId, user_id: req.user.id },
    });
    if (!membership) {
      throw new HttpError(403, "You are not a member of this business");
    }
    const business = await Business.findByPk(businessId);
    if (!business) throw new HttpError(404, "Business not found");
    req.businessId = businessId;
    req.business = business;
    req.membership = membership;
    next();
  } catch (err) {
    next(err);
  }
}

function requireBusinessRole(...roles) {
  return (req, _res, next) => {
    if (!req.membership || !roles.includes(req.membership.role)) {
      next(new HttpError(403, "Insufficient permissions"));
      return;
    }
    next();
  };
}

module.exports = { parseBusinessHeader, requireBusiness, requireBusinessRole };
