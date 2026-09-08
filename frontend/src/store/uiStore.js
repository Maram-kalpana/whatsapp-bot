import { create } from "zustand";

const STORAGE_KEY = "activeBusinessId";

function readStoredBusinessId() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

export const useUiStore = create((set) => ({
  activeBusinessId: readStoredBusinessId(),
  sidebarCollapsed: false,
  setActiveBusinessId: (id) => {
    try {
      if (id) localStorage.setItem(STORAGE_KEY, String(id));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    set({ activeBusinessId: id ? Number(id) : null });
  },
  setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
}));
