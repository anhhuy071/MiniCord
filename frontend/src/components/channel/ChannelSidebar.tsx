import ChannelItem from "./ChannelItem";
import type { Server, Channel } from "../../types/types";
import { useAuth } from "../../context/AuthContext";

type ChannelSidebarProps = {
  server: Server | null;
  activeChannelId?: string;
  onSelectChannel: (channel: Channel) => void;
  onOpenChannelModal: () => void;
};

export default function ChannelSidebar({
  server,
  activeChannelId,
  onSelectChannel,
  onOpenChannelModal,
}: ChannelSidebarProps) {

  const { user } = useAuth();

  const textChannels = server?.channels.filter(c => c.type === "TEXT") || [];
  const voiceChannels = server?.channels.filter(c => c.type === "VOICE") || [];

  return (
    <aside className="channel-sidebar d-flex flex-column p-3">
      <header className="channel-top-bar">
        <div>
          <p className="channel-server-name">{server ? server.name : "Loading..."}</p>
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
            <button className="icon-button" aria-label="Add text channel" onClick={onOpenChannelModal}>
              <i className="fa-solid fa-plus" aria-hidden="true" />
            </button>
          </div>
          <div className="channel-list">
            {textChannels.map((channel) => (
              <ChannelItem
                key={channel.id}
                name={channel.name}
                iconClass="fa-solid fa-hashtag"
                active={channel.id === activeChannelId}
                onSelect={() => onSelectChannel(channel)}
              />
            ))}
            {textChannels.length === 0 && <p style={{ fontSize: '12px', color: '#6d6d6f', margin: '4px 8px' }}>No text channels</p>}
          </div>
        </section>

        <section className="channel-section">
          <div className="section-heading">
            <span>Voice Channels</span>
            <button className="icon-button" aria-label="Add voice channel" onClick={onOpenChannelModal}>
              <i className="fa-solid fa-plus" aria-hidden="true" />
            </button>
          </div>
          <div className="channel-list">
            {voiceChannels.map((channel) => (
              <ChannelItem
                key={channel.id}
                name={channel.name}
                iconClass="fa-solid fa-volume-high"
                active={channel.id === activeChannelId}
                onSelect={() => onSelectChannel(channel)}
              />
            ))}
            {voiceChannels.length === 0 && <p style={{ fontSize: '12px', color: '#6d6d6f', margin: '4px 8px' }}>No voice channels</p>}
          </div>
          <div className="voice-panel" style={{ display: 'none' }}>
             {/* Hidden until voice implementation is complete */}
          </div>
        </section>
      </div>

      <div className="channel-sidebar-footer">
        <div className="sidebar-profile">
          <div className="sidebar-avatar">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
            ) : (
              user?.username?.substring(0, 2).toUpperCase() || '??'
            )}
          </div>
          <div>
            <p className="profile-name">{user?.username || 'Guest'}</p>
            <p className="profile-status">Online</p>
          </div>
        </div>
        <div className="sidebar-actions">
          <button className="icon-button" aria-label="Mute">
            <i className="fa-solid fa-microphone" aria-hidden="true" />
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
