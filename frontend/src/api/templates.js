import { api } from "./client";

export function listTemplates() {
  return api.get("/templates").then((r) => r.data.templates);
}

export function createTemplate(body) {
  return api.post("/templates", body).then((r) => r.data);
}
