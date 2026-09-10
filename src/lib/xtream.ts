/**
 * Xtream Codes–compatible API client (MegaOTT and other panels) with demo fallback.
 * Spec: player_api.php?username=&password=&action=
 */
import type { Channel, ContentKind, PlaylistSource, VodCategory } from '../types/iptv.js'
import { normalizeCategory } from './categories.js'
import { DEMO_CHANNELS, DEMO_SOURCE, refreshDemoEpg } from './demoData.js'
import {
  detectPanelProvider,
  normalizePortalBase,
  providerDisplayName,
  type PanelProvider,
} from './panelCredentials.js'
import { demoVodCategoriesFromChannels, rankVodCategories } from './vodCatalog.js'

export interface XtreamCredentials {
  server: string
  username: string
  password: string
  /** User-facing provider; MegaOTT panels speak the same player_api.php dialect. */
  provider?: PanelProvider
}

export interface XtreamIngestResult {
  ok: boolean
  source: PlaylistSource
  channels: Channel[]
  /** Movie/series categories for on-demand lazy browse (not full catalogs). */
  vodCategories: VodCategory[]
  usedDemoFallback: boolean
  message: string
  liveCount: number
  vodCount: number
  seriesCount: number
  /** True when full VOD/series catalogs were skipped in favor of category lists. */
  vodDeferred: boolean
}

export interface VodCategoryLoadResult {
  ok: boolean
  category: VodCategory
  channels: Channel[]
  message: string
}

export interface CatchupPlayback {
  url: string
  label: string
  supported: boolean
  mode: 'xtream' | 'demo_stub' | 'unsupported'
}

function resolveProvider(creds: XtreamCredentials): PanelProvider {
  return creds.provider ?? detectPanelProvider(creds.server)
}

function isPanelSource(source?: PlaylistSource | null): source is PlaylistSource {
  return Boolean(source && (source.type === 'xtream' || source.type === 'megaott'))
}

interface XtreamStreamRow {
  stream_id?: number | string
  series_id?: number | string
  num?: number | string
  name?: string
  category_name?: string
  category_id?: string | number
  stream_icon?: string
  epg_channel_id?: string
  tv_archive?: number | string | boolean
  tv_archive_duration?: number | string
  container_extension?: string
  rating?: string
  plot?: string
  cover?: string
  stream_type?: string
  year?: string | number
}

interface XtreamCategoryRow {
  category_id?: string | number
  category_name?: string
  parent_id?: string | number
}

