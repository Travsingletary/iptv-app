import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
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
  const retryPlayback = useIptvStore((s) => s.retryPlayback)
  const toggleFavorite = useIptvStore((s) => s.toggleFavorite)
  const setView = useIptvStore((s) => s.setView)
  const startCatchup = useIptvStore((s) => s.startCatchup)
  const clearCatchup = useIptvStore((s) => s.clearCatchup)
  const setMultiViewLayout = useIptvStore((s) => s.setMultiViewLayout)

  const live = useMemo(() => channels.filter((c) => c.kind === 'live'), [channels])
  const channel = channels.find((c) => c.id === player.channelId)
  const idx = live.findIndex((c) => c.id === player.channelId)
  const program = channel ? nowPlaying(epg, channel.tvgId || channel.id) : undefined

  useEffect(() => {
    if (!player.overlayVisible) return
    if (player.catchup?.active) return
    if (player.buffering || player.error) return
    const t = window.setTimeout(() => {
      setPlayer({ overlayVisible: false })
    }, prefs.autoHideControlsMs)
    return () => window.clearTimeout(t)
  }, [
    player.overlayVisible,
    player.paused,
    player.channelId,
    player.catchup?.active,
    player.buffering,
    player.error,
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
    <>
      <AnimatePresence>
        {(player.buffering || player.error) && (
          <motion.div
            key="playback-hud"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center p-4 md:p-6"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className={`pointer-events-auto max-w-lg rounded-2xl border px-4 py-3 shadow-panel backdrop-blur-xl ${
                player.error
                  ? 'border-red-400/40 bg-red-950/80 text-red-100'
                  : 'border-ember-400/35 bg-ink-950/85 text-sand-100'
              }`}
              data-testid="playback-status-hud"
            >
              {player.error ? (
                <div className="space-y-2">
                  <p className="text-sm">{player.error}</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      data-tv-focus
                      data-testid="playback-retry"
                      className="inline-flex items-center gap-1.5 rounded-full bg-sand-50 px-3 py-1.5 text-xs font-semibold text-ink-950"
                      onClick={() => retryPlayback()}
                    >
                      <RotateCcw size={14} />
                      Retry
                    </button>
                    {player.fallbackSuggestions?.map((suggestion) => (
                      <button
                        key={suggestion.channelId}
                        type="button"
                        data-tv-focus
                        onClick={() => playChannel(suggestion.channelId)}
                        className="rounded-full border border-white/20 bg-ink-900/80 px-3 py-1.5 text-xs"
                      >
                        {suggestion.channelName}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-ember-300 animate-pulse-soft">
                  Buffering…
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  data-tv-focus
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
                  data-tv-focus
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
                  data-tv-focus
                  className="rounded-full bg-sand-50 px-4 py-2.5 text-ink-950 hover:bg-white"
                  onClick={() => setPlayer({ paused: !player.paused })}
                >
                  {player.paused ? <Play size={18} /> : <Pause size={18} />}
                </button>
                <button
                  type="button"
                  data-tv-focus
                  className="rounded-full border border-white/15 bg-ink-900/70 p-2.5"
                  onClick={() => zap(-1)}
                  aria-label="Previous channel"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  data-tv-focus
                  className="rounded-full border border-white/15 bg-ink-900/70 p-2.5"
                  onClick={() => zap(1)}
                  aria-label="Next channel"
                >
                  <ChevronRight size={18} />
                </button>
                <button
                  type="button"
                  data-tv-focus
                  className="rounded-full border border-white/15 bg-ink-900/70 p-2.5"
                  onClick={() => setPlayer({ muted: !player.muted })}
                  aria-label="Mute"
                >
                  {player.muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input
                  type="range"
                  data-tv-focus
                  data-testid="player-volume-scrub"
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
                  onKeyDown={(e) => {
                    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
                    e.preventDefault()
                    e.stopPropagation()
                    const delta = e.key === 'ArrowRight' ? 0.05 : -0.05
                    const next = Math.min(1, Math.max(0, player.volume + delta))
                    setPlayer({ volume: next, muted: next === 0 })
                  }}
                  className="h-1 w-28 accent-ember-400"
                />
                <div className="ml-auto flex flex-wrap gap-2">
                  {channel.catchup ? (
                    <>
                      <button
                        type="button"
                        data-tv-focus
                        aria-label="Catch up 15 minutes"
                        className="rounded-full border border-white/15 bg-ink-900/70 px-3 py-2 text-xs font-medium hover:border-ember-400/50"
                        onClick={() => startCatchup(15)}
                      >
                        −15m
                      </button>
                      <button
                        type="button"
                        data-tv-focus
                        aria-label="Catch up 30 minutes"
                        className="rounded-full border border-white/15 bg-ink-900/70 px-3 py-2 text-xs font-medium hover:border-ember-400/50"
                        onClick={() => startCatchup(30)}
                      >
                        −30m
                      </button>
                      {player.catchup?.active && (
                        <button
                          type="button"
                          data-tv-focus
                          aria-label="Return to live"
                          className="rounded-full border border-ember-400/40 bg-ember-500/15 px-3 py-2 text-xs font-medium text-ember-300"
                          onClick={() => clearCatchup()}
                        >
                          Live
                        </button>
                      )}
                    </>
                  ) : (
                    <span
                      className="rounded-full border border-white/10 px-3 py-2 text-xs text-mist-400"
                      title="This stream does not advertise catch-up."
                    >
                      No catch-up
                    </span>
                  )}
                  <button
                    type="button"
                    data-tv-focus
                    className="rounded-full border border-white/15 bg-ink-900/70 px-4 py-2 text-sm font-medium hover:border-ember-400/50"
                    onClick={() => setMultiViewLayout(2)}
                  >
                    Multi-view
                  </button>
                  <button
                    type="button"
                    data-tv-focus
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
                    data-tv-focus
                    className="rounded-full border border-white/15 bg-ink-900/70 px-4 py-2 text-sm font-medium hover:border-ember-400/50"
                    onClick={() => setView('live')}
                  >
                    Channels
                  </button>
                </div>
              </div>

              {player.catchup?.active && (
                <p
                  data-testid="catchup-status"
                  className="rounded-lg border border-ember-400/30 bg-ember-500/10 px-3 py-2 text-xs text-sand-100"
                >
                  {player.catchup.label}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
