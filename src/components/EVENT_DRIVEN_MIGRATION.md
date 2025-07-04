# Event-Driven Migration Guide

## Overview
Agent 2 has successfully refactored all overlay components to use the EventBus system instead of prop drilling. This aligns with Agent 3's event-driven architecture.

## What Changed

### 1. ChatOverlay → ChatOverlayEventDriven
**Before (Prop-based):**
```tsx
<ChatOverlay 
  isOpen={isChatOpen}
  onClose={() => setIsChatOpen(false)}
  messages={messages}
/>
```

**After (Event-driven):**
```tsx
// Just render the component - it manages its own state
<ChatOverlayEventDriven />

// Open via event
eventBus.publish('showChat', { 
  channelId: '123', 
  provider: 'internal' // or 'discord' or 'draftkings'
});
```

### 2. BetSlipModal → BetSlipModalEventDriven
**Before (Prop-based):**
```tsx
<BetSlipModal
  isOpen={isBetSlipOpen}
  onClose={() => setIsBetSlipOpen(false)}
  events={bettingEvents}
/>
```

**After (Event-driven):**
```tsx
// Just render the component
<BetSlipModalEventDriven />

// Request odds via event
eventBus.publish('betSlipRequested', {
  channelId: '123',
  programId: 'prog-1',
  odds: 'draftkings', // Fetches DraftKings odds
});

// Or simply open
eventBus.publish('showBetSlip', { open: true });
```

### 3. ProgramDetailsPopup → ProgramDetailsPopupEventDriven
**Before (Prop-based):**
```tsx
<ProgramDetailsPopup
  isOpen={!!selectedProgram}
  onClose={() => setSelectedProgram(null)}
  program={selectedProgram}
  onPlay={handlePlay}
/>
```

**After (Event-driven):**
```tsx
// Just render the component
<ProgramDetailsPopupEventDriven />

// Show via event (from EPG click)
eventBus.publish('programSelected', {
  programId: 'prog-123',
  channelId: '456',
});

// Or with full program data
eventBus.publish('showProgramDetails', {
  program: programObject
});
```

## New Features

### 1. Modular Chat Providers
```tsx
import { ChatProviderManager, useChatProvider } from './components/ChatProvider';

// Three providers available:
// - 'internal': Built-in channel chat
// - 'discord': Discord integration (stub)
// - 'draftkings': DraftKings betting chat (stub)

// Switch providers via event:
eventBus.publish('showChat', { 
  channelId: '123', 
  provider: 'discord'
});
```

### 2. DraftKings Integration
```tsx
// BetSlipModal now accepts a DraftKings hook
<BetSlipModalEventDriven draftKingsHook={myDraftKingsHook} />

// The hook interface:
interface DraftKingsHook {
  fetchOdds(eventId: string): Promise<BetOption[]>;
  placeBet(bet: SelectedBet): Promise<{ success: boolean; betId?: string }>;
  getUserBalance(): Promise<number>;
  getBettingLimits(): Promise<{ min: number; max: number }>;
}
```

### 3. Cross-Component Communication
```tsx
// From ProgramDetailsPopup, you can:
// - Open betting: Triggers betSlipRequested
// - Share: Triggers openSocialShare
// - Play: Triggers channelChanged

// Components react to channel changes automatically
```

## Integration Steps

### Step 1: Wrap your app with providers
```tsx
import { EventBusProvider } from './components/EventBusProvider';
import { ChatProviderManager } from './components/ChatProvider';

function App() {
  return (
    <EventBusProvider>
      <ChatProviderManager>
        {/* Your app */}
      </ChatProviderManager>
    </EventBusProvider>
  );
}
```

### Step 2: Replace components
```tsx
// Remove these imports:
import { ChatOverlay, BetSlipModal, ProgramDetailsPopup } from './components';

// Add these imports:
import { 
  ChatOverlayEventDriven,
  BetSlipModalEventDriven,
  ProgramDetailsPopupEventDriven 
} from './components/EventDrivenComponents';
```

### Step 3: Remove state management
```tsx
// Remove all of this:
const [isChatOpen, setIsChatOpen] = useState(false);
const [isBetSlipOpen, setIsBetSlipOpen] = useState(false);
const [selectedProgram, setSelectedProgram] = useState(null);

// Components manage their own state now!
```

### Step 4: Update triggers
```tsx
// Replace direct state setters with events:

// Old way:
<button onClick={() => setIsChatOpen(true)}>Open Chat</button>

// New way:
<button onClick={() => eventBus.publish('showChat', { channelId: '123' })}>
  Open Chat
</button>
```

## Event Reference

### Core Events
- `channelChanged`: { channelId, channelName?, channelNumber? }
- `showChat`: { channelId, roomId?, provider? }
- `showBetSlip`: { open: boolean }
- `betSlipRequested`: { channelId, programId?, odds?, eventData? }
- `programSelected`: { programId, channelId }
- `showProgramDetails`: { program: Program }
- `openSocialShare`: { platform, contentUrl, text? }
- `openSocialFeed`: { platform, channelId? }

## Benefits

1. **No Prop Drilling**: Components subscribe to events directly
2. **Decoupled**: Components don't need to know about each other
3. **Extensible**: Easy to add new events and subscribers
4. **Plugin-Ready**: Chat providers can be added without touching core code
5. **Future-Proof**: Ready for DraftKings, Discord, and social integrations

## Testing

Use the EventDrivenDemo component to test all functionality:

```tsx
import { EventDrivenDemo } from './components/EventDrivenComponents';

// Render the demo
<EventDrivenDemo />
```

This provides:
- Event publisher controls
- Real-time event monitoring
- All components working together

## Compatibility

The event-driven components can coexist with the original prop-based components. You can migrate gradually:

1. Keep both versions during migration
2. Update one component at a time
3. Remove old versions when ready

## Next Steps for Other Agents

### Agent 1:
- Replace prop-based components with event-driven versions
- Use EventBus for EPG cell clicks
- Remove component state management

### Agent 3:
- Your EventBus implementation can replace our placeholder
- Hook up real useEPGData to event publishers
- Implement real DraftKings hook

## Questions?

The event-driven architecture is designed to be self-documenting. Each component:
- Declares which events it listens to
- Shows what events it publishes
- Works independently of others

Happy coding! 🚀