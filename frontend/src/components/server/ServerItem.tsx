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
      className={`server-item d-flex align-items-center justify-content-center ${
        active ? "server-item-active" : ""
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
      <span>{label}</span>
    </div>
  );
}