function normalizeServer(server: string): string {
  return normalizePortalBase(server) || (() => {
    let s = server.trim().replace(/\/$/, '')
    if (!/^https?:\/\//i.test(s)) s = `http://${s}`
    return s
  })()
}

export function buildXtreamApiUrl(
  creds: XtreamCredentials,
  action?: string,
  extra: Record<string, string> = {},
): string {
  const base = normalizeServer(creds.server)
  const params = new URLSearchParams({
    username: creds.username,
    password: creds.password,
    ...extra,
  })
  if (action) params.set('action', action)
  return `${base}/player_api.php?${params.toString()}`
}

export function buildXtreamStreamUrl(
  creds: XtreamCredentials,
  kind: 'live' | 'movie' | 'series',
  streamId: string | number,
  extension = 'm3u8',
): string {
  const base = normalizeServer(creds.server)
  const path =
    kind === 'live' ? 'live' : kind === 'movie' ? 'movie' : 'series'
  return `${base}/${path}/${encodeURIComponent(creds.username)}/${encodeURIComponent(creds.password)}/${streamId}.${extension}`
}

/** Catch-up / timeshift URL when provider supports tv_archive. */
export function buildXtreamCatchupUrl(
  creds: XtreamCredentials,
  streamId: string | number,
  startUnix: number,
  durationSec: number,
): string {
  const base = normalizeServer(creds.server)
  return `${base}/streaming/timeshift.php?username=${encodeURIComponent(creds.username)}&password=${encodeURIComponent(creds.password)}&stream=${streamId}&start=${startUnix}&duration=${durationSec}`
}

function truthyArchive(value: XtreamStreamRow['tv_archive']): boolean {
  return value === 1 || value === '1' || value === true || value === 'true'
}

function rowStreamId(row: XtreamStreamRow, kind: ContentKind): string | number | null {
  if (kind === 'series') {
    const id = row.series_id ?? row.stream_id ?? row.num
    return id == null ? null : id
  }
  const id = row.stream_id ?? row.num
  return id == null ? null : id
}

function mapRow(
  row: XtreamStreamRow,
  creds: XtreamCredentials,
  kind: ContentKind,
  groupFallback: string,
  categoryId?: string | number,
): Channel | null {
  const streamId = rowStreamId(row, kind)
  if (streamId == null || !row.name) return null
  const ext =
    row.container_extension ||
    (kind === 'live' ? 'ts' : 'mp4')
  const streamKind = kind === 'live' ? 'live' : kind === 'series' ? 'series' : 'movie'
  const archiveHours = Number(row.tv_archive_duration)
  const provider = resolveProvider(creds)
  const idPrefix = provider === 'megaott' ? 'megaott' : 'xtream'
  const group = row.category_name || groupFallback
  const yearNum = Number(row.year)
  const providerCategoryId =
    categoryId != null
      ? String(categoryId)
      : row.category_id != null
        ? String(row.category_id)
        : undefined
  return {
    id: `${idPrefix}_${kind}_${streamId}`,
    name: row.name,
    group,
    category: normalizeCategory(group, row.name),
    url: buildXtreamStreamUrl(creds, streamKind === 'live' ? 'live' : streamKind === 'series' ? 'series' : 'movie', streamId, ext),
    kind,
    logo: row.stream_icon || row.cover,
    tvgId: row.epg_channel_id,
    catchup: truthyArchive(row.tv_archive),
    poster: row.cover || row.stream_icon,
    rating: row.rating,
    description: row.plot,
    year: Number.isFinite(yearNum) && yearNum > 1900 ? yearNum : undefined,
    quality: kind === 'live' ? 'HD' : undefined,
    streamId: String(streamId),
    archiveDurationHours: Number.isFinite(archiveHours) && archiveHours > 0 ? archiveHours : undefined,
    providerCategoryId,
    containerExtension: ext,
  }
}

export function mapXtreamCategoryRows(
  rows: XtreamCategoryRow[],
  kind: 'movie' | 'series',
): VodCategory[] {
  const out: VodCategory[] = []
  for (const row of rows) {
    if (row.category_id == null || !row.category_name) continue
    out.push({
      id: String(row.category_id),
      name: row.category_name,
      kind,
      normalized: normalizeCategory(row.category_name),
      parentId:
        row.parent_id != null && String(row.parent_id) !== '0'
          ? String(row.parent_id)
          : undefined,
    })
  }
  return rankVodCategories(out)
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

async function fetchAction(
  creds: XtreamCredentials,
  action: string,
  signal?: AbortSignal,
  extra: Record<string, string> = {},
): Promise<XtreamStreamRow[]> {
  const url = buildXtreamApiUrl(creds, action, extra)
  let res: Response
  try {
    res = await fetch(url, { signal })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw err
    throw new Error(
      `Panel ${action} network/CORS failure — use a reachable portal or paste an M3U instead (${err instanceof Error ? err.message : 'fetch failed'})`,
    )
  }
  if (!res.ok) throw new Error(`Panel ${action} failed (HTTP ${res.status})`)
  let json: unknown
  try {
    json = await res.json()
  } catch {
    throw new Error(`Panel ${action} returned non-JSON (check portal URL)`)
  }
  if (Array.isArray(json)) return json as XtreamStreamRow[]
  // Some panels wrap lists: { streams: [...] } or { data: [...] }
  if (json && typeof json === 'object') {
    const obj = json as Record<string, unknown>
    for (const key of ['streams', 'data', 'movies', 'series', 'channels', 'categories']) {
      if (Array.isArray(obj[key])) return obj[key] as XtreamStreamRow[]
    }
  }
  return []
}

async function fetchCategoryRows(
  creds: XtreamCredentials,
  action: 'get_vod_categories' | 'get_series_categories',
  signal?: AbortSignal,
): Promise<XtreamCategoryRow[]> {
  const rows = await fetchAction(creds, action, signal)
  return rows as XtreamCategoryRow[]
}

async function authenticate(
  creds: XtreamCredentials,
  signal?: AbortSignal,
): Promise<boolean> {
  const url = buildXtreamApiUrl(creds)
  let res: Response
  try {
    res = await fetch(url, { signal })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw err
    throw new Error(
      `Cannot reach panel (network/CORS). Confirm the portal URL is browser-reachable, or paste an M3U.`,
    )
  }
  if (!res.ok) {
    throw new Error(`Panel auth HTTP ${res.status} — check portal URL`)
  }
  let json: unknown
  try {
    json = await res.json()
  } catch {
    throw new Error('Panel auth returned non-JSON — expect player_api.php (MegaOTT / Xtream-compatible)')
  }
  const info = (json as { user_info?: Record<string, unknown> })?.user_info
  if (!info) return false
  const auth = info.auth
  if (auth === 1 || auth === '1' || auth === true) return true
  const status = String(info.status ?? '').toLowerCase()
  if (status === 'active' || status === 'true') return true
  return false
}

export function formatXtreamError(err: unknown): string {
  if (!(err instanceof Error)) return 'unknown error'
  if (/timed out/i.test(err.message)) return 'panel timed out'
  if (/authentication failed|invalid username/i.test(err.message)) return err.message
  if (/network\/CORS|Cannot reach/i.test(err.message)) return err.message
  return err.message
}

/**
 * Ingest live channels + VOD/series *category lists* from a MegaOTT / Xtream panel.
 * Full VOD/series catalogs are intentionally deferred — load per category on demand
 * so large panels (~7k live + tens of thousands of VOD) do not freeze the browser.
 * On network/auth failure, returns demo pack with usedDemoFallback=true.
 */
export async function ingestXtream(
  creds: XtreamCredentials,
  options: { signal?: AbortSignal; demoOnFailure?: boolean; timeoutMs?: number } = {},
): Promise<XtreamIngestResult> {
  const demoOnFailure = options.demoOnFailure !== false
  // Live catalogs on MegaOTT can be large; categories are light.
  const timeoutMs = options.timeoutMs ?? 90_000
  const provider = resolveProvider(creds)
  const label = providerDisplayName(provider)

  if (!creds.server.trim() || !creds.username.trim() || !creds.password) {
    const err = new Error(`${label} requires portal URL, username, and password`)
    if (!demoOnFailure) throw err
    return {
      ok: false,
      source: { ...DEMO_SOURCE, createdAt: Date.now() },
      channels: DEMO_CHANNELS,
      vodCategories: demoVodCategoriesFromChannels(DEMO_CHANNELS),
      usedDemoFallback: true,
      message: `${label} unavailable (${err.message}). Loaded demo pack instead.`,
      liveCount: DEMO_CHANNELS.filter((c) => c.kind === 'live').length,
      vodCount: DEMO_CHANNELS.filter((c) => c.kind === 'movie').length,
      seriesCount: DEMO_CHANNELS.filter((c) => c.kind === 'series').length,
      vodDeferred: false,
    }
  }

  const sourceBase: PlaylistSource = {
    id: `${provider}_${Date.now().toString(36)}`,
    name: `${label} · ${creds.username}`,
    type: provider === 'megaott' ? 'megaott' : 'xtream',
    url: normalizeServer(creds.server),
    username: creds.username,
    password: creds.password,
    createdAt: Date.now(),
  }

  const run = async (): Promise<XtreamIngestResult> => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const onParentAbort = () => controller.abort()
    options.signal?.addEventListener('abort', onParentAbort)
    try {
      const signal = controller.signal
      const ok = await authenticate(creds, signal)
      if (!ok) throw new Error(`${label} authentication failed — invalid username/password`)

      const liveRows = await fetchAction(creds, 'get_live_streams', signal)
      const live = liveRows
        .map((row) => mapRow(row, creds, 'live', 'Live'))
        .filter((c): c is Channel => Boolean(c))
      if (!live.length) throw new Error(`${label} returned no live streams`)

      let vodCategories: VodCategory[] = []
      let catalogNote = ''
      let vodDeferred = true
      try {
        const [vodCatRows, seriesCatRows] = await Promise.all([
          fetchCategoryRows(creds, 'get_vod_categories', signal),
          fetchCategoryRows(creds, 'get_series_categories', signal).catch(() => [] as XtreamCategoryRow[]),
        ])
        const movieCats = mapXtreamCategoryRows(vodCatRows, 'movie')
        const seriesCats = mapXtreamCategoryRows(seriesCatRows, 'series')
        vodCategories = [...movieCats, ...seriesCats]
        catalogNote = ` VOD lazy: ${movieCats.length} movie + ${seriesCats.length} series categories (titles load on browse).`
        vodDeferred = true
      } catch (catalogErr) {
        catalogNote = ` VOD categories skipped (${formatXtreamError(catalogErr)}).`
        vodDeferred = true
      }

      const archiveCount = live.filter((c) => c.catchup).length
      return {
        ok: true,
        source: sourceBase,
        channels: live,
        vodCategories,
        usedDemoFallback: false,
        message: `Imported ${live.length} live (${archiveCount} with catch-up) from ${label}.${catalogNote}`,
        liveCount: live.length,
        vodCount: 0,
        seriesCount: 0,
        vodDeferred,
      }
    } finally {
      clearTimeout(timer)
      options.signal?.removeEventListener('abort', onParentAbort)
    }
  }

  try {
    return await withTimeout(run(), timeoutMs + 5_000, `${label} ingest`)
  } catch (err) {
    if (!demoOnFailure) throw err
    return {
      ok: false,
      source: { ...DEMO_SOURCE, createdAt: Date.now() },
      channels: DEMO_CHANNELS,
      vodCategories: demoVodCategoriesFromChannels(DEMO_CHANNELS),
      usedDemoFallback: true,
      message: `${label} unavailable (${formatXtreamError(err)}). Loaded demo pack instead.`,
      liveCount: DEMO_CHANNELS.filter((c) => c.kind === 'live').length,
      vodCount: DEMO_CHANNELS.filter((c) => c.kind === 'movie').length,
      seriesCount: DEMO_CHANNELS.filter((c) => c.kind === 'series').length,
      vodDeferred: false,
    }
  }
}

/**
 * Load movie or series titles for one panel category (lazy / on-demand).
 */
export async function loadXtreamVodCategory(
  creds: XtreamCredentials,
  category: VodCategory,
  options: { signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<VodCategoryLoadResult> {
  const timeoutMs = options.timeoutMs ?? 60_000
  const label = providerDisplayName(resolveProvider(creds))

  const run = async (): Promise<VodCategoryLoadResult> => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const onParentAbort = () => controller.abort()
    options.signal?.addEventListener('abort', onParentAbort)
    try {
      const signal = controller.signal
      const action = category.kind === 'series' ? 'get_series' : 'get_vod_streams'
      const rows = await fetchAction(creds, action, signal, {
        category_id: String(category.id),
      })
      const channels = rows
        .map((row) =>
          mapRow(row, creds, category.kind, category.name, category.id),
        )
        .filter((c): c is Channel => Boolean(c))
      return {
        ok: true,
        category,
        channels,
        message: `Loaded ${channels.length} ${category.kind === 'series' ? 'series' : 'titles'} in “${category.name}”.`,
      }
    } finally {
      clearTimeout(timer)
      options.signal?.removeEventListener('abort', onParentAbort)
    }
  }

  try {
    return await withTimeout(run(), timeoutMs + 2_000, `${label} VOD category`)
  } catch (err) {
    return {
      ok: false,
      category,
      channels: [],
      message: `Could not load “${category.name}” (${formatXtreamError(err)}).`,
    }
  }
}

/**
 * Resolve a playable episode URL for a series title via get_series_info.
 * Prefers season 1 / earliest episode when available.
 */
export async function resolveSeriesPlaybackUrl(
  creds: XtreamCredentials,
  seriesId: string | number,
  options: { signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<{ url: string; label: string; episodeId: string; extension: string } | null> {
  const timeoutMs = options.timeoutMs ?? 30_000
  const run = async () => {
    const url = buildXtreamApiUrl(creds, 'get_series_info', {
      series_id: String(seriesId),
    })
    const res = await fetch(url, { signal: options.signal })
    if (!res.ok) throw new Error(`get_series_info HTTP ${res.status}`)
    const json = (await res.json()) as {
      episodes?: Record<string, Array<{ id?: string | number; title?: string; container_extension?: string }>>
    }
    const episodes = json.episodes
    if (!episodes || typeof episodes !== 'object') return null
    const seasons = Object.keys(episodes).sort((a, b) => Number(a) - Number(b))
    for (const season of seasons) {
      const list = episodes[season]
      if (!Array.isArray(list) || !list.length) continue
      const ep = list[0]
      if (ep?.id == null) continue
      const ext = ep.container_extension || 'mp4'
      return {
        url: buildXtreamStreamUrl(creds, 'series', ep.id, ext),
        label: ep.title || `S${season}E1`,
        episodeId: String(ep.id),
        extension: ext,
      }
    }
    return null
  }
  try {
    return await withTimeout(run(), timeoutMs, 'series info')
  } catch {
    return null
  }
}

/** Demo / unavailable-archive stub: documented timeshift offset marker. */
export function buildDemoCatchupStub(
  channel: Channel,
  minutesAgo: number,
  provider: PanelProvider = 'megaott',
): CatchupPlayback {
  if (!channel.catchup) {
    return {
      url: channel.url,
      label: 'Catch-up not advertised for this channel',
      supported: false,
      mode: 'unsupported',
    }
  }
  const label = providerDisplayName(provider)
  // Public demo HLS has no real archive — surface a clear stub URL marker for UI/docs.
  const stub = `${channel.url}${channel.url.includes('?') ? '&' : '?'}aether_catchup=${minutesAgo}m`
  return {
    url: stub,
    label: `Timeshift stub · ${minutesAgo} min (${label} archive unavailable on this stream)`,
    supported: true,
    mode: 'demo_stub',
  }
}

/**
 * Resolve catch-up playback URL.
 * Prefer real timeshift.php when a MegaOTT / Xtream-compatible source has credentials
 * and the channel advertises archive; otherwise use the demo stub.
 */
export function resolveCatchupPlayback(
  channel: Channel,
  minutesAgo: number,
  source?: PlaylistSource | null,
): CatchupPlayback {
  if (!channel.catchup) {
    return {
      url: channel.url,
      label: 'Catch-up not advertised for this channel',
      supported: false,
      mode: 'unsupported',
    }
  }

  const streamId =
    channel.streamId ||
    (channel.id.match(/^(?:xtream|megaott)_(?:live|movie|series)_(.+)$/)?.[1] ?? null)

  if (isPanelSource(source) && source.url && source.username && source.password && streamId) {
    const startUnix = Math.floor(Date.now() / 1000) - minutesAgo * 60
    const durationSec = Math.max(60, minutesAgo * 60)
    const url = buildXtreamCatchupUrl(
      { server: source.url, username: source.username, password: source.password },
      streamId,
      startUnix,
      durationSec,
    )
    const label = providerDisplayName(source.type === 'megaott' ? 'megaott' : 'xtream')
    return {
      url,
      label: `${label} timeshift · ${minutesAgo} min ago`,
      supported: true,
      mode: 'xtream',
    }
  }

  const stubProvider: PanelProvider =
    source?.type === 'xtream' ? 'xtream' : 'megaott'
  return buildDemoCatchupStub(channel, minutesAgo, stubProvider)
}

export function xtreamDemoEpg() {
  return refreshDemoEpg()
}
