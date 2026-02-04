import ServerSidebar from "../components/server/ServerSidebar";
import ChannelSidebar from "../components/channel/ChannelSidebar";
import MainContent from "../components/main/MainContent";
import MembersSidebar from "../components/member/MembersSidebar";
import Topbar from "../components/common/Topbar";
import { useState } from "react";

export default function AppLayout() {
  const [activeServer, setActiveServer] = useState("DR");
  const [activeChannel, setActiveChannel] = useState("general");

  return (
    <div className="app-shell">
      <Topbar activeServer={activeServer}/>
      <div className="app-root d-flex">
        <ServerSidebar activeServer={activeServer} onSelectServer={setActiveServer} />
        <ChannelSidebar activeChannel={activeChannel} onSelectChannel={setActiveChannel} />
        <MainContent channelName={activeChannel} />
        <MembersSidebar />
      </div>
    </div>
  );
}
