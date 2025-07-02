import React, { useState } from 'react';

interface Bet {
  id: number;
  match: string;
  selection: string;
  odds: number;
  stake: number;
}

interface BetSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BetSlipModal: React.FC<BetSlipModalProps> = ({ isOpen, onClose }) => {
  const [bets, setBets] = useState<Bet[]>([
    { id: 1, match: 'Man United vs Liverpool', selection: 'Man United Win', odds: 2.5, stake: 10 },
    { id: 2, match: 'Real Madrid vs Barcelona', selection: 'Over 2.5 Goals', odds: 1.8, stake: 20 },
    { id: 3, match: 'Chelsea vs Arsenal', selection: 'Draw', odds: 3.2, stake: 15 },
  ]);

  const updateStake = (id: number, stake: number) => {
    setBets(bets.map(bet => bet.id === id ? { ...bet, stake } : bet));
  };

  const removeBet = (id: number) => {
    setBets(bets.filter(bet => bet.id !== id));
  };

  const totalStake = bets.reduce((sum, bet) => sum + bet.stake, 0);
  const potentialReturn = bets.reduce((sum, bet) => sum + (bet.stake * bet.odds), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white rounded-lg shadow-2xl w-96 max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Bet Slip</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto max-h-[50vh]">
          {bets.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p>No bets in your slip</p>
              <p className="text-sm mt-2">Add selections to start betting</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {bets.map((bet) => (
                <div key={bet.id} className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{bet.match}</p>
                      <p className="text-xs text-gray-400">{bet.selection}</p>
                    </div>
                    <button
                      onClick={() => removeBet(bet.id)}
                      className="text-red-400 hover:text-red-300 ml-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">Odds:</span>
                    <span className="text-sm font-semibold text-green-400">{bet.odds.toFixed(2)}</span>
                    <span className="text-sm text-gray-400 ml-auto">Stake:</span>
                    <div className="flex items-center">
                      <span className="text-sm mr-1">$</span>
                      <input
                        type="number"
                        value={bet.stake}
                        onChange={(e) => updateStake(bet.id, parseFloat(e.target.value) || 0)}
                        className="w-16 bg-gray-700 text-white px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="5"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Potential return: ${(bet.stake * bet.odds).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-700">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total Stake:</span>
              <span className="font-semibold">${totalStake.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Potential Return:</span>
              <span className="font-semibold text-green-400">${potentialReturn.toFixed(2)}</span>
            </div>
          </div>
          <button
            className="w-full bg-green-600 hover:bg-green-700 py-2 rounded-lg font-semibold transition-colors"
            disabled={bets.length === 0}
          >
            Place Bet
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">Press B to toggle bet slip</p>
        </div>
      </div>
    </div>
  );
};

export default BetSlipModal;