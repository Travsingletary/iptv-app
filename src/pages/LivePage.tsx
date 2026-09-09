import { useEffect, useMemo } from 'react'
import { Search } from 'lucide-react'
import {
  selectGroups,
  selectLiveChannels,
  useIptvStore,
} from '../store/useIptvStore'
import { nowPlaying } from '../lib/epg'

/** Channel browser panel — video lives on the Shell canvas behind overlays. */
export function LivePage() {
  const channels = useIptvStore((s) => s.channels)
  const epg = useIptvStore((s) => s.epg)
  const player = useIptvStore((s) => s.player)
  const playChannel = useIptvStore((s) => s.playChannel)
  const setMenuOpen = useIptvStore((s) => s.setMenuOpen)
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

  useEffect(() => {
    if (!player.channelId && filtered[0]) {
      playChannel(filtered[0].id)
    }
  }, [player.channelId, filtered, playChannel])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-3 border-b border-white/10 p-4 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-ember-400">
              Live TV
            </p>
            <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
              Channels
            </h1>
          </div>
          <button
            type="button"
            data-tv-focus
            data-testid="watch-fullscreen"
            onClick={() => setMenuOpen(false)}
            className="rounded-full border border-ember-400/40 bg-ember-500/15 px-4 py-2 text-sm font-medium text-ember-200 hover:border-ember-400/70 focus-visible:focus-ring"
          >
            Watch full screen
          </button>
        </div>
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
            data-tv-focus
            onClick={() => setSelectedGroup(null)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium focus-visible:focus-ring ${
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
              data-tv-focus
              onClick={() => setSelectedGroup(g)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium focus-visible:focus-ring ${
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

      <div className="min-h-0 flex-1 overflow-y-auto p-2 md:p-3">
        {filtered.map((ch) => {
          const program = nowPlaying(epg, ch.tvgId || ch.id)
          const on = player.channelId === ch.id
          return (
            <button
              key={ch.id}
              type="button"
              data-tv-focus
              onClick={() => {
                playChannel(ch.id)
              }}
              className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition focus-visible:focus-ring ${
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
    </div>
  )
}
