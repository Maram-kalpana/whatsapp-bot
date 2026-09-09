import { api } from "./client";

export function listConversations(params) {
  return api.get("/inbox", { params }).then((r) => r.data.conversations);
}

export function openInbox(body) {
  return api.post("/inbox/open", body).then((r) => r.data.conversation);
}

export function getInboxMessages(id) {
  return api.get(`/inbox/${id}/messages`).then((r) => r.data);
}

export function sendInboxMessage(id, { text, file, caption } = {}) {
  if (file) {
    const fd = new FormData();
    fd.append("media", file);
    if (caption) fd.append("caption", caption);
    return api.post(`/inbox/${id}/messages`, fd).then((r) => r.data.message);
  }
  return api.post(`/inbox/${id}/messages`, { text }).then((r) => r.data.message);
}

export function markInboxRead(id) {
  return api.post(`/inbox/${id}/read`).then((r) => r.data.conversation);
}

export function updateInbox(id, body) {
  return api.patch(`/inbox/${id}`, body).then((r) => r.data.conversation);
}
