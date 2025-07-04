import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Info, ChevronRight } from 'lucide-react';
import { useEventBus, useEventSubscription } from './EventBusProvider';

interface Program {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  description?: string;
  category?: string;
  rating?: string;
  progress?: number; // 0-100 for current program
}

interface MiniEPGGuideProps {
  maxPrograms?: number;
  position?: 'center' | 'right';
  autoHideDelay?: number;
}

// Mock program generator
const generatePrograms = (channelId: string, count: number = 5): Program[] => {
  const programs: Program[] = [];
  const now = new Date();
  let currentTime = new Date(now.getTime() - 30 * 60000); // Current program started 30 min ago
  
  const titles = [
    'Morning News',
    'Sports Update',
    'Documentary: Nature',
    'Movie: Action Heroes',
    'Comedy Show',
    'Drama Series',
    'Live Concert',
    'Talk Show',
    'Reality TV',
    'Kids Programming',
  ];
  
  for (let i = 0; i < count; i++) {
    const duration = 30 + Math.floor(Math.random() * 90); // 30-120 minutes
    const endTime = new Date(currentTime.getTime() + duration * 60000);
    
    const program: Program = {
      id: `prog-${channelId}-${i}`,
      title: titles[Math.floor(Math.random() * titles.length)] + (i === 0 ? ' (Live)' : ''),
      startTime: new Date(currentTime),
      endTime: endTime,
      category: ['News', 'Sports', 'Entertainment', 'Movie', 'Documentary'][Math.floor(Math.random() * 5)],
      rating: i > 0 ? ['PG', 'PG-13', 'R', 'TV-14'][Math.floor(Math.random() * 4)] : undefined,
    };
    
    // Calculate progress for current program
    if (i === 0) {
      const elapsed = now.getTime() - program.startTime.getTime();
      const total = program.endTime.getTime() - program.startTime.getTime();
      program.progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
    }
    
    programs.push(program);
    currentTime = endTime;
  }
  
  return programs;
};

