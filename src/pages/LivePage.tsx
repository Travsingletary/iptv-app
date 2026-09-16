import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import {
  selectLiveChannels,
  useIptvStore,
} from '../store/useIptvStore'
import { nowPlaying } from '../lib/epg'
import { channelDisplayNumber } from '../lib/channelSurfing'
import {
  FAVORITES_CHIP,
  channelCategory,
  rankCategoryChips,
  rankChannelSearch,
} from '../lib/categories'
import { computeVirtualWindow } from '../lib/virtualWindow'
import { SurfingHopStrip } from '../components/player/SurfingHopStrip'
import type { Channel } from '../types/iptv'
import type { EpgProgram } from '../types/iptv'

const ROW_HEIGHT = 56

const ChannelRow = memo(function ChannelRow({
  ch,
  on,
  program,
  displayNumber,
}: {
  ch: Channel
  on: boolean
  program?: EpgProgram
  displayNumber: number
}) {
  const playChannel = useIptvStore((s) => s.playChannel)
  const bucket = channelCategory(ch)
  return (
    <button
      type="button"
      data-tv-focus
      data-testid={on ? 'live-channel-on-air' : undefined}
      data-on-air={on ? 'true' : undefined}
      data-channel-id={ch.id}
      onClick={() => playChannel(ch.id)}
      style={{ height: ROW_HEIGHT }}
      className={`flex w-full items-center gap-3 rounded-xl px-3 text-left transition focus-visible:focus-ring ${
        on ? 'bg-ember-500/15 ring-1 ring-ember-400/40' : 'hover:bg-white/5'
      }`}
    >
      <span className="w-8 shrink-0 text-right font-mono text-[11px] tabular-nums text-mist-400">
        {displayNumber}
      </span>
      {ch.logo ? (
        <img src={ch.logo} alt="" className="h-10 w-10 rounded-lg object-cover" loading="lazy" />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-700 font-display font-bold text-ember-400">
          {ch.name.slice(0, 1)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{ch.name}</p>
        <p className="truncate text-xs text-mist-300">
          {program?.title ||
            (ch.group && ch.group !== bucket ? `${bucket} · ${ch.group}` : ch.group || bucket)}
        </p>
      </div>
      {on && (
        <span className="font-mono text-[10px] uppercase tracking-wider text-ember-400">
          On air
        </span>
      )}
    </button>
  )
})

/** Channel browser panel — video lives on the Shell canvas behind overlays. */
export function LivePage() {
  const channels = useIptvStore((s) => s.channels)
  const epg = useIptvStore((s) => s.epg)
  const playerChannelId = useIptvStore((s) => s.player.channelId)
  const playChannel = useIptvStore((s) => s.playChannel)
  const setMenuOpen = useIptvStore((s) => s.setMenuOpen)
  const selectedGroup = useIptvStore((s) => s.selectedGroup)
  const setSelectedGroup = useIptvStore((s) => s.setSelectedGroup)
  const search = useIptvStore((s) => s.search)
  const setSearch = useIptvStore((s) => s.setSearch)
  const favorites = useIptvStore((s) => s.favorites)
  const recentIds = useIptvStore((s) => s.recentIds)
  const surfingPreviewId = useIptvStore((s) => s.surfing.previewChannelId)

  const [draftSearch, setDraftSearch] = useState(search)
  const listRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(640)

  const live = useMemo(() => selectLiveChannels(channels), [channels])
  const chips = useMemo(
    () =>
      rankCategoryChips({
        channels: live,
        favorites,
        recentIds,
      }),
    [live, favorites, recentIds],
  )

  const filtered = useMemo(
    () =>
      rankChannelSearch({
        channels: live,
        query: search,
        selectedCategory: selectedGroup,
        favorites,
        recentIds,
      }),
    [live, selectedGroup, search, favorites, recentIds],
  )

  // Debounce search so 7k-channel ranking does not run on every keypress.
  useEffect(() => {
    setDraftSearch(search)
  }, [search])
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (draftSearch !== search) setSearch(draftSearch)
    }, 120)
    return () => window.clearTimeout(t)
  }, [draftSearch, search, setSearch])

  useEffect(() => {
    if (!playerChannelId && filtered[0]) {
      playChannel(filtered[0].id)
    }
  }, [playerChannelId, filtered, playChannel])

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const measure = () => setViewportHeight(el.clientHeight || 640)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const onAirId = surfingPreviewId || playerChannelId

  // Keep the tuned / preview channel in the virtual window when the Live rail opens.
  useEffect(() => {
    if (!onAirId || !listRef.current) return
    const idx = filtered.findIndex((c) => c.id === onAirId)
    if (idx < 0) return
    const top = idx * ROW_HEIGHT
    const el = listRef.current
    if (top < el.scrollTop || top > el.scrollTop + el.clientHeight - ROW_HEIGHT) {
      el.scrollTop = Math.max(0, top - el.clientHeight / 3)
      setScrollTop(el.scrollTop)
    }
  }, [onAirId, filtered])

  const windowed = useMemo(
    () =>
      computeVirtualWindow({
        scrollTop,
        viewportHeight,
        itemCount: filtered.length,
        itemHeight: ROW_HEIGHT,
        overscan: 10,
      }),
    [scrollTop, viewportHeight, filtered.length],
  )

  const visibleRows = useMemo(
    () => filtered.slice(windowed.start, windowed.end),
    [filtered, windowed.start, windowed.end],
  )

  const onScroll = useCallback(() => {
    const el = listRef.current
    if (!el) return
    setScrollTop(el.scrollTop)
  }, [])

  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="live-page">
      <div className="space-y-3 border-b border-white/10 p-4 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-ember-400">
              Live TV
            </p>
            <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
              Channels
            </h1>
            <p
              className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-mist-400"
              data-testid="live-channel-count"
            >
              {filtered.length === live.length
                ? `${live.length.toLocaleString()} live`
                : `${filtered.length.toLocaleString()} of ${live.length.toLocaleString()} live`}
            </p>
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
            value={draftSearch}
            onChange={(e) => setDraftSearch(e.target.value)}
            placeholder="Search channels"
            data-testid="live-channel-search"
            data-tv-focus
            className="w-full rounded-xl border border-white/10 bg-ink-850 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-ember-400/50"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" data-testid="live-category-chips">
          <button
            type="button"
            data-tv-focus
            data-testid="chip-all"
            onClick={() => setSelectedGroup(null)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium focus-visible:focus-ring ${
              !selectedGroup
                ? 'bg-ember-500 text-ink-950'
                : 'bg-ink-800 text-mist-300'
            }`}
          >
            All
            <span className="ml-1 opacity-60">{live.length}</span>
          </button>
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              data-tv-focus
              data-testid={`chip-${chip.id === FAVORITES_CHIP ? 'favorites' : chip.id.toLowerCase()}`}
              onClick={() => setSelectedGroup(chip.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium focus-visible:focus-ring ${
                selectedGroup === chip.id
                  ? 'bg-ember-500 text-ink-950'
                  : 'bg-ink-800 text-mist-300'
              }`}
            >
              {chip.label}
              <span className="ml-1 opacity-60">{chip.count}</span>
            </button>
          ))}
        </div>
      </div>

      <SurfingHopStrip variant="rail" />

      <div
        ref={listRef}
        onScroll={onScroll}
        className="min-h-0 flex-1 overflow-y-auto p-2 md:p-3"
        data-testid="live-channel-list"
        data-virtual-count={visibleRows.length}
        data-catalog-count={filtered.length}
      >
        <div style={{ height: windowed.totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${windowed.offsetY}px)` }}>
            {visibleRows.map((ch, i) => {
              const absoluteIndex = windowed.start + i
              // Prefer LCN; when filtering, still show provider number or absolute filtered index.
              const liveIndex = live.findIndex((c) => c.id === ch.id)
              const displayNumber = channelDisplayNumber(
                ch,
                liveIndex >= 0 ? liveIndex : absoluteIndex,
              )
              return (
                <ChannelRow
                  key={ch.id}
                  ch={ch}
                  on={onAirId === ch.id}
                  displayNumber={displayNumber}
                  program={nowPlaying(epg, ch.tvgId || ch.id)}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
