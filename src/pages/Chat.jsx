import { useEffect, useRef, useState } from "react";
import { useAuth, useCallState } from "../state/store.js";
import Avatar from "../components/Avatar.jsx";

export default function Chat({ socket }) {
  const { user } = useAuth();
  const callState = useCallState();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const timelineRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (payload) => {
      setMessages((prev) => [...prev, payload]);
      setIsTyping(false);
    };

    const handleTyping = ({ from, typing }) => {
      if (from !== user?.id) {
        setIsTyping(typing);
        if (typing) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
        }
      }
    };

    socket.on("chat:message", handleMessage);
    socket.on("chat:typing", handleTyping);
    
    return () => {
      socket.off("chat:message", handleMessage);
      socket.off("chat:typing", handleTyping);
      clearTimeout(typingTimeoutRef.current);
    };
  }, [socket, user?.id]);

  useEffect(() => {
    if (!timelineRef.current) return;
    timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
  }, [messages, isTyping]);

  function handleInputChange(e) {
    setText(e.target.value);
    
    // Emit typing indicator
    if (callState.partner && socket) {
      socket.emit("chat:typing", { 
        to: callState.partner.id, 
        typing: e.target.value.length > 0 
      });
    }
  }

  function sendMessage(event) {
    event.preventDefault();
    if (!text.trim() || !callState.partner) return;

    const payload = { 
      from: user?.id, 
      text: text.trim(), 
      ts: Date.now(),
      user: { displayName: user?.displayName }
    };
    
    setMessages((prev) => [...prev, payload]);
    socket?.emit("chat:send", { toRoom: callState.partner.id, text: text.trim() });
    setText("");
    
    // Clear typing indicator
    socket?.emit("chat:typing", { to: callState.partner.id, typing: false });
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <section className="panel chat-wrapper">
      <div className="flex items-center gap-3 mb-6">
        <svg className="w-8 h-8 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
        </svg>
        <div>
          <h2 className="mb-1">Shared Notes</h2>
          <p className="hint mb-0">
            {callState.partner 
              ? `Chat with ${callState.partner.displayName} during your call`
              : "No active conversation partner"
            }
          </p>
        </div>
      </div>

      <div ref={timelineRef} className="chat-timeline">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
            </svg>
            <p className="text-slate-400 text-sm">
              {callState.partner ? "Start a conversation..." : "Join a call to start chatting"}
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isOwn = msg.from === user?.id;
            return (
              <div
                key={idx}
                className={`flex gap-3 mb-4 ${isOwn ? 'flex-row-reverse' : ''}`}
              >
                <Avatar 
                  name={isOwn ? user?.displayName : callState.partner?.displayName} 
                  size="sm" 
                />
                <div className={`chat-bubble ${isOwn ? 'self' : ''}`}>
                  <span className="block">{msg.text}</span>
                  <time className="text-xs opacity-70">
                    {formatTime(msg.ts)}
                  </time>
                </div>
              </div>
            );
          })
        )}
        
        {isTyping && (
          <div className="flex gap-3 mb-4">
            <Avatar name={callState.partner?.displayName} size="sm" />
            <div className="chat-bubble">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} className="chat-composer">
        <input
          placeholder={
            callState.partner 
              ? `Message ${callState.partner.displayName}...` 
              : "Join a call to start chatting"
          }
          value={text}
          onChange={handleInputChange}
          disabled={!callState.partner}
          className="flex-1"
        />
        <button 
          className="btn" 
          type="submit" 
          disabled={!callState.partner || !text.trim()}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </form>
    </section>
  );
}
