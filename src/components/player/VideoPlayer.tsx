import { useEffect, useRef } from 'react'
import Hls from 'hls.js'
import mpegts from 'mpegts.js'
import { useIptvStore } from '../../store/useIptvStore'
import { trackEvent } from '../../lib/eventLogger'

interface VideoPlayerProps {
  className?: string
  onReady?: () => void
  /** Override channel for multi-view slots. */
  channelIdOverride?: string
  /** When true, do not write global player buffering/error state. */
  silent?: boolean
  mutedOverride?: boolean
}

function isMpegTsUrl(url: string): boolean {
  try {
    const path = new URL(url, 'http://local').pathname.toLowerCase()
    return path.endsWith('.ts') && !path.endsWith('.m3u8')
  } catch {
    return /\.ts($|\?)/i.test(url) && !/\.m3u8/i.test(url)
  }
}

export function VideoPlayer({
  className = '',
  onReady,
  channelIdOverride,
  silent = false,
  mutedOverride,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const mpegtsRef = useRef<mpegts.Player | null>(null)
  const playStartedRef = useRef(false)
  const storeChannelId = useIptvStore((s) => s.player.channelId)
  const channelId = channelIdOverride ?? storeChannelId
  const paused = useIptvStore((s) => s.player.paused)
  const muted = useIptvStore((s) => s.player.muted)
  const volume = useIptvStore((s) => s.player.volume)
  const catchup = useIptvStore((s) => s.player.catchup)
  const channels = useIptvStore((s) => s.channels)
  const setPlayer = useIptvStore((s) => s.setPlayer)
  const setStreamError = useIptvStore((s) => s.setStreamError)

  const channel = channels.find((c) => c.id === channelId)
  const streamUrl =
    !channelIdOverride && catchup?.active && catchup.url
      ? catchup.url
      : channel?.url

  useEffect(() => {
    const video = videoRef.current
    if (!video || !streamUrl || !channel) return

    if (!silent) {
      setPlayer({ buffering: true, error: null, fallbackSuggestions: [] })
    }
    let destroyed = false
    playStartedRef.current = false
    const activeChannel = channel

    const emitPlayEnd = () => {
      if (!playStartedRef.current || !activeChannel) return
      playStartedRef.current = false
      void trackEvent('play_end', {
        channelId: activeChannel.id,
        name: activeChannel.name,
      })
    }

    const onPlaying = () => {
      if (!destroyed) {
        if (!silent) setPlayer({ buffering: false, error: null })
        if (!playStartedRef.current) {
          playStartedRef.current = true
          void trackEvent('play_start', {
            channelId: activeChannel.id,
            name: activeChannel.name,
          })
        }
        onReady?.()
      }
    }
    const onWaiting = () => {
      if (!destroyed && !silent) setPlayer({ buffering: true })
    }
    const onError = () => {
      if (!destroyed && !silent) {
        setStreamError('Playback failed. This stream may be offline or blocked.')
      }
    }
    const onEnded = () => {
      emitPlayEnd()
    }

    video.addEventListener('playing', onPlaying)
    video.addEventListener('waiting', onWaiting)
    video.addEventListener('error', onError)
    video.addEventListener('ended', onEnded)

    const useMpegTs = isMpegTsUrl(streamUrl) && mpegts.getFeatureList().mseLivePlayback

    if (useMpegTs) {
      const player = mpegts.createPlayer(
        {
          type: 'mse',
          isLive: true,
          url: streamUrl,
        },
        {
          enableWorker: true,
          stashInitialSize: 128,
          liveBufferLatencyChasing: true,
        },
      )
      mpegtsRef.current = player
      player.attachMediaElement(video)
      player.load()
      player.on(mpegts.Events.ERROR, () => {
        if (!destroyed && !silent) {
          setStreamError('Stream error. Try another channel.')
        }
      })
      void video.play().catch(() => {
        if (!silent) setPlayer({ paused: true, buffering: false })
      })
    } else if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
      })
      hlsRef.current = hls
      hls.loadSource(streamUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        void video.play().catch(() => {
          if (!silent) setPlayer({ paused: true, buffering: false })
        })
      })
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal && !silent) {
          setStreamError('Stream error. Try another channel.')
        }
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl
      void video.play().catch(() => {
        if (!silent) setPlayer({ paused: true, buffering: false })
      })
    } else if (!silent) {
      setPlayer({ error: 'HLS is not supported in this browser.', buffering: false })
    }

    return () => {
      destroyed = true
      emitPlayEnd()
      video.removeEventListener('playing', onPlaying)
      video.removeEventListener('waiting', onWaiting)
      video.removeEventListener('error', onError)
      video.removeEventListener('ended', onEnded)
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
      if (mpegtsRef.current) {
        try {
          mpegtsRef.current.destroy()
        } catch {
          /* ignore */
        }
        mpegtsRef.current = null
      }
      video.removeAttribute('src')
      video.load()
    }
  }, [streamUrl, channelId, channel, onReady, setPlayer, setStreamError, silent])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (silent) {
      void video.play().catch(() => undefined)
      return
    }
    if (paused) video.pause()
    else void video.play().catch(() => undefined)
  }, [paused, silent])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    // mutedOverride=true forces silence (non-focused multi-view panes).
    // undefined falls through to global mute.
    const effectivelyMuted =
      mutedOverride === true ? true : mutedOverride === false ? false : Boolean(muted)
    video.muted = effectivelyMuted
    video.volume = volume
  }, [muted, volume, mutedOverride])

  return (
    <video
      ref={videoRef}
      className={`h-full w-full bg-black object-contain ${className}`}
      playsInline
      autoPlay
      muted={
        mutedOverride === true ? true : mutedOverride === false ? false : Boolean(muted)
      }
      poster={channel?.backdrop || channel?.poster}
    />
  )
}
