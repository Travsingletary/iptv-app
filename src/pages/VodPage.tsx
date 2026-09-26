import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Film, Loader2, Play, Tv, X } from 'lucide-react'
import { selectVod, useIptvStore } from '../store/useIptvStore'
import {
  channelsInCategory,
  pageCount,
  pageSlice,
  rankVodCategories,
  VOD_PAGE_SIZE,
} from '../lib/vodCatalog'

export function VodPage() {
  const channels = useIptvStore((s) => s.channels)
  const player = useIptvStore((s) => s.player)
  const playVodTitle = useIptvStore((s) => s.playVodTitle)
  const setPlayer = useIptvStore((s) => s.setPlayer)
  const setMenuOpen = useIptvStore((s) => s.setMenuOpen)
  const vodCategories = useIptvStore((s) => s.vodCategories)
  const vodLoadedCategoryIds = useIptvStore((s) => s.vodLoadedCategoryIds)
  const vodLoadingCategoryId = useIptvStore((s) => s.vodLoadingCategoryId)
  const vodLoadError = useIptvStore((s) => s.vodLoadError)
  const loadVodCategory = useIptvStore((s) => s.loadVodCategory)
  const sources = useIptvStore((s) => s.sources)
  const activeSourceId = useIptvStore((s) => s.activeSourceId)

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [kindFilter, setKindFilter] = useState<'all' | 'movie' | 'series'>('movie')

  const rankedCats = useMemo(() => {
    const ranked = rankVodCategories(vodCategories)
    if (kindFilter === 'all') return ranked
    return ranked.filter((c) => c.kind === kindFilter)
  }, [vodCategories, kindFilter])

  const activeCategory =
    rankedCats.find((c) => c.id === selectedCategoryId) ?? rankedCats[0] ?? null

  useEffect(() => {
    if (!activeCategory) return
    if (selectedCategoryId !== activeCategory.id) {
      setSelectedCategoryId(activeCategory.id)
      setPage(1)
    }
  }, [activeCategory, selectedCategoryId])

  useEffect(() => {
    if (!activeCategory) return
    if (vodLoadedCategoryIds.includes(activeCategory.id)) return
    if (vodLoadingCategoryId === activeCategory.id) return
    void loadVodCategory(activeCategory.id)
  }, [
    activeCategory,
    vodLoadedCategoryIds,
    vodLoadingCategoryId,
    loadVodCategory,
  ])

  const categoryTitles = useMemo(() => {
    if (!activeCategory) {
      return selectVod(channels)
    }
    if (activeCategory.id.startsWith('demo_')) {
      return selectVod(channels).filter(
        (c) =>
          c.kind === activeCategory.kind &&
          (c.group === activeCategory.name ||
            (!c.group && activeCategory.name === (c.kind === 'movie' ? 'Movies' : 'Series'))),
      )
    }
    return channelsInCategory(channels, activeCategory.id, activeCategory.kind)
  }, [channels, activeCategory])

  const pages = pageCount(categoryTitles.length, VOD_PAGE_SIZE)
  const pageItems = useMemo(
    () => pageSlice(categoryTitles, page, VOD_PAGE_SIZE),
    [categoryTitles, page],
  )

  const detail = channels.find((c) => c.id === detailId)
  const playingVod = channels.find(
    (c) => c.id === player.channelId && c.kind !== 'live',
  )
  const panelSource = sources.find(
    (s) => s.id === activeSourceId && (s.type === 'megaott' || s.type === 'xtream'),
  )
  const movieCatCount = vodCategories.filter((c) => c.kind === 'movie').length
  const seriesCatCount = vodCategories.filter((c) => c.kind === 'series').length

  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="vod-page">
      <header className="shrink-0 space-y-3 border-b border-white/10 px-4 pb-4 pt-6 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-ember-400">
              On demand
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight md:text-4xl">
              Cinema & Series
            </h1>
            <p className="mt-1 max-w-xl text-sm text-mist-300">
              {panelSource
                ? `${movieCatCount} movie · ${seriesCatCount} series categories — titles load per category.`
                : 'Browse posters, open a title, and play on the TV canvas.'}
            </p>
          </div>
          {playingVod && (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-ember-300">
                Now playing <span className="font-semibold">{playingVod.name}</span>
              </p>
              <button
                type="button"
                data-tv-focus
                className="rounded-full border border-white/15 bg-ink-900/80 px-3 py-1.5 text-sm focus-visible:focus-ring"
                onClick={() => setMenuOpen(false)}
              >
                Watch full screen
              </button>
              <button
                type="button"
                data-tv-focus
                className="rounded-full border border-white/15 bg-ink-900/80 px-3 py-1.5 text-sm focus-visible:focus-ring"
                onClick={() => setPlayer({ channelId: null, paused: true })}
              >
                Stop
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-2" data-testid="vod-kind-filter">
          {(
            [
              ['movie', 'Movies', Film],
              ['series', 'Series', Tv],
              ['all', 'All', Film],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              data-tv-focus
              data-testid={`vod-kind-${id}`}
              onClick={() => {
                setKindFilter(id)
                setPage(1)
                setSelectedCategoryId(null)
              }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium focus-visible:focus-ring ${
                kindFilter === id
                  ? 'bg-ember-500 text-ink-950'
                  : 'bg-ink-800 text-mist-300'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        <div
          className="flex gap-2 overflow-x-auto pb-1"
          data-testid="vod-category-chips"
        >
          {rankedCats.map((cat) => {
            const selected = activeCategory?.id === cat.id
            const loaded = vodLoadedCategoryIds.includes(cat.id)
            return (
              <button
                key={`${cat.kind}-${cat.id}`}
                type="button"
                data-tv-focus
                data-testid={`vod-cat-${cat.id}`}
                onClick={() => {
                  setSelectedCategoryId(cat.id)
                  setPage(1)
                  void loadVodCategory(cat.id)
                }}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium focus-visible:focus-ring ${
                  selected
                    ? 'bg-ember-500 text-ink-950'
                    : 'bg-ink-800 text-mist-300'
                }`}
              >
                {cat.name}
                {cat.normalized && cat.normalized !== 'Other' ? (
                  <span className="ml-1 opacity-60">{cat.normalized}</span>
                ) : null}
                {loaded ? <span className="ml-1 opacity-50">·</span> : null}
              </button>
            )
          })}
          {!rankedCats.length && (
            <p className="text-sm text-mist-400">
              No VOD categories yet — connect MegaOTT in Settings.
            </p>
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6" data-testid="vod-grid">
        {vodLoadError && (
          <p className="mb-3 rounded-xl border border-ember-500/30 bg-ember-500/10 px-3 py-2 text-sm text-ember-200">
            {vodLoadError}
          </p>
        )}

        {vodLoadingCategoryId === activeCategory?.id && (
          <div className="mb-4 flex items-center gap-2 text-sm text-mist-300">
            <Loader2 size={16} className="animate-spin text-ember-400" />
            Loading “{activeCategory?.name}”…
          </div>
        )}

        {!pageItems.length && !vodLoadingCategoryId && activeCategory && (
          <p className="text-sm text-mist-400">
            {vodLoadedCategoryIds.includes(activeCategory.id)
              ? 'No titles in this category.'
              : 'Select a category to load titles.'}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {pageItems.map((ch, i) => (
            <motion.button
              key={ch.id}
              type="button"
              data-tv-focus
              data-testid={`vod-title-${ch.id}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.3) }}
              whileHover={{ y: -4 }}
              onClick={() => setDetailId(ch.id)}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-ink-800 text-left focus-visible:focus-ring"
            >
              <div
                className="aspect-[2/3] bg-cover bg-center transition duration-500 group-hover:scale-105"
                style={{
                  backgroundImage: `url(${ch.poster || ch.backdrop || ch.logo || ''})`,
                  backgroundColor: '#1f2a3d',
                }}
              />
              <div className="p-2.5">
                <p className="truncate text-sm font-semibold">{ch.name}</p>
                <p className="truncate text-xs text-mist-400">
                  {[ch.year, ch.rating, ch.containerExtension || ch.quality]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
            </motion.button>
          ))}
        </div>

        {pages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              data-tv-focus
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-full border border-white/15 px-4 py-2 text-sm disabled:opacity-40 focus-visible:focus-ring"
            >
              Previous
            </button>
            <span className="font-mono text-xs text-mist-400">
              Page {page} / {pages} · {categoryTitles.length} titles
            </span>
            <button
              type="button"
              data-tv-focus
              disabled={page >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className="rounded-full border border-white/15 px-4 py-2 text-sm disabled:opacity-40 focus-visible:focus-ring"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {detail && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/75 p-4 backdrop-blur-sm md:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDetailId(null)}
            data-testid="vod-detail"
          >
            <motion.div
              className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-ink-900 shadow-panel"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="h-48 bg-cover bg-center md:h-64"
                style={{
                  backgroundImage: `linear-gradient(180deg, transparent, #0c1018), url(${
                    detail.backdrop || detail.poster || detail.logo || ''
                  })`,
                }}
              />
              <button
                type="button"
                data-tv-focus
                className="absolute right-4 top-4 rounded-full bg-ink-950/70 p-2 focus-visible:focus-ring"
                onClick={() => setDetailId(null)}
              >
                <X size={18} />
              </button>
              <div className="space-y-4 p-6">
                <div>
                  <h2 className="font-display text-2xl font-bold md:text-3xl">
                    {detail.name}
                  </h2>
                  <p className="mt-1 text-sm text-mist-300">
                    {[
                      detail.kind === 'series' ? 'Series' : 'Movie',
                      detail.year,
                      detail.rating,
                      detail.containerExtension,
                      detail.group,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                {detail.description ? (
                  <p className="text-sm leading-relaxed text-sand-100/80">
                    {detail.description}
                  </p>
                ) : (
                  <p className="text-sm text-mist-400">
                    {detail.kind === 'series'
                      ? 'Play starts the first available episode when the panel provides series info.'
                      : 'No plot provided by the panel.'}
                  </p>
                )}
                <button
                  type="button"
                  data-tv-focus
                  data-testid="vod-play"
                  onClick={() => {
                    void playVodTitle(detail.id)
                    setDetailId(null)
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-sand-50 px-5 py-3 text-sm font-semibold text-ink-950 focus-visible:focus-ring"
                >
                  <Play size={16} fill="currentColor" />
                  Play
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
