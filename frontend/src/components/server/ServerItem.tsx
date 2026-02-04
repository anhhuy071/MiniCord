type ServerItemProps = {
  label: string;
  active?: boolean;
  onSelect?: () => void;
};

export default function ServerItem({
  label,
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
      onKeyDown={(e) => {
        if (!onSelect) return;
        if (e.key === "Enter" || e.key === " ") {
          onSelect();
        }
      }}
    >
      <span>{label}</span>
    </div>
  );
}
