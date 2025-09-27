import { create } from "zustand";
import { setAuth } from "../lib/api.js";

const readPersistedAuth = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("rvc-auth");
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn("Failed to parse stored auth", err);
    return null;
  }
};

const persisted = readPersistedAuth();

if (persisted?.token) {
  setAuth(persisted.token);
}

export const useAuth = create((set) => ({
  user: persisted?.user || null,
  token: persisted?.token || null,
  login: (data) => {
    const token = data.tokens?.access || null;
    setAuth(token);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "rvc-auth",
        JSON.stringify({ user: data.user, token })
      );
    }
    set({ user: data.user, token });
  },
  logout: () => {
    setAuth(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("rvc-auth");
    }
    set({ user: null, token: null });
  },
  setUser: (user) =>
    set((state) => {
      const merged = { ...state.user, ...user };
      if (typeof window !== "undefined" && state.token) {
        window.localStorage.setItem(
          "rvc-auth",
          JSON.stringify({ user: merged, token: state.token })
        );
      }
      return { user: merged };
    })
}));

const initialCallState = {
  inCall: false,
  partner: null,
  roomId: null,
  callLogId: null,
  startedAt: null,
  iceServers: [],
  initiator: false
};

export const useCallState = create((set) => ({
  ...initialCallState,
  setCall: (payload) => set((state) => ({ ...state, ...payload })),
  reset: () => set((state) => ({ ...state, ...initialCallState }))
}));
