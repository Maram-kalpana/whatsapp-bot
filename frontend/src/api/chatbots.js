import { api } from "./client";

export function listChatbots() {
  return api.get("/chatbots").then((r) => r.data.chatbots);
}

export function getChatbot(id) {
  return api.get(`/chatbots/${id}`).then((r) => r.data);
}

export function createChatbot(body) {
  return api.post("/chatbots", body).then((r) => r.data.chatbot);
}

export function updateChatbot(id, body) {
  return api.put(`/chatbots/${id}`, body).then((r) => r.data.chatbot);
}

export function toggleChatbotActive(id, isActive) {
  return api.patch(`/chatbots/${id}/active`, { is_active: isActive }).then((r) => r.data.chatbot);
}

export function saveChatbotFlow(id, body) {
  return api.put(`/chatbots/${id}/flow`, body).then((r) => r.data);
}

export function deleteChatbot(id) {
  return api.delete(`/chatbots/${id}`).then((r) => r.data);
}
