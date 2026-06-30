import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import type { Message } from "../../types/types";
import { isNearBottom, isOwnChannelMessage } from "../../utils/message.util";

type MainContentProps = {
  channelName: string;
  channelId: string;
  messages: Message[];
  isConnected: boolean;
  sendMessage: (content: string, author: string, authorId?: string) => void;
  deleteMessage: (messageId: string) => void;
  error: string | null;
};

export default function MainContent({
  channelName,
  channelId,
  messages,
  isConnected,
  sendMessage,
  deleteMessage,
  error,
}: MainContentProps) {
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState("");
  const messagesRef = useRef<HTMLElement>(null);
  const shouldAutoScrollRef = useRef(true);

  useEffect(() => {
    shouldAutoScrollRef.current = true;
    const container = messagesRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [channelId]);

  useEffect(() => {
    const container = messagesRef.current;
    if (!container || !shouldAutoScrollRef.current) return;

    container.scrollTop = container.scrollHeight;
  }, [messages]);

  const handleScroll = () => {
    const container = messagesRef.current;
    if (!container) return;
    shouldAutoScrollRef.current = isNearBottom(container);
  };

  const canSend = isConnected && Boolean(user?.username) && Boolean(inputValue.trim());

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend || !user?.username) return;
    shouldAutoScrollRef.current = true;
    sendMessage(inputValue, user.username, user.id);
    setInputValue("");
  };

  const isOwnMessage = (message: Message) => isOwnChannelMessage(message, user);

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

      <section className="chat-messages" ref={messagesRef} onScroll={handleScroll}>
        {error && <div style={{ color: "red", padding: "10px", textAlign: "center" }}>{error}</div>}

        {messages.map((message) => {
          const ownMessage = isOwnMessage(message);
          return (
          <article
            key={message.id}
            className={`chat-message${ownMessage ? " chat-message--own" : ""}`}
            style={message.status === "pending" ? { opacity: 0.65 } : undefined}
          >
            <div className="message-avatar">
              {message.author.substring(0, 2).toUpperCase()}
            </div>
            <div className="message-body">
              <div className="message-heading">
                <div>
                  <span className="message-author">{message.author}</span>
                  {message.status === "pending" && (
                    <span style={{ fontSize: "11px", marginLeft: "8px", color: "var(--text-muted, #949ba4)" }}>
                      Sending…
                    </span>
                  )}
                </div>
                <div className="message-heading-end">
                  {isConnected && ownMessage && (
                    <button
                      type="button"
                      className="icon-button message-delete-button"
                      aria-label="Delete message"
                      title="Delete message"
                      onClick={() => deleteMessage(message.id)}
                    >
                      <i className="fa-solid fa-trash" aria-hidden="true" />
                    </button>
                  )}
                  <span className="message-time">{new Date(message.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
              <p className="message-text">{message.content}</p>
            </div>
          </article>
        );
        })}
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
            disabled={!isConnected || !user?.username}
          />
          <div className="input-actions" style={{ position: 'relative', right: 0 }}>
            <button type="submit" className="icon-button" aria-label="Send Message" disabled={!canSend}>
              <i className="fa-solid fa-paper-plane" aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
