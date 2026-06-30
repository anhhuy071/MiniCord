import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { Conversation, DirectMessage } from '../../types/types';
import { getOtherParticipant } from '../../utils/dm.util';
import { isNearBottom } from '../../utils/message.util';

type DirectMessagePanelProps = {
  conversation: Conversation;
  messages: DirectMessage[];
  isConnected: boolean;
  onlineUserIds: Set<string>;
  sendMessage: (content: string) => void;
  onBack: () => void;
  error: string | null;
};

export default function DirectMessagePanel({
  conversation,
  messages,
  isConnected,
  onlineUserIds,
  sendMessage,
  onBack,
  error,
}: DirectMessagePanelProps) {
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const messagesRef = useRef<HTMLElement>(null);
  const shouldAutoScrollRef = useRef(true);

  const peer = user?.id ? getOtherParticipant(conversation, user.id) : conversation.userTwo;
  const peerOnline = onlineUserIds.has(peer.id);

  useEffect(() => {
    shouldAutoScrollRef.current = true;
    const container = messagesRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [conversation.id]);

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

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSend) return;
    shouldAutoScrollRef.current = true;
    sendMessage(inputValue);
    setInputValue('');
  };

  return (
    <main className="main-content d-flex flex-column">
      <div className="chat-header">
        <div className="d-flex align-items-center gap-2">
          <button type="button" className="icon-button" aria-label="Back to channels" onClick={onBack}>
            <i className="fa-solid fa-arrow-left" aria-hidden="true" />
          </button>
          <div>
            <p className="channel-title">
              @ {peer.username}
              <span
                style={{
                  fontSize: '12px',
                  marginLeft: '10px',
                  color: peerOnline ? '#43b581' : '#949ba4',
                }}
              >
                {peerOnline ? '● Online' : '○ Offline'}
              </span>
              <span
                style={{
                  fontSize: '12px',
                  marginLeft: '10px',
                  color: isConnected ? '#43b581' : '#f04747',
                }}
              >
                {isConnected ? '● Connected' : '○ Disconnected'}
              </span>
            </p>
            <p className="channel-topic">Direct message</p>
          </div>
        </div>
      </div>

      <section className="chat-messages" ref={messagesRef} onScroll={handleScroll}>
        {error ? (
          <div style={{ color: 'red', padding: '10px', textAlign: 'center' }}>{error}</div>
        ) : null}

        {messages.map((message) => (
          <article
            key={message.id}
            className="chat-message"
            style={message.status === 'pending' ? { opacity: 0.65 } : undefined}
          >
            <div className="message-avatar">
              {(message.author || peer.username).substring(0, 2).toUpperCase()}
            </div>
            <div className="message-body">
              <div className="message-heading">
                <div>
                  <span className="message-author">{message.author}</span>
                  {message.status === 'pending' ? (
                    <span
                      style={{
                        fontSize: '11px',
                        marginLeft: '8px',
                        color: 'var(--text-muted, #949ba4)',
                      }}
                    >
                      Sending…
                    </span>
                  ) : null}
                </div>
                <span className="message-time">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <p className="message-text">{message.content}</p>
            </div>
          </article>
        ))}
      </section>

      <div className="chat-input border-top-0 pt-3">
        <form
          onSubmit={handleSend}
          style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '8px' }}
        >
          <div className="input-prefix" aria-hidden="true">
            <i className="fa-solid fa-plus" />
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder={`Message @${peer.username}`}
            aria-label={`Message @${peer.username}`}
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
