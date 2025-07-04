# Tivimate-Style UI/UX Workflow Design

## Overview
This document outlines the complete workflow design for implementing Tivimate's UI/UX principles in our streaming application. It covers navigation patterns, component architecture, and user interaction flows.

## Core UI/UX Principles Implementation

### 1. EPG-Centric Design
- **Primary Interface**: EPG grid is the main entry point and central hub
- **Always Visible**: Channel list remains accessible from all screens
- **Time Navigation**: Horizontal scrolling through time periods
- **Channel Navigation**: Vertical scrolling through channels

### 2. Hierarchical Navigation Structure
```
Home (EPG View)
├── Live TV (Current EPG)
├── Movies (VOD Grid)
├── TV Series (Categories → Series Grid → Episodes)
├── Catch-up (Historical EPG)
├── Recordings (User Content)
├── Favorites (Bookmarked Content)
├── Search (Global Search)
└── Settings (Configuration)
```

## Detailed Component Architecture

### Core Components Needed

#### 1. EPGGrid Component
```typescript
interface EPGGridProps {
  channels: Channel[]
  programs: Program[]
  currentTime: Date
  selectedTime: Date
  onProgramSelect: (program: Program) => void
  onChannelSelect: (channel: Channel) => void
  showMiniPlayer: boolean
}
```

**Features:**
- Virtual scrolling for performance
- Time indicator line
- Program highlight states
- Catch-up availability indicators
- Recording status indicators

#### 2. ChannelList Component
```typescript
interface ChannelListProps {
  channels: Channel[]
  selectedChannel: Channel
  onChannelSelect: (channel: Channel) => void
  showLogos: boolean
}
```

**Features:**
- Channel logos display
- Favorite channel indicators
- Hidden channel filtering
- Custom channel ordering

#### 3. VideoPlayer Component
```typescript
interface VideoPlayerProps {
  source: string
  isFullscreen: boolean
  showControls: boolean
  onControlsToggle: () => void
  currentProgram?: Program
}
```

**Features:**
- Picture-in-Picture mode
- Full-screen playback
- OSD (On-Screen Display) controls
- Quick channel switcher overlay

#### 4. ProgramInfo Component
```typescript
interface ProgramInfoProps {
  program: Program
  channel: Channel
  showProgress: boolean
  actions: ProgramAction[]
}
```

**Features:**
- Program details overlay
- Progress bar for live/catch-up
- Action buttons (Record, Remind, Favorite)
- Cast and crew information

## Navigation Workflow Implementation

### 1. Application Launch Flow

```typescript
// Initial State Management
interface AppState {
  currentView: 'epg' | 'player' | 'vod' | 'settings'
  selectedChannel: Channel
  selectedProgram: Program
  lastWatchedChannel: Channel
  miniPlayerVisible: boolean
}

// Launch Sequence
1. Load user preferences
2. Initialize with last watched channel
3. Display EPG grid centered on current time
4. Start mini player with default/last channel
5. Highlight current program
```

### 2. EPG Navigation Workflow

#### Key Bindings:
- **Arrow Keys**: Navigate grid (Up/Down: channels, Left/Right: time)
- **OK/Enter**: Select program/channel
- **Back**: Return to previous view
- **Menu**: Open main menu sidebar
- **Info**: Show program details
- **Record**: Quick record current program

#### Navigation States:
```typescript
enum NavigationState {
  CHANNEL_LIST_FOCUS = 'channel_list',
  EPG_GRID_FOCUS = 'epg_grid',
  MINI_PLAYER_FOCUS = 'mini_player',
  PROGRAM_INFO_FOCUS = 'program_info'
}
```

### 3. Full-Screen Player Workflow

#### Entry Points:
- Select current program from EPG
- Select channel from channel list
- Play VOD content
- Resume from recordings

#### Player States:
```typescript
interface PlayerState {
  isPlaying: boolean
  showOSD: boolean
  currentTime: number
  duration: number
  volume: number
  audioTracks: AudioTrack[]
  subtitles: Subtitle[]
  aspectRatio: AspectRatio
}
```

#### OSD Control Layout:
```
[Channel Logo] [Program Title]                    [Time]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ Progress Bar

[⏸/▶️] [⏮] [⏭] [🔊] [Volume ████░░░░] [⚙️] [📺] [CC] [🔍]
```

### 4. VOD/Movies Navigation Workflow

#### Grid Layout Structure:
```typescript
interface VODGridProps {
  categories: Category[]
  movies: Movie[]
  selectedCategory: Category
  sortOrder: SortOrder
  viewMode: 'grid' | 'list'
}
```

