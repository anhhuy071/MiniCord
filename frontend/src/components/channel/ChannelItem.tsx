type ChannelItemProps = {
  name: string;
  prefix?: string;
  active?: boolean;
  onSelect?: () => void;
};

export default function ChannelItem({
  name,
  prefix = "#",
  active = false,
  onSelect,
}: ChannelItemProps) {
  return (
    <div
      className={`channel-item d-flex align-items-center px-3 ${
        active ? "is-active" : ""
      }`}
      role="button"
      tabIndex={0}
      aria-pressed={active}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (!onSelect) return;
        if (event.key === "Enter" || event.key === " ") onSelect();
      }}
    >
      <span className="channel-prefix">{prefix}</span>
      <span className="channel-name mx-2">{name}</span>
    </div>
  );
}
