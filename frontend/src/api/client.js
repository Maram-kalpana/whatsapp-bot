import axios from "axios";
// import { BUSINESS_HEADER } from "../shared/constants";
import { useUiStore } from "../store/uiStore";
import { useAuthStore } from "../store/authStore";
import constants from "../shared/constants";

const root = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");

export const api = axios.create({
  baseURL: `${root}/api`,
  withCredentials: true,
});

export function assetUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${root}${path.startsWith("/") ? path : `/${path}`}`;
}

export function apiErrorMessage(err, fallback = "Something went wrong") {
  return err?.response?.data?.error || err?.message || fallback;
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const businessId = useUiStore.getState().activeBusinessId;
  if (businessId) config.headers[constants.BUSINESS_HEADER] = String(businessId);
  return config;
});

let refreshPromise = null;

function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = api
      .post("/auth/refresh")
      .then(({ data }) => {
        useAuthStore.getState().setSession({ accessToken: data.accessToken, user: data.user });
        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status;
    const url = String(original.url || "");
    const skip =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/refresh");

    if (status !== 401 || original._retry || skip) {
      return Promise.reject(error);
    }

    original._retry = true;
    try {
      const token = await refreshAccessToken();
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    } catch (refreshErr) {
      useAuthStore.getState().clear();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
      return Promise.reject(refreshErr);
    }
  },
);
