import { api } from "./client";

export function listCampaigns(params) {
  return api.get("/campaigns", { params }).then((r) => r.data.campaigns);
}

export function getCampaign(id) {
  return api.get(`/campaigns/${id}`).then((r) => r.data.campaign);
}

export function createBroadcast(formData) {
  return api.post("/campaigns/broadcast", formData).then((r) => r.data.campaign);
}

export function createDrip(formData) {
  return api.post("/campaigns/drip", formData).then((r) => r.data.campaign);
}

export function deleteCampaign(id) {
  return api.delete(`/campaigns/${id}`).then((r) => r.data);
}
