import { api } from "./client";

export function listOrders(params) {
  return api.get("/orders", { params }).then((r) => r.data.orders);
}

export function getOrder(id) {
  return api.get(`/orders/${id}`).then((r) => r.data.order);
}

export function createOrder(body) {
  return api.post("/orders", body).then((r) => r.data.order);
}

export function updateOrderStatus(id, status) {
  return api.patch(`/orders/${id}/status`, { status }).then((r) => r.data.order);
}

export function createOrderCheckout(id) {
  return api.post(`/orders/${id}/checkout`).then((r) => r.data);
}

export function verifyOrderPayment(id, body) {
  return api.post(`/orders/${id}/verify-payment`, body).then((r) => r.data.order);
}
