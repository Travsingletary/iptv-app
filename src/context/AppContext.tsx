import React, { createContext, useContext } from 'react'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { AppStore } from '../types'

// Zustand store
export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // User state
      user: null,
      isAuthenticated: false,
      isLoading: false,

      // UI state
      theme: 'dark',
      sidebarOpen: false,
      currentPage: 'home',
      toasts: [],
      modals: [],

      // Data state
      channels: [],
      currentChannel: null,
      epgData: {},
      recordings: [],
      playlists: [],

      // Player state
      playerState: {
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        volume: 50,
        isMuted: false,
        isFullscreen: false,
        isPictureInPicture: false,
        quality: 'auto',
        playbackRate: 1,
        buffered: null,
        error: null,
      },

      // Settings
      settings: {
        general: {
          theme: 'dark',
          language: 'en',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          autostart: false,
        },
        video: {
          autoplay: true,
          volume: 50,
          quality: 'auto',
          playbackRate: 1,
          subtitles: false,
          subtitleLanguage: 'en',
        },
        epg: {
          daysToShow: 7,
          autoRefresh: true,
          refreshInterval: 30,
          showPastPrograms: false,
        },
        recording: {
          defaultQuality: 'high',
          storageLocation: '/recordings',
          maxRecordings: 100,
          autoDelete: false,
          deleteAfterDays: 30,
        },
        parental: {
          enabled: false,
          pin: '',
          restrictedCategories: [],
          restrictedChannels: [],
          restrictedTimes: {
            start: '22:00',
            end: '06:00',
          },
        },
      },

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setTheme: (theme) => set({ theme }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      addToast: (toast) => {
        const id = Date.now().toString()
        set((state) => ({
          toasts: [...state.toasts, { ...toast, id }],
        }))
        
        // Auto-remove toast after duration
        setTimeout(() => {
          set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
          }))
        }, toast.duration || 5000)
      },
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),
      addModal: (modal) => {
        const id = Date.now().toString()
        set((state) => ({
          modals: [...state.modals, { ...modal, id }],
        }))
      },
      removeModal: (id) =>
        set((state) => ({
          modals: state.modals.filter((m) => m.id !== id),
        })),
      setChannels: (channels) => set({ channels }),
      setCurrentChannel: (currentChannel) => set({ currentChannel }),
      updatePlayerState: (playerState) =>
        set((state) => ({
          playerState: { ...state.playerState, ...playerState },
        })),
      updateSettings: (settings) =>
        set((state) => ({
          settings: { ...state.settings, ...settings },
        })),
    }),
    {
      name: 'steady-stream-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        settings: state.settings,
        favoriteChannels: state.user?.preferences?.favoriteChannels || [],
      }),
    }
  )
)

// Context for providing additional app-level functionality
interface AppContextType {
  // Add any additional context values here
  version: string
  buildDate: string
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}

interface AppProviderProps {
  children: React.ReactNode
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const value: AppContextType = {
    version: '1.0.0',
    buildDate: new Date().toISOString(),
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}