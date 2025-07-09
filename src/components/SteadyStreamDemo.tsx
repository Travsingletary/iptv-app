import React, { useState, useEffect } from 'react';
import { ChatOverlay } from './ChatOverlay';
import { BetSlipModal } from './BetSlipModal';
import { ProgramDetailsPopup, mockProgram } from './ProgramDetailsPopup';
import { MessageSquare, Trophy, Info } from 'lucide-react';

export const SteadyStreamDemo: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isBetSlipOpen, setIsBetSlipOpen] = useState(false);
  const [isProgramDetailsOpen, setIsProgramDetailsOpen] = useState(false);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          setIsBetSlipOpen(true);
          break;
        case 'c':
          e.preventDefault();
          setIsChatOpen(!isChatOpen);
          break;
        case 'i':
          e.preventDefault();
          setIsProgramDetailsOpen(true);
          break;
        case 'escape':
          e.preventDefault();
          // Close all modals
          setIsChatOpen(false);
          setIsBetSlipOpen(false);
          setIsProgramDetailsOpen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isChatOpen]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">SteadyStream TV Components Demo</h1>
        <p className="text-gray-400 mb-8">
          Test the three overlay components. Use keyboard shortcuts or click the buttons below.
        </p>

        {/* Keyboard shortcuts info */}
        <div className="bg-gray-900 rounded-lg p-4 mb-8">
          <h3 className="font-semibold mb-2">Keyboard Shortcuts:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><kbd className="bg-gray-800 px-2 py-1 rounded">B</kbd> - Open Bet Slip</div>
            <div><kbd className="bg-gray-800 px-2 py-1 rounded">C</kbd> - Toggle Chat</div>
            <div><kbd className="bg-gray-800 px-2 py-1 rounded">I</kbd> - Program Info</div>
            <div><kbd className="bg-gray-800 px-2 py-1 rounded">ESC</kbd> - Close All</div>
          </div>
        </div>

        {/* Component buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Chat Overlay */}
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <MessageSquare className="text-blue-500 mr-2" size={24} />
              <h2 className="text-xl font-semibold">Chat Overlay</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              YouTube-style chat with auto-scrolling messages and mock data simulation.
            </p>
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {isChatOpen ? 'Close Chat' : 'Open Chat'}
            </button>
          </div>

          {/* Bet Slip Modal */}
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Trophy className="text-yellow-500 mr-2" size={24} />
              <h2 className="text-xl font-semibold">Bet Slip Modal</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Slide-in betting drawer with mock odds, event selection, and stake calculation.
            </p>
            <button
              onClick={() => setIsBetSlipOpen(true)}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Open Bet Slip
            </button>
          </div>

          {/* Program Details Popup */}
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Info className="text-purple-500 mr-2" size={24} />
              <h2 className="text-xl font-semibold">Program Details</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Modal popup with program info, rating, and action buttons (Play/Record/Favorite).
            </p>
            <button
              onClick={() => setIsProgramDetailsOpen(true)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Show Details
            </button>
          </div>
        </div>

        {/* Mock video player area */}
        <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center mb-8">
          <div className="text-center">
            <div className="text-6xl mb-4">📺</div>
            <p className="text-gray-400">Video Player Area</p>
            <p className="text-sm text-gray-500 mt-2">Components will overlay on top of the video</p>
          </div>
        </div>

        {/* Integration example */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Integration Example</h3>
          <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
{`import { ChatOverlay, BetSlipModal, ProgramDetailsPopup } from './components';

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isBetSlipOpen, setIsBetSlipOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);

  return (
    <>
      <VideoPlayer />
      
      <ChatOverlay 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
      
      <BetSlipModal
        isOpen={isBetSlipOpen}
        onClose={() => setIsBetSlipOpen(false)}
      />
      
      <ProgramDetailsPopup
        isOpen={!!selectedProgram}
        onClose={() => setSelectedProgram(null)}
        program={selectedProgram}
      />
    </>
  );
}`}
          </pre>
        </div>
      </div>

      {/* Render the actual components */}
      <ChatOverlay
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      <BetSlipModal
        isOpen={isBetSlipOpen}
        onClose={() => setIsBetSlipOpen(false)}
      />

      <ProgramDetailsPopup
        isOpen={isProgramDetailsOpen}
        onClose={() => setIsProgramDetailsOpen(false)}
        program={mockProgram}
        onPlay={(program) => {
          console.log('Playing:', program.title);
          alert(`Now playing: ${program.title}`);
        }}
        onRecord={(program) => {
          console.log('Recording:', program.title);
        }}
        onFavorite={(program) => {
          console.log('Favorited:', program.title);
        }}
      />
    </div>
  );
};