import { create } from "zustand";

export const useAuthStore = create((set) => ({
  accessToken: null,
  user: null,
  businesses: [],
  bootstrapped: false,
  setSession: ({ accessToken, user }) => set({ accessToken, user }),
  setUser: (user) => set({ user }),
  setBusinesses: (businesses) => set({ businesses }),
  setBootstrapped: (bootstrapped) => set({ bootstrapped }),
  clear: () => set({ accessToken: null, user: null, businesses: [] }),
}));
