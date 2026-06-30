import MemberItem from "./MemberItem";
import type { ServerMember } from "../../types/types";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
};

function formatRole(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

type MembersSidebarProps = {
  members: ServerMember[];
  onlineUserIds: Set<string>;
  isLoading?: boolean;
};

export default function MembersSidebar({
  members,
  onlineUserIds,
  isLoading = false,
}: MembersSidebarProps) {
  const onlineMembers = members.filter((m) => onlineUserIds.has(m.userId));
  const offlineMembers = members.filter((m) => !onlineUserIds.has(m.userId));

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
        {isLoading ? (
          <p className="members-section-title" style={{ padding: "8px 12px" }}>
            Loading members…
          </p>
        ) : members.length === 0 ? (
          <p className="members-section-title" style={{ padding: "8px 12px" }}>
            No members
          </p>
        ) : (
          <>
            <div className="members-section">
              <p className="members-section-title">
                Online — {onlineMembers.length}
              </p>
              {onlineMembers.map((member) => (
                <MemberItem
                  key={member.id}
                  name={member.user.username}
                  role={formatRole(member.role)}
                  status="online"
                />
              ))}
            </div>

            <div className="members-section">
              <p className="members-section-title">
                Offline — {offlineMembers.length}
              </p>
              {offlineMembers.map((member) => (
                <MemberItem
                  key={member.id}
                  name={member.user.username}
                  role={formatRole(member.role)}
                  status="offline"
                />
              ))}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
