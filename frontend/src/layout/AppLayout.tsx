import { useState, useEffect, useCallback } from "react";
import ServerSidebar from "../components/server/ServerSidebar";
import ChannelSidebar from "../components/channel/ChannelSidebar";
import MainContent from "../components/main/MainContent";
import MembersSidebar from "../components/member/MembersSidebar";
import Topbar from "../components/common/Topbar";
import ServerModal from "../components/server/ServerModal";
import ChannelModal from "../components/channel/ChannelModal";
import type { Server, Channel } from "../types/types";
import { fetchApi } from "../services/api";

export default function AppLayout() {
  const [servers, setServers] = useState<Server[]>([]);
  const [activeServer, setActiveServer] = useState<Server | null>(null);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);

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

  const handleSelectServer = (server: Server) => {
    setActiveServer(server);
    if (server.channels && server.channels.length > 0) {
      setActiveChannel(server.channels[0]);
    } else {
      setActiveChannel(null);
    }
  };

  const handleServerSuccess = (server: Server) => {
    // Refresh servers to get full data (including default channel), and auto-select the new one
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
        <ChannelSidebar 
          server={activeServer} 
          activeChannelId={activeChannel?.id} 
          onSelectChannel={setActiveChannel} 
          onOpenChannelModal={() => setIsChannelModalOpen(true)}
        />
        {activeChannel && <MainContent channelName={activeChannel.name} channelId={activeChannel.id} />}
        <MembersSidebar />
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
