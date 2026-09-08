import { api } from "./client";

export function listFlows() {
  return api.get("/flows").then((r) => r.data.flows);
}

export function listPublishedFlows() {
  return api.get("/flows/published").then((r) => r.data.flows);
}

export function getFlow(id) {
  return api.get(`/flows/${id}`).then((r) => r.data);
}

export function createFlow(body) {
  return api.post("/flows", body).then((r) => r.data);
}

export function updateFlow(id, body) {
  return api.put(`/flows/${id}`, body).then((r) => r.data);
}

export function saveFlowStructure(id, body) {
  return api.put(`/flows/${id}/structure`, body).then((r) => r.data);
}

export function publishFlow(id) {
  return api.post(`/flows/${id}/publish`).then((r) => r.data);
}

export function deleteFlow(id) {
  return api.delete(`/flows/${id}`).then((r) => r.data);
}
