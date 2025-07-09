import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Circle, Heart, Clock, Calendar, Info, Star, Share2, Trophy } from 'lucide-react';
import { useEventBus, useEventSubscription } from './EventBusProvider';

export interface Program {
  id: string;
  title: string;
  description: string;
  channelName: string;
  channelNumber: string;
  channelId: string;
  startTime: string;
  endTime: string;
  duration: number;
  category: string;
  rating?: number;
  isLive?: boolean;
  progress?: number;
  thumbnail?: string;
}

interface ProgramDetailsPopupEventDrivenProps {
  // Optional prop overrides
  forceOpen?: boolean;
  onClose?: () => void;
}

export const ProgramDetailsPopupEventDriven: React.FC<ProgramDetailsPopupEventDrivenProps> = ({
  forceOpen,
  onClose,
}) => {
  const eventBus = useEventBus();
  const [isOpen, setIsOpen] = useState(false);
  const [program, setProgram] = useState<Program | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Subscribe to showProgramDetails events
  useEventSubscription('showProgramDetails', useCallback((payload) => {
    setProgram(payload.program);
    setIsOpen(true);
  }, []));

  // Subscribe to programSelected events (from EPG)
  useEventSubscription('programSelected', useCallback(async (payload) => {
    // Fetch program details (mock for now)
    const programDetails: Program = {
      id: payload.programId,
      title: `Program ${payload.programId}`,
      description: 'Loading program details...',
      channelName: `Channel ${payload.channelId}`,
      channelNumber: payload.channelId,
      channelId: payload.channelId,
      startTime: new Date().toLocaleTimeString(),
      endTime: new Date(Date.now() + 3600000).toLocaleTimeString(),
      duration: 60,
      category: 'Entertainment',
      isLive: true,
      progress: 30,
    };
    
    setProgram(programDetails);
    setIsOpen(true);
  }, []));

  // Subscribe to channel changes
  useEventSubscription('channelChanged', useCallback((payload) => {
    if (isOpen && program) {
      // Update program with new channel info if needed
      setProgram(prev => prev ? {
        ...prev,
        channelId: payload.channelId,
        channelName: payload.channelName || `Channel ${payload.channelId}`,
        channelNumber: payload.channelNumber || payload.channelId,
      } : null);
    }
  }, [isOpen, program]));

  const handleClose = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  const handlePlay = () => {
    if (program) {
      // Publish channel change event
      eventBus.publish('channelChanged', {
        channelId: program.channelId,
        channelName: program.channelName,
        channelNumber: program.channelNumber,
      });
      
      handleClose();
    }
  };

  const handleRecord = () => {
    setIsRecording(!isRecording);
    // Future: publish recording event
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    // Future: publish favorite event
  };

  const handleShare = () => {
    if (program) {
      eventBus.publish('openSocialShare', {
        platform: 'twitter',
        contentUrl: `channel://${program.channelId}/program/${program.id}`,
        text: `Watching ${program.title} on ${program.channelName}`,
      });
    }
  };

  const handleBet = () => {
    if (program) {
      eventBus.publish('betSlipRequested', {
        channelId: program.channelId,
        programId: program.id,
        eventData: {
          name: program.title,
          channel: program.channelName,
        },
      });
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < Math.floor(rating) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-600'}
          />
        ))}
        <span className="text-sm text-gray-400 ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const open = forceOpen !== undefined ? forceOpen : isOpen;

  if (!program && open) return null;

  return (
    <AnimatePresence>
      {open && program && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none"
          >
            <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden pointer-events-auto">
              {/* Header with thumbnail background */}
              <div className="relative h-48 bg-gradient-to-b from-gray-800 to-gray-900">
                {program.thumbnail && (
                  <div className="absolute inset-0 opacity-30">
                    <img
                      src={program.thumbnail}
                      alt={program.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>

                {/* Live indicator */}
                {program.isLive && (
                  <div className="absolute top-4 left-4 flex items-center space-x-2 bg-red-600 px-3 py-1 rounded-full">
                    <Circle className="fill-white" size={8} />
                    <span className="text-white text-sm font-semibold">LIVE</span>
                  </div>
                )}

                {/* Program info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-900">
                  <h2 className="text-2xl font-bold text-white mb-2">{program.title}</h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-300">
                    <span className="flex items-center">
                      <span className="font-semibold">{program.channelNumber}</span>
                      <span className="mx-1">•</span>
                      {program.channelName}
                    </span>
                    <span className="flex items-center">
                      <Clock size={14} className="mr-1" />
                      {program.startTime} - {program.endTime}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center text-gray-400">
                    <Calendar size={16} className="mr-1" />
                    {formatDuration(program.duration)}
                  </div>
                  <div className="flex items-center text-gray-400">
                    <Info size={16} className="mr-1" />
                    {program.category}
                  </div>
                  {program.rating && renderRating(program.rating)}
                </div>

                {/* Progress bar (if live) */}
                {program.isLive && program.progress !== undefined && (
                  <div className="w-full">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{program.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${program.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="text-gray-300 leading-relaxed">
                  <p>{program.description}</p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 pt-4">
                  <button
                    onClick={handlePlay}
                    className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    <Play size={20} className="fill-white" />
                    <span>{program.isLive ? 'Watch Live' : 'Play'}</span>
                  </button>

                  <button
                    onClick={handleRecord}
                    className={`flex items-center justify-center space-x-2 font-semibold py-3 px-6 rounded-lg transition-colors ${
                      isRecording
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    <Circle className={isRecording ? 'fill-white' : ''} size={20} />
                    <span>{isRecording ? 'Recording' : 'Record'}</span>
                  </button>

                  <button
                    onClick={handleFavorite}
                    className={`flex items-center justify-center space-x-2 font-semibold py-3 px-6 rounded-lg transition-colors ${
                      isFavorited
                        ? 'bg-pink-600 hover:bg-pink-700 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    <Heart className={isFavorited ? 'fill-white' : ''} size={20} />
                    <span>{isFavorited ? 'Favorited' : 'Favorite'}</span>
                  </button>

                  {/* New action buttons for event integration */}
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center space-x-2 bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    <Share2 size={20} />
                    <span>Share</span>
                  </button>

                  <button
                    onClick={handleBet}
                    className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    <Trophy size={20} />
                    <span>Bet</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Usage example
export const ProgramDetailsPopupEventDrivenExample: React.FC = () => {
  const eventBus = useEventBus();

  const mockProgram: Program = {
    id: '1',
    title: 'UEFA Champions League: Real Madrid vs Manchester City',
    description: 'Semi-final second leg of the UEFA Champions League.',
    channelName: 'Sports HD',
    channelNumber: '201',
    channelId: '201',
    startTime: '20:00',
    endTime: '22:00',
    duration: 120,
    category: 'Sports',
    rating: 4.8,
    isLive: true,
    progress: 35,
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => eventBus.publish('showProgramDetails', { program: mockProgram })}
        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
      >
        Show Program Details
      </button>
      
      <button
        onClick={() => eventBus.publish('programSelected', { 
          programId: 'prog-123',
          channelId: '456',
        })}
        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
      >
        Select Program (from EPG)
      </button>
      
      <ProgramDetailsPopupEventDriven />
    </div>
  );
};