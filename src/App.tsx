import React, { useState, useEffect } from 'react';
import {
  EventBusProvider,
  ChatProviderManager,
  ChatOverlayEventDriven,
  BetSlipModalEventDriven,
  ProgramDetailsPopupEventDriven,
  ChannelInfoBar,
  MiniEPGGuide,
  useEventBus
} from './components';
import { VideoPlayer } from './components/VideoPlayer/VideoPlayer';

// Main app content component
function AppContent() {
  const eventBus = useEventBus();
  const [showDemo, setShowDemo] = useState(false);

  // Keyboard controls for IPTV navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case 'enter':
        case ' ': // Space for OK/Select
          eventBus.publish('okButtonPressed', {});
          break;
        case 'b':
          eventBus.publish('showBetSlip', { open: true });
          break;
        case 'c':
          eventBus.publish('showChat', { channelId: '001' });
          break;
        case 'i':
          eventBus.publish('showChannelInfo', { show: true });
          break;
        case 'd':
          setShowDemo(!showDemo);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [eventBus, showDemo]);

  // Simulate channel changes for demo
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate channel data update every 30 seconds
      eventBus.publish('channelChanged', {
        channelId: Math.random().toString(),
        channelName: `Sports HD ${Math.floor(Math.random() * 10) + 1}`,
        channelNumber: `${Math.floor(Math.random() * 999) + 1}`
      });
    }, 30000);

    // Initial channel data
    eventBus.publish('channelChanged', {
      channelId: '001',
      channelName: 'ESPN HD',
      channelNumber: '101'
    });

    return () => clearInterval(interval);
  }, [eventBus]);

  return (
    <div className="w-full h-full relative bg-black">
      {/* Main video player area */}
      <VideoPlayer 
        sources={[
          {
            src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            type: 'video/mp4',
            label: '720p'
          }
        ]}
        autoPlay={true}
        className="w-full h-full"
      />
      
      {/* Overlays and UI components */}
      <ChatOverlayEventDriven />
      <BetSlipModalEventDriven />
      <ProgramDetailsPopupEventDriven />
      <ChannelInfoBar />
      <MiniEPGGuide />
      
      {/* Demo mode toggle */}
      {showDemo && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-80 p-4 rounded-lg text-white text-sm">
          <h3 className="font-bold mb-2">🎮 Demo Mode Active</h3>
          <div className="space-y-1">
            <div><kbd className="bg-gray-700 px-2 py-1 rounded">B</kbd> - Toggle Bet Slip</div>
            <div><kbd className="bg-gray-700 px-2 py-1 rounded">C</kbd> - Toggle Chat</div>
            <div><kbd className="bg-gray-700 px-2 py-1 rounded">I</kbd> - Show Channel Info</div>
            <div><kbd className="bg-gray-700 px-2 py-1 rounded">Enter/Space</kbd> - Open EPG</div>
            <div><kbd className="bg-gray-700 px-2 py-1 rounded">ESC</kbd> - Close All</div>
            <div><kbd className="bg-gray-700 px-2 py-1 rounded">D</kbd> - Toggle Demo</div>
          </div>
        </div>
      )}
      
      {/* Status indicator */}
      <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded text-sm">
        ● LIVE
      </div>
    </div>
  );
}

// Main app with providers
function App() {
  return (
    <EventBusProvider>
      <ChatProviderManager>
        <AppContent />
      </ChatProviderManager>
    </EventBusProvider>
  );
}

export default App;