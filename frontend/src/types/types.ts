export interface ServerMember {
  id: string;
  role: string;
  userId: string;
  serverId: string;
  user: {
    id: string;
    username: string;
    avatarUrl?: string | null;
  };
}

export interface PublicUser {
  id: string;
  username: string;
  avatarUrl?: string | null;
  createdAt?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
}

export interface Channel {
  id: string;
  name: string;
  type: "TEXT" | "VOICE";
  serverId: string;
}

export interface Server {
  id: string;
  name: string;
  imageUrl?: string | null;
  ownerId: string;
  channels: Channel[];
}

export interface Message {
  id: string;
  channelId: string;
  room: string;
  author: string;
  authorId?: string;
  content: string;
  createdAt: string;
  status?: 'pending' | 'sent' | 'failed';
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
