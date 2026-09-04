import { useEffect, useMemo } from 'react'
import { Search } from 'lucide-react'
import { VideoPlayer } from '../components/player/VideoPlayer'
import { PlayerChrome } from '../components/player/PlayerChrome'
import {
  selectGroups,
  selectLiveChannels,
  useIptvStore,
} from '../store/useIptvStore'
import { nowPlaying } from '../lib/epg'

export function LivePage() {
  const channels = useIptvStore((s) => s.channels)
  const epg = useIptvStore((s) => s.epg)
  const player = useIptvStore((s) => s.player)
  const playChannel = useIptvStore((s) => s.playChannel)
  const setPlayer = useIptvStore((s) => s.setPlayer)
  const selectedGroup = useIptvStore((s) => s.selectedGroup)
  const setSelectedGroup = useIptvStore((s) => s.setSelectedGroup)
  const search = useIptvStore((s) => s.search)
  const setSearch = useIptvStore((s) => s.setSearch)

  const live = useMemo(() => selectLiveChannels(channels), [channels])
  const groups = useMemo(() => selectGroups(live), [live])

  const filtered = useMemo(() => {
    return live.filter((c) => {
      if (selectedGroup && c.group !== selectedGroup) return false
      if (!search.trim()) return true
      const hay = `${c.name} ${c.group}`.toLowerCase()
      return hay.includes(search.toLowerCase())
    })
  }, [live, selectedGroup, search])

  const active = channels.find((c) => c.id === player.channelId) || filtered[0]

  useEffect(() => {
    if (!player.channelId && filtered[0]) {
      playChannel(filtered[0].id)
    }
  }, [player.channelId, filtered, playChannel])

  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row">
      <div
        className="relative aspect-video w-full shrink-0 bg-black lg:aspect-auto lg:h-full lg:w-[62%]"
        onMouseMove={() => setPlayer({ overlayVisible: true })}
        onClick={() => setPlayer({ overlayVisible: true })}
      >
        {active ? (
          <>
            <VideoPlayer />
            <PlayerChrome />
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-mist-400">
            No live channels
          </div>
        )}
      </div>

      <aside className="flex min-h-0 flex-1 flex-col border-t border-white/10 bg-ink-900/60 lg:border-l lg:border-t-0">
        <div className="space-y-3 border-b border-white/10 p-4">
          <h1 className="font-display text-xl font-bold">Live TV</h1>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-mist-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search channels"
              className="w-full rounded-xl border border-white/10 bg-ink-850 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-ember-400/50"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedGroup(null)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                !selectedGroup
                  ? 'bg-ember-500 text-ink-950'
                  : 'bg-ink-800 text-mist-300'
              }`}
            >
              All
            </button>
            {groups.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setSelectedGroup(g)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                  selectedGroup === g
                    ? 'bg-ember-500 text-ink-950'
                    : 'bg-ink-800 text-mist-300'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {filtered.map((ch) => {
            const program = nowPlaying(epg, ch.tvgId || ch.id)
            const on = player.channelId === ch.id
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => playChannel(ch.id)}
                className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                  on
                    ? 'bg-ember-500/15 ring-1 ring-ember-400/40'
                    : 'hover:bg-white/5'
                }`}
              >
                {ch.logo ? (
                  <img
                    src={ch.logo}
                    alt=""
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-700 font-display font-bold text-ember-400">
                    {ch.name.slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{ch.name}</p>
                  <p className="truncate text-xs text-mist-300">
                    {program?.title || ch.group}
                  </p>
                </div>
                {on && (
                  <span className="font-mono text-[10px] uppercase tracking-wider text-ember-400">
                    On air
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </aside>
    </div>
  )
}
