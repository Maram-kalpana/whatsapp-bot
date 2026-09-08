import { api } from "./client";

export function listBusinesses() {
  return api.get("/businesses").then((r) => r.data.businesses);
}

export function createBusiness({ name, industry, logo }) {
  const form = new FormData();
  form.append("name", name);
  if (industry) form.append("industry", industry);
  if (logo) form.append("logo", logo);
  return api.post("/businesses", form).then((r) => r.data.business);
}

export function updateBusiness(id, { name, industry, logo }) {
  const form = new FormData();
  if (name) form.append("name", name);
  if (industry !== undefined) form.append("industry", industry ?? "");
  if (logo) form.append("logo", logo);
  return api.patch(`/businesses/${id}`, form).then((r) => r.data.business);
}

export function listMembers(businessId) {
  return api.get(`/businesses/${businessId}/members`).then((r) => r.data.members);
}

export function addMember(businessId, payload) {
  return api.post(`/businesses/${businessId}/members`, payload).then((r) => r.data.member);
}

export function removeMember(businessId, userId) {
  return api.delete(`/businesses/${businessId}/members/${userId}`).then((r) => r.data);
}
