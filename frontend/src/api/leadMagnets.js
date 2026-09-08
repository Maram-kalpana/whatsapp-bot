import axios from "axios";
import { api } from "./client";

const root = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");

export function listLeadMagnets() {
  return api.get("/lead-magnets").then((r) => r.data.lead_magnets);
}

export function getLeadMagnet(id) {
  return api.get(`/lead-magnets/${id}`).then((r) => r.data.lead_magnet);
}

export function createLeadMagnet(body) {
  return api.post("/lead-magnets", body).then((r) => r.data.lead_magnet);
}

export function updateLeadMagnet(id, body) {
  return api.put(`/lead-magnets/${id}`, body).then((r) => r.data.lead_magnet);
}

export function deleteLeadMagnet(id) {
  return api.delete(`/lead-magnets/${id}`).then((r) => r.data);
}

export function getPublicLeadForm(slug) {
  return axios.get(`${root}/api/public/lead-magnets/${slug}`).then((r) => r.data.form);
}

export function submitPublicLeadForm(slug, body) {
  return axios.post(`${root}/api/public/lead-magnets/${slug}/submit`, body).then((r) => r.data);
}

export function publicCaptureUrl(slug) {
  if (typeof window === "undefined") return `/capture/${slug}`;
  return `${window.location.origin}/capture/${slug}`;
}
