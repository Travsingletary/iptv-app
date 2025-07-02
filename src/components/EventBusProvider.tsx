import React, { createContext, useContext, useCallback, useRef, useEffect } from 'react';

// Event types for the application
export type EventType = 
  | 'channelChanged'
  | 'betSlipRequested'
  | 'showChat'
  | 'showBetSlip'
  | 'openSocialFeed'
  | 'openSocialShare'
  | 'programSelected'
  | 'showProgramDetails';

// Event payload types
export interface EventPayloads {
  channelChanged: { channelId: string; channelName?: string; channelNumber?: string };
  betSlipRequested: { channelId: string; programId?: string; odds?: any; eventData?: any };
  showChat: { channelId: string; roomId?: string; provider?: 'discord' | 'internal' | 'draftkings' };
  showBetSlip: { open: boolean };
  openSocialFeed: { platform: 'twitter' | 'instagram' | 'tiktok'; channelId?: string };
  openSocialShare: { platform: string; contentUrl: string; text?: string };
  programSelected: { programId: string; channelId: string };
  showProgramDetails: { program: any };
}

type EventCallback<T extends EventType> = (payload: EventPayloads[T]) => void;
type UnsubscribeFn = () => void;

interface EventBusContextType {
  publish: <T extends EventType>(event: T, payload: EventPayloads[T]) => void;
  subscribe: <T extends EventType>(event: T, callback: EventCallback<T>) => UnsubscribeFn;
}

const EventBusContext = createContext<EventBusContextType | null>(null);

// Hook to use the EventBus
export const useEventBus = () => {
  const context = useContext(EventBusContext);
  if (!context) {
    throw new Error('useEventBus must be used within EventBusProvider');
  }
  return context;
};

// EventBus Provider (placeholder for Agent 3's implementation)
export const EventBusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const listenersRef = useRef<Map<EventType, Set<EventCallback<any>>>>(new Map());

  const publish = useCallback(<T extends EventType>(event: T, payload: EventPayloads[T]) => {
    const listeners = listenersRef.current.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(payload));
    }
    console.log(`[EventBus] Published: ${event}`, payload);
  }, []);

  const subscribe = useCallback(<T extends EventType>(
    event: T,
    callback: EventCallback<T>
  ): UnsubscribeFn => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(callback);
    
    console.log(`[EventBus] Subscribed to: ${event}`);
    
    // Return unsubscribe function
    return () => {
      const listeners = listenersRef.current.get(event);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          listenersRef.current.delete(event);
        }
      }
      console.log(`[EventBus] Unsubscribed from: ${event}`);
    };
  }, []);

  const value: EventBusContextType = {
    publish,
    subscribe,
  };

  return (
    <EventBusContext.Provider value={value}>
      {children}
    </EventBusContext.Provider>
  );
};

// Helper hook for components to subscribe to events
export const useEventSubscription = <T extends EventType>(
  event: T,
  callback: EventCallback<T>
) => {
  const eventBus = useEventBus();
  
  useEffect(() => {
    const unsubscribe = eventBus.subscribe(event, callback);
    return unsubscribe;
  }, [event, callback, eventBus]);
};