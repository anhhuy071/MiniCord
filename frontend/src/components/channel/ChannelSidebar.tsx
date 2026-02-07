import ChannelItem from "./ChannelItem";

const channelGroups = [

  { name: "welcome", iconClass: "fa-regular fa-hand" },
  { name: "general", iconClass: "fa-regular fa-comments" },
  { name: "build-ideas", iconClass: "fa-solid fa-brain" },
  { name: "bot-commands", iconClass: "fa-solid fa-robot" },
  { name: "memes", iconClass: "fa-regular fa-face-laugh" },
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
          <i className="fa-solid fa-ellipsis-vertical" aria-hidden="true" />
        </button>
      </header>

      <div className="channel-scroll">
        <section className="channel-section">
          <div className="section-heading">
            <span>Text Channels</span>
            <button className="icon-button" aria-label="Add text channel">
              <i className="fa-solid fa-plus" aria-hidden="true" />
            </button>
          </div>
          <div className="channel-list">
            {channelGroups.map((channel) => (
              <ChannelItem
                key={channel.name}
                name={channel.name}
                iconClass={channel.iconClass}
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
              <i className="fa-solid fa-plus" aria-hidden="true" />
            </button>
          </div>
          <div className="channel-list">
            {voiceChannels.map((channel) => (
              <ChannelItem
                key={channel}
                name={channel}
                iconClass="fa-solid fa-volume-high"
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
      </div>

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
            <i className="fa-solid fa-volume-xmark" aria-hidden="true" />
          </button>
          <button className="icon-button" aria-label="Headphones">
            <i className="fa-solid fa-headphones" aria-hidden="true" />
          </button>
          <button className="icon-button" aria-label="Settings">
            <i className="fa-solid fa-gear" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}
