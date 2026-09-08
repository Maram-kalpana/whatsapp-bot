import { useEffect } from "react";
import { io } from "socket.io-client";

let socket = null;

export function useSocket() {
  useEffect(() => {
    if (!socket) {
      socket = io(import.meta.env.VITE_SOCKET_URL ?? "http://localhost:4000", {
        autoConnect: false,
      });
    }
  }, []);

  return socket;
}
