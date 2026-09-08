import { api } from "./client";

export function listProducts(params) {
  return api.get("/catalog/products", { params }).then((r) => r.data.products);
}

export function listSyncedProducts() {
  return api.get("/catalog/products/synced").then((r) => r.data.products);
}

export function createProduct(formData) {
  return api.post("/catalog/products", formData).then((r) => r.data.product);
}

export function updateProduct(id, formData) {
  return api.put(`/catalog/products/${id}`, formData).then((r) => r.data.product);
}

export function toggleProductActive(id, isActive) {
  return api.patch(`/catalog/products/${id}/active`, { is_active: isActive }).then((r) => r.data.product);
}

export function deleteProduct(id) {
  return api.delete(`/catalog/products/${id}`).then((r) => r.data);
}

export function getCatalogSettings() {
  return api.get("/catalog/settings").then((r) => r.data.settings);
}

export function updateCatalogSettings(body) {
  return api.put("/catalog/settings", body).then((r) => r.data.settings);
}

export function syncCatalogToMeta() {
  return api.post("/catalog/sync").then((r) => r.data);
}
