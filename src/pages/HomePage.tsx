import { useMemo } from 'react'
import { HeroBanner } from '../components/browse/HeroBanner'
import { ChannelRail } from '../components/browse/ChannelRail'
import {
  selectLiveChannels,
  selectVod,
  useIptvStore,
} from '../store/useIptvStore'

export function HomePage() {
  const channels = useIptvStore((s) => s.channels)
  const favorites = useIptvStore((s) => s.favorites)
  const recentIds = useIptvStore((s) => s.recentIds)

  const live = useMemo(() => selectLiveChannels(channels), [channels])
  const vod = useMemo(() => selectVod(channels), [channels])
  const featured = live[0] || vod[0] || channels[0]
  const favs = channels.filter((c) => favorites.includes(c.id))
  const recent = recentIds
    .map((id) => channels.find((c) => c.id === id))
    .filter(Boolean) as typeof channels

  const byGroup = useMemo(() => {
    const map = new Map<string, typeof channels>()
    for (const ch of live) {
      const list = map.get(ch.group) || []
      list.push(ch)
      map.set(ch.group, list)
    }
    return [...map.entries()].slice(0, 4)
  }, [live])

  if (!featured) {
    return (
      <div className="flex h-full items-center justify-center p-10 text-mist-300">
        No channels loaded. Add a playlist in Settings.
      </div>
    )
  }

  return (
    <div className="pb-16">
      <HeroBanner channel={featured} />
      {recent.length > 0 && (
        <ChannelRail title="Continue watching" channels={recent} />
      )}
      {favs.length > 0 && (
        <ChannelRail title="My list" channels={favs} />
      )}
      <ChannelRail title="Live now" channels={live} />
      {vod.length > 0 && (
        <ChannelRail title="On demand" channels={vod} variant="poster" />
      )}
      {byGroup.map(([group, list]) => (
        <ChannelRail key={group} title={group} channels={list} />
      ))}
    </div>
  )
}
