import { useState } from "react";
import { api } from "../lib/api.js";
import { useAuth } from "../state/store.js";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

export default function Login({ navigate }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const login = useAuth((state) => state.login);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data } = await api.post("/auth/login", { email, password });
      login(data);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel auth-form">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
        </div>
        <h2>Welcome back</h2>
        <p className="hint">Sign in to discover new voices near you.</p>
      </div>

      <form onSubmit={handleSubmit} className="form-grid">
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
            placeholder="Enter your password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        {error ? <div className="status-banner error">{error}</div> : null}
        
        <button type="submit" className="btn" disabled={loading}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner size="sm" />
              Signing in...
            </span>
          ) : (
            "Sign in"
          )}
        </button>
        
        <button 
          type="button" 
          className="btn-secondary" 
          onClick={() => navigate("/register")}
          disabled={loading}
        >
          Need an account? Sign up
        </button>
      </form>
    </section>
  );
}
