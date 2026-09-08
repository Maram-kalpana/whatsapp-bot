import { api } from "./client";

export function listWhatsappNumbers() {
  return api.get("/whatsapp-numbers").then((r) => r.data.numbers);
}

export function saveWhatsappNumber(payload) {
  return api.post("/whatsapp-numbers", payload).then((r) => r.data.number);
}

export function updateWhatsappNumber(id, payload) {
  return api.patch(`/whatsapp-numbers/${id}`, payload).then((r) => r.data.number);
}
