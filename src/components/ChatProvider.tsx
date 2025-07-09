import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// Chat message interface
export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  userColor?: string;
  provider?: string;
  channelId?: string;
  avatarUrl?: string;
  badges?: string[];
}

// Chat provider capabilities
export interface ChatProviderCapabilities {
  sendMessages: boolean;
  reactions: boolean;
  moderatorTools: boolean;
  userProfiles: boolean;
  threading: boolean;
  mediaSharing: boolean;
}

// Base chat provider interface
export interface ChatProvider {
  id: string;
  name: string;
  icon?: React.ComponentType<{ size?: number }>;
  capabilities: ChatProviderCapabilities;
  
  // Connection management
  connect(channelId: string, roomId?: string): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // Message handling
  sendMessage(message: string): Promise<void>;
  deleteMessage?(messageId: string): Promise<void>;
  editMessage?(messageId: string, newMessage: string): Promise<void>;
  
  // Event handlers
  onMessage(callback: (message: ChatMessage) => void): () => void;
  onUserJoin?(callback: (username: string) => void): () => void;
  onUserLeave?(callback: (username: string) => void): () => void;
  onError?(callback: (error: Error) => void): () => void;
  
  // User management
  getActiveUsers?(): Promise<string[]>;
  getUserProfile?(username: string): Promise<any>;
  
  // Moderation
  banUser?(username: string): Promise<void>;
  timeoutUser?(username: string, duration: number): Promise<void>;
  
  // Authentication
  authenticate?(token: string): Promise<void>;
}

// Chat provider registry
class ChatProviderRegistry {
  private providers: Map<string, ChatProvider> = new Map();
  
  register(provider: ChatProvider) {
    this.providers.set(provider.id, provider);
  }
  
  get(id: string): ChatProvider | undefined {
    return this.providers.get(id);
  }
  
  getAll(): ChatProvider[] {
    return Array.from(this.providers.values());
  }
  
  unregister(id: string) {
    this.providers.delete(id);
  }
}

// Internal chat provider implementation
export class InternalChatProvider implements ChatProvider {
  id = 'internal';
  name = 'Channel Chat';
  capabilities: ChatProviderCapabilities = {
    sendMessages: true,
    reactions: false,
    moderatorTools: false,
    userProfiles: false,
    threading: false,
    mediaSharing: false,
  };
  
  private connected = false;
  private messageHandlers: Set<(message: ChatMessage) => void> = new Set();
  private currentChannelId?: string;
  
  async connect(channelId: string): Promise<void> {
    this.currentChannelId = channelId;
    this.connected = true;
    console.log(`[InternalChat] Connected to channel ${channelId}`);
    
    // Simulate welcome message
    setTimeout(() => {
      this.simulateMessage({
        id: Date.now().toString(),
        username: 'System',
        message: `Welcome to channel ${channelId} chat!`,
        timestamp: new Date(),
        userColor: '#4ECDC4',
        provider: this.id,
        channelId,
      });
    }, 1000);
  }
  
  async disconnect(): Promise<void> {
    this.connected = false;
    this.currentChannelId = undefined;
    console.log('[InternalChat] Disconnected');
  }
  
  isConnected(): boolean {
    return this.connected;
  }
  
  async sendMessage(message: string): Promise<void> {
    if (!this.connected) throw new Error('Not connected');
    
    const chatMessage: ChatMessage = {
      id: Date.now().toString(),
      username: 'You',
      message,
      timestamp: new Date(),
      userColor: '#45B7D1',
      provider: this.id,
      channelId: this.currentChannelId,
    };
    
    this.messageHandlers.forEach(handler => handler(chatMessage));
  }
  
  onMessage(callback: (message: ChatMessage) => void): () => void {
    this.messageHandlers.add(callback);
    return () => this.messageHandlers.delete(callback);
  }
  
  private simulateMessage(message: ChatMessage) {
    this.messageHandlers.forEach(handler => handler(message));
  }
}

// Discord chat provider stub
export class DiscordChatProvider implements ChatProvider {
  id = 'discord';
  name = 'Discord';
  capabilities: ChatProviderCapabilities = {
    sendMessages: true,
    reactions: true,
    moderatorTools: true,
    userProfiles: true,
    threading: true,
    mediaSharing: true,
  };
  
  private connected = false;
  
  async connect(channelId: string, roomId?: string): Promise<void> {
    // Would connect to Discord API
    this.connected = true;
    console.log(`[Discord] Connected to server ${roomId}, channel ${channelId}`);
  }
  
