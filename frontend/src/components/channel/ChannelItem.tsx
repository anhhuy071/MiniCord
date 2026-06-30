type ChannelItemProps = {
  name: string;
  prefix?: string;
  iconClass?: string;
  logoUrl?: string;
  active?: boolean;
  onSelect?: () => void;
};

export default function ChannelItem({
  name,
  prefix = "#",
  iconClass,
  logoUrl,
  active = false,
  onSelect,
}: ChannelItemProps) {
  const fallbackIcon = iconClass ? (
    <i className={iconClass} aria-hidden="true" />
  ) : (
    <span aria-hidden="true">{prefix}</span>
  );

  return (
    <div
      className={`channel-item d-flex align-items-center px-3 ${
        active ? "is-active" : ""
      }`}
      role="button"
      tabIndex={0}
      aria-pressed={active}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (!onSelect) return;
        if (e.key === " ") e.preventDefault();
        if (e.key === "Enter" || e.key === " ") onSelect();
      }}
    >
      {logoUrl ? (
        <img className="channel-logo" src={logoUrl} alt="" aria-hidden="true" />
      ) : (
        <div className="channel-prefix channel-prefix-default" aria-hidden="true">
          {fallbackIcon}
        </div>
      )}
      <div className="channel-name mx-2">{name}</div>
    </div>
  );
}
