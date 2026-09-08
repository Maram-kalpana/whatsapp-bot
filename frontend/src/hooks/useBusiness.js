import { useAuthStore } from "../store/authStore";
import { useUiStore } from "../store/uiStore";

export function useBusiness() {
  const businesses = useAuthStore((s) => s.businesses);
  const activeBusinessId = useUiStore((s) => s.activeBusinessId);
  const setActiveBusinessId = useUiStore((s) => s.setActiveBusinessId);
  const activeBusiness = businesses.find((b) => b.id === activeBusinessId) || null;
  return { businesses, activeBusinessId, activeBusiness, setActiveBusinessId };
}
