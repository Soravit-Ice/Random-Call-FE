import { useState } from "react";
import { api } from "../lib/api.js";
import { useAuth } from "../state/store.js";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

export default function Register({ navigate }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const login = useAuth((state) => state.login);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!email || !password || !displayName) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data } = await api.post("/auth/register", { email, password, displayName });
      login(data);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to register");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel auth-form">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </div>
        <h2>Create your space</h2>
        <p className="hint">A quick profile helps others know who they are speaking with.</p>
      </div>

      <form onSubmit={handleSubmit} className="form-grid">
        <div>
          <label htmlFor="displayName">Display Name</label>
          <input
            id="displayName"
            placeholder="How should others see you?"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div>
          <label htmlFor="email">Email</label>
          <input 
            id="email"
            type="email"
            placeholder="Enter your email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        
        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            placeholder="Create a secure password (min 6 chars)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            minLength={6}
          />
        </div>

        {error ? <div className="status-banner error">{error}</div> : null}
        
        <button type="submit" className="btn" disabled={loading}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner size="sm" />
              Creating account...
            </span>
          ) : (
            "Create account"
          )}
        </button>
        
        <button 
          type="button" 
          className="btn-secondary" 
          onClick={() => navigate("/login")}
          disabled={loading}
        >
          Already have an account? Sign in
        </button>
      </form>
    </section>
  );
}
