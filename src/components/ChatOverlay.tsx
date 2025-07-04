import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  userColor?: string;
}

interface ChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  messages?: ChatMessage[];
}

// Mock data for MVP
const mockMessages: ChatMessage[] = [
  { id: '1', username: 'SportsFan23', message: 'What a game!', timestamp: new Date(Date.now() - 300000), userColor: '#FF6B6B' },
  { id: '2', username: 'StreamWatcher', message: 'The quality is amazing', timestamp: new Date(Date.now() - 240000), userColor: '#4ECDC4' },
  { id: '3', username: 'TVAddict', message: 'Anyone else watching the match?', timestamp: new Date(Date.now() - 180000), userColor: '#45B7D1' },
  { id: '4', username: 'JohnDoe', message: 'Goal incoming!', timestamp: new Date(Date.now() - 120000), userColor: '#96CEB4' },
  { id: '5', username: 'GameTime', message: 'This channel is great', timestamp: new Date(Date.now() - 60000), userColor: '#FECA57' },
  { id: '6', username: 'LiveViewer', message: 'Hello everyone!', timestamp: new Date(Date.now() - 30000), userColor: '#FF9FF3' },
];

export const ChatOverlay: React.FC<ChatOverlayProps> = ({ isOpen, onClose, messages = mockMessages }) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(messages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Simulate receiving new messages for demo
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        username: `User${Math.floor(Math.random() * 1000)}`,
        message: getRandomMessage(),
        timestamp: new Date(),
        userColor: getRandomColor(),
      };
      
      setChatMessages((prev) => [...prev.slice(-50), newMessage]); // Keep last 50 messages
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const getRandomMessage = () => {
    const messages = [
      'Great stream!',
      'Love this channel',
      'What\'s the score?',
      'Just joined, what did I miss?',
      'HD quality is perfect',
      'Anyone else from UK?',
      'This is exciting!',
      'Thanks for streaming',
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getRandomColor = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF', '#48DBFB'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
              <h3 className="text-white font-semibold">Live Chat</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close chat"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg) => (
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
                  </div>
                  <p className="text-gray-200 text-sm break-words">{msg.message}</p>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input (placeholder for future implementation) */}
            <div className="p-4 border-t border-gray-700">
              <div className="bg-gray-800 rounded-lg px-4 py-2 text-gray-500 text-sm">
                Chat is view-only in MVP
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Usage example
export const ChatOverlayExample: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Toggle Chat
      </button>
      
      <ChatOverlay
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
};