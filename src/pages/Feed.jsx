import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { useAuth } from "../state/store.js";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import Avatar from "../components/Avatar.jsx";

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  async function loadFeed() {
    try {
      setError(null);
      const { data } = await api.get("/feed");
      setPosts(data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load feed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFeed();
  }, []);

  async function createPost(event) {
    event.preventDefault();
    if (!content.trim()) return;
    
    try {
      setPosting(true);
      setError(null);
      const { data } = await api.post("/feed", { content });
      setPosts((prev) => [data, ...prev]);
      setContent("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create post");
    } finally {
      setPosting(false);
    }
  }

  async function likePost(postId) {
    try {
      await api.post(`/feed/${postId}/like`);
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, _count: { ...post._count, likes: (post._count?.likes || 0) + 1 } }
          : post
      ));
    } catch (err) {
      console.error("Failed to like post", err);
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <section className="panel text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-slate-400">Loading community feed...</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="flex items-center gap-3 mb-6">
        <svg className="w-8 h-8 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
          <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
        </svg>
        <div>
          <h2 className="mb-1">Community Feed</h2>
          <p className="hint mb-0">Share highlights from your latest conversations.</p>
        </div>
      </div>

      <form onSubmit={createPost} className="bg-white/5 p-6 rounded-xl mb-6">
        <div className="flex gap-4">
          <Avatar name={user?.displayName} size="md" />
          <div className="flex-1">
            <textarea
              placeholder="Share how your call went..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="w-full mb-3"
              disabled={posting}
            />
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-400 flex items-center gap-1">
                ✨ Positive vibes only
              </div>
              <button 
                type="submit" 
                className="btn" 
                disabled={!content.trim() || posting}
              >
                {posting ? (
                  <span className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    Posting...
                  </span>
                ) : (
                  "Post"
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {error ? <div className="status-banner error mb-6">{error}</div> : null}

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
            </svg>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">No posts yet</h3>
            <p className="text-slate-400">Be the first to share your conversation experience!</p>
          </div>
        ) : (
          posts.map((post) => (
            <article key={post.id} className="feed-card">
              <header className="flex items-center gap-3 mb-4">
                <Avatar name={post.user?.displayName} size="sm" />
                <div className="flex-1">
                  <strong className="text-white">{post.user?.displayName}</strong>
                  <div className="text-sm text-slate-400">{formatDate(post.createdAt)}</div>
                </div>
              </header>
              
              <p className="text-slate-300 mb-4 leading-relaxed">{post.content}</p>
              
              <footer className="flex items-center gap-6 text-sm">
                <button 
                  className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors"
                  onClick={() => likePost(post.id)}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  {post._count?.likes ?? 0}
                </button>
                
                <span className="flex items-center gap-2 text-slate-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                  {post._count?.comments ?? 0}
                </span>
              </footer>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
