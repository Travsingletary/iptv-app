import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Circle, Heart, Clock, Calendar, Info, Star } from 'lucide-react';

export interface Program {
  id: string;
  title: string;
  description: string;
  channelName: string;
  channelNumber: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  category: string;
  rating?: number;
  isLive?: boolean;
  progress?: number; // 0-100
  thumbnail?: string;
}

interface ProgramDetailsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  program: Program | null;
  onPlay?: (program: Program) => void;
  onRecord?: (program: Program) => void;
  onFavorite?: (program: Program) => void;
}

// Mock data for demonstration
export const mockProgram: Program = {
  id: '1',
  title: 'UEFA Champions League: Real Madrid vs Manchester City',
  description: 'Semi-final second leg of the UEFA Champions League. Real Madrid hosts Manchester City at the Santiago Bernabéu in what promises to be an epic encounter between two football giants. The first leg ended in a thrilling 3-3 draw, setting up a dramatic finale in Madrid.',
  channelName: 'Sports HD',
  channelNumber: '201',
  startTime: '20:00',
  endTime: '22:00',
  duration: 120,
  category: 'Sports',
  rating: 4.8,
  isLive: true,
  progress: 35,
};

export const ProgramDetailsPopup: React.FC<ProgramDetailsPopupProps> = ({
  isOpen,
  onClose,
  program,
  onPlay,
  onRecord,
  onFavorite,
}) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  if (!program) return null;

  const handlePlay = () => {
    onPlay?.(program);
    onClose();
  };

  const handleRecord = () => {
    setIsRecording(!isRecording);
    onRecord?.(program);
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    onFavorite?.(program);
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
                  onClick={onClose}
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
export const ProgramDetailsPopupExample: React.FC = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsPopupOpen(true)}
        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
      >
        Show Program Details
      </button>
      
      <ProgramDetailsPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        program={mockProgram}
        onPlay={(program) => console.log('Playing:', program.title)}
        onRecord={(program) => console.log('Recording:', program.title)}
        onFavorite={(program) => console.log('Favorited:', program.title)}
      />
    </div>
  );
};