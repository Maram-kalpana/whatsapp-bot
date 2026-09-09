const { sequelize, User, Business, BusinessUser } = require("../../models");
const { HttpError } = require("../../utils/httpError");

function publicBusiness(business, role) {
  return {
    id: business.id,
    name: business.name,
    logo_url: business.logo_url,
    industry: business.industry,
    owner_user_id: business.owner_user_id,
    wallet_balance: business.wallet_balance,
    quality_score: business.quality_score,
    daily_limit_tier: business.daily_limit_tier,
    plan: business.plan,
    trial_ends_at: business.trial_ends_at,
    created_at: business.created_at,
    role: role || null,
  };
}

function logoPath(file) {
  if (!file) return null;
  return `/uploads/logos/${file.filename}`;
}

async function createBusiness(user, { name, industry }, file) {
  return sequelize.transaction(async (t) => {
    const business = await Business.create(
      {
        name,
        industry: industry || null,
        logo_url: logoPath(file),
        owner_user_id: user.id,
        wallet_balance: 1000,
        quality_score: "high",
        daily_limit_tier: "250",
        plan: "trial",
        trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      { transaction: t },
    );
    await BusinessUser.create(
      { business_id: business.id, user_id: user.id, role: "owner" },
      { transaction: t },
    );
    return publicBusiness(business, "owner");
  });
}

async function listForUser(userId) {
  const rows = await BusinessUser.findAll({
    where: { user_id: userId },
    include: [{ model: Business, required: true }],
    order: [["business_id", "ASC"]],
  });
  return rows.map((row) => publicBusiness(row.Business, row.role));
}

async function assertMembership(businessId, userId) {
  const membership = await BusinessUser.findOne({
    where: { business_id: businessId, user_id: userId },
  });
  if (!membership) throw new HttpError(403, "You are not a member of this business");
  return membership;
}

async function updateBusiness(businessId, userId, payload, file) {
  const membership = await assertMembership(businessId, userId);
  if (!["owner", "admin"].includes(membership.role)) {
    throw new HttpError(403, "Only owners and admins can update the business");
  }
  const business = await Business.findByPk(businessId);
  if (!business) throw new HttpError(404, "Business not found");
  if (payload.name) business.name = payload.name;
  if (payload.industry !== undefined) business.industry = payload.industry || null;
  if (file) business.logo_url = logoPath(file);
  await business.save();
  return publicBusiness(business, membership.role);
}

async function listMembers(businessId, userId) {
  await assertMembership(businessId, userId);
  const rows = await BusinessUser.findAll({
    where: { business_id: businessId },
    include: [{ model: User, attributes: ["id", "name", "email", "role"] }],
    order: [["user_id", "ASC"]],
  });
  return rows.map((row) => ({
    user_id: row.user_id,
    role: row.role,
    name: row.User?.name,
    email: row.User?.email,
  }));
}

async function addMember(businessId, actorId, { email, role }) {
  const actor = await assertMembership(businessId, actorId);
  if (!["owner", "admin"].includes(actor.role)) {
    throw new HttpError(403, "Only owners and admins can add team members");
  }
  if (role === "owner" && actor.role !== "owner") {
    throw new HttpError(403, "Only an owner can assign the owner role");
  }
  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  if (!user) {
    throw new HttpError(404, "No user with that email. They must register first.");
  }
  const existing = await BusinessUser.findOne({
    where: { business_id: businessId, user_id: user.id },
  });
  if (existing) throw new HttpError(409, "That user is already a member");
  await BusinessUser.create({ business_id: businessId, user_id: user.id, role: role || "agent" });
  return { user_id: user.id, role: role || "agent", name: user.name, email: user.email };
}

async function removeMember(businessId, actorId, targetUserId) {
  const actor = await assertMembership(businessId, actorId);
  if (!["owner", "admin"].includes(actor.role)) {
    throw new HttpError(403, "Only owners and admins can remove team members");
  }
  const target = await BusinessUser.findOne({
    where: { business_id: businessId, user_id: targetUserId },
  });
  if (!target) throw new HttpError(404, "Member not found");
  if (target.role === "owner") {
    const owners = await BusinessUser.count({ where: { business_id: businessId, role: "owner" } });
    if (owners <= 1) throw new HttpError(400, "Cannot remove the last owner");
  }
  if (target.role === "owner" && actor.role !== "owner") {
    throw new HttpError(403, "Only an owner can remove another owner");
  }
  await target.destroy();
  return { ok: true };
}

module.exports = {
  publicBusiness,
  createBusiness,
  listForUser,
  updateBusiness,
  listMembers,
  addMember,
  removeMember,
};
