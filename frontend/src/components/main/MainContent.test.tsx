import { describe, it, expect, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MainContent from './MainContent';
import type { Message } from '../../types/types';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', username: 'alice', email: 'alice@example.com' },
  }),
}));

const ownMessage: Message = {
  id: 'msg-1',
  channelId: 'ch-1',
  room: 'general',
  author: 'alice',
  authorId: 'user-1',
  content: 'My message',
  createdAt: '2024-01-01T12:00:00.000Z',
  status: 'sent',
};

const otherMessage: Message = {
  ...ownMessage,
  id: 'msg-2',
  author: 'bob',
  authorId: 'user-2',
  content: 'Their message',
};

function renderMainContent(overrides: Partial<ComponentProps<typeof MainContent>> = {}) {
  const deleteMessage = vi.fn();
  const sendMessage = vi.fn();

  render(
    <MainContent
      channelName="general"
      channelId="ch-1"
      messages={[ownMessage, otherMessage]}
      isConnected
      sendMessage={sendMessage}
      deleteMessage={deleteMessage}
      error={null}
      {...overrides}
    />,
  );

  return { deleteMessage, sendMessage };
}

describe('MainContent delete message UI', () => {
  it('shows delete button only on the current user messages when connected', () => {
    renderMainContent();

    expect(screen.getAllByRole('button', { name: 'Delete message' })).toHaveLength(1);
  });

  it('hides delete buttons when disconnected', () => {
    renderMainContent({ isConnected: false });

    expect(screen.queryByRole('button', { name: 'Delete message' })).not.toBeInTheDocument();
  });

  it('calls deleteMessage with the message id when delete is clicked', async () => {
    const user = userEvent.setup();
    const { deleteMessage } = renderMainContent();

    await user.click(screen.getByRole('button', { name: 'Delete message' }));

    expect(deleteMessage).toHaveBeenCalledWith('msg-1');
  });
});
