# Tivimate Navigation Patterns & Keyboard Shortcuts

## Overview
This document details the specific navigation patterns, keyboard shortcuts, and interaction flows that make Tivimate's interface intuitive and efficient for TV viewing.

## Primary Navigation Modes

### 1. Remote Control Navigation
Tivimate is optimized for TV remote controls with directional pad (D-pad) navigation:

```typescript
interface RemoteControlMap {
  // Primary Navigation
  UP: 'navigate_up' | 'volume_up' | 'channel_up'
  DOWN: 'navigate_down' | 'volume_down' | 'channel_down'
  LEFT: 'navigate_left' | 'seek_backward' | 'time_backward'
  RIGHT: 'navigate_right' | 'seek_forward' | 'time_forward'
  
  // Action Buttons
  OK: 'select' | 'play_pause' | 'toggle_osd'
  BACK: 'go_back' | 'exit_fullscreen' | 'close_menu'
  MENU: 'open_main_menu' | 'toggle_sidebar'
  
  // Quick Actions
  INFO: 'show_program_info' | 'toggle_details'
  GUIDE: 'open_epg' | 'return_to_guide'
  
  // Playback Control
  PLAY_PAUSE: 'toggle_playback'
  STOP: 'stop_playback'
  RECORD: 'quick_record'
  
  // Number Keys
  NUMBERS: 'direct_channel_input' | 'time_jump'
}
```

## Context-Specific Navigation Behaviors

### 1. EPG Grid Navigation

#### Default State (EPG Focus)
```typescript
interface EPGNavigationBehavior {
  UP: () => {
    // Move to previous channel in grid
    // If at top, scroll channel list up
    // Maintain time position
  }
  
  DOWN: () => {
    // Move to next channel in grid
    // If at bottom, scroll channel list down
    // Maintain time position
  }
  
  LEFT: () => {
    // Move to previous time slot (30min/1hr intervals)
    // If at current time boundary, switch to past programs (catch-up)
    // Scroll EPG grid horizontally
  }
  
  RIGHT: () => {
    // Move to next time slot
    // Auto-load future program data
    // Scroll EPG grid horizontally
  }
  
  OK: () => {
    // If current/live program: Start full-screen playback
    // If future program: Show program details + set reminder
    // If past program: Start catch-up playback (if available)
  }
  
  BACK: () => {
    // Return to last view or exit app
  }
  
  MENU: () => {
    // Open main navigation sidebar
  }
}
```

### 2. Full-Screen Player Navigation

#### Player with Hidden OSD
```typescript
interface PlayerNavigationHidden {
  UP: () => {
    // Quick channel up
    // Show channel change overlay (2-3 seconds)
    // Auto-hide overlay
  }
  
  DOWN: () => {
    // Quick channel down
    // Show channel change overlay
  }
  
  LEFT: () => {
    // Seek backward (10-30 seconds for VOD/catch-up)
    // For live TV: Previous channel
  }
  
  RIGHT: () => {
    // Seek forward (10-30 seconds for VOD/catch-up)
    // For live TV: Next channel
  }
  
  OK: () => {
    // Show/toggle OSD controls
    // Auto-hide after 5-10 seconds of inactivity
  }
  
  BACK: () => {
    // Return to EPG view
    // Keep mini-player active
  }
}
```

#### Player with Visible OSD
```typescript
interface PlayerNavigationOSD {
  UP: () => {
    // Navigate through OSD elements:
    // Progress bar → Audio tracks → Subtitles → Settings
  }
  
  DOWN: () => {
    // Navigate down through OSD elements
  }
  
  LEFT: () => {
    // In progress bar: Seek backward
    // In other controls: Navigate left through options
  }
  
  RIGHT: () => {
    // In progress bar: Seek forward  
    // In other controls: Navigate right through options
  }
  
  OK: () => {
    // Activate selected control
    // In progress bar: Jump to position
  }
  
  BACK: () => {
    // Hide OSD
    // If pressed again: Return to EPG
  }
}
```

### 3. VOD/Movies Grid Navigation

```typescript
interface VODNavigationBehavior {
  UP: () => {
    // Move up in movie/series grid
    // If at top row: Move to category tabs
  }
  
  DOWN: () => {
    // Move down in grid
    // Load more content if near bottom
  }
  
  LEFT: () => {
    // Move left in grid
    // Wrap to previous row if at leftmost
  }
  
  RIGHT: () => {
    // Move right in grid
    // Wrap to next row if at rightmost
  }
  
  OK: () => {
    // Open movie/series details page
    // Or start playback if quick-play enabled
  }
  
  BACK: () => {
    // Return to main menu or previous category
  }
}
```

## Advanced Navigation Features