  async disconnect(): Promise<void> {
    this.connected = false;
  }
  
  isConnected(): boolean {
    return this.connected;
  }
  
  async sendMessage(message: string): Promise<void> {
    if (!this.connected) throw new Error('Not connected');
    // Would send via Discord API
    console.log(`[Discord] Sending: ${message}`);
  }
  
  onMessage(callback: (message: ChatMessage) => void): () => void {
    // Would subscribe to Discord websocket
    return () => {};
  }
  
  async authenticate(token: string): Promise<void> {
    // Would authenticate with Discord
    console.log('[Discord] Authenticated');
  }
}

// DraftKings chat provider stub
export class DraftKingsChatProvider implements ChatProvider {
  id = 'draftkings';
  name = 'DraftKings Chat';
  capabilities: ChatProviderCapabilities = {
    sendMessages: true,
    reactions: true,
    moderatorTools: false,
    userProfiles: true,
    threading: false,
    mediaSharing: false,
  };
  
  private connected = false;
  private messageHandlers: Set<(message: ChatMessage) => void> = new Set();
  
  async connect(channelId: string): Promise<void> {
    this.connected = true;
    console.log(`[DraftKings] Connected to betting chat for channel ${channelId}`);
    
    // Simulate betting-focused messages
    setTimeout(() => {
      this.simulateMessage({
        id: Date.now().toString(),
        username: 'BetBot',
        message: 'Place your bets! Odds are updating live.',
        timestamp: new Date(),
        userColor: '#00C851',
        provider: this.id,
        channelId,
        badges: ['verified', 'dk-official'],
      });
    }, 1500);
  }
  
  async disconnect(): Promise<void> {
    this.connected = false;
  }
  
  isConnected(): boolean {
    return this.connected;
  }
  
  async sendMessage(message: string): Promise<void> {
    if (!this.connected) throw new Error('Not connected');
    
    const chatMessage: ChatMessage = {
      id: Date.now().toString(),
      username: 'You',
      message,
      timestamp: new Date(),
      userColor: '#00C851',
      provider: this.id,
      badges: ['dk-user'],
    };
    
    this.messageHandlers.forEach(handler => handler(chatMessage));
  }
  
  onMessage(callback: (message: ChatMessage) => void): () => void {
    this.messageHandlers.add(callback);
    return () => this.messageHandlers.delete(callback);
  }
  
  private simulateMessage(message: ChatMessage) {
    this.messageHandlers.forEach(handler => handler(message));
  }
}

// Chat provider context
interface ChatProviderContextType {
  registry: ChatProviderRegistry;
  activeProvider: ChatProvider | null;
  setActiveProvider: (providerId: string) => void;
  messages: ChatMessage[];
  sendMessage: (message: string) => Promise<void>;
  isConnected: boolean;
}

const ChatProviderContext = createContext<ChatProviderContextType | null>(null);

export const useChatProvider = () => {
  const context = useContext(ChatProviderContext);
  if (!context) {
    throw new Error('useChatProvider must be used within ChatProviderManager');
  }
  return context;
};

// Chat provider manager component
export const ChatProviderManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [registry] = useState(() => {
    const reg = new ChatProviderRegistry();
    // Register default providers
    reg.register(new InternalChatProvider());
    reg.register(new DiscordChatProvider());
    reg.register(new DraftKingsChatProvider());
    return reg;
  });
  
  const [activeProvider, setActiveProviderState] = useState<ChatProvider | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const setActiveProvider = useCallback((providerId: string) => {
    const provider = registry.get(providerId);
    if (provider) {
      setActiveProviderState(provider);
    }
  }, [registry]);
  
  const sendMessage = useCallback(async (message: string) => {
    if (activeProvider && activeProvider.isConnected()) {
      await activeProvider.sendMessage(message);
    }
  }, [activeProvider]);
  
  // Set up message handler for active provider
  useEffect(() => {
    if (!activeProvider) return;
    
    const unsubscribe = activeProvider.onMessage((message) => {
      setMessages(prev => [...prev.slice(-100), message]); // Keep last 100 messages
    });
    
    setIsConnected(activeProvider.isConnected());
    
    return () => {
      unsubscribe();
    };
  }, [activeProvider]);
  
  const value: ChatProviderContextType = {
    registry,
    activeProvider,
    setActiveProvider,
    messages,
    sendMessage,
    isConnected,
  };
  
  return (
    <ChatProviderContext.Provider value={value}>
      {children}
    </ChatProviderContext.Provider>
  );
};