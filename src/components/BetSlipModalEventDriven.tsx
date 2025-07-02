import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Clock, TrendingUp, DollarSign } from 'lucide-react';
import { useEventBus, useEventSubscription } from './EventBusProvider';

// DraftKings integration hook interface
export interface DraftKingsHook {
  fetchOdds: (eventId: string) => Promise<BetOption[]>;
  placeBet: (bet: SelectedBet) => Promise<{ success: boolean; betId?: string }>;
  getUserBalance: () => Promise<number>;
  getBettingLimits: () => Promise<{ min: number; max: number }>;
}

interface BetEvent {
  id: string;
  eventName: string;
  category: string;
  startTime: string;
  channelId?: string;
  programId?: string;
  options: BetOption[];
}

interface BetOption {
  id: string;
  name: string;
  odds: number;
  provider?: 'draftkings' | 'internal';
}

interface SelectedBet {
  eventId: string;
  optionId: string;
  eventName: string;
  optionName: string;
  odds: number;
  stake: number;
}

interface BetSlipModalEventDrivenProps {
  // Optional prop overrides
  forceOpen?: boolean;
  onClose?: () => void;
  draftKingsHook?: DraftKingsHook;
}

// Mock DraftKings hook for demonstration
const mockDraftKingsHook: DraftKingsHook = {
  fetchOdds: async (eventId) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      { id: `${eventId}-1`, name: 'Team A Win', odds: 1.85, provider: 'draftkings' },
      { id: `${eventId}-2`, name: 'Draw', odds: 3.5, provider: 'draftkings' },
      { id: `${eventId}-3`, name: 'Team B Win', odds: 2.1, provider: 'draftkings' },
    ];
  },
  placeBet: async (bet) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, betId: `BET-${Date.now()}` };
  },
  getUserBalance: async () => {
    return 1000.00;
  },
  getBettingLimits: async () => {
    return { min: 1, max: 500 };
  },
};

