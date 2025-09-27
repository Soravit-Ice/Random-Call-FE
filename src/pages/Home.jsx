import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { useAuth, useCallState } from "../state/store.js";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import Avatar from "../components/Avatar.jsx";
import StatusIndicator from "../components/StatusIndicator.jsx";

export default function Home({ navigate }) {
  const { user, setUser } = useAuth();
  const setCall = useCallState((state) => state.setCall);
  const [lat, setLat] = useState(user?.lat ?? "");
  const [lng, setLng] = useState(user?.lng ?? "");
  const [radius, setRadius] = useState(user?.radiusKmDefault ?? 10);
  const [status, setStatus] = useState(null);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data } = await api.get("/me");
        setUser(data);
        setLat(data?.lat ?? "");
        setLng(data?.lng ?? "");
        setRadius(data?.radiusKmDefault ?? 10);
        await api.patch("/me/status", { isOnline: true });
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    }

    if (user) loadProfile();
  }, [user?.id, setUser]);

  async function updateLocation(event) {
    event.preventDefault();
    try {
      setLoadingLocation(true);
      setStatus(null);
      await api.patch("/me/location", {
        lat: lat === "" ? null : Number(lat),
        lng: lng === "" ? null : Number(lng),
        radiusKmDefault: Number(radius)
      });
      setStatus({ message: "Location preferences updated successfully", tone: "success" });
    } catch (err) {
      setStatus({ message: err.response?.data?.error || "Failed to save preferences", tone: "error" });
    } finally {
      setLoadingLocation(false);
    }
  }

  async function getCurrentLocation() {
    if (!navigator.geolocation) {
      setStatus({ message: "Geolocation is not supported by this browser", tone: "error" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(6));
        setLng(position.coords.longitude.toFixed(6));
        setStatus({ message: "Location detected successfully", tone: "success" });
      },
      (error) => {
        setStatus({ message: "Failed to get your location", tone: "error" });
      }
    );
  }

  async function startMatch() {
    try {
      setLoadingMatch(true);
      setStatus(null);
      const { data } = await api.post("/match/request", { mode: "near" });
      if (!data.match) {
        setStatus({ message: "No one is available right now. Try again soon!", tone: "info" });
        return;
      }

      setCall({
        inCall: true,
        partner: data.match.partner,
        roomId: data.match.roomId,
        callLogId: data.match.callLogId,
        startedAt: Date.now(),
        iceServers: data.match.iceServers || [],
        initiator: true
      });
      navigate("/call");
    } catch (err) {
      setStatus({ message: err.response?.data?.error || "Failed to find a match", tone: "error" });
    } finally {
      setLoadingMatch(false);
    }
  }

  return (
    <section className="panel">
      <div className="flex items-center gap-4 mb-6">
        <Avatar name={user?.displayName} size="lg" />
        <div>
          <h2 className="mb-1">Hello {user?.displayName || user?.email}</h2>
          <StatusIndicator status="online" />
        </div>
      </div>

      <p className="hint">Fine-tune your location preferences to connect with nearby voices.</p>

      <form onSubmit={updateLocation} className="form-grid">
        <div className="bg-white/5 p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="section-title flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Location Settings
            </div>
            <button 
              type="button" 
              className="btn-secondary text-sm py-1 px-3"
              onClick={getCurrentLocation}
            >
              Use Current Location
            </button>
          </div>
          <p className="hint mb-4">Leave coordinates blank to stay private or share for better matches.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="lat">Latitude</label>
              <input 
                id="lat"
                value={lat} 
                onChange={(e) => setLat(e.target.value)} 
                placeholder="13.7563"
                type="number"
                step="any"
              />
            </div>
            <div>
              <label htmlFor="lng">Longitude</label>
              <input 
                id="lng"
                value={lng} 
                onChange={(e) => setLng(e.target.value)} 
                placeholder="100.5018"
                type="number"
                step="any"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label htmlFor="radius">Match radius (km)</label>
            <input
              id="radius"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              type="number"
              min="1"
              max="1000"
              placeholder="10"
            />
          </div>
        </div>

        <button type="submit" className="btn" disabled={loadingLocation}>
          {loadingLocation ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner size="sm" />
              Saving...
            </span>
          ) : (
            "Save preferences"
          )}
        </button>
      </form>

      <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 p-6 rounded-xl border border-indigo-500/20">
        <div className="section-title flex items-center gap-2 mb-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
          Ready to talk?
        </div>
        <p className="hint mb-4">We'll pair you with someone nearby or widen the radius if nobody is around.</p>
        <button 
          className="btn w-full" 
          onClick={startMatch} 
          disabled={loadingMatch}
        >
          {loadingMatch ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner size="sm" />
              Looking for a partner...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Find someone to talk to
            </span>
          )}
        </button>
      </div>

      {status ? (
        <div className={`status-banner${status.tone === "error" ? " error" : ""}`}>
          {status.message}
        </div>
      ) : null}
    </section>
  );
}
