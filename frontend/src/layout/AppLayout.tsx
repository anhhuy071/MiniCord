import ServerSidebar from "../components/server/ServerSidebar";
import ChannelSidebar from "../components/channel/ChannelSidebar";
import MainContent from "../components/main/MainContent";

export default function AppLayout() {
  return (
    <div className="app-root">
      <ServerSidebar />
      <ChannelSidebar />
      <MainContent />
    </div>
  );
}
