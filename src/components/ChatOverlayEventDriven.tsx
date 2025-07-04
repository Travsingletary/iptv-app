import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Users } from 'lucide-react';
import { useEventBus, useEventSubscription } from './EventBusProvider';

// Chat provider interface for extensibility
export interface ChatProvider {
  id: 'discord' | 'internal' | 'draftkings' | 'custom';
  name: string;
  icon?: React.ComponentType<{ size?: number }>;
  connect: (channelId: string, roomId?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  onMessage: (callback: (message: ChatMessage) => void) => void;
}

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  userColor?: string;
  provider?: string;
}

interface ChatOverlayEventDrivenProps {
  // Optional prop overrides for manual control
  forceOpen?: boolean;
  onClose?: () => void;
  defaultProvider?: ChatProvider['id'];
}

// Mock providers for demonstration
const mockProviders: Record<string, Partial<ChatProvider>> = {
  internal: {
    id: 'internal',
    name: 'Channel Chat',
    connect: async () => console.log('[Chat] Connected to internal chat'),
    disconnect: async () => console.log('[Chat] Disconnected from internal chat'),
  },
  discord: {
    id: 'discord',
    name: 'Discord',
    connect: async () => console.log('[Chat] Connected to Discord'),
    disconnect: async () => console.log('[Chat] Disconnected from Discord'),
  },
  draftkings: {
    id: 'draftkings',
    name: 'DraftKings Chat',
    connect: async () => console.log('[Chat] Connected to DraftKings chat'),
    disconnect: async () => console.log('[Chat] Disconnected from DraftKings chat'),
  },
};

export const ChatOverlayEventDriven: React.FC<ChatOverlayEventDrivenProps> = ({
  forceOpen,
  onClose,
  defaultProvider = 'internal',
}) => {
  const eventBus = useEventBus();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentChannelId, setCurrentChannelId] = useState<string>('');
  const [currentProvider, setCurrentProvider] = useState<ChatProvider['id']>(defaultProvider);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to showChat events
  useEventSubscription('showChat', useCallback((payload) => {
    setIsOpen(true);
    setCurrentChannelId(payload.channelId);
    if (payload.provider) {
      setCurrentProvider(payload.provider);
    }
    
    // Connect to the chat provider
    const provider = mockProviders[payload.provider || defaultProvider];
    if (provider?.connect) {
      provider.connect(payload.channelId, payload.roomId);
    }
  }, [defaultProvider]));

  // Subscribe to channel changes
  useEventSubscription('channelChanged', useCallback((payload) => {
    if (isOpen) {
      // Switch chat room when channel changes
      setCurrentChannelId(payload.channelId);
      setMessages([]); // Clear messages for new channel
      
      // Reconnect to new channel
      const provider = mockProviders[currentProvider];
      if (provider?.connect) {
        provider.connect(payload.channelId);
      }
    }
  }, [isOpen, currentProvider]));

  // Handle closing
  const handleClose = useCallback(() => {
    setIsOpen(false);
    const provider = mockProviders[currentProvider];
    if (provider?.disconnect) {
      provider.disconnect();
    }
    
    // Call optional onClose prop
    onClose?.();
    
    // Publish event for other components
    eventBus.publish('showChat', { channelId: currentChannelId, provider: currentProvider });
  }, [currentChannelId, currentProvider, eventBus, onClose]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate receiving messages (replace with real provider integration)
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        username: `User${Math.floor(Math.random() * 1000)}`,
        message: getRandomMessage(),
        timestamp: new Date(),
        userColor: getRandomColor(),
        provider: currentProvider,
      };
      
      setMessages((prev) => [...prev.slice(-50), newMessage]);
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, currentProvider]);

  const getRandomMessage = () => {
    const channelMessages = [
      `Watching channel ${currentChannelId}!`,
      'Great quality stream!',
      'Love this program',
      'Anyone else watching?',
      `${currentProvider === 'draftkings' ? 'Placed my bet!' : 'This is exciting!'}`,
    ];
    const generalMessages = [
      'Hello everyone!',
      'Just joined',
      'Thanks for the stream',
      '👋',
      '🔥🔥🔥',
    ];
    
    const messages = [...channelMessages, ...generalMessages];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getRandomColor = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF', '#48DBFB'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const open = forceOpen !== undefined ? forceOpen : isOpen;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed right-0 top-0 h-full w-80 bg-gray-900/95 backdrop-blur-sm shadow-2xl z-50"
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center space-x-2">
                <MessageSquare className="text-blue-500" size={20} />
                <div>
                  <h3 className="text-white font-semibold">Live Chat</h3>
                  <p className="text-xs text-gray-400">
                    {mockProviders[currentProvider]?.name} • Channel {currentChannelId}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close chat"
              >
                <X size={20} />
              </button>
            </div>

            {/* Provider selector */}
            <div className="flex items-center p-2 space-x-2 border-b border-gray-700">
              {Object.entries(mockProviders).map(([key, provider]) => (
                <button
                  key={key}
                  onClick={() => setCurrentProvider(provider.id!)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    currentProvider === provider.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {provider.name}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 mt-8">
                  <Users size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-sm">Be the first to say hello!</p>
                </div>
              )}
              
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-baseline space-x-2">
                    <span 
                      className="font-semibold text-sm"
                      style={{ color: msg.userColor || '#4ECDC4' }}
                    >
                      {msg.username}
                    </span>
                    <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
                    {msg.provider && msg.provider !== 'internal' && (
                      <span className="text-xs bg-gray-700 px-1 rounded">
                        {msg.provider}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-200 text-sm break-words">{msg.message}</p>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-700">
              <div className="bg-gray-800 rounded-lg px-4 py-2 text-gray-500 text-sm text-center">
                {currentProvider === 'draftkings' 
                  ? 'DraftKings chat coming soon'
                  : 'Chat input coming soon'}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Usage example showing event-driven approach
export const ChatOverlayEventDrivenExample: React.FC = () => {
  const eventBus = useEventBus();

  return (
    <div className="space-y-4">
      <button
        onClick={() => eventBus.publish('showChat', { 
          channelId: '123', 
          provider: 'internal' 
        })}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Open Internal Chat
      </button>
      
      <button
        onClick={() => eventBus.publish('showChat', { 
          channelId: '123', 
          provider: 'discord' 
        })}
        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
      >
        Open Discord Chat
      </button>
      
      <button
        onClick={() => eventBus.publish('showChat', { 
          channelId: '123', 
          provider: 'draftkings' 
        })}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Open DraftKings Chat
      </button>
      
      <ChatOverlayEventDriven />
    </div>
  );
};