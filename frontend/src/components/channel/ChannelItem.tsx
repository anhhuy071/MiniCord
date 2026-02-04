type ChannelItemProps = {
  name: string;
  prefix?: string;
  icon?: string;
  logoUrl?: string;
  active?: boolean;
  onSelect?: () => void;
};

export default function ChannelItem({
  name,
  prefix = "#",
  icon,
  logoUrl,
  active = false,
  onSelect,
}: ChannelItemProps) {
  const fallbackGlyph = icon ?? prefix;

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
      {logoUrl ? (<img className="channel-logo" src={logoUrl} alt="" aria-hidden="true" /> ) : (
        <div className="channel-prefix channel-prefix-default" aria-hidden="true">
          {fallbackGlyph}
        </div>
      )}
      <div className="channel-name mx-2">{name}</div>
    </div>
  );
}
