import { useMemo } from 'react'
import { Heart, History } from 'lucide-react'
import { surfingHopIds } from '../../lib/channelSurfing'
import { selectLiveChannels, useIptvStore } from '../../store/useIptvStore'

type SurfingHopStripProps = {
  /** Compact strip for Live rail; slightly larger when shown under zap OSD chrome. */
  variant?: 'rail' | 'osd'
}

/** Quick-hop strip: last-watched + favorites for addictive channel surfing. */
export function SurfingHopStrip({ variant = 'rail' }: SurfingHopStripProps) {
  const channels = useIptvStore((s) => s.channels)
  const recentIds = useIptvStore((s) => s.recentIds)
  const favorites = useIptvStore((s) => s.favorites)
  const playerChannelId = useIptvStore((s) => s.player.channelId)
  const previewId = useIptvStore((s) => s.surfing.previewChannelId)
  const playChannel = useIptvStore((s) => s.playChannel)

  const live = useMemo(() => selectLiveChannels(channels), [channels])
  const byId = useMemo(() => new Map(live.map((c) => [c.id, c])), [live])
  const currentId = previewId || playerChannelId

  const hopIds = useMemo(
    () =>
      surfingHopIds({
        recentIds,
        favoriteIds: favorites,
        liveIds: live.map((c) => c.id),
        currentId,
        limit: variant === 'rail' ? 8 : 6,
      }),
    [recentIds, favorites, live, currentId, variant],
  )

  if (!hopIds.length) return null

  const favSet = new Set(favorites)

  return (
    <div
      data-testid="surfing-hop-strip"
      className={
        variant === 'rail'
          ? 'space-y-2 border-b border-white/10 px-4 pb-3 pt-1 md:px-6'
          : 'pointer-events-auto absolute inset-x-0 bottom-24 z-24 flex justify-center px-4'
      }
    >
      {variant === 'rail' && (
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mist-400">
          Surf · Recents & favorites
        </p>
      )}
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {hopIds.map((id) => {
          const ch = byId.get(id)
          if (!ch) return null
          const isFav = favSet.has(id)
          const isRecent = recentIds[0] === id || recentIds.includes(id)
          return (
            <button
              key={id}
              type="button"
              data-tv-focus
              data-testid={`surf-hop-${id}`}
              onClick={() => playChannel(id)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1.5 text-left transition focus-visible:focus-ring ${
                currentId === id
                  ? 'border-ember-400/50 bg-ember-500/15'
                  : 'border-white/10 bg-ink-900/80 hover:border-ember-400/40'
              }`}
            >
              {ch.logo ? (
                <img src={ch.logo} alt="" className="h-7 w-7 rounded-md object-cover" />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ink-700 text-xs font-bold text-ember-400">
                  {ch.name.slice(0, 1)}
                </span>
              )}
              <span className="max-w-[7rem] truncate text-xs font-medium">{ch.name}</span>
              {isFav ? (
                <Heart size={12} className="shrink-0 fill-ember-400 text-ember-400" />
              ) : isRecent ? (
                <History size={12} className="shrink-0 text-mist-400" />
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
