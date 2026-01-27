
import ServerItem from "./ServerItem";

const servers = ["DR", "PX", "GL", "LY", "NF"];

type ServerSidebarProps = {
  activeServer: string;
  onSelectServer: (label: string) => void;
};

export default function ServerSidebar({
  activeServer,
  onSelectServer,
}: ServerSidebarProps) {
  return (
    <aside className="server-sidebar d-flex flex-column align-items-center py-3">
      <div className="server-home">MC</div>
      <div className="server-divider" />
      <div className="server-list d-flex flex-column gap-2">
        {servers.map((label) => (
          <ServerItem
            key={label}
            label={label}
            active={label === activeServer}
            onSelect={() => onSelectServer(label)}
          />
        ))}
      </div>
      <div className="server-divider" />
      <button className="server-create" aria-label="Create server">
        +
      </button>
    </aside>
  );
}
