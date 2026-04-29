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
  room: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
