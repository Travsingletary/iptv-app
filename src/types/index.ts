// User and Authentication Types
export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  preferences: UserPreferences
  createdAt: string
  updatedAt: string
}

export interface UserPreferences {
  theme: 'dark' | 'light'
  language: string
  timezone: string
  autoplay: boolean
  volume: number
  quality: 'auto' | 'high' | 'medium' | 'low'
  subtitles: boolean
  parentalControls: boolean
  favoriteChannels: string[]
  channelGroups: ChannelGroup[]
}

// Channel Types
export interface Channel {
  id: string
  name: string
  logo?: string
  url: string
  group?: string
  country?: string
  language?: string
  category?: string
  isActive: boolean
  quality?: string
  codec?: string
  bitrate?: number
  resolution?: string
  aspectRatio?: string
  tvgId?: string
  tvgName?: string
  tvgLogo?: string
  tvgShift?: number
  isFavorite?: boolean
  sortOrder?: number
  createdAt: string
  updatedAt: string
}

export interface ChannelGroup {
  id: string
  name: string
  channels: Channel[]
  isVisible: boolean
  sortOrder: number
}

// EPG Types
export interface EPGProgram {
  id: string
  channelId: string
  title: string
  description?: string
  category?: string
  startTime: string
  endTime: string
  duration: number
  rating?: string
  genre?: string[]
  actors?: string[]
  directors?: string[]
  year?: number
  country?: string
  language?: string
  subtitles?: string[]
  isLive?: boolean
  isRecordable?: boolean
  isRecording?: boolean
  hasRecording?: boolean
  posterUrl?: string
  thumbnailUrl?: string
  createdAt: string
  updatedAt: string
}

export interface EPGDay {
  date: string
  programs: EPGProgram[]
}

export interface EPGData {
  channelId: string
  days: EPGDay[]
}

// Playlist Types
export interface Playlist {
  id: string
  name: string
  url: string
  type: 'M3U' | 'M3U8' | 'XSPF'
  channels: Channel[]
  isActive: boolean
  lastUpdated: string
  autoUpdate: boolean
  updateInterval: number
  createdAt: string
  updatedAt: string
}

export interface PlaylistImportResult {
  success: boolean
  channelsImported: number
  channelsSkipped: number
  errors: string[]
  playlist: Playlist
}

// Recording Types
export interface Recording {
  id: string
  channelId: string
  programId?: string
  title: string
  description?: string
  startTime: string
  endTime: string
  duration: number
  status: 'scheduled' | 'recording' | 'completed' | 'failed' | 'cancelled'
  filePath?: string
  fileSize?: number
  quality?: string
  format?: string
  isWatched?: boolean
  progress?: number
  createdAt: string
  updatedAt: string
}

export interface RecordingSchedule {
  id: string
  channelId: string
  programId?: string
  title: string
  type: 'once' | 'daily' | 'weekly' | 'series'
  startTime: string
  endTime: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Video Player Types
export interface VideoPlayerState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  isFullscreen: boolean
  isPictureInPicture: boolean
  quality: string
  playbackRate: number
  buffered: TimeRanges | null
  error: string | null
}

export interface VideoPlayerConfig {
  autoplay: boolean
  controls: boolean
  fluid: boolean
  responsive: boolean
  playbackRates: number[]
  languages: string[]
  plugins: Record<string, any>
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// UI Types
export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export interface Modal {
  id: string
  title: string
  content: React.ReactNode
  size: 'sm' | 'md' | 'lg' | 'xl'
  closable: boolean
  onClose?: () => void
}

// Error Types
export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: string
  stack?: string
}

// Settings Types
export interface AppSettings {
  general: {
    theme: 'dark' | 'light'
    language: string
    timezone: string
    autostart: boolean
  }
  video: {
    autoplay: boolean
    volume: number
    quality: 'auto' | 'high' | 'medium' | 'low'
    playbackRate: number
    subtitles: boolean
    subtitleLanguage: string
  }
  epg: {
    daysToShow: number
    autoRefresh: boolean
    refreshInterval: number
    showPastPrograms: boolean
  }
  recording: {
    defaultQuality: string
    storageLocation: string
    maxRecordings: number
    autoDelete: boolean
    deleteAfterDays: number
  }
  parental: {
    enabled: boolean
    pin: string
    restrictedCategories: string[]
    restrictedChannels: string[]
    restrictedTimes: {
      start: string
      end: string
    }
  }
}

// Keyboard Shortcuts
export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  action: string
  description: string
}

// Search Types
export interface SearchResult {
  type: 'channel' | 'program' | 'recording'
  id: string
  title: string
  subtitle?: string
  description?: string
  thumbnail?: string
  relevance: number
}

export interface SearchFilters {
  type?: 'channel' | 'program' | 'recording'
  category?: string
  genre?: string
  rating?: string
  language?: string
  startDate?: string
  endDate?: string
}

// Utility Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export type SortOrder = 'asc' | 'desc'

export type ViewMode = 'grid' | 'list' | 'table'

export interface SortConfig {
  field: string
  order: SortOrder
}

export interface FilterConfig {
  field: string
  value: any
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan'
}

// Store Types
export interface AppStore {
  // User state
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // UI state
  theme: 'dark' | 'light'
  sidebarOpen: boolean
  currentPage: string
  toasts: Toast[]
  modals: Modal[]
  
  // Data state
  channels: Channel[]
  currentChannel: Channel | null
  epgData: Record<string, EPGData>
  recordings: Recording[]
  playlists: Playlist[]
  
  // Player state
  playerState: VideoPlayerState
  
  // Settings
  settings: AppSettings
  
  // Actions
  setUser: (user: User | null) => void
  setTheme: (theme: 'dark' | 'light') => void
  setSidebarOpen: (open: boolean) => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  addModal: (modal: Omit<Modal, 'id'>) => void
  removeModal: (id: string) => void
  setChannels: (channels: Channel[]) => void
  setCurrentChannel: (channel: Channel | null) => void
  updatePlayerState: (state: Partial<VideoPlayerState>) => void
  updateSettings: (settings: Partial<AppSettings>) => void
}

// Component Props Types
export interface ComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface ButtonProps extends ComponentProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

export interface InputProps extends ComponentProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  placeholder?: string
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onFocus?: () => void
  onBlur?: () => void
  disabled?: boolean
  required?: boolean
  error?: string
}

export interface SelectProps extends ComponentProps {
  options: Array<{ value: string; label: string }>
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: string
}

// Hook Types
export interface UseApiOptions {
  enabled?: boolean
  refetchInterval?: number
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

export interface UseLocalStorageOptions {
  serializer?: {
    read: (value: string) => any
    write: (value: any) => string
  }
}

export interface UseDebounceOptions {
  delay: number
  leading?: boolean
  trailing?: boolean
}

// Event Types
export interface KeyboardEvent {
  key: string
  code: string
  ctrlKey: boolean
  altKey: boolean
  shiftKey: boolean
  metaKey: boolean
  preventDefault: () => void
  stopPropagation: () => void
}

export interface MouseEvent {
  clientX: number
  clientY: number
  button: number
  buttons: number
  ctrlKey: boolean
  altKey: boolean
  shiftKey: boolean
  metaKey: boolean
  preventDefault: () => void
  stopPropagation: () => void
}

// Re-export React types for convenience
export type { FC, ReactNode, ComponentProps as ReactComponentProps } from 'react'