import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Clock, TrendingUp } from 'lucide-react';

interface BetEvent {
  id: string;
  eventName: string;
  category: string;
  startTime: string;
  options: BetOption[];
}

interface BetOption {
  id: string;
  name: string;
  odds: number;
}

interface SelectedBet {
  eventId: string;
  optionId: string;
  eventName: string;
  optionName: string;
  odds: number;
  stake: number;
}

interface BetSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  events?: BetEvent[];
}

// Mock data for MVP
const mockEvents: BetEvent[] = [
  {
    id: '1',
    eventName: 'Manchester United vs Liverpool',
    category: 'Premier League',
    startTime: '20:00',
    options: [
      { id: '1a', name: 'Man United Win', odds: 2.5 },
      { id: '1b', name: 'Draw', odds: 3.2 },
      { id: '1c', name: 'Liverpool Win', odds: 2.1 },
    ],
  },
  {
    id: '2',
    eventName: 'Real Madrid vs Barcelona',
    category: 'La Liga',
    startTime: '21:00',
    options: [
      { id: '2a', name: 'Real Madrid Win', odds: 1.9 },
      { id: '2b', name: 'Draw', odds: 3.5 },
      { id: '2c', name: 'Barcelona Win', odds: 3.8 },
    ],
  },
  {
    id: '3',
    eventName: 'Lakers vs Warriors',
    category: 'NBA',
    startTime: '02:00',
    options: [
      { id: '3a', name: 'Lakers -5.5', odds: 1.85 },
      { id: '3b', name: 'Warriors +5.5', odds: 1.95 },
    ],
  },
];

export const BetSlipModal: React.FC<BetSlipModalProps> = ({ isOpen, onClose, events = mockEvents }) => {
  const [selectedBets, setSelectedBets] = useState<SelectedBet[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        if (!isOpen) {
          // Trigger opening (this should be handled by parent component)
          console.log('B key pressed - open bet slip');
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  const handleSelectBet = (event: BetEvent, option: BetOption) => {
    setSelectedBets((prev) => {
      const existingBetIndex = prev.findIndex((bet) => bet.eventId === event.id);
      
      if (existingBetIndex >= 0) {
        // Replace existing bet for this event
        const newBets = [...prev];
        newBets[existingBetIndex] = {
          eventId: event.id,
          optionId: option.id,
          eventName: event.eventName,
          optionName: option.name,
          odds: option.odds,
          stake: newBets[existingBetIndex].stake || 10,
        };
        return newBets;
      } else {
        // Add new bet
        return [...prev, {
          eventId: event.id,
          optionId: option.id,
          eventName: event.eventName,
          optionName: option.name,
          odds: option.odds,
          stake: 10,
        }];
      }
    });
  };

  const handleStakeChange = (eventId: string, stake: number) => {
    setSelectedBets((prev) =>
      prev.map((bet) =>
        bet.eventId === eventId ? { ...bet, stake: Math.max(0, stake) } : bet
      )
    );
  };

  const handleRemoveBet = (eventId: string) => {
    setSelectedBets((prev) => prev.filter((bet) => bet.eventId !== eventId));
  };

  const calculateTotalOdds = () => {
    return selectedBets.reduce((acc, bet) => acc * bet.odds, 1);
  };

  const calculateTotalStake = () => {
    return selectedBets.reduce((acc, bet) => acc + bet.stake, 0);
  };

  const calculatePotentialWinnings = () => {
    if (selectedBets.length === 0) return 0;
    return calculateTotalStake() * calculateTotalOdds();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setShowSuccess(true);
    
    // Reset after showing success
    setTimeout(() => {
      setShowSuccess(false);
      setSelectedBets([]);
      onClose();
    }, 2000);
  };

  const isSelected = (eventId: string, optionId: string) => {
    return selectedBets.some((bet) => bet.eventId === eventId && bet.optionId === optionId);
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-96 bg-gray-900 shadow-2xl z-50 overflow-hidden"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div className="flex items-center space-x-2">
                  <Trophy className="text-yellow-500" size={24} />
                  <h2 className="text-xl font-bold text-white">Bet Slip</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Close bet slip"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Events */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-white">{event.eventName}</h3>
                      <div className="flex items-center text-gray-400 text-sm">
                        <Clock size={14} className="mr-1" />
                        {event.startTime}
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{event.category}</p>
                    
                    <div className="space-y-2">
                      {event.options.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleSelectBet(event, option)}
                          className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            isSelected(event.id, option.id)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span>{option.name}</span>
                            <span className="font-bold">{option.odds.toFixed(2)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bet Slip */}
              {selectedBets.length > 0 && (
                <div className="border-t border-gray-700 p-4 space-y-3">
                  <h3 className="font-semibold text-white mb-2">Your Selections</h3>
                  
                  {selectedBets.map((bet) => (
                    <div key={bet.eventId} className="bg-gray-800 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{bet.eventName}</p>
                          <p className="text-xs text-gray-400">{bet.optionName} @ {bet.odds.toFixed(2)}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveBet(bet.eventId)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <label className="text-xs text-gray-400">Stake:</label>
                        <input
                          type="number"
                          value={bet.stake}
                          onChange={(e) => handleStakeChange(bet.eventId, parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 bg-gray-700 text-white rounded text-sm"
                          min="0"
                          step="5"
                        />
                      </div>
                    </div>
                  ))}

                  {/* Summary */}
                  <div className="bg-gray-800 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total Stake:</span>
                      <span className="text-white font-medium">${calculateTotalStake().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total Odds:</span>
                      <span className="text-white font-medium">{calculateTotalOdds().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-700">
                      <span className="text-gray-400">Potential Win:</span>
                      <span className="text-green-500 font-bold">${calculatePotentialWinnings().toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || selectedBets.length === 0}
                    className={`w-full py-3 rounded-lg font-semibold transition-all ${
                      showSuccess
                        ? 'bg-green-600 text-white'
                        : isSubmitting
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {showSuccess ? (
                      'Bet Placed Successfully!'
                    ) : isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <TrendingUp className="animate-spin mr-2" size={18} />
                        Placing Bet...
                      </span>
                    ) : (
                      'Place Bet'
                    )}
                  </button>
                </div>
              )}

              {/* Empty State */}
              {selectedBets.length === 0 && (
                <div className="p-4 text-center text-gray-400">
                  <p className="text-sm">Select events to add to your bet slip</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Usage example
export const BetSlipModalExample: React.FC = () => {
  const [isBetSlipOpen, setIsBetSlipOpen] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        setIsBetSlipOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div>
      <button
        onClick={() => setIsBetSlipOpen(!isBetSlipOpen)}
        className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
      >
        Open Bet Slip (or press B)
      </button>
      
      <BetSlipModal
        isOpen={isBetSlipOpen}
        onClose={() => setIsBetSlipOpen(false)}
      />
    </div>
  );
};