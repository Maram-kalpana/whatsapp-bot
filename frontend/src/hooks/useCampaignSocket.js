import { useEffect } from "react";
import { io } from "socket.io-client";
import { useAuthStore } from "../store/authStore";
import { useUiStore } from "../store/uiStore";

let shared = null;

export function useCampaignSocket(onUpdate) {
  const token = useAuthStore((s) => s.accessToken);
  const businessId = useUiStore((s) => s.activeBusinessId);

  useEffect(() => {
    if (!token || !businessId || !onUpdate) return undefined;
    if (!shared) {
      shared = io(import.meta.env.VITE_SOCKET_URL ?? "http://localhost:4000", {
        auth: { token },
        withCredentials: true,
      });
    } else if (!shared.connected) {
      shared.auth = { token };
      shared.connect();
    }
    const socket = shared;
    const join = () => socket.emit("join-business", businessId);
    socket.on("connect", join);
    if (socket.connected) join();
    socket.on("campaign:updated", onUpdate);
    return () => {
      socket.off("campaign:updated", onUpdate);
      socket.off("connect", join);
    };
  }, [token, businessId, onUpdate]);
}
