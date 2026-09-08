/**
 * Xtream Codes–compatible API client (MegaOTT and other panels) with demo fallback.
 * Spec: player_api.php?username=&password=&action=
 */
import type { Channel, ContentKind, PlaylistSource } from '../types/iptv.js'
import { DEMO_CHANNELS, DEMO_SOURCE, refreshDemoEpg } from './demoData.js'
import {
  detectPanelProvider,
  normalizePortalBase,
  providerDisplayName,
  type PanelProvider,
} from './panelCredentials.js'

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
  usedDemoFallback: boolean
  message: string
  liveCount: number
  vodCount: number
  seriesCount: number
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
): Channel | null {
  const streamId = rowStreamId(row, kind)
  if (streamId == null || !row.name) return null
  const ext = row.container_extension || 'm3u8'
  const streamKind = kind === 'live' ? 'live' : kind === 'series' ? 'series' : 'movie'
  const archiveHours = Number(row.tv_archive_duration)
  const provider = resolveProvider(creds)
  const idPrefix = provider === 'megaott' ? 'megaott' : 'xtream'
  return {
    id: `${idPrefix}_${kind}_${streamId}`,
    name: row.name,
    group: row.category_name || groupFallback,
    url: buildXtreamStreamUrl(creds, streamKind === 'live' ? 'live' : streamKind === 'series' ? 'series' : 'movie', streamId, ext),
    kind,
    logo: row.stream_icon || row.cover,
    tvgId: row.epg_channel_id,
    catchup: truthyArchive(row.tv_archive),
    poster: row.cover || row.stream_icon,
    rating: row.rating,
    description: row.plot,
    quality: kind === 'live' ? 'HD' : undefined,
    streamId: String(streamId),
    archiveDurationHours: Number.isFinite(archiveHours) && archiveHours > 0 ? archiveHours : undefined,
  }
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
): Promise<XtreamStreamRow[]> {
  const url = buildXtreamApiUrl(creds, action)
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
    for (const key of ['streams', 'data', 'movies', 'series', 'channels']) {
      if (Array.isArray(obj[key])) return obj[key] as XtreamStreamRow[]
    }
  }
  return []
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
 * Ingest live + VOD + series from a MegaOTT / Xtream-compatible panel.
 * On network/auth failure, returns demo pack with usedDemoFallback=true.
 */
export async function ingestXtream(
  creds: XtreamCredentials,
  options: { signal?: AbortSignal; demoOnFailure?: boolean; timeoutMs?: number } = {},
): Promise<XtreamIngestResult> {
  const demoOnFailure = options.demoOnFailure !== false
  // Large MegaOTT panels (tens of thousands of VOD/series rows) need a long window.
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
      usedDemoFallback: true,
      message: `${label} unavailable (${err.message}). Loaded demo pack instead.`,
      liveCount: DEMO_CHANNELS.filter((c) => c.kind === 'live').length,
      vodCount: DEMO_CHANNELS.filter((c) => c.kind === 'movie').length,
      seriesCount: DEMO_CHANNELS.filter((c) => c.kind === 'series').length,
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

      // Live is required for a successful connect. VOD/series are best-effort so a
      // huge catalog or slow panel still yields watchable live channels.
      const liveRows = await fetchAction(creds, 'get_live_streams', signal)
      const live = liveRows
        .map((row) => mapRow(row, creds, 'live', 'Live'))
        .filter((c): c is Channel => Boolean(c))
      if (!live.length) throw new Error(`${label} returned no live streams`)

      let vodRows: XtreamStreamRow[] = []
      let seriesRows: XtreamStreamRow[] = []
      let catalogNote = ''
      try {
        ;[vodRows, seriesRows] = await Promise.all([
          fetchAction(creds, 'get_vod_streams', signal),
          fetchAction(creds, 'get_series', signal),
        ])
      } catch (catalogErr) {
        catalogNote = ` VOD/series skipped (${formatXtreamError(catalogErr)}).`
      }

      const vod = vodRows
        .map((row) => mapRow(row, creds, 'movie', 'VOD'))
        .filter((c): c is Channel => Boolean(c))
      const series = seriesRows
        .map((row) => mapRow(row, creds, 'series', 'Series'))
        .filter((c): c is Channel => Boolean(c))

      const channels = [...live, ...vod, ...series]
      const archiveCount = live.filter((c) => c.catchup).length
      return {
        ok: true,
        source: sourceBase,
        channels,
        usedDemoFallback: false,
        message: `Imported ${live.length} live (${archiveCount} with catch-up), ${vod.length} VOD, ${series.length} series from ${label}.${catalogNote}`,
        liveCount: live.length,
        vodCount: vod.length,
        seriesCount: series.length,
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
      usedDemoFallback: true,
      message: `${label} unavailable (${formatXtreamError(err)}). Loaded demo pack instead.`,
      liveCount: DEMO_CHANNELS.filter((c) => c.kind === 'live').length,
      vodCount: DEMO_CHANNELS.filter((c) => c.kind === 'movie').length,
      seriesCount: DEMO_CHANNELS.filter((c) => c.kind === 'series').length,
    }
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
