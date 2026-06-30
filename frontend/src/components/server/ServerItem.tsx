type ServerItemProps = {
  label: string;
  imageUrl?: string | null;
  active?: boolean;
  onSelect?: () => void;
};

export default function ServerItem({
  label,
  imageUrl,
  active = false,
  onSelect,
}: ServerItemProps) {
  return (
    <div
      className={`server-item d-flex justify-content-center align-items-center ${active ? "server-item-active" : ""} `}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      aria-pressed={active}
      style={imageUrl ? { backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover' } : {}}
      onKeyDown={(e) => {
        if (!onSelect) return;
        if (e.key === "Enter" || e.key === " ") {
          onSelect();
        }
      }}
    >
      {!imageUrl && <span>{label}</span>}
    </div>
  );
}
