import { useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { useIptvStore } from '../../store/useIptvStore'
import { programsForChannel, progressPct } from '../../lib/epg'
import { formatTimeRange, hoursGrid, startOfHour } from '../../lib/time'
import { selectLiveChannels } from '../../store/useIptvStore'

const HOUR_WIDTH = 240

export function EpgGuide() {
  const channels = useIptvStore((s) => s.channels)
  const epg = useIptvStore((s) => s.epg)
  const prefs = useIptvStore((s) => s.prefs)
  const search = useIptvStore((s) => s.search)
  const playChannel = useIptvStore((s) => s.playChannel)
  const player = useIptvStore((s) => s.player)
  const scrollRef = useRef<HTMLDivElement>(null)

  const live = useMemo(() => {
    const list = selectLiveChannels(channels)
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q),
    )
  }, [channels, search])

  const gridStart = startOfHour(Date.now() - 30 * 60_000)
  const hours = hoursGrid(gridStart, prefs.guideHours)
  const now = Date.now()
  const nowOffset =
    ((now - gridStart) / (prefs.guideHours * 60 * 60_000)) *
    (prefs.guideHours * HOUR_WIDTH)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-end justify-between gap-4 px-6 pb-4 pt-6 md:px-10">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-ember-400">
            Electronic program guide
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight md:text-4xl">
            TV Guide
          </h1>
        </div>
        <button
          type="button"
          className="rounded-full border border-white/15 bg-ink-850 px-4 py-2 text-sm hover:border-ember-400/50"
          onClick={() => {
            scrollRef.current?.scrollTo({
              left: Math.max(0, nowOffset - 120),
              behavior: 'smooth',
            })
          }}
        >
          Jump to now
        </button>
      </div>

      <div
        ref={scrollRef}
        className="relative min-h-0 flex-1 overflow-auto px-6 pb-8 md:px-10"
      >
        <div
          className="relative min-w-max"
          style={{ width: prefs.guideHours * HOUR_WIDTH + 220 }}
        >
          {/* Time header */}
          <div className="sticky top-0 z-20 flex bg-ink-950/95 backdrop-blur">
            <div className="sticky left-0 z-30 w-[220px] shrink-0 border-b border-r border-white/10 bg-ink-950/95 px-3 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-mist-400">
              Channel
            </div>
            <div className="relative flex border-b border-white/10">
              {hours.map((h) => (
                <div
                  key={h}
                  className="border-r border-white/8 px-3 py-3 font-mono text-xs text-mist-300"
                  style={{ width: HOUR_WIDTH }}
                >
                  {new Intl.DateTimeFormat(undefined, {
                    hour: 'numeric',
                    minute: '2-digit',
                  }).format(h)}
                </div>
              ))}
              <div
                className="pointer-events-none absolute bottom-0 top-0 w-px bg-ember-400"
                style={{ left: nowOffset }}
              />
            </div>
          </div>

          {live.map((ch, row) => {
            const programs = programsForChannel(
              epg,
              ch.tvgId || ch.id,
              now,
              prefs.guideHours * 60 * 60_000,
            )
            const active = player.channelId === ch.id
            return (
              <div key={ch.id} className="flex min-h-[72px]">
                <button
                  type="button"
                  onClick={() => playChannel(ch.id)}
                  className={`sticky left-0 z-10 flex w-[220px] shrink-0 items-center gap-3 border-b border-r border-white/8 px-3 py-2 text-left backdrop-blur transition ${
                    active
                      ? 'bg-ember-500/15 ring-1 ring-inset ring-ember-400/40'
                      : 'bg-ink-900/90 hover:bg-ink-800'
                  }`}
                >
                  {ch.logo ? (
                    <img
                      src={ch.logo}
                      alt=""
                      className="h-9 w-9 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-700 font-display text-sm font-bold text-ember-400">
                      {ch.name.slice(0, 1)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{ch.name}</p>
                    <p className="truncate font-mono text-[10px] uppercase tracking-wider text-mist-400">
                      {ch.group}
                      {ch.quality ? ` · ${ch.quality}` : ''}
                    </p>
                  </div>
                </button>

                <div
                  className="relative border-b border-white/8"
                  style={{ width: prefs.guideHours * HOUR_WIDTH }}
                >
                  <div
                    className="pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-ember-400/80"
                    style={{ left: nowOffset }}
                  />
                  {programs.length === 0 && (
                    <div className="absolute inset-y-2 left-2 flex items-center rounded-lg border border-dashed border-white/10 px-3 text-xs text-mist-400">
                      No guide data
                    </div>
                  )}
                  {programs.map((p) => {
                    const spanMs = prefs.guideHours * 60 * 60_000
                    const trackW = prefs.guideHours * HOUR_WIDTH
                    const startClamped = Math.max(p.start, gridStart)
                    const endClamped = Math.min(p.end, gridStart + spanMs)
                    if (endClamped <= startClamped) return null
                    const left =
                      ((startClamped - gridStart) / spanMs) * trackW
                    const width = ((endClamped - startClamped) / spanMs) * trackW - 3
                    if (width < 10) return null
                    const isNow = p.start <= now && p.end > now
                    const compact = width < 90
                    return (
                      <motion.button
                        key={p.id}
                        type="button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(row * 0.02, 0.2) }}
                        onClick={() => playChannel(ch.id)}
                        className={`absolute top-2 overflow-hidden rounded-lg border px-2 py-1.5 text-left transition hover:brightness-110 ${
                          isNow
                            ? 'border-ember-400/50 bg-ember-500/20'
                            : 'border-white/10 bg-ink-800/90'
                        }`}
                        style={{
                          left,
                          width,
                          height: 'calc(100% - 1rem)',
                        }}
                        title={`${p.title} · ${formatTimeRange(p.start, p.end)}`}
                      >
                        <p className="truncate text-xs font-semibold leading-tight">
                          {p.title}
                        </p>
                        {!compact && (
                          <p className="truncate font-mono text-[10px] leading-tight text-mist-300">
                            {formatTimeRange(p.start, p.end)}
                          </p>
                        )}
                        {isNow && (
                          <div className="mt-1 h-0.5 overflow-hidden rounded bg-white/15">
                            <div
                              className="h-full bg-ember-400"
                              style={{ width: `${progressPct(p, now)}%` }}
                            />
                          </div>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
