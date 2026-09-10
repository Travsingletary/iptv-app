import { motion } from 'framer-motion'
import { Play, Plus } from 'lucide-react'
import type { Channel } from '../../types/iptv'
import { useIptvStore } from '../../store/useIptvStore'
import { nowPlaying } from '../../lib/epg'

export function HeroBanner({ channel }: { channel: Channel }) {
  const playChannel = useIptvStore((s) => s.playChannel)
  const setMenuOpen = useIptvStore((s) => s.setMenuOpen)
  const toggleFavorite = useIptvStore((s) => s.toggleFavorite)
  const favorites = useIptvStore((s) => s.favorites)
  const epg = useIptvStore((s) => s.epg)
  const program = nowPlaying(epg, channel.tvgId || channel.id)
  const image = channel.backdrop || channel.poster || channel.logo

  return (
    <section className="relative isolate min-h-[58vh] overflow-hidden md:min-h-[68vh]">
      <motion.div
        className="pointer-events-none absolute inset-0"
        initial={{ scale: 1.08, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        style={{
          backgroundImage: image
            ? `linear-gradient(90deg, rgba(7,9,13,0.96) 0%, rgba(7,9,13,0.72) 42%, rgba(7,9,13,0.35) 100%), linear-gradient(180deg, transparent 40%, rgba(7,9,13,0.95) 100%), url(${image})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-hero-wash opacity-70 mix-blend-multiply" />

      <div className="relative z-10 flex h-full max-w-3xl flex-col justify-end px-6 pb-10 pt-24 md:px-10 md:pb-14">
        <motion.p
          className="font-mono text-xs uppercase tracking-[0.24em] text-ember-400"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {channel.kind === 'live' ? 'Featured live' : 'Featured title'}
        </motion.p>
        <motion.h1
          className="mt-3 font-display text-4xl font-extrabold leading-[0.95] tracking-tight text-balance md:text-6xl lg:text-7xl"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.5 }}
        >
          Aether
        </motion.h1>
        <motion.p
          className="mt-2 font-display text-2xl font-semibold text-sand-100 md:text-3xl"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26 }}
        >
          {channel.name}
        </motion.p>
        <motion.p
          className="mt-4 max-w-xl text-sm leading-relaxed text-sand-100/80 md:text-base"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34 }}
        >
          {program?.title
            ? `On now: ${program.title}. ${channel.description || ''}`
            : channel.description ||
              'Cable clarity meets on-demand browsing — guide, live zap, and cinema-grade playback.'}
        </motion.p>

        <motion.div
          className="mt-7 flex flex-wrap gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
        >
          <button
            type="button"
            data-tv-focus
            onClick={() => {
              playChannel(channel.id)
              setMenuOpen(false)
            }}
            className="inline-flex items-center gap-2 rounded-full bg-sand-50 px-5 py-3 text-sm font-semibold text-ink-950 shadow-glow transition hover:bg-white focus-visible:focus-ring"
          >
            <Play size={16} fill="currentColor" />
            Watch now
          </button>
          <button
            type="button"
            data-tv-focus
            onClick={() => toggleFavorite(channel.id)}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-ink-900/50 px-5 py-3 text-sm font-medium backdrop-blur transition hover:border-ember-400/50 focus-visible:focus-ring"
          >
            <Plus size={16} />
            {favorites.includes(channel.id) ? 'In My List' : 'My List'}
          </button>
        </motion.div>
      </div>
    </section>
  )
}