#### Category Navigation:
- Horizontal category tabs
- Vertical movie/series grid
- Filter and sort options
- Search integration

### 5. Contextual Menu System

#### EPG Context Menu:
```typescript
interface EPGContextMenu {
  program: Program
  actions: [
    'play_now',
    'record',
    'set_reminder',
    'program_details',
    'search_title',
    'add_to_favorites'
  ]
}
```

#### Channel Context Menu:
```typescript
interface ChannelContextMenu {
  channel: Channel
  actions: [
    'hide_channel',
    'move_channel',
    'add_to_favorites',
    'channel_settings',
    'view_schedule'
  ]
}
```

## Key User Interaction Flows

### 1. Quick Channel Change Flow
```
User Input: Up/Down arrows in full-screen player
→ Show quick channel overlay (2 seconds)
→ Display: Previous/Next channel info
→ Auto-switch after timeout or immediate on OK
```

### 2. Program Selection Flow
```
EPG Grid Navigation:
1. Highlight program
2. Show mini preview (if available)
3. Display quick info tooltip
4. OK/Enter → Full details or play
5. Context menu → Additional actions
```

### 3. Time Navigation Flow
```
EPG Time Scrolling:
1. Left/Right arrows move time window
2. Time indicator shows current position
3. Smooth scrolling animation
4. Auto-load program data for new time ranges
```

### 4. Search Workflow
```
Global Search Flow:
1. Open search interface
2. Real-time results as typing
3. Categories: Programs, Movies, Series, Channels
4. Recent searches saved
5. Voice search integration (if available)
```

## UI Layout Specifications

### 1. EPG Grid Layout
```css
.epg-container {
  display: grid;
  grid-template-columns: 200px 1fr;
  grid-template-rows: 60px 1fr;
  height: 100vh;
}

.time-header {
  grid-column: 2;
  /* Time slots header */
}

.channel-list {
  grid-row: 2;
  /* Scrollable channel list */
}

.epg-grid {
  grid-column: 2;
  grid-row: 2;
  /* Main EPG grid */
}
```

### 2. Mini Player Layout
```css
.mini-player {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 320px;
  height: 180px;
  z-index: 100;
}
```

### 3. Responsive Design Considerations
- **TV Screens**: 1920x1080 primary target
- **Tablet**: Adapted layouts for touch
- **Mobile**: Simplified single-column views
- **4K Displays**: Scaled UI elements

## State Management Architecture

### 1. Global State Structure
```typescript
interface GlobalState {
  user: UserState
  channels: ChannelState
  epg: EPGState
  player: PlayerState
  ui: UIState
  settings: SettingsState
}
```

### 2. EPG Data Management
```typescript
interface EPGState {
  currentTimeWindow: TimeWindow
  programData: Map<string, Program[]>
  loadingStates: Map<string, boolean>
  cache: EPGCache
}
```

### 3. Navigation State
```typescript
interface NavigationState {
  currentRoute: Route
  navigationStack: Route[]
  focusState: FocusState
  activeModal: Modal | null
}
```

## Performance Optimization Strategies

### 1. Virtual Scrolling
- Implement virtual scrolling for EPG grid
- Only render visible time slots and channels
- Lazy load program data as needed

### 2. Caching Strategy
- Cache EPG data for current day + 2 days
- Progressive loading of additional days
- Cache channel logos and metadata

### 3. Smooth Animations
- 60fps target for all transitions
- Hardware acceleration for scrolling
- Preload critical UI elements

## Implementation Priority

### Phase 1: Core EPG
1. Basic EPG grid layout
2. Channel list component
3. Time navigation
4. Program selection

### Phase 2: Player Integration
1. Mini player in EPG view
2. Full-screen player
3. Basic OSD controls
4. Channel switching

### Phase 3: Advanced Features
1. Contextual menus
2. Search functionality
3. VOD integration
4. Settings system

### Phase 4: Polish
1. Smooth animations
2. Performance optimization
3. Accessibility features
4. Error handling

## Technical Implementation Notes

### Key Libraries/Frameworks
- **React/Vue**: Component architecture
- **TypeScript**: Type safety
- **CSS Grid/Flexbox**: Layout system
- **React Query/SWR**: Data fetching
- **Framer Motion**: Animations
- **React Virtual**: Virtual scrolling

### Performance Targets
- **Initial Load**: < 3 seconds
- **Channel Switch**: < 500ms
- **EPG Navigation**: 60fps
- **Memory Usage**: < 500MB

This workflow design provides a comprehensive foundation for implementing Tivimate's functionality while maintaining the flexibility to adapt to your specific requirements and technical stack.