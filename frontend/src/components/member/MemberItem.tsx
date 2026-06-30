type MemberItemProps = {
  name: string;
  status?: "online" | "idle" | "dnd" | "offline";
  role?: string;
};

export default function MemberItem({
  name,
  status = "online",
  role,
}: MemberItemProps) {
  return (
    <div
      className="member-item"
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") event.currentTarget.click();
      }}
    >
      <div className={`member-avatar member-status-${status}`}>
        {name.slice(0, 2).toUpperCase()}
      </div>
      <div className="member-meta">
        <p className="member-name">{name}</p>
        {role ? <p className="member-role">{role}</p> : null}
      </div>
    </div>
  );
}
