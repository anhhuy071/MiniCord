import MemberItem from "./MemberItem";

const members = [
  { name: "Skyline", role: "Community Lead", status: "online" as const },
  { name: "Nova", role: "Product Designer", status: "idle" as const },
  { name: "Lumen", role: "Engineer", status: "online" as const },
  { name: "Archer", role: "Moderator", status: "dnd" as const },
  { name: "Zuri", role: "Member", status: "offline" as const },
];

export default function MembersSidebar() {
  return (
    <aside className="members-sidebar">
      <div className="members-header">
        <p className="members-title">Members</p>
        <span className="members-count">{members.length}</span>
      </div>

      <div className="members-search">
        <input type="text" placeholder="Search" aria-label="Search members" />
      </div>

      <div className="members-scroll">
        <div className="members-section">
          <p className="members-section-title">Online — 3</p>
          {members
            .filter((member) => member.status !== "offline")
            .map((member) => (
              <MemberItem
                key={member.name}
                name={member.name}
                role={member.role}
                status={member.status}
              />
            ))}
        </div>

        <div className="members-section">
          <p className="members-section-title">Offline — 1</p>
          {members
            .filter((member) => member.status === "offline")
            .map((member) => (
              <MemberItem
                key={member.name}
                name={member.name}
                role={member.role}
                status={member.status}
              />
            ))}
        </div>
      </div>
    </aside>
  );
}
