import React, { useState, useEffect } from 'react';
import { EventBusProvider } from './EventBusProvider';
import { ChannelInfoBar } from './ChannelInfoBar';
import { MiniEPGGuide } from './MiniEPGGuide';
import { createChannelChangedPayload } from './TiviMateAdapter';
import type { ChannelChangedEvent } from './types/epg';
import { Tv, Info, Keyboard, Layers } from 'lucide-react';

// Mock channel change event for demo
const createMockChannelEvent = (channelId: string): ChannelChangedEvent => {
  const now = new Date();
  const currentStart = new Date(now.getTime() - 30 * 60000); // Started 30 min ago
  const currentEnd = new Date(now.getTime() + 60 * 60000); // Ends in 60 min
  const nextStart = currentEnd;
  const nextEnd = new Date(nextStart.getTime() + 90 * 60000); // 90 min duration
  
  return {
    channel: {
      id: channelId,
      name: `Channel ${channelId} HD`,
    },
    programs: {
      current: {
        id: `prog-current-${channelId}`,
        title: 'UEFA Champions League: Real Madrid vs Manchester City',
        start: currentStart,
        end: currentEnd,
        description: 'Semi-final second leg of the UEFA Champions League.',
        category: 'Sports',
        rating: 'TV-14',
      },
      next: {
        id: `prog-next-${channelId}`,
        title: 'Sports News Tonight',
        start: nextStart,
        end: nextEnd,
        description: 'Latest sports news and highlights.',
        category: 'News',
      },
    },
  };
};

export const TiviMateDemo: React.FC = () => {
  return (
    <EventBusProvider>
      <TiviMateDemoContent />
    </EventBusProvider>
  );
};

const TiviMateDemoContent: React.FC = () => {
  const [currentChannel, setCurrentChannel] = useState('101');

  useEffect(() => {
    // Handle keyboard navigation
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          changeChannel(1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          changeChannel(-1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentChannel]);

  const changeChannel = (increment: number) => {
    const newChannelNum = parseInt(currentChannel) + increment;
    const newChannelId = newChannelNum.toString();
    setCurrentChannel(newChannelId);
    
    // Simulate Agent 3's channel change event
    const event = createMockChannelEvent(newChannelId);
    
    // Use the EventBus with proper payload
    window.dispatchEvent(new CustomEvent('eventbus-channelChanged', {
      detail: createChannelChangedPayload(event),
    }));
  };

  const triggerOKButton = () => {
    window.dispatchEvent(new CustomEvent('eventbus-okButtonPressed', {
      detail: { context: 'epg' },
    }));
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Mock video player area */}
      <div className="relative h-screen">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
          <div className="text-center">
            <Tv className="w-32 h-32 text-gray-700 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-2">TiviMate-Style IPTV</h1>
            <p className="text-gray-400">Channel {currentChannel}</p>
          </div>
        </div>

        {/* Control hints */}
        <div className="absolute top-4 right-4 bg-gray-900/80 backdrop-blur rounded-lg p-4 max-w-sm">
          <h3 className="font-semibold text-white mb-2 flex items-center">
            <Keyboard className="mr-2" size={20} />
            Keyboard Controls
          </h3>
          <div className="space-y-1 text-sm text-gray-300">
            <div>↑↓ - Change channels</div>
            <div>OK - Show mini EPG</div>
            <div>ESC - Close overlays</div>
            <div>← → - Volume (simulated)</div>
          </div>
        </div>

        {/* Demo controls */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex space-x-4">
          <button
            onClick={() => changeChannel(-1)}
            className="bg-gray-800/80 backdrop-blur hover:bg-gray-700/80 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            ← Previous
          </button>
          
          <button
            onClick={triggerOKButton}
            className="bg-blue-600/80 backdrop-blur hover:bg-blue-700/80 text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            OK (Mini EPG)
          </button>
          
          <button
            onClick={() => changeChannel(1)}
            className="bg-gray-800/80 backdrop-blur hover:bg-gray-700/80 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Next →
          </button>
        </div>
      </div>

      {/* TiviMate components */}
      <ChannelInfoBar />
      <MiniEPGGuide />
    </div>
  );
};

// Integration Guide Component
export const TiviMateIntegrationGuide: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">TiviMate Components Integration Guide</h1>
        
        <div className="space-y-8">
          {/* Overview */}
          <section className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Layers className="mr-2" size={24} />
              Components Overview
            </h2>
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="font-semibold text-white">1. ChannelInfoBar</h3>
                <p>Bottom overlay showing current/next program when changing channels. Auto-hides after 5 seconds.</p>
              </div>
              <div>
                <h3 className="font-semibold text-white">2. MiniEPGGuide</h3>
                <p>Shows 4 upcoming programs when OK is pressed. Navigate with arrows, select to see details.</p>
              </div>
              <div>
                <h3 className="font-semibold text-white">3. More coming...</h3>
                <p>QuickSettings, ChannelPreview, VolumeIndicator, ChannelNumberDisplay</p>
              </div>
            </div>
          </section>

          {/* Integration */}
          <section className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Integration with Agent 3's Data</h2>
            <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
{`// When Agent 3 publishes channel change:
const event: ChannelChangedEvent = {
  channel: { id: '101', name: 'Sports HD' },
  programs: {
    current: { /* current program */ },
    next: { /* next program */ }
  }
};

// Convert and publish to EventBus:
eventBus.publish('channelChanged', 
  createChannelChangedPayload(event)
);`}
            </pre>
          </section>

          {/* Required Events */}
          <section className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Required Events</h2>
            <div className="space-y-3 text-sm">
              <div className="bg-gray-800 p-3 rounded">
                <code className="text-blue-400">channelChanged</code>
                <p className="text-gray-400 mt-1">Triggered when switching channels. Shows info bar.</p>
              </div>
              <div className="bg-gray-800 p-3 rounded">
                <code className="text-blue-400">okButtonPressed</code>
                <p className="text-gray-400 mt-1">Shows mini EPG guide with upcoming programs.</p>
              </div>
              <div className="bg-gray-800 p-3 rounded">
                <code className="text-blue-400">showChannelInfo</code>
                <p className="text-gray-400 mt-1">Manually show/hide channel info bar.</p>
              </div>
            </div>
          </section>

          {/* Usage */}
          <section className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Usage in Main App</h2>
            <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
{`import { ChannelInfoBar, MiniEPGGuide } from './components';
import { EventBusProvider } from './components/EventBusProvider';

function App() {
  return (
    <EventBusProvider>
      {/* Your video player */}
      <VideoPlayer />
      
      {/* TiviMate overlays */}
      <ChannelInfoBar />
      <MiniEPGGuide />
    </EventBusProvider>
  );
}`}
            </pre>
          </section>
        </div>

        <div className="mt-8 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
          <p className="text-blue-300">
            <Info className="inline mr-2" size={16} />
            These components are designed to work seamlessly with Agent 3's EPG data and Agent 1's main app structure.
          </p>
        </div>
      </div>
    </div>
  );
};