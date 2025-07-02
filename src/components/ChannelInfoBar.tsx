import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronRight, Tv, Signal } from 'lucide-react';
import { useEventBus, useEventSubscription } from './EventBusProvider';

interface Program {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  description?: string;
  category?: string;
  rating?: string;
}

interface Channel {
  id: string;
  number: string;
  name: string;
  logo?: string;
  quality?: 'HD' | 'FHD' | '4K' | 'SD';
  isRecording?: boolean;
  isFavorite?: boolean;
}

interface ChannelInfoBarProps {
  autoHideDelay?: number; // milliseconds
  position?: 'top' | 'bottom';
  showProgressBar?: boolean;
}

// Mock data generator for demo
const generateMockProgram = (offset: number = 0): Program => {
  const now = new Date();
  const start = new Date(now.getTime() + offset);
  const end = new Date(start.getTime() + (60 + Math.random() * 60) * 60000); // 60-120 min
  
  const titles = [
    'Premier League: Man United vs Liverpool',
    'Breaking News Live',
    'The Morning Show',
    'Movie: Inception',
    'Documentary: Planet Earth',
    'Sports Center',
    'Late Night Talk Show',
  ];
  
  return {
    id: `prog-${Date.now()}-${offset}`,
    title: titles[Math.floor(Math.random() * titles.length)],
    startTime: start,
    endTime: end,
    category: ['Sports', 'News', 'Entertainment', 'Movie', 'Documentary'][Math.floor(Math.random() * 5)],
    rating: ['PG', 'PG-13', 'R', 'TV-14'][Math.floor(Math.random() * 4)],
  };
};

