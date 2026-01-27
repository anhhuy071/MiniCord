const messages = [
  {
    id: 1,
    author: "Skyline",
    initials: "SK",
    role: "Community Lead",
    time: "Today at 3:01 PM",
    content:
      "Welcome to MiniCord! This is the space to prototype, collaborate, and chat while we build.",
  },
  {
    id: 2,
    author: "Nova",
    initials: "NV",
    role: "Product Designer",
    time: "Today at 3:15 PM",
    content: "Check out the new Discord-style layout, let me know if the spacing feels right.",
  },
  {
    id: 3,
    author: "Lumen",
    initials: "LM",
    role: "Engineer",
    time: "Today at 3:22 PM",
    content:
      "Just dropped a quick demo of how the message list renders. Planning to wire up WebSocket next.",
  },
];

type MainContentProps = {
  channelName: string;
};

export default function MainContent({ channelName }: MainContentProps) {
  return (
    <main className="main-content d-flex flex-column">
      <div className="chat-header">
        <div>
          <p className="channel-title"># {channelName}</p>
          <p className="channel-topic">A place for quick chat, design reviews, and watercooler moments.</p>
        </div>
        <div className="chat-header-actions">
          <span className="pill">Announcements</span>
          <button className="icon-button">Invite</button>
          <button className="icon-button">Search</button>
        </div>
      </div>

      <section className="chat-messages">
        {messages.map((message) => (
          <article key={message.id} className="chat-message">
            <div className="message-avatar">{message.initials}</div>
            <div className="message-body">
              <div className="message-heading">
                <div>
                  <span className="message-author">{message.author}</span>
                  <span className="message-role">{message.role}</span>
                </div>
                <span className="message-time">{message.time}</span>
              </div>
              <p className="message-text">{message.content}</p>
            </div>
          </article>
        ))}
      </section>

      <div className="chat-input">
        <div className="input-prefix">+</div>
        <input
          type="text"
          placeholder={`Message #${channelName}`}
          aria-label={`Message #${channelName}`}
        />
        <div className="input-actions">
          <button className="icon-button">😀</button>
          <button className="icon-button">📎</button>
        </div>
      </div>
    </main>
  );
}
