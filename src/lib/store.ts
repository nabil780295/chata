import { Persona, Conversation, Message, Story, UserProfile } from "../types";
import { INITIAL_PERSONAS, INITIAL_STORIES } from "../data/personas";

// Local storage key constants
const KEYS = {
  PERSONAS: "maya_personas",
  STORIES: "maya_stories",
  CONVERSATIONS: "maya_conversations",
  MESSAGES_PREFIX: "maya_messages_",
  USER_PROFILE: "maya_user_profile"
};

// --- Profile / User Helpers ---
export function getUserProfile(): UserProfile {
  if (typeof window === "undefined") {
    return { uid: "guest_user", displayName: "Guest User", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100", createdAt: new Date().toISOString(), isGuest: true };
  }
  const saved = localStorage.getItem(KEYS.USER_PROFILE);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // Fallback
    }
  }
  const defaultProfile: UserProfile = {
    uid: "guest_" + Math.random().toString(36).substring(2, 9),
    displayName: "Guest User",
    avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100&h=100`,
    createdAt: new Date().toISOString(),
    isGuest: true
  };
  localStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(defaultProfile));
  return defaultProfile;
}

export function saveUserProfile(profile: UserProfile): void {
  localStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
}

// --- Personas Core (Preloaded + Admin Customizations) ---
export function getPersonas(): Persona[] {
  if (typeof window === "undefined") return INITIAL_PERSONAS;
  const saved = localStorage.getItem(KEYS.PERSONAS);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_PERSONAS;
    }
  }
  localStorage.setItem(KEYS.PERSONAS, JSON.stringify(INITIAL_PERSONAS));
  return INITIAL_PERSONAS;
}

export function savePersona(persona: Persona): Persona[] {
  const personas = getPersonas();
  const index = personas.findIndex(p => p.id === persona.id);
  if (index >= 0) {
    personas[index] = persona;
  } else {
    personas.push(persona);
  }
  localStorage.setItem(KEYS.PERSONAS, JSON.stringify(personas));
  return personas;
}

export function deletePersona(id: string): Persona[] {
  const personas = getPersonas().filter(p => p.id !== id);
  localStorage.setItem(KEYS.PERSONAS, JSON.stringify(personas));
  return personas;
}

// --- Stories Core (Preloaded + Admin Stories) ---
export function getStories(): Story[] {
  if (typeof window === "undefined") return INITIAL_STORIES;
  const saved = localStorage.getItem(KEYS.STORIES);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_STORIES;
    }
  }
  localStorage.setItem(KEYS.STORIES, JSON.stringify(INITIAL_STORIES));
  return INITIAL_STORIES;
}

export function saveStory(story: Story): Story[] {
  const stories = getStories();
  stories.unshift(story); // New stories on top
  localStorage.setItem(KEYS.STORIES, JSON.stringify(stories));
  return stories;
}

export function deleteStory(id: string): Story[] {
  const stories = getStories().filter(s => s.id !== id);
  localStorage.setItem(KEYS.STORIES, JSON.stringify(stories));
  return stories;
}

// --- Conversations ---
export function getConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem(KEYS.CONVERSATIONS);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [];
}

export function saveConversations(conversations: Conversation[]): void {
  localStorage.setItem(KEYS.CONVERSATIONS, JSON.stringify(conversations));
}

export function getOrCreateConversation(personaId: string): Conversation {
  const conversations = getConversations();
  let conv = conversations.find(c => c.personaId === personaId);
  const user = getUserProfile();

  if (!conv) {
    conv = {
      id: `conv_${personaId}_${user.uid}`,
      userId: user.uid,
      personaId: personaId,
      lastMessage: "Tap here to say hi! 👋",
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0
    };
    conversations.push(conv);
    saveConversations(conversations);
  }
  return conv;
}

// --- Messages ---
export function getMessages(conversationId: string): Message[] {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem(KEYS.MESSAGES_PREFIX + conversationId);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [];
}

export function saveMessages(conversationId: string, messages: Message[]): void {
  localStorage.setItem(KEYS.MESSAGES_PREFIX + conversationId, JSON.stringify(messages));
  
  // Update last message in the parent conversation record
  if (messages.length > 0) {
    const lastMsg = messages[messages.length - 1];
    const conversations = getConversations();
    const convIdx = conversations.findIndex(c => c.id === conversationId);
    if (convIdx >= 0) {
      conversations[convIdx].lastMessage = lastMsg.text || "Shared an attachment";
      conversations[convIdx].lastMessageTime = lastMsg.timestamp;
      saveConversations(conversations);
    }
  }
}

export function addMessage(conversationId: string, text: string, senderId: "user" | "bot", senderName: string, attachmentUrl?: string): Message {
  const messages = getMessages(conversationId);
  const newMessage: Message = {
    id: "msg_" + Math.random().toString(36).substring(2, 9),
    senderId,
    senderName,
    text,
    timestamp: new Date().toISOString(),
    attachmentUrl,
    isRead: senderId === "user" ? true : false
  };
  messages.push(newMessage);
  saveMessages(conversationId, messages);

  // If message is from user, reset unread count. If from bot, increment unread count if chat is closed.
  if (senderId === "user") {
    clearUnreadCount(conversationId);
  }

  return newMessage;
}

export function incrementUnreadCount(conversationId: string): void {
  const conversations = getConversations();
  const index = conversations.findIndex(c => c.id === conversationId);
  if (index >= 0) {
    conversations[index].unreadCount += 1;
    saveConversations(conversations);
  }
}

export function clearUnreadCount(conversationId: string): void {
  const conversations = getConversations();
  const index = conversations.findIndex(c => c.id === conversationId);
  if (index >= 0) {
    conversations[index].unreadCount = 0;
    saveConversations(conversations);
  }
}
