import { useMemo } from 'react'
import { Grid2x2, Columns2, Maximize2 } from 'lucide-react'
import { VideoPlayer } from '../components/player/VideoPlayer'
import { selectLiveChannels, useIptvStore } from '../store/useIptvStore'

export function MultiViewPage() {
  const channels = useIptvStore((s) => s.channels)
  const player = useIptvStore((s) => s.player)
  const setMultiViewLayout = useIptvStore((s) => s.setMultiViewLayout)
  const setMultiViewSlot = useIptvStore((s) => s.setMultiViewSlot)
  const playChannel = useIptvStore((s) => s.playChannel)

  const live = useMemo(() => selectLiveChannels(channels), [channels])
  const layout = player.multiViewLayout === 1 ? 2 : player.multiViewLayout
  const slots = player.multiViewIds.slice(0, layout)

  // Ensure slots populated
  const filled =
    slots.length >= layout
      ? slots
      : [...slots, ...live.map((c) => c.id)].filter(
          (id, i, arr) => id && arr.indexOf(id) === i,
        ).slice(0, layout)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 md:px-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ember-400">
            Multi-view
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Live mosaic
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            data-tv-focus
            aria-label="2-up mosaic"
            onClick={() => setMultiViewLayout(2)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
              layout === 2
                ? 'border-ember-400/50 bg-ember-500/15 text-sand-50'
                : 'border-white/10 text-mist-300 hover:border-ember-400/40'
            }`}
          >
            <Columns2 size={16} /> 2-up
          </button>
          <button
            type="button"
            data-tv-focus
            aria-label="4-up mosaic"
            onClick={() => setMultiViewLayout(4)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
              layout === 4
                ? 'border-ember-400/50 bg-ember-500/15 text-sand-50'
                : 'border-white/10 text-mist-300 hover:border-ember-400/40'
            }`}
          >
            <Grid2x2 size={16} /> 4-up
          </button>
          <button
            type="button"
            data-tv-focus
            aria-label="Exit multi-view"
            onClick={() => setMultiViewLayout(1)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-mist-300 hover:border-ember-400/40"
          >
            <Maximize2 size={16} /> Single
          </button>
        </div>
      </header>

      <div
        className={`grid min-h-0 flex-1 gap-2 p-3 md:p-4 ${
          layout === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-2'
        }`}
      >
        {Array.from({ length: layout }).map((_, index) => {
          const id = filled[index]
          const channel = live.find((c) => c.id === id) || live[index]
          const focused = player.channelId === channel?.id
          return (
            <div
              key={`slot_${index}`}
              className={`relative min-h-[12rem] overflow-hidden rounded-2xl border bg-black ${
                focused
                  ? 'border-ember-400 ring-2 ring-ember-400/60'
                  : 'border-white/10'
              }`}
            >
              {channel ? (
                <>
                  <VideoPlayer
                    channelIdOverride={channel.id}
                    silent
                    mutedOverride={player.channelId !== channel.id || player.muted}
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/90 to-transparent p-3">
                    <p className="font-display text-sm font-semibold text-sand-50">
                      {channel.name}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-mist-400">
                      Slot {index + 1}
                      {focused ? ' · focus' : ''}
                    </p>
                  </div>
                  <div className="absolute right-2 top-2 flex gap-2">
                    <button
                      type="button"
                      data-tv-focus
                      aria-label={`Focus slot ${index + 1}`}
                      onClick={() => playChannel(channel.id)}
                      className="rounded-lg border border-white/20 bg-ink-900/80 px-2 py-1 text-[10px] uppercase tracking-wide text-sand-50 backdrop-blur"
                    >
                      Focus
                    </button>
                    <label className="rounded-lg border border-white/20 bg-ink-900/80 px-2 py-1 text-[10px] text-mist-200 backdrop-blur">
                      <span className="sr-only">Choose channel for slot {index + 1}</span>
                      <select
                        data-tv-focus
                        aria-label={`Channel for slot ${index + 1}`}
                        value={channel.id}
                        onChange={(e) => setMultiViewSlot(index, e.target.value)}
                        className="max-w-[9rem] bg-transparent outline-none"
                      >
                        {live.map((c) => (
                          <option key={c.id} value={c.id} className="bg-ink-900">
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-mist-400">
                  No channel
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
