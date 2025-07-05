import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  PlayIcon, 
  PauseIcon, 
  SpeakerWaveIcon, 
  SpeakerXMarkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon
} from '@heroicons/react/24/outline'
import Hls from 'hls.js'

interface VideoPlayerProps {
  src: string
  poster?: string
  title?: string
  onTimeUpdate?: (currentTime: number) => void
  onEnded?: () => void
  autoplay?: boolean
  muted?: boolean
  className?: string
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  title,
  onTimeUpdate,
  onEnded,
  autoplay = false,
  muted = false,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(muted)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showControls, setShowControls] = useState(true)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    setIsLoading(true)
    setError(null)

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    // Check if HLS is supported
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferSize: 60 * 1000 * 1000,
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
        startLevel: -1,
        autoStartLoad: true,
        debug: false,
      })

      hlsRef.current = hls
      hls.loadSource(src)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false)
        if (autoplay) {
          video.play().catch(console.error)
        }
      })

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', data)
        if (data.fatal) {
          setError(`Playback error: ${data.details}`)
          setIsLoading(false)
        }
      })

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = src
      setIsLoading(false)
    } else {
      // Fallback for direct video URLs
      video.src = src
      setIsLoading(false)
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [src, autoplay])

  const togglePlay = async () => {
    if (!videoRef.current) return

    try {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        await videoRef.current.play()
      }
    } catch (error) {
      console.error('Play/pause error:', error)
    }
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    const newMuted = !isMuted
    videoRef.current.muted = newMuted
    setIsMuted(newMuted)
  }

  const toggleFullscreen = () => {
    if (!videoRef.current) return

    if (!isFullscreen) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  const handleVolumeChange = (newVolume: number) => {
    if (!videoRef.current) return
    videoRef.current.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const handleSeek = (time: number) => {
    if (!videoRef.current) return
    videoRef.current.currentTime = time
  }

  const showControlsTemporarily = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false)
    }, 3000)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      onTimeUpdate?.(video.currentTime)
    }
    const handleDurationChange = () => setDuration(video.duration)
    const handleEnded = () => {
      setIsPlaying(false)
      onEnded?.()
    }
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('durationchange', handleDurationChange)
    video.addEventListener('ended', handleEnded)
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('durationchange', handleDurationChange)
      video.removeEventListener('ended', handleEnded)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [onTimeUpdate, onEnded])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          handleSeek(Math.max(0, currentTime - 10))
          break
        case 'ArrowRight':
          e.preventDefault()
          handleSeek(Math.min(duration, currentTime + 10))
          break
        case 'ArrowUp':
          e.preventDefault()
          handleVolumeChange(Math.min(1, volume + 0.1))
          break
        case 'ArrowDown':
          e.preventDefault()
          handleVolumeChange(Math.max(0, volume - 0.1))
          break
        case 'm':
          e.preventDefault()
          toggleMute()
          break
        case 'f':
          e.preventDefault()
          toggleFullscreen()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [currentTime, duration, volume, togglePlay])

  if (error) {
    return (
      <div className={`relative bg-black flex items-center justify-center ${className}`}>
        <div className="text-center text-white">
          <div className="text-red-500 mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Playback Error</h3>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`relative bg-black group ${className}`}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={poster}
        muted={isMuted}
        playsInline
        onClick={togglePlay}
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      )}

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showControls ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4"
      >
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="relative h-1 bg-gray-600 rounded-full cursor-pointer">
            <div
              className="absolute h-full bg-primary-500 rounded-full"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={togglePlay}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              {isPlaying ? (
                <PauseIcon className="w-6 h-6 text-white" />
              ) : (
                <PlayIcon className="w-6 h-6 text-white" />
              )}
            </button>

            <button
              onClick={toggleMute}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              {isMuted ? (
                <SpeakerXMarkIcon className="w-6 h-6 text-white" />
              ) : (
                <SpeakerWaveIcon className="w-6 h-6 text-white" />
              )}
            </button>

            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-20 accent-primary-500"
              />
            </div>

            <div className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {title && (
              <span className="text-white text-sm font-medium">{title}</span>
            )}
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              {isFullscreen ? (
                <ArrowsPointingInIcon className="w-6 h-6 text-white" />
              ) : (
                <ArrowsPointingOutIcon className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default VideoPlayer