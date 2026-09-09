import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Play, X } from 'lucide-react'
import { ChannelRail } from '../components/browse/ChannelRail'
import { selectVod, useIptvStore } from '../store/useIptvStore'

export function VodPage() {
  const channels = useIptvStore((s) => s.channels)
  const player = useIptvStore((s) => s.player)
  const playChannel = useIptvStore((s) => s.playChannel)
  const setPlayer = useIptvStore((s) => s.setPlayer)
  const setMenuOpen = useIptvStore((s) => s.setMenuOpen)
  const [detailId, setDetailId] = useState<string | null>(null)

  const vod = useMemo(() => selectVod(channels), [channels])
  const movies = vod.filter((c) => c.kind === 'movie')
  const series = vod.filter((c) => c.kind === 'series')
  const detail = channels.find((c) => c.id === detailId)
  const playingVod = channels.find(
    (c) => c.id === player.channelId && c.kind !== 'live',
  )

  return (
    <div className="pb-16">
      <header className="px-6 pb-2 pt-8 md:px-10">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-ember-400">
          On demand
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight md:text-5xl">
          Cinema & Series
        </h1>
        <p className="mt-2 max-w-xl text-sm text-mist-300 md:text-base">
          Browse posters, open a title, and play instantly — Netflix-style rails
          with IPTV sources underneath.
        </p>
        {playingVod && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <p className="text-sm text-ember-300">
              Now playing <span className="font-semibold">{playingVod.name}</span>{' '}
              on the TV canvas
            </p>
            <button
              type="button"
              data-tv-focus
              className="rounded-full border border-white/15 bg-ink-900/80 px-3 py-1.5 text-sm"
              onClick={() => setMenuOpen(false)}
            >
              Watch full screen
            </button>
            <button
              type="button"
              data-tv-focus
              className="rounded-full border border-white/15 bg-ink-900/80 px-3 py-1.5 text-sm"
              onClick={() => {
                const live = channels.find((c) => c.kind === 'live')
                if (live) playChannel(live.id)
                else setPlayer({ channelId: null, paused: true })
              }}
            >
              Back to catalog
            </button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-2 gap-3 px-6 py-6 sm:grid-cols-3 md:grid-cols-4 md:px-10 lg:grid-cols-5">
        {vod.map((ch, i) => (
          <motion.button
            key={ch.id}
            type="button"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.05, 0.4) }}
            whileHover={{ y: -6 }}
            onClick={() => setDetailId(ch.id)}
            className="group overflow-hidden rounded-2xl border border-white/10 bg-ink-800 text-left"
          >
            <div
              className="aspect-[2/3] bg-cover bg-center transition duration-500 group-hover:scale-105"
              style={{
                backgroundImage: `url(${ch.poster || ch.backdrop || ''})`,
                backgroundColor: '#1f2a3d',
              }}
            />
            <div className="p-3">
              <p className="truncate text-sm font-semibold">{ch.name}</p>
              <p className="text-xs text-mist-400">
                {[ch.year, ch.rating, ch.quality].filter(Boolean).join(' · ')}
              </p>
            </div>
          </motion.button>
        ))}
      </div>

      {movies.length > 0 && (
        <ChannelRail title="Movies" channels={movies} variant="poster" />
      )}
      {series.length > 0 && (
        <ChannelRail title="Series" channels={series} variant="poster" />
      )}

      <AnimatePresence>
        {detail && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/75 p-4 backdrop-blur-sm md:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDetailId(null)}
          >
            <motion.div
              className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-ink-900 shadow-panel"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="h-48 bg-cover bg-center md:h-64"
                style={{
                  backgroundImage: `linear-gradient(180deg, transparent, #0c1018), url(${
                    detail.backdrop || detail.poster || ''
                  })`,
                }}
              />
              <button
                type="button"
                className="absolute right-4 top-4 rounded-full bg-ink-950/70 p-2"
                onClick={() => setDetailId(null)}
              >
                <X size={18} />
              </button>
              <div className="space-y-4 p-6">
                <div>
                  <h2 className="font-display text-2xl font-bold md:text-3xl">
                    {detail.name}
                  </h2>
                  <p className="mt-1 text-sm text-mist-300">
                    {[detail.year, detail.rating, detail.quality, detail.group]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-sand-100/80">
                  {detail.description}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    playChannel(detail.id)
                    setDetailId(null)
                    setMenuOpen(false)
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-sand-50 px-5 py-3 text-sm font-semibold text-ink-950"
                >
                  <Play size={16} fill="currentColor" />
                  Play
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
