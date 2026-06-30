import { useState, useEffect, useCallback, useRef } from "react";
import ServerSidebar from "../components/server/ServerSidebar";
import ChannelSidebar from "../components/channel/ChannelSidebar";
import MainContent from "../components/main/MainContent";
import MembersSidebar from "../components/member/MembersSidebar";
import Topbar from "../components/common/Topbar";
import ServerModal from "../components/server/ServerModal";
import ChannelModal from "../components/channel/ChannelModal";
import VoicePanel from "../components/channel/VoicePanel";
import type { Server, Channel, ServerMember } from "../types/types";
import { fetchApi } from "../services/api";
import { useSocket } from "../hooks/useSocket";
import { useAuth } from "../context/AuthContext";

export default function AppLayout() {
  const { token } = useAuth();
  const [servers, setServers] = useState<Server[]>([]);
  const [activeServer, setActiveServer] = useState<Server | null>(null);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [activeVoiceChannel, setActiveVoiceChannel] = useState<Channel | null>(null);

  const { socket, messages, voicePresence, onlineUserIds, isConnected, sendMessage, deleteMessage, error } = useSocket(activeChannel?.id, token);

  const [members, setMembers] = useState<ServerMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);

  const loadServers = useCallback(async (selectServerId?: string) => {
    try {
      const data = await fetchApi<Server[]>("/servers");
      setServers(data);
      if (data.length > 0) {
        let serverToSelect = data[0];
        if (selectServerId) {
          const found = data.find(s => s.id === selectServerId);
          if (found) serverToSelect = found;
        }
        setActiveServer(serverToSelect);
        if (serverToSelect.channels && serverToSelect.channels.length > 0) {
          setActiveChannel(serverToSelect.channels[0]);
        } else {
          setActiveChannel(null);
        }
      }
    } catch (err) {
      console.error("Failed to load servers", err);
    }
  }, []);

  useEffect(() => {
    loadServers();
  }, [loadServers]);

  const membersRequestIdRef = useRef(0);

  const loadMembers = useCallback(async (serverId: string) => {
    const requestId = ++membersRequestIdRef.current;
    try {
      setMembersLoading(true);
      const data = await fetchApi<ServerMember[]>(`/servers/${serverId}/members`);
      if (requestId !== membersRequestIdRef.current) return;
      setMembers(data);
    } catch (err) {
      if (requestId !== membersRequestIdRef.current) return;
      console.error("Failed to load members", err);
      setMembers([]);
    } finally {
      if (requestId === membersRequestIdRef.current) {
        setMembersLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (activeServer?.id) {
      loadMembers(activeServer.id);
    } else {
      setMembers([]);
    }
  }, [activeServer?.id, loadMembers]);

  const handleSelectServer = (server: Server) => {
    setActiveServer(server);
    if (server.channels && server.channels.length > 0) {
      setActiveChannel(server.channels[0]);
    } else {
      setActiveChannel(null);
    }
  };

  const handleServerSuccess = (server: Server) => {
    loadServers(server.id);
  };

  const handleChannelSuccess = (channel: Channel) => {
    // Immediately add channel to active server
    if (activeServer) {
      const updatedServer = {
        ...activeServer,
        channels: [...activeServer.channels, channel],
      };
      setServers(prev => prev.map(s => s.id === activeServer.id ? updatedServer : s));
      setActiveServer(updatedServer);
      setActiveChannel(channel);
    }
  };

  const handleSelectChannel = (channel: Channel) => {
    if (channel.type === "VOICE") {
      setActiveVoiceChannel(channel);
    } else {
      setActiveChannel(channel);
    }
  };

  return (
    <div className="app-shell">
      <Topbar activeServer={activeServer?.name} />
      <div className="app-root d-flex">
        <ServerSidebar 
          servers={servers} 
          activeServerId={activeServer?.id} 
          onSelectServer={handleSelectServer} 
          onOpenServerModal={() => setIsServerModalOpen(true)}
        />
        <div className="d-flex flex-column" style={{ width: '260px', background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}>
          <ChannelSidebar 
            server={activeServer} 
            activeChannelId={activeChannel?.id} 
            voicePresence={voicePresence}
            onSelectChannel={handleSelectChannel} 
            onOpenChannelModal={() => setIsChannelModalOpen(true)}
          />
          {activeVoiceChannel && (
            <VoicePanel 
              channelId={activeVoiceChannel.id} 
              channelName={activeVoiceChannel.name} 
              socket={socket} 
              onDisconnect={() => setActiveVoiceChannel(null)} 
            />
          )}
        </div>
        {activeChannel && (
          <MainContent 
            channelName={activeChannel.name} 
            channelId={activeChannel.id} 
            messages={messages}
            isConnected={isConnected}
            sendMessage={sendMessage}
            deleteMessage={deleteMessage}
            error={error}
          />
        )}
        <MembersSidebar
          members={members}
          onlineUserIds={onlineUserIds}
          isLoading={membersLoading}
        />
      </div>

      <ServerModal 
        isOpen={isServerModalOpen} 
        onClose={() => setIsServerModalOpen(false)} 
        onSuccess={handleServerSuccess} 
      />

      {activeServer && (
        <ChannelModal 
          isOpen={isChannelModalOpen} 
          onClose={() => setIsChannelModalOpen(false)} 
          serverId={activeServer.id}
          onSuccess={handleChannelSuccess}
        />
      )}
    </div>
  );
}
