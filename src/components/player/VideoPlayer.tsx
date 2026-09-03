import { useEffect, useRef } from 'react'
import Hls from 'hls.js'
import { useIptvStore } from '../../store/useIptvStore'
import { trackEvent } from '../../lib/eventLogger'

interface VideoPlayerProps {
  className?: string
  onReady?: () => void
}

export function VideoPlayer({ className = '', onReady }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const channelId = useIptvStore((s) => s.player.channelId)
  const paused = useIptvStore((s) => s.player.paused)
  const muted = useIptvStore((s) => s.player.muted)
  const volume = useIptvStore((s) => s.player.volume)
  const channels = useIptvStore((s) => s.channels)
  const setPlayer = useIptvStore((s) => s.setPlayer)

  const channel = channels.find((c) => c.id === channelId)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !channel?.url) return

    setPlayer({ buffering: true, error: null })
    let destroyed = false

    const onPlaying = () => {
      if (!destroyed) {
        setPlayer({ buffering: false, error: null })
        if (channel) {
          void trackEvent('play_start', { channelId: channel.id, name: channel.name })
        }
        onReady?.()
      }
    }
    const onWaiting = () => {
      if (!destroyed) setPlayer({ buffering: true })
    }
    const onError = () => {
      if (!destroyed) {
        setPlayer({
          buffering: false,
          error: 'Playback failed. This stream may be offline or blocked.',
        })
      }
    }
    const onEnded = () => {
      if (channel) {
        void trackEvent('play_end', { channelId: channel.id, name: channel.name })
      }
    }

    video.addEventListener('playing', onPlaying)
    video.addEventListener('waiting', onWaiting)
    video.addEventListener('error', onError)
    video.addEventListener('ended', onEnded)

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
      })
      hlsRef.current = hls
      hls.loadSource(channel.url)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        void video.play().catch(() => {
          setPlayer({ paused: true, buffering: false })
        })
      })
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          setPlayer({
            buffering: false,
            error: 'Stream error. Try another channel.',
          })
        }
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = channel.url
      void video.play().catch(() => setPlayer({ paused: true, buffering: false }))
    } else {
      setPlayer({ error: 'HLS is not supported in this browser.', buffering: false })
    }

    return () => {
      destroyed = true
      video.removeEventListener('playing', onPlaying)
      video.removeEventListener('waiting', onWaiting)
      video.removeEventListener('error', onError)
      video.removeEventListener('ended', onEnded)
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
      video.removeAttribute('src')
      video.load()
    }
  }, [channel?.url, channelId, onReady, setPlayer])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (paused) video.pause()
    else void video.play().catch(() => undefined)
  }, [paused])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = muted
    video.volume = volume
  }, [muted, volume])

  return (
    <video
      ref={videoRef}
      className={`h-full w-full bg-black object-contain ${className}`}
      playsInline
      autoPlay
      poster={channel?.backdrop || channel?.poster}
    />
  )
}
