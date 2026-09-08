import { api } from "./client";

export function listContactGroups() {
  return api.get("/contacts/groups").then((r) => r.data.groups);
}

export function listContacts(params) {
  return api.get("/contacts", { params }).then((r) => r.data);
}

export function createContact(body) {
  return api.post("/contacts", body).then((r) => r.data.contact);
}

export function updateContact(id, body) {
  return api.patch(`/contacts/${id}`, body).then((r) => r.data.contact);
}

export function deleteContact(id) {
  return api.delete(`/contacts/${id}`).then((r) => r.data);
}
