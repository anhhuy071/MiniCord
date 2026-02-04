import ChannelItem from "./ChannelItem";

const channelGroups = [

  { name: "welcome", icon: "👋" },
  { name: "general", icon: "💬" },
  { name: "build-ideas", icon: "🧠" },
  { name: "bot-commands", icon: "🤖" },
  { name: "memes", icon: "😂" },
];

const voiceChannels = ["Lounge", "Garden", "Raid Room"];

type ChannelSidebarProps = {
  activeChannel: string;
  onSelectChannel: (channelName: string) => void;
};

export default function ChannelSidebar({
  activeChannel,
  onSelectChannel,
}: ChannelSidebarProps) {
  return (
    <aside className="channel-sidebar d-flex flex-column p-3">
      <header className="channel-top-bar">
        <div>
          <p className="channel-server-name">MiniCord HQ</p>
          <p className="channel-server-topic">A cozy corner for builders and friends.</p>
        </div>
        <button className="icon-button" aria-label="Quick actions">
          ⋮
        </button>
      </header>

      <section className="channel-section">
        <div className="section-heading">
          <span>Text Channels</span>
          <button className="icon-button" aria-label="Add text channel">
            +
          </button>
        </div>
        <div className="channel-list">
          {channelGroups.map((channel) => (
            <ChannelItem
              key={channel.name}
              name={channel.name}
              icon={channel.icon}
              active={channel.name === activeChannel}
              onSelect={() => onSelectChannel(channel.name)}
            />
          ))}
        </div>
      </section>

      <section className="channel-section">
        <div className="section-heading">
          <span>Voice Channels</span>
          <button className="icon-button" aria-label="Add voice channel">
            +
          </button>
        </div>
        <div className="channel-list">
          {voiceChannels.map((channel) => (
            <ChannelItem
              key={channel}
              name={channel}
              prefix="🔊"
              active={channel === activeChannel}
              onSelect={() => onSelectChannel(channel)}
            />
          ))}
        </div>
        <div className="voice-panel">
          <div className="voice-status">
            <span className="voice-indicator" />
            <div>
              <p className="voice-title">Voice Connected</p>
              <p className="voice-subtitle">Streaming in MiniDeck</p>
            </div>
          </div>
          <button className="voice-action">Join Call</button>
        </div>
      </section>

      <div className="channel-sidebar-footer">
        <div className="sidebar-profile">
          <div className="sidebar-avatar">AC</div>
          <div>
            <p className="profile-name">Avery Code</p>
            <p className="profile-status">#0034</p>
          </div>
        </div>
        <div className="sidebar-actions">
          <button className="icon-button" aria-label="Mute">
            🔇
          </button>
          <button className="icon-button" aria-label="Headphones">
            🎧
          </button>
          <button className="icon-button" aria-label="Settings">
            ⚙️
          </button>
        </div>
      </div>
    </aside>
  );
}
