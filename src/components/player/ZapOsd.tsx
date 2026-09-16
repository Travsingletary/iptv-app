import { AnimatePresence, motion } from 'framer-motion'
import { useMemo } from 'react'
import { channelDisplayNumber, nowAndNext } from '../../lib/channelSurfing'
import { formatTimeRange } from '../../lib/time'
import { selectLiveChannels, useIptvStore } from '../../store/useIptvStore'

/** Brief non-blocking zap banner — channel #, name, logo, now/next. */
export function ZapOsd() {
  const surfing = useIptvStore((s) => s.surfing)
  const channels = useIptvStore((s) => s.channels)
  const epg = useIptvStore((s) => s.epg)
  const playerChannelId = useIptvStore((s) => s.player.channelId)
  const reduceMotion = useIptvStore((s) => s.prefs.reduceMotion)

  const live = useMemo(() => selectLiveChannels(channels), [channels])
  const previewId = surfing.previewChannelId || playerChannelId
  const idx = live.findIndex((c) => c.id === previewId)
  const channel = idx >= 0 ? live[idx] : channels.find((c) => c.id === previewId)
  const show = surfing.osdVisible && Boolean(channel) && !surfing.digitEntryActive

  const epgPair = useMemo(() => {
    if (!channel) return {}
    return nowAndNext(epg, channel.tvgId || channel.id)
  }, [channel, epg])

  const number = channel && idx >= 0 ? channelDisplayNumber(channel, idx) : channel?.number

  return (
    <AnimatePresence>
      {show && channel && (
        <motion.div
          key="zap-osd"
          data-testid="zap-osd"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[25] flex justify-start p-4 md:p-6"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: 10 }}
          transition={{ duration: 0.18 }}
        >
          <div className="flex max-w-xl items-center gap-3 rounded-2xl border border-white/15 bg-ink-950/80 px-3 py-2.5 shadow-panel backdrop-blur-xl md:gap-4 md:px-4 md:py-3">
            {channel.logo ? (
              <img
                src={channel.logo}
                alt=""
                className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-white/10"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ink-800 font-display text-lg font-bold text-ember-400">
                {channel.name.slice(0, 1)}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ember-400">
                Ch {number ?? '—'}
              </p>
              <p className="truncate font-display text-lg font-semibold tracking-tight md:text-xl">
                {channel.name}
              </p>
              {epgPair.now && (
                <p className="mt-0.5 truncate text-xs text-sand-100/85 md:text-sm">
                  Now · {epgPair.now.title}
                  <span className="text-mist-400">
                    {' '}
                    · {formatTimeRange(epgPair.now.start, epgPair.now.end)}
                  </span>
                </p>
              )}
              {epgPair.next && (
                <p className="truncate text-[11px] text-mist-300 md:text-xs">
                  Next · {epgPair.next.title}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
