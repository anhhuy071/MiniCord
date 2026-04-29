import ServerItem from "./ServerItem";
import type { Server } from "../../types/types";

type ServerSidebarProps = {
  servers: Server[];
  activeServerId?: string;
  onSelectServer: (server: Server) => void;
  onOpenServerModal: () => void;
};

export default function ServerSidebar({
  servers,
  activeServerId,
  onSelectServer,
  onOpenServerModal,
}: ServerSidebarProps) {
  return (
    <aside className="server-sidebar d-flex flex-column align-items-center py-3">
      <div className="server-home">MC</div>
      <div className="server-divider" />
      <div className="server-list d-flex flex-column gap-2">
        {servers.map((server) => (
          <ServerItem
            key={server.id}
            label={server.name.substring(0, 2).toUpperCase()}
            imageUrl={server.imageUrl}
            active={server.id === activeServerId}
            onSelect={() => onSelectServer(server)}
          />
        ))}
      </div>
      <div className="server-divider" />
      <button className="server-create" aria-label="Create server" onClick={onOpenServerModal}>
        <i className="fa-solid fa-plus" aria-hidden="true" />
      </button>
    </aside>
  );
}
