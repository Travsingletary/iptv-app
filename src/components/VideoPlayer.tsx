import React from 'react'
import { Channel } from '../types/stream'
import { Play, Pause, Volume2 } from 'lucide-react'

interface VideoPlayerProps {
  channel: Channel | null
  className?: string
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  channel, 
  className = '' 
}) => {
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [isMuted, setIsMuted] = React.useState(false)

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleMute = () => {
    setIsMuted(!isMuted)
  }

  // Show placeholder when no channel or inactive channel
  if (!channel || !channel.isActive) {
    return (
      <div 
        className={`bg-gray-800 flex items-center justify-center ${className}`}
        data-testid="video-player-placeholder"
      >
        <div className="text-center">
          <div className="text-6xl mb-4">📺</div>
          <p className="text-gray-400">
            {!channel ? 'Select a channel to start watching' : 'Channel unavailable'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`bg-black relative group ${className}`}
      data-testid="video-player"
    >
      {/* Video placeholder - in real app this would be video element */}
      <div className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-4xl mb-2">{channel.logo}</div>
          <h2 className="text-xl font-bold">{channel.name}</h2>
          <p className="text-sm opacity-75">Channel {channel.number}</p>
          {isPlaying ? (
            <div className="mt-4 text-green-400">● LIVE</div>
          ) : (
            <div className="mt-4 text-gray-400">⏸ PAUSED</div>
          )}
        </div>
      </div>

      {/* Video Controls Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200">
        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex items-center gap-4 bg-black bg-opacity-75 rounded-lg p-3">
            <button
              onClick={handlePlayPause}
              className="text-white hover:text-blue-400 transition-colors"
              data-testid="play-pause-button"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            
            <button
              onClick={handleMute}
              className="text-white hover:text-blue-400 transition-colors"
              data-testid="mute-button"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              <Volume2 size={20} />
            </button>

            <div className="flex-1 text-sm text-white">
              Now playing: {channel.name}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}