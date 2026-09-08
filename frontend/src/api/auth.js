import { api } from "./client";

export function register(payload) {
  return api.post("/auth/register", payload).then((r) => r.data);
}

export function login(payload) {
  return api.post("/auth/login", payload).then((r) => r.data);
}

export function refreshSession() {
  return api.post("/auth/refresh").then((r) => r.data);
}

export function logout() {
  return api.post("/auth/logout").then((r) => r.data);
}

export function fetchMe() {
  return api.get("/auth/me").then((r) => r.data);
}

export function updateMe(payload) {
  return api.patch("/auth/me", payload).then((r) => r.data);
}
