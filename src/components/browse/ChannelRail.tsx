import { motion } from 'framer-motion'
import type { Channel } from '../../types/iptv'
import { useIptvStore } from '../../store/useIptvStore'
import { nowPlaying } from '../../lib/epg'

interface ChannelRailProps {
  title: string
  channels: Channel[]
  variant?: 'poster' | 'live'
}

export function ChannelRail({
  title,
  channels,
  variant = 'live',
}: ChannelRailProps) {
  const playChannel = useIptvStore((s) => s.playChannel)
  const epg = useIptvStore((s) => s.epg)
  if (!channels.length) return null

  return (
    <section className="px-6 py-5 md:px-10">
      <div className="mb-3 flex items-end justify-between">
        <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">
          {title}
        </h2>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-400">
          {channels.length} titles
        </p>
      </div>
      <div className="rail-mask -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {channels.map((ch, i) => {
          const program = nowPlaying(epg, ch.tvgId || ch.id)
          const isPoster = variant === 'poster' || ch.kind !== 'live'
          return (
            <motion.button
              key={ch.id}
              type="button"
              data-tv-focus
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.35) }}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                playChannel(ch.id)
                useIptvStore.getState().setMenuOpen(false)
              }}
              className={`group relative shrink-0 overflow-hidden text-left focus-visible:focus-ring ${
                isPoster
                  ? 'aspect-[2/3] w-[9.5rem] md:w-40'
                  : 'h-28 w-52 md:h-32 md:w-60'
              } rounded-2xl border border-white/10 bg-ink-800`}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                style={{
                  backgroundImage: `linear-gradient(180deg, transparent 30%, rgba(7,9,13,0.92) 100%), url(${
                    ch.poster || ch.backdrop || ch.logo || ''
                  })`,
                  backgroundColor: '#171f2e',
                }}
              />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <p className="truncate text-sm font-semibold">{ch.name}</p>
                <p className="mt-0.5 truncate text-xs text-mist-300">
                  {program?.title || ch.group}
                  {ch.quality ? ` · ${ch.quality}` : ''}
                </p>
              </div>
              {ch.kind === 'live' && (
                <span className="absolute left-2 top-2 rounded-md bg-ember-500/90 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-ink-950">
                  Live
                </span>
              )}
            </motion.button>
          )
        })}
      </div>
    </section>
  )
}
