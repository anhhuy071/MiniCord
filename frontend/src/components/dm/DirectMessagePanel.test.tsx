import { describe, it, expect, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DirectMessagePanel from './DirectMessagePanel';
import type { Conversation, DirectMessage } from '../../types/types';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', username: 'alice', email: 'alice@example.com' },
  }),
}));

const conversation: Conversation = {
  id: 'conv-1',
  userOneId: 'user-1',
  userTwoId: 'user-2',
  updatedAt: '2024-01-01T12:00:00.000Z',
  userOne: { id: 'user-1', username: 'alice', avatarUrl: null },
  userTwo: { id: 'user-2', username: 'bob', avatarUrl: null },
};

const messages: DirectMessage[] = [
  {
    id: 'dm-1',
    conversationId: 'conv-1',
    author: 'alice',
    authorId: 'user-1',
    content: 'Hi bob',
    createdAt: '2024-01-01T12:00:00.000Z',
    status: 'sent',
  },
];

function renderPanel(overrides: Partial<ComponentProps<typeof DirectMessagePanel>> = {}) {
  const sendMessage = vi.fn();
  const onBack = vi.fn();

  render(
    <DirectMessagePanel
      conversation={conversation}
      messages={messages}
      isConnected
      onlineUserIds={new Set(['user-2'])}
      sendMessage={sendMessage}
      onBack={onBack}
      error={null}
      {...overrides}
    />,
  );

  return { sendMessage, onBack };
}

describe('DirectMessagePanel', () => {
  it('shows the peer username in the header', () => {
    renderPanel();
    expect(screen.getByText(/@ bob/)).toBeInTheDocument();
  });

  it('calls sendMessage when the form is submitted', async () => {
    const user = userEvent.setup();
    const { sendMessage } = renderPanel();

    await user.type(screen.getByLabelText('Message @bob'), 'Hello there');
    await user.click(screen.getByRole('button', { name: 'Send Message' }));

    expect(sendMessage).toHaveBeenCalledWith('Hello there');
  });

  it('calls onBack when back button is clicked', async () => {
    const user = userEvent.setup();
    const { onBack } = renderPanel();

    await user.click(screen.getByRole('button', { name: 'Back to channels' }));

    expect(onBack).toHaveBeenCalled();
  });
});
