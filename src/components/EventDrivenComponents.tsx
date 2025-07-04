import React, { useState } from 'react';
import { EventBusProvider, useEventBus } from './EventBusProvider';
import { ChatProviderManager } from './ChatProvider';
import { ChatOverlayEventDriven } from './ChatOverlayEventDriven';
import { BetSlipModalEventDriven } from './BetSlipModalEventDriven';
import { ProgramDetailsPopupEventDriven } from './ProgramDetailsPopupEventDriven';
import { MessageSquare, Trophy, Info, Tv, Radio } from 'lucide-react';

// Export all event-driven components
export { EventBusProvider, useEventBus } from './EventBusProvider';
export { ChatOverlayEventDriven } from './ChatOverlayEventDriven';
export { BetSlipModalEventDriven } from './BetSlipModalEventDriven';
export { ProgramDetailsPopupEventDriven } from './ProgramDetailsPopupEventDriven';
export { ChatProviderManager, useChatProvider } from './ChatProvider';
export type { ChatProvider, ChatMessage, ChatProviderCapabilities } from './ChatProvider';

// Unified demo component showing event-driven architecture
export const EventDrivenDemo: React.FC = () => {
  return (
    <EventBusProvider>
      <ChatProviderManager>
        <div className="min-h-screen bg-gray-950 text-white p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">SteadyStream TV - Event-Driven Components</h1>
              <p className="text-gray-400">
                All components now use EventBus instead of prop drilling. No more manual state management!
              </p>
            </div>

            {/* Event Publishers */}
            <EventPublishers />
            
            {/* Component Status */}
            <ComponentStatus />

            {/* Event-driven components (they manage their own state) */}
            <ChatOverlayEventDriven />
            <BetSlipModalEventDriven />
            <ProgramDetailsPopupEventDriven />
          </div>
        </div>
      </ChatProviderManager>
    </EventBusProvider>
  );
};

// Event publisher controls
const EventPublishers: React.FC = () => {
  const eventBus = useEventBus();
  const [currentChannel, setCurrentChannel] = useState('101');

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold mb-4">Event Publishers</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Channel Controls */}
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="font-semibold mb-3 flex items-center">
            <Tv className="mr-2 text-blue-500" size={20} />
            Channel Controls
          </h3>
          <div className="space-y-2">
            <input
              type="text"
              value={currentChannel}
              onChange={(e) => setCurrentChannel(e.target.value)}
              className="w-full px-3 py-1 bg-gray-800 rounded text-sm"
              placeholder="Channel ID"
            />
            <button
              onClick={() => eventBus.publish('channelChanged', {
                channelId: currentChannel,
                channelName: `Channel ${currentChannel}`,
                channelNumber: currentChannel,
              })}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm"
            >
              Change Channel
            </button>
          </div>
        </div>

        {/* Chat Controls */}
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="font-semibold mb-3 flex items-center">
            <MessageSquare className="mr-2 text-green-500" size={20} />
            Chat Controls
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => eventBus.publish('showChat', {
                channelId: currentChannel,
                provider: 'internal',
              })}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded text-sm"
            >
              Open Internal Chat
            </button>
            <button
              onClick={() => eventBus.publish('showChat', {
                channelId: currentChannel,
                provider: 'discord',
              })}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded text-sm"
            >
              Open Discord Chat
            </button>
            <button
              onClick={() => eventBus.publish('showChat', {
                channelId: currentChannel,
                provider: 'draftkings',
              })}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded text-sm"
            >
              Open DraftKings Chat
            </button>
          </div>
        </div>

        {/* Betting Controls */}
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="font-semibold mb-3 flex items-center">
            <Trophy className="mr-2 text-yellow-500" size={20} />
            Betting Controls
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => eventBus.publish('betSlipRequested', {
                channelId: currentChannel,
                programId: `prog-${Date.now()}`,
                odds: 'draftkings',
              })}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded text-sm"
            >
              Request DraftKings Odds
            </button>
            <button
              onClick={() => eventBus.publish('showBetSlip', { open: true })}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded text-sm"
            >
              Open Bet Slip
            </button>
          </div>
        </div>

        {/* Program Controls */}
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="font-semibold mb-3 flex items-center">
            <Info className="mr-2 text-purple-500" size={20} />
            Program Controls
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => eventBus.publish('programSelected', {
                programId: `prog-${Date.now()}`,
                channelId: currentChannel,
              })}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded text-sm"
            >
              Select Program (EPG Click)
            </button>
            <button
              onClick={() => eventBus.publish('showProgramDetails', {
                program: {
                  id: '1',
                  title: 'Live Sports Event',
                  description: 'An exciting live sports event.',
                  channelName: `Channel ${currentChannel}`,
                  channelNumber: currentChannel,
                  channelId: currentChannel,
                  startTime: '20:00',
                  endTime: '22:00',
                  duration: 120,
                  category: 'Sports',
                  isLive: true,
                  progress: 45,
                  rating: 4.7,
                },
              })}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded text-sm"
            >
              Show Program Details
            </button>
          </div>
        </div>

        {/* Social Controls */}
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="font-semibold mb-3 flex items-center">
            <Radio className="mr-2 text-pink-500" size={20} />
            Social Controls
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => eventBus.publish('openSocialShare', {
                platform: 'twitter',
                contentUrl: `https://steadystream.tv/channel/${currentChannel}`,
                text: 'Check out this awesome stream!',
              })}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded text-sm"
            >
              Share on Twitter
            </button>
            <button
              onClick={() => eventBus.publish('openSocialFeed', {
                platform: 'twitter',
                channelId: currentChannel,
              })}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded text-sm"
            >
              Open Social Feed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component status display
const ComponentStatus: React.FC = () => {
  const [events, setEvents] = useState<{ event: string; timestamp: Date; payload: any }[]>([]);
  const eventBus = useEventBus();

  // Subscribe to all events for monitoring
  React.useEffect(() => {
    const eventTypes = [
      'channelChanged',
      'betSlipRequested',
      'showChat',
      'showBetSlip',
      'openSocialFeed',
      'openSocialShare',
      'programSelected',
      'showProgramDetails',
    ] as const;

    const unsubscribes = eventTypes.map(eventType => 
      eventBus.subscribe(eventType as any, (payload: any) => {
        setEvents(prev => [{
          event: eventType,
          timestamp: new Date(),
          payload,
        }, ...prev.slice(0, 9)]); // Keep last 10 events
      })
    );

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [eventBus]);

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold mb-4">Event Bus Activity</h2>
      <div className="bg-gray-900 rounded-lg p-4 max-h-64 overflow-y-auto">
        {events.length === 0 ? (
          <p className="text-gray-500 text-center">No events published yet. Try the controls above!</p>
        ) : (
          <div className="space-y-2">
            {events.map((event, idx) => (
              <div key={idx} className="bg-gray-800 rounded p-2 text-sm">
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-blue-400">{event.event}</span>
                  <span className="text-xs text-gray-500">
                    {event.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <pre className="text-xs text-gray-400 mt-1 overflow-x-auto">
                  {JSON.stringify(event.payload, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};