export const BetSlipModalEventDriven: React.FC<BetSlipModalEventDrivenProps> = ({
  forceOpen,
  onClose,
  draftKingsHook = mockDraftKingsHook,
}) => {
  const eventBus = useEventBus();
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<BetEvent[]>([]);
  const [selectedBets, setSelectedBets] = useState<SelectedBet[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [loadingOdds, setLoadingOdds] = useState<string[]>([]);

  // Subscribe to betSlipRequested events
  useEventSubscription('betSlipRequested', useCallback(async (payload) => {
    setIsOpen(true);
    
    // Create or update event
    const newEvent: BetEvent = {
      id: payload.programId || payload.channelId,
      eventName: `Channel ${payload.channelId} Event`,
      category: 'Live',
      startTime: new Date().toLocaleTimeString(),
      channelId: payload.channelId,
      programId: payload.programId,
      options: payload.eventData?.options || [],
    };
    
    // If DraftKings odds requested, fetch them
    if (payload.odds === 'draftkings' || !payload.eventData) {
      setLoadingOdds(prev => [...prev, newEvent.id]);
      try {
        const dkOdds = await draftKingsHook.fetchOdds(newEvent.id);
        newEvent.options = dkOdds;
      } catch (error) {
        console.error('[BetSlip] Failed to fetch DraftKings odds:', error);
      } finally {
        setLoadingOdds(prev => prev.filter(id => id !== newEvent.id));
      }
    }
    
    setEvents(prev => {
      const existing = prev.findIndex(e => e.id === newEvent.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newEvent;
        return updated;
      }
      return [...prev, newEvent];
    });
  }, [draftKingsHook]));

  // Subscribe to showBetSlip events (simple open/close)
  useEventSubscription('showBetSlip', useCallback((payload) => {
    setIsOpen(payload.open);
  }, []));

  // Subscribe to channel changes
  useEventSubscription('channelChanged', useCallback((payload) => {
    if (isOpen) {
      // Optionally add the new channel as a betting option
      eventBus.publish('betSlipRequested', {
        channelId: payload.channelId,
        odds: 'draftkings',
      });
    }
  }, [isOpen, eventBus]));

  // Fetch user balance on open
  useEffect(() => {
    if (isOpen) {
      draftKingsHook.getUserBalance().then(setUserBalance);
    }
  }, [isOpen, draftKingsHook]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  const handleSelectBet = (event: BetEvent, option: BetOption) => {
    setSelectedBets((prev) => {
      const existingBetIndex = prev.findIndex((bet) => bet.eventId === event.id);
      
      if (existingBetIndex >= 0) {
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
    
    try {
      // Place bets through DraftKings
      const betPromises = selectedBets.map(bet => draftKingsHook.placeBet(bet));
      const results = await Promise.all(betPromises);
      
      if (results.every(r => r.success)) {
        setShowSuccess(true);
        
        // Update balance
        const newBalance = await draftKingsHook.getUserBalance();
        setUserBalance(newBalance);
        
        // Publish success event
        eventBus.publish('betSlipRequested', {
          channelId: selectedBets[0]?.eventId || '',
          eventData: { status: 'success', bets: results },
        });
        
        setTimeout(() => {
          setShowSuccess(false);
          setSelectedBets([]);
          handleClose();
        }, 2000);
      }
    } catch (error) {
      console.error('[BetSlip] Failed to place bets:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSelected = (eventId: string, optionId: string) => {
    return selectedBets.some((bet) => bet.eventId === eventId && bet.optionId === optionId);
  };

  const open = forceOpen !== undefined ? forceOpen : isOpen;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
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
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Balance</p>
                    <p className="text-sm font-semibold text-green-500">
                      ${userBalance.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Events */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {events.length === 0 && (
                  <div className="text-center text-gray-500 mt-8">
                    <Trophy size={48} className="mx-auto mb-2 opacity-50" />
                    <p>No betting events available</p>
                    <p className="text-sm mt-2">Events will appear when you watch channels</p>
                  </div>
                )}

                {events.map((event) => (
                  <div key={event.id} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-white">{event.eventName}</h3>
                      <div className="flex items-center text-gray-400 text-sm">
                        <Clock size={14} className="mr-1" />
                        {event.startTime}
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">
                      {event.category} • Channel {event.channelId}
                    </p>
                    
                    {loadingOdds.includes(event.id) ? (
                      <div className="text-center py-4">
                        <TrendingUp className="animate-spin mx-auto text-gray-500" size={20} />
                        <p className="text-sm text-gray-500 mt-2">Loading DraftKings odds...</p>
                      </div>
                    ) : (
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
                              <span className="flex items-center">
                                {option.name}
                                {option.provider === 'draftkings' && (
                                  <span className="ml-2 text-xs bg-green-600 px-1 rounded">DK</span>
                                )}
                              </span>
                              <span className="font-bold">{option.odds.toFixed(2)}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
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
                        <div className="relative">
                          <DollarSign size={14} className="absolute left-2 top-1.5 text-gray-500" />
                          <input
                            type="number"
                            value={bet.stake}
                            onChange={(e) => handleStakeChange(bet.eventId, parseFloat(e.target.value) || 0)}
                            className="w-24 pl-6 pr-2 py-1 bg-gray-700 text-white rounded text-sm"
                            min="1"
                            max="500"
                            step="5"
                          />
                        </div>
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
                    disabled={isSubmitting || selectedBets.length === 0 || calculateTotalStake() > userBalance}
                    className={`w-full py-3 rounded-lg font-semibold transition-all ${
                      showSuccess
                        ? 'bg-green-600 text-white'
                        : isSubmitting
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : calculateTotalStake() > userBalance
                        ? 'bg-red-600 text-white cursor-not-allowed'
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
                    ) : calculateTotalStake() > userBalance ? (
                      'Insufficient Balance'
                    ) : (
                      'Place Bet'
                    )}
                  </button>
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
export const BetSlipModalEventDrivenExample: React.FC = () => {
  const eventBus = useEventBus();

  return (
    <div className="space-y-4">
      <button
        onClick={() => eventBus.publish('betSlipRequested', {
          channelId: '123',
          programId: 'prog-1',
          odds: 'draftkings',
        })}
        className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
      >
        Request DraftKings Odds
      </button>
      
      <button
        onClick={() => eventBus.publish('showBetSlip', { open: true })}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Open Bet Slip
      </button>
      
      <BetSlipModalEventDriven />
    </div>
  );
};