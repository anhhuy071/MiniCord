import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

type MainContentProps = {
  channelName: string;
  channelId: string;
  messages: any[];
  isConnected: boolean;
  sendMessage: (content: string, author?: string) => void;
  error: string | null;
};

export default function MainContent({ channelName, channelId, messages, isConnected, sendMessage, error }: MainContentProps) {
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    sendMessage(inputValue, user?.username || "Local User");
    setInputValue("");
  };

  return (
    <main className="main-content d-flex flex-column">
      <div className="chat-header">
        <div>
          <p className="channel-title">
            # {channelName} 
            <span style={{ fontSize: "12px", marginLeft: "10px", color: isConnected ? "#43b581" : "#f04747" }}>
              {isConnected ? "● Connected" : "○ Disconnected"}
            </span>
          </p>
          <p className="channel-topic">A place for quick chat, design reviews, and watercooler moments.</p>
        </div>
        <div className="chat-header-actions">
          <span className="pill">Announcements</span>
          <button className="icon-button">Invite</button>
          <button className="icon-button">Search</button>
        </div>
      </div>

      <section className="chat-messages">
        {error && <div style={{ color: "red", padding: "10px", textAlign: "center" }}>{error}</div>}
        
        {messages.map((message) => (
          <article key={message.id} className="chat-message">
            <div className="message-avatar">
              {message.author.substring(0, 2).toUpperCase()}
            </div>
            <div className="message-body">
              <div className="message-heading">
                <div>
                  <span className="message-author">{message.author}</span>
                </div>
                <span className="message-time">{new Date(message.createdAt).toLocaleTimeString()}</span>
              </div>
              <p className="message-text">{message.content}</p>
            </div>
          </article>
        ))}
      </section>

      <div className="chat-input border-top-0 pt-3">
        <form onSubmit={handleSend} style={{ display: 'flex', width: '100%', alignItems: 'center', gap: "8px" }}>
          <div className="input-prefix" aria-hidden="true">
            <i className="fa-solid fa-plus" />
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Message #${channelName}`}
            aria-label={`Message #${channelName}`}
            style={{ flex: 1 }}
            disabled={!isConnected}
          />
          <div className="input-actions" style={{ position: 'relative', right: 0 }}>
            <button type="submit" className="icon-button" aria-label="Send Message" disabled={!isConnected || !inputValue.trim()}>
              <i className="fa-solid fa-paper-plane" aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
