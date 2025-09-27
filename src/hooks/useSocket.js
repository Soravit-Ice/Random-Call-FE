import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../state/store.js";

export function useSocket() {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const instance = io(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/realtime`, {
      transports: ["websocket"],
      autoConnect: true
    });

    setSocket(instance);

    if (user) {
      instance.emit("user:online", user.id);
    }

    return () => {
      instance.disconnect();
      setSocket(null);
    };
  }, [user?.id]);

  return socket;
}
