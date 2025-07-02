import React, { useState, useEffect } from 'react';
import ChatOverlay from './components/ChatOverlay';
import BetSlipModal from './components/BetSlipModal';
import ProgramDetailsPopup from './components/ProgramDetailsPopup';

const App: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isBetSlipOpen, setIsBetSlipOpen] = useState(false);
  const [isProgramDetailsOpen, setIsProgramDetailsOpen] = useState(false);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Prevent shortcuts when typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'c':
          setIsChatOpen(prev => !prev);
          break;
        case 'b':
          setIsBetSlipOpen(prev => !prev);
          break;
        case 'i':
          setIsProgramDetailsOpen(prev => !prev);
          break;
        case 'escape':
          // Close all overlays
          setIsChatOpen(false);
          setIsBetSlipOpen(false);
          setIsProgramDetailsOpen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Main Content */}
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold mb-8">Steady Stream App</h1>
        
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Component Integration Demo</h2>
          <p className="text-gray-300 mb-6">
            Use keyboard shortcuts or buttons to toggle the overlays and modals:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Chat Overlay</h3>
              <p className="text-sm text-gray-400 mb-3">Press C or click the button</p>
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg transition-colors"
              >
                {isChatOpen ? 'Close' : 'Open'} Chat
              </button>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Bet Slip Modal</h3>
              <p className="text-sm text-gray-400 mb-3">Press B or click the button</p>
              <button
                onClick={() => setIsBetSlipOpen(!isBetSlipOpen)}
                className="w-full bg-green-600 hover:bg-green-700 py-2 rounded-lg transition-colors"
              >
                {isBetSlipOpen ? 'Close' : 'Open'} Bet Slip
              </button>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Program Details</h3>
              <p className="text-sm text-gray-400 mb-3">Press I or click the button</p>
              <button
                onClick={() => setIsProgramDetailsOpen(!isProgramDetailsOpen)}
                className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded-lg transition-colors"
              >
                {isProgramDetailsOpen ? 'Close' : 'Open'} Program Info
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-3">Keyboard Shortcuts</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <kbd className="px-2 py-1 bg-gray-800 rounded text-sm">C</kbd>
              <span className="text-gray-400">Toggle Chat</span>
            </div>
            <div className="flex items-center space-x-2">
              <kbd className="px-2 py-1 bg-gray-800 rounded text-sm">B</kbd>
              <span className="text-gray-400">Toggle Bet Slip</span>
            </div>
            <div className="flex items-center space-x-2">
              <kbd className="px-2 py-1 bg-gray-800 rounded text-sm">I</kbd>
              <span className="text-gray-400">Toggle Info</span>
            </div>
            <div className="flex items-center space-x-2">
              <kbd className="px-2 py-1 bg-gray-800 rounded text-sm">ESC</kbd>
              <span className="text-gray-400">Close All</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overlays and Modals */}
      <ChatOverlay isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <BetSlipModal isOpen={isBetSlipOpen} onClose={() => setIsBetSlipOpen(false)} />
      <ProgramDetailsPopup isOpen={isProgramDetailsOpen} onClose={() => setIsProgramDetailsOpen(false)} />
    </div>
  );
};

export default App;