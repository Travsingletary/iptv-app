import { useEffect, useRef } from 'react'
import Hls from 'hls.js'
import mpegts from 'mpegts.js'
import { useIptvStore } from '../../store/useIptvStore'
import { trackEvent } from '../../lib/eventLogger'
import {
  applyHighestQualityPreference,
  hlsPlayerConfig,
  isMpegTsUrl,
  isProgressiveUrl,
  unsupportedFormatMessage,
} from '../../lib/playback'

interface VideoPlayerProps {
  className?: string
  onReady?: () => void
  /** Override channel for multi-view slots. */
  channelIdOverride?: string
  /** When true, do not write global player buffering/error state. */
  silent?: boolean
  mutedOverride?: boolean
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
  const generationRef = useRef(0)
  const storeChannelId = useIptvStore((s) => s.player.channelId)
  const channelId = channelIdOverride ?? storeChannelId
  const paused = useIptvStore((s) => s.player.paused)
  const muted = useIptvStore((s) => s.player.muted)
  const volume = useIptvStore((s) => s.player.volume)
  const catchup = useIptvStore((s) => s.player.catchup)
  const playbackNonce = useIptvStore((s) => s.player.playbackNonce)
  const channels = useIptvStore((s) => s.channels)
  const setPlayer = useIptvStore((s) => s.setPlayer)
  const setStreamError = useIptvStore((s) => s.setStreamError)

  const channel = channels.find((c) => c.id === channelId)
  const streamUrl =
    !channelIdOverride && catchup?.active && catchup.url ? catchup.url : channel?.url

  useEffect(() => {
    const video = videoRef.current
    if (!video || !streamUrl || !channel) return

    const generation = ++generationRef.current

    if (!silent) {
      setPlayer({ buffering: true, error: null, fallbackSuggestions: [] })
    }
    let destroyed = false
    playStartedRef.current = false
    const activeChannel = channel

    const teardownEngines = () => {
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
    }

    // Soft teardown: keep last decoded frame on the element (faster zap / less black).
    teardownEngines()

    const emitPlayEnd = () => {
      if (!playStartedRef.current || !activeChannel) return
      playStartedRef.current = false
      void trackEvent('play_end', {
        channelId: activeChannel.id,
        name: activeChannel.name,
      })
    }

    const onPlaying = () => {
      if (destroyed || generation !== generationRef.current) return
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
    const onWaiting = () => {
      if (!destroyed && !silent && generation === generationRef.current) {
        setPlayer({ buffering: true })
      }
    }
    const onError = () => {
      if (!destroyed && !silent && generation === generationRef.current) {
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
    const isLiveKind = activeChannel.kind === 'live'
    const useProgressive = isProgressiveUrl(streamUrl)
    const unsupportedMsg = unsupportedFormatMessage(streamUrl)

    if (unsupportedMsg) {
      if (!silent) setStreamError(unsupportedMsg)
    } else if (useMpegTs) {
      const player = mpegts.createPlayer(
        {
          type: 'mse',
          isLive: isLiveKind,
          url: streamUrl,
        },
        {
          enableWorker: true,
          stashInitialSize: isLiveKind ? 128 : 384,
          liveBufferLatencyChasing: isLiveKind,
        },
      )
      mpegtsRef.current = player
      player.attachMediaElement(video)
      player.load()
      player.on(mpegts.Events.ERROR, () => {
        if (!destroyed && !silent && generation === generationRef.current) {
          setStreamError('Stream error. Try another channel.')
        }
      })
      void video.play().catch(() => {
        if (!silent && generation === generationRef.current) {
          setPlayer({ paused: true, buffering: false })
        }
      })
    } else if (useProgressive) {
      video.src = streamUrl
      void video.play().catch(() => {
        if (!silent && generation === generationRef.current) {
          setPlayer({ paused: true, buffering: false })
        }
      })
    } else if (Hls.isSupported()) {
      const hls = new Hls(hlsPlayerConfig(isLiveKind))
      hlsRef.current = hls
      hls.loadSource(streamUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
        if (destroyed || generation !== generationRef.current) return
        // Prefer highest quality variant (HD/4K) — do not start on a low rung.
        applyHighestQualityPreference(hls, data.levels ?? [])
        void video.play().catch(() => {
          if (!silent) setPlayer({ paused: true, buffering: false })
        })
      })
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal && !silent && generation === generationRef.current) {
          // Soft recover once before surfacing error.
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad()
            return
          }
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError()
            return
          }
          setStreamError('Stream error. Try another channel.')
        }
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl
      void video.play().catch(() => {
        if (!silent && generation === generationRef.current) {
          setPlayer({ paused: true, buffering: false })
        }
      })
    } else if (!silent) {
      setPlayer({ error: 'Playback is not supported in this browser.', buffering: false })
    }

    return () => {
      destroyed = true
      emitPlayEnd()
      video.removeEventListener('playing', onPlaying)
      video.removeEventListener('waiting', onWaiting)
      video.removeEventListener('error', onError)
      video.removeEventListener('ended', onEnded)
      teardownEngines()
      // Intentionally do not video.load() here — keeps last frame during zap.
      // Only clear if this generation is still current and effect fully unmounts later.
    }
  }, [streamUrl, channelId, channel, onReady, setPlayer, setStreamError, silent, playbackNonce])

  // Hard clear only when leaving the canvas (no channel).
  useEffect(() => {
    if (channelId) return
    const video = videoRef.current
    if (!video) return
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
  }, [channelId])

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
      muted={mutedOverride === true ? true : mutedOverride === false ? false : Boolean(muted)}
      poster={channel?.backdrop || channel?.poster}
    />
  )
}
