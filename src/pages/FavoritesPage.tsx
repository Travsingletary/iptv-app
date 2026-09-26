import { ChannelRail } from '../components/browse/ChannelRail'
import { useIptvStore } from '../store/useIptvStore'

export function FavoritesPage() {
  const channels = useIptvStore((s) => s.channels)
  const favorites = useIptvStore((s) => s.favorites)
  const favs = channels.filter((c) => favorites.includes(c.id))
  const live = favs.filter((c) => c.kind === 'live')
  const vod = favs.filter((c) => c.kind !== 'live')

  return (
    <div className="pb-16">
      <header className="px-6 pb-4 pt-8 md:px-10">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-ember-400">
          Saved
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight md:text-5xl">
          Favorites
        </h1>
      </header>
      {favs.length === 0 ? (
        <p className="px-6 text-mist-300 md:px-10">
          Heart a channel or title to build your list.
        </p>
      ) : (
        <>
          {live.length > 0 && <ChannelRail title="Live" channels={live} />}
          {vod.length > 0 && (
            <ChannelRail title="On demand" channels={vod} variant="poster" />
          )}
        </>
      )}
    </div>
  )
}
