# SteadyStream TV Components - Integration Guide

## Quick Start for Other Agents

### 1. Import Components

```tsx
// Option A: Import individual components
import { ChatOverlay, BetSlipModal, ProgramDetailsPopup } from './components';

// Option B: Import everything
import * as SteadyStreamComponents from './components';
```

### 2. Basic Implementation

```tsx
function App() {
  // Component states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isBetSlipOpen, setIsBetSlipOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  // Global keyboard handler
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          setIsBetSlipOpen(true);
          break;
        case 'escape':
          setIsChatOpen(false);
          setIsBetSlipOpen(false);
          setSelectedProgram(null);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <>
      {/* Your main app content */}
      <YourVideoPlayer />
      <YourEPGGrid 
        onProgramClick={(program) => setSelectedProgram(program)}
      />

      {/* Overlay Components */}
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
        onPlay={handlePlayProgram}
      />
    </>
  );
}
```

## Component APIs

### ChatOverlay
```tsx
interface ChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  messages?: ChatMessage[];  // Optional - uses mock data if not provided
}

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  userColor?: string;
}
```

### BetSlipModal
```tsx
interface BetSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  events?: BetEvent[];  // Optional - uses mock data if not provided
}

interface BetEvent {
  id: string;
  eventName: string;
  category: string;
  startTime: string;
  options: BetOption[];
}
```

### ProgramDetailsPopup
```tsx
interface ProgramDetailsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  program: Program | null;
  onPlay?: (program: Program) => void;
  onRecord?: (program: Program) => void;
  onFavorite?: (program: Program) => void;
}

interface Program {
  id: string;
  title: string;
  description: string;
  channelName: string;
  channelNumber: string;
  startTime: string;
  endTime: string;
  duration: number;
  category: string;
  rating?: number;
  isLive?: boolean;
  progress?: number;
  thumbnail?: string;
}
```

## Integration Examples

### With EPG Grid
```tsx
// In your EPG component
<EPGCell 
  onClick={() => {
    setSelectedProgram({
      id: cell.programId,
      title: cell.title,
      // ... map your data to Program interface
    });
  }}
/>
```

### With Video Player
```tsx
const handlePlayProgram = (program: Program) => {
  // Your video player logic
  videoPlayer.loadChannel(program.channelNumber);
  setSelectedProgram(null); // Close popup
};
```

### With State Management (Zustand example)
```tsx
// store.ts
interface UIStore {
  isChatOpen: boolean;
  isBetSlipOpen: boolean;
  selectedProgram: Program | null;
  toggleChat: () => void;
  openBetSlip: () => void;
  closeBetSlip: () => void;
  selectProgram: (program: Program | null) => void;
}

// App.tsx
const { isChatOpen, toggleChat, selectedProgram } = useUIStore();
```

## Data Integration

### Real-time Chat (WebSocket)
```tsx
// Replace mock messages with real data
const [messages, setMessages] = useState<ChatMessage[]>([]);

useEffect(() => {
  const ws = new WebSocket('wss://your-chat-server');
  
  ws.onmessage = (event) => {
    const newMessage = JSON.parse(event.data);
    setMessages(prev => [...prev.slice(-50), newMessage]);
  };
  
  return () => ws.close();
}, []);

<ChatOverlay 
  isOpen={isChatOpen}
  onClose={() => setIsChatOpen(false)}
  messages={messages}  // Pass real messages
/>
```

### Betting Data (API)
```tsx
const [bettingEvents, setBettingEvents] = useState<BetEvent[]>([]);

useEffect(() => {
  fetch('/api/betting/events')
    .then(res => res.json())
    .then(data => setBettingEvents(data));
}, []);

<BetSlipModal
  isOpen={isBetSlipOpen}
  onClose={() => setIsBetSlipOpen(false)}
  events={bettingEvents}  // Pass real events
/>
```

## Styling Customization

All components use Tailwind CSS classes. To customize:

1. **Colors**: Modify the Tailwind classes in component files
2. **Sizes**: Adjust width classes (e.g., `w-80` to `w-96` for wider chat)
3. **Animations**: Modify Framer Motion props

Example:
```tsx
// In ChatOverlay.tsx, change width:
className="fixed right-0 top-0 h-full w-80 ..." // Change w-80 to w-96
```

## Testing

Run the audit component to verify everything is working:
```tsx
import { ComponentAudit } from './components';

// Temporarily add to your app
<ComponentAudit />
```

## Common Issues & Solutions

### Issue: Components not showing
- Check z-index conflicts with your app
- Ensure `isOpen` prop is `true`
- Check if parent has `position: relative`

### Issue: Keyboard shortcuts not working
- Ensure no input is focused
- Check if another handler is preventing default

### Issue: TypeScript errors
- Ensure all dependencies are installed
- Check tsconfig includes component directory

## Next Steps

1. **Agent 1**: Integrate with main app structure
2. **Agent 3**: Connect to real data sources
3. **All**: Test integration thoroughly
4. **All**: Coordinate on shared state management