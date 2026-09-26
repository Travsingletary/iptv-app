import { AnimatePresence, motion } from 'framer-motion'
import { useMemo } from 'react'
import { channelDisplayNumber, matchChannelByNumber } from '../../lib/channelSurfing'
import { selectLiveChannels, useIptvStore } from '../../store/useIptvStore'

/** Center overlay while typing channel numbers on the remote digit pad. */
export function ChannelNumberOverlay() {
  const surfing = useIptvStore((s) => s.surfing)
  const channels = useIptvStore((s) => s.channels)
  const reduceMotion = useIptvStore((s) => s.prefs.reduceMotion)

  const live = useMemo(() => selectLiveChannels(channels), [channels])
  const match = useMemo(
    () => (surfing.digitBuffer ? matchChannelByNumber(live, surfing.digitBuffer) : null),
    [live, surfing.digitBuffer],
  )
  const show = surfing.digitEntryActive && Boolean(surfing.digitBuffer)

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="channel-number-overlay"
          data-testid="channel-number-overlay"
          className="pointer-events-none absolute inset-0 z-40 flex items-start justify-end p-6 md:p-10"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.16 }}
        >
          <div className="min-w-[7.5rem] rounded-2xl border border-ember-400/35 bg-ink-950/85 px-5 py-4 text-right shadow-panel backdrop-blur-xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ember-400">
              Channel
            </p>
            <p
              className="mt-1 font-display text-5xl font-bold tabular-nums tracking-tight text-sand-50"
              data-testid="channel-number-digits"
            >
              {surfing.digitBuffer}
            </p>
            {match && (
              <p className="mt-2 max-w-[14rem] truncate text-sm text-sand-100/80">
                {channelDisplayNumber(match.channel, match.index)} · {match.channel.name}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
