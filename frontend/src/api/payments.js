import { api } from "./client";

const root = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");

export function getRazorpaySettings() {
  return api.get("/payments/settings/razorpay").then((r) => r.data.setting);
}

export function saveRazorpaySettings(body) {
  return api.put("/payments/settings/razorpay", body).then((r) => r.data.setting);
}

export function razorpayWebhookUrl(businessId) {
  return `${root}/api/public/payments/razorpay/${businessId}/webhook`;
}

export function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(window.Razorpay);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export function createWalletTopup(amount) {
  return api.post("/payments/wallet/topup", { amount }).then((r) => r.data);
}

export function verifyWalletTopup(body) {
  return api.post("/payments/wallet/verify", body).then((r) => r.data);
}

export function listWalletTransactions(params) {
  return api.get("/payments/wallet/transactions", { params }).then((r) => r.data.transactions);
}