### 1. Quick Channel Input
```typescript
interface QuickChannelInput {
  // Number key pressed
  onNumberKey: (digit: number) => {
    // Start 3-second timer
    // Display channel number overlay
    // Accept additional digits
    // Auto-switch after timeout or OK pressed
  }
  
  // Examples:
  // Press "1" → Shows "1_" → Auto-switch to channel 1 after 3 seconds
  // Press "1", "2", "3" → Shows "123" → Switch to channel 123
}
```

### 2. Time Jump Navigation
```typescript
interface TimeJumpNavigation {
  // In EPG view, number keys can jump to specific times
  onNumberKey: (digit: number) => {
    // If single digit (1-9): Jump to that hour (1PM, 2PM, etc.)
    // If double digit: Jump to specific time (12 = 12:00, 15 = 3:00 PM)
  }
}
```

### 3. Alphabetical Search
```typescript
interface AlphabeticalSearch {
  // Quick letter navigation in channel lists or VOD
  onLetterKey: (letter: string) => {
    // Jump to first channel/content starting with that letter
    // Show search overlay with current letter
  }
}
```

## Navigation State Management

### 1. Focus State Tracking
```typescript
interface FocusState {
  currentFocus: FocusableElement
  previousFocus: FocusableElement[]
  navigationHistory: NavigationAction[]
  
  // Focus restoration on BACK
  restorePreviousFocus: () => void
  
  // Focus prediction for smooth UX
  predictNextFocus: (direction: Direction) => FocusableElement
}

enum FocusableElement {
  EPG_GRID = 'epg_grid',
  CHANNEL_LIST = 'channel_list',
  MINI_PLAYER = 'mini_player',
  MAIN_MENU = 'main_menu',
  VOD_GRID = 'vod_grid',
  PLAYER_OSD = 'player_osd',
  SEARCH_INPUT = 'search_input',
  SETTINGS_MENU = 'settings_menu'
}
```

### 2. Navigation Context
```typescript
interface NavigationContext {
  currentScreen: Screen
  modalStack: Modal[]
  overlayStack: Overlay[]
  
  // Context-aware navigation
  handleNavigation: (action: NavigationAction) => void
  
  // Smart back navigation
  goBack: () => void // Considers modals, overlays, and screen history
}
```

## Specific Interaction Patterns

### 1. Program Selection in EPG
```
Navigation Flow:
1. Highlight program in EPG grid
2. Show mini info tooltip (title, time)
3. OK pressed:
   - If LIVE program → Start playback immediately
   - If FUTURE program → Show details with reminder option
   - If PAST program → Show catch-up option (if available)
4. Long press/Menu:
   - Show context menu (Record, Remind, Details, Search)
```

### 2. Channel Change with Overlay
```
Quick Channel Change Flow:
1. UP/DOWN in full-screen player
2. Show channel overlay:
   ┌─────────────────────────────┐
   │ ← BBC One HD             → │
   │ News at Ten                │
   │ 22:00 - 23:00             │
   └─────────────────────────────┘
3. Auto-hide after 2-3 seconds
4. Allow continued navigation while visible
```

### 3. OSD Control Navigation
```
OSD Focus Order:
1. Progress Bar (seek control)
2. Play/Pause button
3. Previous/Next buttons  
4. Volume control
5. Audio track selector
6. Subtitle selector
7. Settings button
8. Picture-in-Picture toggle
9. Full-screen exit

Navigation wraps around (circular focus)
```

## Accessibility Considerations

### 1. Voice Navigation
```typescript
interface VoiceCommands {
  "channel [number]": switchToChannel
  "go to [channel name]": switchToChannelByName
  "what's on [channel]": showChannelSchedule
  "record this": recordCurrentProgram
  "volume [up/down]": adjustVolume
  "pause/play": togglePlayback
}
```

### 2. Large Font/High Contrast Mode
- Scale all UI elements by 1.5x
- Increase focus indicators
- High contrast color schemes
- Larger touch targets for hybrid devices

### 3. Screen Reader Support
- Announce current program info
- Describe EPG navigation position
- Read channel change information
- Provide audio feedback for all actions

## Performance Considerations

### 1. Navigation Responsiveness
```typescript
interface NavigationPerformance {
  maxResponseTime: 16; // 60fps target
  
  // Optimizations:
  - Virtual scrolling for EPG grid
  - Predictive loading of adjacent content
  - Hardware-accelerated animations
  - Debounced rapid navigation
}
```

### 2. Memory Management
- Cache only visible + adjacent EPG data
- Lazy load channel logos
- Preload critical navigation elements
- Clean up unused components

This navigation system ensures that users can efficiently browse content, control playback, and access all features using standard TV remote controls, creating the authentic Tivimate experience.