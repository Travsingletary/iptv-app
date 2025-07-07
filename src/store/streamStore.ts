import { create } from 'zustand'
import { StreamState, StreamActions, Channel, Program } from '../types/stream'
import { mockChannels, mockPrograms } from '../utils/mockData'

type StreamStore = StreamState & StreamActions

export const useStreamStore = create<StreamStore>((set, get) => ({
  // State
  currentChannel: null,
  currentProgram: null,
  channels: [],
  programs: [],
  isLoading: false,
  error: null,

  // Actions
  setCurrentChannel: (channel: Channel) => {
    set({ currentChannel: channel })
    // Auto-load current program for the channel
    const currentProgram = get().programs.find(
      (program) => 
        program.channelId === channel.id && 
        program.isLive
    )
    set({ currentProgram: currentProgram || null })
  },

  setCurrentProgram: (program: Program | null) => {
    set({ currentProgram: program })
  },

  loadChannels: async () => {
    set({ isLoading: true, error: null })
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      const channels = mockChannels
      set({ 
        channels, 
        currentChannel: channels[0] || null,
        isLoading: false 
      })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load channels',
        isLoading: false 
      })
    }
  },

  loadPrograms: async (channelId: string) => {
    set({ isLoading: true, error: null })
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300))
      const programs = mockPrograms.filter(p => p.channelId === channelId)
      const currentProgram = programs.find(p => p.isLive) || null
      set({ 
        programs, 
        currentProgram,
        isLoading: false 
      })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load programs',
        isLoading: false 
      })
    }
  },

  setError: (error: string | null) => set({ error }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
}))