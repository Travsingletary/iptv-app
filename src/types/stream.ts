/**
 * Core types for SteadyStream application
 */

export interface Channel {
  id: string
  number: string
  name: string
  logo?: string
  streamUrl?: string
  isActive: boolean
}

export interface Program {
  id: string
  channelId: string
  title: string
  description: string
  startTime: Date
  endTime: Date
  category: string
  rating?: string
  isLive: boolean
}

export interface StreamState {
  currentChannel: Channel | null
  currentProgram: Program | null
  channels: Channel[]
  programs: Program[]
  isLoading: boolean
  error: string | null
}

export interface StreamActions {
  setCurrentChannel: (channel: Channel) => void
  setCurrentProgram: (program: Program | null) => void
  loadChannels: () => Promise<void>
  loadPrograms: (channelId: string) => Promise<void>
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
}