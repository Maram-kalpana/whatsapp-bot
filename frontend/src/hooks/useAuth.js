import { useAuthStore } from "../store/authStore";
import { useUiStore } from "../store/uiStore";
import { listBusinesses } from "../api/businesses";
import { refreshSession, logout as apiLogout } from "../api/auth";

export function syncActiveBusiness(businesses) {
  const ids = businesses.map((b) => b.id);
  const current = useUiStore.getState().activeBusinessId;
  const next = ids.includes(current) ? current : ids[0] || null;
  useUiStore.getState().setActiveBusinessId(next);
}

export async function bootstrapAuth() {
  try {
    const data = await refreshSession();
    useAuthStore.getState().setSession({ accessToken: data.accessToken, user: data.user });
    const businesses = await listBusinesses();
    useAuthStore.getState().setBusinesses(businesses);
    syncActiveBusiness(businesses);
  } catch {
    useAuthStore.getState().clear();
  } finally {
    useAuthStore.getState().setBootstrapped(true);
  }
}

export async function applyAuthPayload(data) {
  useAuthStore.getState().setSession({ accessToken: data.accessToken, user: data.user });
  const businesses = await listBusinesses();
  useAuthStore.getState().setBusinesses(businesses);
  syncActiveBusiness(businesses);
  return businesses;
}

export async function signOut() {
  try {
    await apiLogout();
  } catch {
    /* still clear local session */
  }
  useAuthStore.getState().clear();
  useUiStore.getState().setActiveBusinessId(null);
}

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const businesses = useAuthStore((s) => s.businesses);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  return {
    user,
    accessToken,
    businesses,
    bootstrapped,
    isAuthenticated: Boolean(user && accessToken),
  };
}