export const MiniEPGGuide: React.FC<MiniEPGGuideProps> = ({
  maxPrograms = 4,
  position = 'center',
  autoHideDelay = 10000,
}) => {
  const eventBus = useEventBus();
  const [isVisible, setIsVisible] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [channelInfo, setChannelInfo] = useState<{ id: string; name: string; number: string } | null>(null);
  const [hideTimer, setHideTimer] = useState<NodeJS.Timeout | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Subscribe to OK button press
  useEventSubscription('okButtonPressed', useCallback((payload) => {
    if (payload.context !== 'menu' && channelInfo) {
      setIsVisible(true);
      setSelectedIndex(0);
      
      // Reset auto-hide timer
      if (hideTimer) clearTimeout(hideTimer);
      const timer = setTimeout(() => setIsVisible(false), autoHideDelay);
      setHideTimer(timer);
    }
  }, [channelInfo, hideTimer, autoHideDelay]));

  // Subscribe to channel changes to update channel info
  useEventSubscription('channelChanged', useCallback((payload) => {
    setChannelInfo({
      id: payload.channelId,
      name: payload.channelName || `Channel ${payload.channelId}`,
      number: payload.channelNumber || payload.channelId,
    });
    // Generate programs for the new channel
    setPrograms(generatePrograms(payload.channelId, maxPrograms));
  }, [maxPrograms]));

  // Handle keyboard navigation
  useEffect(() => {
    if (!isVisible) return;
    
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(programs.length - 1, prev + 1));
          break;
        case 'Enter':
        case 'OK':
          e.preventDefault();
          handleSelectProgram(programs[selectedIndex]);
          break;
        case 'Escape':
        case 'Back':
          e.preventDefault();
          setIsVisible(false);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible, selectedIndex, programs]);

  const handleSelectProgram = (program: Program) => {
    eventBus.publish('showProgramDetails', { program });
    setIsVisible(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (start: Date, end: Date) => {
    const duration = Math.floor((end.getTime() - start.getTime()) / 60000);
    if (duration < 60) return `${duration}m`;
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (!channelInfo) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-45"
            onClick={() => setIsVisible(false)}
          />
          
          {/* Mini EPG */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed z-50 ${
              position === 'center' 
                ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' 
                : 'top-1/2 right-8 -translate-y-1/2'
            }`}
          >
            <div className="bg-gray-900/95 backdrop-blur-md rounded-lg shadow-2xl overflow-hidden w-96">
              {/* Header */}
              <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{channelInfo.number}</div>
                    <div className="text-xs text-gray-400">CH</div>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{channelInfo.name}</h3>
                    <p className="text-xs text-gray-400">Program Guide</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsVisible(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Program list */}
              <div className="p-2">
                {programs.map((program, index) => (
                  <motion.div
                    key={program.id}
                    className={`p-3 rounded-lg mb-2 cursor-pointer transition-all ${
                      selectedIndex === index 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                    onClick={() => handleSelectProgram(program)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Clock size={14} className={selectedIndex === index ? 'text-white' : 'text-gray-500'} />
                          <span className="text-sm font-medium">
                            {formatTime(program.startTime)} - {formatTime(program.endTime)}
                          </span>
                          <span className="text-xs opacity-75">
                            ({formatDuration(program.startTime, program.endTime)})
                          </span>
                        </div>
                        
                        <h4 className="font-semibold mb-1">{program.title}</h4>
                        
                        <div className="flex items-center space-x-2 text-xs">
                          {program.category && (
                            <span className={`px-2 py-0.5 rounded ${
                              selectedIndex === index 
                                ? 'bg-blue-700' 
                                : 'bg-gray-700'
                            }`}>
                              {program.category}
                            </span>
                          )}
                          {program.rating && (
                            <span className={`px-2 py-0.5 rounded ${
                              selectedIndex === index 
                                ? 'bg-blue-700' 
                                : 'bg-gray-700'
                            }`}>
                              {program.rating}
                            </span>
                          )}
                        </div>

                        {/* Progress bar for current program */}
                        {program.progress !== undefined && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Live</span>
                              <span>{Math.round(program.progress)}%</span>
                            </div>
                            <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                              <motion.div
                                className={selectedIndex === index ? 'bg-white' : 'bg-blue-500'}
                                initial={{ width: 0 }}
                                animate={{ width: `${program.progress}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <ChevronRight 
                        size={20} 
                        className={`ml-2 ${selectedIndex === index ? 'text-white' : 'text-gray-600'}`} 
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Footer hints */}
              <div className="bg-gray-800 px-4 py-2 flex justify-between text-xs text-gray-400">
                <span>↑↓ Navigate</span>
                <span>OK/Enter Select</span>
                <span>Back/Esc Close</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Usage example
export const MiniEPGGuideExample: React.FC = () => {
  const eventBus = useEventBus();
  const [currentChannel, setCurrentChannel] = useState({
    id: '101',
    name: 'Sports HD',
    number: '101',
  });

  // Initialize channel
  useEffect(() => {
    eventBus.publish('channelChanged', {
      channelId: currentChannel.id,
      channelName: currentChannel.name,
      channelNumber: currentChannel.number,
    });
  }, []);

  const handleOKPress = () => {
    eventBus.publish('okButtonPressed', { context: 'epg' });
  };

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">TiviMate-Style Mini EPG Guide</h1>
        
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Controls</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 mb-2">Current Channel: {currentChannel.name}</p>
              <button
                onClick={handleOKPress}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-medium text-lg"
              >
                Press OK (Show Mini EPG)
              </button>
            </div>
            
            <div className="text-sm text-gray-500 space-y-1">
              <p>• Press OK to show the mini EPG guide</p>
              <p>• Use ↑↓ to navigate programs</p>
              <p>• Press Enter/OK to see program details</p>
              <p>• Press Esc/Back to close</p>
              <p>• Auto-hides after 10 seconds</p>
            </div>
          </div>
        </div>

        {/* The actual component */}
        <MiniEPGGuide />
      </div>
    </div>
  );
};