export const ChannelInfoBar: React.FC<ChannelInfoBarProps> = ({
  autoHideDelay = 5000,
  position = 'bottom',
  showProgressBar = true,
}) => {
  const eventBus = useEventBus();
  const [isVisible, setIsVisible] = useState(false);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [currentProgram, setCurrentProgram] = useState<Program | null>(null);
  const [nextProgram, setNextProgram] = useState<Program | null>(null);
  const [progress, setProgress] = useState(0);
  const [hideTimer, setHideTimer] = useState<NodeJS.Timeout | null>(null);

  // Subscribe to channel change events
  useEventSubscription('channelChanged', useCallback((payload) => {
    // Show info bar with new channel data
    const newChannel: Channel = {
      id: payload.channelId,
      number: payload.channelNumber || payload.channelId,
      name: payload.channelName || `Channel ${payload.channelId}`,
      quality: ['HD', 'FHD', '4K'][Math.floor(Math.random() * 3)] as any,
      isFavorite: Math.random() > 0.5,
    };
    
    setChannel(newChannel);
    setCurrentProgram(generateMockProgram(-30 * 60000)); // Started 30 min ago
    setNextProgram(generateMockProgram(60 * 60000)); // Starts in 60 min
    setIsVisible(true);
    
    // Reset auto-hide timer
    if (hideTimer) clearTimeout(hideTimer);
    const timer = setTimeout(() => setIsVisible(false), autoHideDelay);
    setHideTimer(timer);
  }, [autoHideDelay, hideTimer]));

  // Subscribe to manual show/hide events
  useEventSubscription('showChannelInfo', useCallback((payload) => {
    setIsVisible(payload.show);
    if (!payload.show && hideTimer) {
      clearTimeout(hideTimer);
    }
  }, [hideTimer]));

  // Calculate progress
  useEffect(() => {
    if (!currentProgram || !showProgressBar) return;
    
    const updateProgress = () => {
      const now = new Date();
      const start = new Date(currentProgram.startTime);
      const end = new Date(currentProgram.endTime);
      const total = end.getTime() - start.getTime();
      const elapsed = now.getTime() - start.getTime();
      const prog = Math.min(100, Math.max(0, (elapsed / total) * 100));
      setProgress(prog);
    };
    
    updateProgress();
    const interval = setInterval(updateProgress, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, [currentProgram, showProgressBar]);

  // Manual show/hide
  const handleToggleVisibility = () => {
    setIsVisible(!isVisible);
    eventBus.publish('overlayShown', { overlay: 'channelInfo', visible: !isVisible });
  };

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Calculate time remaining
  const getTimeRemaining = (endTime: Date) => {
    const now = new Date();
    const remaining = endTime.getTime() - now.getTime();
    const minutes = Math.floor(remaining / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (!channel || !currentProgram) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: position === 'bottom' ? 100 : -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: position === 'bottom' ? 100 : -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`fixed ${position === 'bottom' ? 'bottom-0' : 'top-0'} left-0 right-0 z-40`}
        >
          <div className="bg-gradient-to-t from-black via-gray-900/95 to-gray-900/90 backdrop-blur-md">
            {/* Progress bar */}
            {showProgressBar && (
              <div className="h-1 bg-gray-800">
                <motion.div
                  className="h-full bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: 'linear' }}
                />
              </div>
            )}

            <div className="px-6 py-4">
              <div className="flex items-start justify-between">
                {/* Channel info */}
                <div className="flex items-start space-x-4">
                  {/* Channel logo/number */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center">
                      {channel.logo ? (
                        <img src={channel.logo} alt={channel.name} className="w-12 h-12 object-contain" />
                      ) : (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">{channel.number}</div>
                          {channel.quality && (
                            <div className="text-xs text-blue-400 font-semibold">{channel.quality}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Program info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="text-white font-semibold text-lg">{channel.name}</h3>
                      {channel.isFavorite && (
                        <span className="text-yellow-500">★</span>
                      )}
                      {channel.isRecording && (
                        <span className="text-red-500 text-sm">● REC</span>
                      )}
                      <Signal className="text-green-500" size={16} />
                    </div>

                    {/* Current program */}
                    <div className="mb-2">
                      <div className="flex items-center space-x-2 text-white">
                        <Clock size={14} />
                        <span className="text-sm">{formatTime(currentProgram.startTime)} - {formatTime(currentProgram.endTime)}</span>
                        <span className="text-sm text-gray-400">({getTimeRemaining(currentProgram.endTime)} left)</span>
                      </div>
                      <h4 className="text-lg text-white font-medium mt-1">{currentProgram.title}</h4>
                      <div className="flex items-center space-x-3 mt-1">
                        {currentProgram.category && (
                          <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
                            {currentProgram.category}
                          </span>
                        )}
                        {currentProgram.rating && (
                          <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
                            {currentProgram.rating}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Next program */}
                    {nextProgram && (
                      <div className="flex items-center space-x-2 text-gray-400">
                        <ChevronRight size={14} />
                        <span className="text-sm">Next:</span>
                        <span className="text-sm text-gray-300">{formatTime(nextProgram.startTime)}</span>
                        <span className="text-sm text-gray-300">{nextProgram.title}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action hints */}
                <div className="flex flex-col items-end space-y-1 text-xs text-gray-500">
                  <div>OK - More Info</div>
                  <div>↑↓ - Change Channel</div>
                  <div>← → - Volume</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Usage example
export const ChannelInfoBarExample: React.FC = () => {
  const eventBus = useEventBus();
  const [currentChannel, setCurrentChannel] = useState(101);

  const changeChannel = (increment: number) => {
    const newChannel = currentChannel + increment;
    setCurrentChannel(newChannel);
    eventBus.publish('channelChanged', {
      channelId: newChannel.toString(),
      channelNumber: newChannel.toString(),
      channelName: `Channel ${newChannel}`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">TiviMate-Style Channel Info Bar</h1>
        
        <div className="bg-gray-900 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white mb-4">Channel Controls</h2>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => changeChannel(-1)}
              className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              ← Previous Channel
            </button>
            
            <div className="text-white text-xl font-bold">
              Channel {currentChannel}
            </div>
            
            <button
              onClick={() => changeChannel(1)}
              className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Next Channel →
            </button>
          </div>
          
          <div className="text-sm text-gray-400 mt-4">
            <p>The info bar will appear at the bottom when you change channels.</p>
            <p>It automatically hides after 5 seconds (TiviMate behavior).</p>
          </div>
        </div>

        {/* Info bar component */}
        <ChannelInfoBar />
      </div>
    </div>
  );
};