import { useCallback, useEffect, useMemo, useState } from "react";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Home from "./pages/Home.jsx";
import Feed from "./pages/Feed.jsx";
import Call from "./pages/Call.jsx";
import Chat from "./pages/Chat.jsx";
import { useAuth, useCallState } from "./state/store.js";
import { useSocket } from "./hooks/useSocket.js";

const AUTH_FREE_ROUTES = ["/login", "/register"];
const NAV_ITEMS = [
  { path: "/", label: "Home" },
  { path: "/feed", label: "Feed" },
  { path: "/chat", label: "Chat" },
  { path: "/call", label: "Call" }
];

export default function App() {
  const [path, setPath] = useState(window.location.pathname || "/");
  const { user, logout } = useAuth();
  const setCall = useCallState((state) => state.setCall);
  const resetCall = useCallState((state) => state.reset);
  const socket = useSocket();

  const navigate = useCallback((to) => {
    if (to === window.location.pathname) return;
    window.history.pushState({}, "", to);
    setPath(to);
  }, []);

  useEffect(() => {
    const handler = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  useEffect(() => {
    if (!user && !AUTH_FREE_ROUTES.includes(path)) {
      navigate("/login");
    }
    if (user && AUTH_FREE_ROUTES.includes(path)) {
      navigate("/");
    }
  }, [user, path, navigate]);

  useEffect(() => {
    if (!socket) return;

    const handleIncoming = (payload) => {
      setCall({
        inCall: true,
        partner: payload.partner,
        roomId: payload.roomId,
        callLogId: payload.callLogId,
        startedAt: Date.now(),
        iceServers: payload.iceServers || [],
        initiator: false
      });
      navigate("/call");
    };

    const handleHangup = () => {
      resetCall();
      navigate("/");
    };

    socket.on("match:incoming", handleIncoming);
    socket.on("call:hangup", handleHangup);

    return () => {
      socket.off("match:incoming", handleIncoming);
      socket.off("call:hangup", handleHangup);
    };
  }, [socket, setCall, resetCall, navigate]);

  const Page = useMemo(() => {
    const map = {
      "/": Home,
      "/login": Login,
      "/register": Register,
      "/feed": Feed,
      "/call": Call,
      "/chat": Chat
    };
    return map[path] || NotFound;
  }, [path]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-title">Random Voice Call</span>
          <span className="brand-subtitle">Spontaneous conversations nearby</span>
        </div>
        {user ? (
          <nav className="nav-links">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.path}
                className={item.path === path ? "active" : ""}
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </button>
            ))}
            <button className="btn-ghost" onClick={logout}>
              Logout
            </button>
          </nav>
        ) : null}
      </header>
      <main className="app-main">
        <Page navigate={navigate} socket={socket} />
      </main>
    </div>
  );
}

function NotFound({ navigate }) {
  return (
    <div className="panel text-center">
      <h2>Page not found</h2>
      <p className="hint">The page you requested is taking a break.</p>
      <button className="btn" onClick={() => navigate("/")}>
        Go Home
      </button>
    </div>
  );
}
