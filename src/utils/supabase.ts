import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar: string | null
          preferences: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar?: string | null
          preferences?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar?: string | null
          preferences?: any
          created_at?: string
          updated_at?: string
        }
      }
      channels: {
        Row: {
          id: string
          name: string
          logo: string | null
          url: string
          group: string | null
          country: string | null
          language: string | null
          category: string | null
          is_active: boolean
          quality: string | null
          codec: string | null
          bitrate: number | null
          resolution: string | null
          aspect_ratio: string | null
          tvg_id: string | null
          tvg_name: string | null
          tvg_logo: string | null
          tvg_shift: number | null
          is_favorite: boolean
          sort_order: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          logo?: string | null
          url: string
          group?: string | null
          country?: string | null
          language?: string | null
          category?: string | null
          is_active?: boolean
          quality?: string | null
          codec?: string | null
          bitrate?: number | null
          resolution?: string | null
          aspect_ratio?: string | null
          tvg_id?: string | null
          tvg_name?: string | null
          tvg_logo?: string | null
          tvg_shift?: number | null
          is_favorite?: boolean
          sort_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo?: string | null
          url?: string
          group?: string | null
          country?: string | null
          language?: string | null
          category?: string | null
          is_active?: boolean
          quality?: string | null
          codec?: string | null
          bitrate?: number | null
          resolution?: string | null
          aspect_ratio?: string | null
          tvg_id?: string | null
          tvg_name?: string | null
          tvg_logo?: string | null
          tvg_shift?: number | null
          is_favorite?: boolean
          sort_order?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      epg_programs: {
        Row: {
          id: string
          channel_id: string
          title: string
          description: string | null
          category: string | null
          start_time: string
          end_time: string
          duration: number
          rating: string | null
          genre: string[] | null
          actors: string[] | null
          directors: string[] | null
          year: number | null
          country: string | null
          language: string | null
          subtitles: string[] | null
          is_live: boolean
          is_recordable: boolean
          is_recording: boolean
          has_recording: boolean
          poster_url: string | null
          thumbnail_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          channel_id: string
          title: string
          description?: string | null
          category?: string | null
          start_time: string
          end_time: string
          duration: number
          rating?: string | null
          genre?: string[] | null
          actors?: string[] | null
          directors?: string[] | null
          year?: number | null
          country?: string | null
          language?: string | null
          subtitles?: string[] | null
          is_live?: boolean
          is_recordable?: boolean
          is_recording?: boolean
          has_recording?: boolean
          poster_url?: string | null
          thumbnail_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          channel_id?: string
          title?: string
          description?: string | null
          category?: string | null
          start_time?: string
          end_time?: string
          duration?: number
          rating?: string | null
          genre?: string[] | null
          actors?: string[] | null
          directors?: string[] | null
          year?: number | null
          country?: string | null
          language?: string | null
          subtitles?: string[] | null
          is_live?: boolean
          is_recordable?: boolean
          is_recording?: boolean
          has_recording?: boolean
          poster_url?: string | null
          thumbnail_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      recordings: {
        Row: {
          id: string
          channel_id: string
          program_id: string | null
          title: string
          description: string | null
          start_time: string
          end_time: string
          duration: number
          status: string
          file_path: string | null
          file_size: number | null
          quality: string | null
          format: string | null
          is_watched: boolean
          progress: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          channel_id: string
          program_id?: string | null
          title: string
          description?: string | null
          start_time: string
          end_time: string
          duration: number
          status: string
          file_path?: string | null
          file_size?: number | null
          quality?: string | null
          format?: string | null
          is_watched?: boolean
          progress?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          channel_id?: string
          program_id?: string | null
          title?: string
          description?: string | null
          start_time?: string
          end_time?: string
          duration?: number
          status?: string
          file_path?: string | null
          file_size?: number | null
          quality?: string | null
          format?: string | null
          is_watched?: boolean
          progress?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      playlists: {
        Row: {
          id: string
          name: string
          url: string
          type: string
          is_active: boolean
          last_updated: string
          auto_update: boolean
          update_interval: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          url: string
          type: string
          is_active?: boolean
          last_updated?: string
          auto_update?: boolean
          update_interval?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          url?: string
          type?: string
          is_active?: boolean
          last_updated?: string
          auto_update?: boolean
          update_interval?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}