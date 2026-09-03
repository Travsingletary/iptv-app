import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Maximize2,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { nowPlaying, progressPct } from '../../lib/epg'
import { formatTimeRange } from '../../lib/time'
import { useIptvStore } from '../../store/useIptvStore'

interface PlayerChromeProps {
  onOpenGuide?: () => void
}

export function PlayerChrome({ onOpenGuide }: PlayerChromeProps) {
  const channels = useIptvStore((s) => s.channels)
  const epg = useIptvStore((s) => s.epg)
  const favorites = useIptvStore((s) => s.favorites)
  const player = useIptvStore((s) => s.player)
  const prefs = useIptvStore((s) => s.prefs)
  const setPlayer = useIptvStore((s) => s.setPlayer)
  const playChannel = useIptvStore((s) => s.playChannel)
  const toggleFavorite = useIptvStore((s) => s.toggleFavorite)
  const setView = useIptvStore((s) => s.setView)

  const live = useMemo(
    () => channels.filter((c) => c.kind === 'live'),
    [channels],
  )
  const channel = channels.find((c) => c.id === player.channelId)
  const idx = live.findIndex((c) => c.id === player.channelId)
  const program = channel
    ? nowPlaying(epg, channel.tvgId || channel.id)
    : undefined

  useEffect(() => {
    if (!player.overlayVisible) return
    const t = window.setTimeout(() => {
      setPlayer({ overlayVisible: false })
    }, prefs.autoHideControlsMs)
    return () => window.clearTimeout(t)
  }, [
    player.overlayVisible,
    player.paused,
    player.channelId,
    prefs.autoHideControlsMs,
    setPlayer,
  ])

  if (!channel) return null

  const zap = (dir: -1 | 1) => {
    if (idx < 0 || !live.length) return
    const next = live[(idx + dir + live.length) % live.length]
    playChannel(next.id)
  }

  return (
    <AnimatePresence>
      {player.overlayVisible && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between bg-gradient-to-t from-ink-950 via-ink-950/20 to-ink-950/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
        >
          <div className="pointer-events-auto flex items-start justify-between p-5 md:p-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-ember-400">
                Now watching
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight md:text-4xl">
                {channel.name}
              </h2>
              {program && (
                <p className="mt-1 max-w-xl text-sm text-sand-100/80 md:text-base">
                  {program.title}
                  <span className="text-mist-400">
                    {' '}
                    · {formatTimeRange(program.start, program.end)}
                  </span>
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-full border border-white/15 bg-ink-900/70 p-2.5 backdrop-blur hover:border-ember-400/60"
                onClick={() => toggleFavorite(channel.id)}
                aria-label="Toggle favorite"
              >
                <Heart
                  className={
                    favorites.includes(channel.id)
                      ? 'fill-ember-400 text-ember-400'
                      : 'text-sand-50'
                  }
                  size={18}
                />
              </button>
              <button
                type="button"
                className="rounded-full border border-white/15 bg-ink-900/70 p-2.5 backdrop-blur hover:border-ember-400/60"
                onClick={() => document.documentElement.requestFullscreen?.()}
                aria-label="Fullscreen"
              >
                <Maximize2 size={18} />
              </button>
            </div>
          </div>

          <div className="pointer-events-auto space-y-4 p-5 md:p-8">
            {program && (
              <div className="h-1 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-ember-400 transition-[width] duration-700"
                  style={{ width: `${progressPct(program)}%` }}
                />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="rounded-full bg-sand-50 px-4 py-2.5 text-ink-950 hover:bg-white"
                onClick={() => setPlayer({ paused: !player.paused })}
              >
                {player.paused ? <Play size={18} /> : <Pause size={18} />}
              </button>
              <button
                type="button"
                className="rounded-full border border-white/15 bg-ink-900/70 p-2.5"
                onClick={() => zap(-1)}
                aria-label="Previous channel"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className="rounded-full border border-white/15 bg-ink-900/70 p-2.5"
                onClick={() => zap(1)}
                aria-label="Next channel"
              >
                <ChevronRight size={18} />
              </button>
              <button
                type="button"
                className="rounded-full border border-white/15 bg-ink-900/70 p-2.5"
                onClick={() => setPlayer({ muted: !player.muted })}
                aria-label="Mute"
              >
                {player.muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={player.muted ? 0 : player.volume}
                onChange={(e) =>
                  setPlayer({
                    volume: Number(e.target.value),
                    muted: Number(e.target.value) === 0,
                  })
                }
                className="h-1 w-28 accent-ember-400"
              />
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  className="rounded-full border border-white/15 bg-ink-900/70 px-4 py-2 text-sm font-medium hover:border-ember-400/50"
                  onClick={() => {
                    onOpenGuide?.()
                    setView('guide')
                  }}
                >
                  TV Guide
                </button>
                <button
                  type="button"
                  className="rounded-full border border-white/15 bg-ink-900/70 px-4 py-2 text-sm font-medium hover:border-ember-400/50"
                  onClick={() => setView('live')}
                >
                  Channels
                </button>
              </div>
            </div>

            {player.error && (
              <p className="rounded-lg border border-red-400/30 bg-red-950/50 px-3 py-2 text-sm text-red-200">
                {player.error}
              </p>
            )}
            {player.buffering && !player.error && (
              <p className="font-mono text-xs uppercase tracking-widest text-mist-300 animate-pulse-soft">
                Buffering…
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
