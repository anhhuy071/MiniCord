import type { Conversation } from '../../types/types';
import { getOtherParticipant } from '../../utils/dm.util';

type ConversationListProps = {
  conversations: Conversation[];
  activeConversationId: string | null;
  currentUserId: string;
  unreadByConversation: Record<string, number>;
  onSelect: (conversation: Conversation) => void;
};

export default function ConversationList({
  conversations,
  activeConversationId,
  currentUserId,
  unreadByConversation,
  onSelect,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="dm-conversation-list">
        <p className="members-section-title" style={{ padding: '8px 12px' }}>
          No direct messages yet
        </p>
      </div>
    );
  }

  return (
    <div className="dm-conversation-list">
      <p className="members-section-title" style={{ padding: '8px 12px 4px' }}>
        Direct Messages
      </p>
      {conversations.map((conversation) => {
        const peer = getOtherParticipant(conversation, currentUserId);
        const unread = unreadByConversation[conversation.id] ?? 0;
        const isActive = conversation.id === activeConversationId;

        return (
          <button
            key={conversation.id}
            type="button"
            className={`dm-conversation-item${isActive ? ' is-active' : ''}`}
            onClick={() => onSelect(conversation)}
          >
            <div className="member-avatar">{peer.username.slice(0, 2).toUpperCase()}</div>
            <div className="member-meta">
              <p className="member-name">{peer.username}</p>
            </div>
            {unread > 0 ? <span className="dm-unread-badge">{unread}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
