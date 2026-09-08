import { api } from "./client";

export function getDashboardSummary() {
  return api.get("/dashboard/summary").then((r) => r.data.summary);
}

export function getWebhookLogs() {
  return api.get("/dashboard/webhook-logs").then((r) => r.data.logs);
}
