type MemberItemProps = {
  name: string;
  status?: "online" | "idle" | "dnd" | "offline";
  role?: string;
  onMessage?: () => void;
  showMessageAction?: boolean;
};

export default function MemberItem({
  name,
  status = "online",
  role,
  onMessage,
  showMessageAction = false,
}: MemberItemProps) {
  return (
    <div className="member-item">
      <div
        className="member-item-main"
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
      {showMessageAction && onMessage ? (
        <button
          type="button"
          className="icon-button member-message-button"
          aria-label={`Message ${name}`}
          onClick={onMessage}
        >
          <i className="fa-solid fa-message" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
