const { sequelize, Business, WalletTransaction } = require("../models");
const { HttpError } = require("../utils/httpError");

function messageCost() {
  const n = Number(process.env.MESSAGE_COST || 1);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

async function getBalance(businessId) {
  const business = await Business.findByPk(businessId);
  return Number(business?.wallet_balance || 0);
}

async function assertCanSend(businessId) {
  const balance = await getBalance(businessId);
  const cost = messageCost();
  if (balance < cost) {
    throw new Error("Insufficient wallet balance");
  }
  return { balance, cost };
}

async function topUpWallet(businessId, amount, reason = "wallet_topup") {
  const credit = Number(amount);
  if (!Number.isFinite(credit) || credit <= 0) {
    throw new HttpError(400, "Invalid top-up amount");
  }

  return sequelize.transaction(async (t) => {
    const business = await Business.findByPk(businessId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!business) throw new HttpError(404, "Business not found");

    business.wallet_balance = Number(business.wallet_balance || 0) + credit;
    await business.save({ transaction: t });

    const tx = await WalletTransaction.create(
      {
        business_id: businessId,
        type: "topup",
        amount: credit,
        reason,
      },
      { transaction: t },
    );

    return {
      wallet_balance: Number(business.wallet_balance),
      transaction: tx,
    };
  });
}

async function deductForMessage(businessId, amount) {
  const cost = amount ?? messageCost();

  return sequelize.transaction(async (t) => {
    const business = await Business.findByPk(businessId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!business) throw new HttpError(404, "Business not found");

    const balance = Number(business.wallet_balance || 0);
    if (balance < cost) {
      throw new Error("Insufficient wallet balance");
    }

    business.wallet_balance = balance - cost;
    await business.save({ transaction: t });

    await WalletTransaction.create(
      {
        business_id: businessId,
        type: "deduction",
        amount: cost,
        reason: "message_send",
      },
      { transaction: t },
    );

    return Number(business.wallet_balance);
  });
}

module.exports = {
  messageCost,
  getBalance,
  assertCanSend,
  topUpWallet,
  deductForMessage,
};
