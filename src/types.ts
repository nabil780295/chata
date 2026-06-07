export interface Persona {
  id: string;
  name: string;
  bengaliName: string;
  age: number;
  avatar: string;
  status: string;
  bio: string;
  personality: string;
  prompt: string;
  location: string;
  hobbies: string[];
  zodiac: string;
}

export interface Message {
  id: string;
  senderId: "user" | "bot";
  senderName: string;
  text: string;
  timestamp: string;
  attachmentUrl?: string;
  reactions?: string[];
  isRead?: boolean;
}

export interface Conversation {
  id: string;
  userId: string;
  personaId: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isTyping?: boolean;
}

export interface Story {
  id: string;
  personaId: string;
  name: string;
  avatarUrl: string;
  mediaUrl: string;
  text: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string;
  avatarUrl: string;
  createdAt: string;
  isGuest: boolean;
  nickname?: string;
}
