/**
 * Xtream Codes API client with graceful demo fallback.
 * Spec: player_api.php?username=&password=&action=
 */
import type { Channel, ContentKind, PlaylistSource } from '../types/iptv.js'
import { DEMO_CHANNELS, DEMO_SOURCE, refreshDemoEpg } from './demoData.js'

export interface XtreamCredentials {
  server: string
  username: string
  password: string
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
  let s = server.trim().replace(/\/$/, '')
  if (!/^https?:\/\//i.test(s)) s = `http://${s}`
  return s
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
  return {
    id: `xtream_${kind}_${streamId}`,
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
      `Xtream ${action} network/CORS failure — use a reachable panel or paste an M3U instead (${err instanceof Error ? err.message : 'fetch failed'})`,
    )
  }
  if (!res.ok) throw new Error(`Xtream ${action} failed (HTTP ${res.status})`)
  let json: unknown
  try {
    json = await res.json()
  } catch {
    throw new Error(`Xtream ${action} returned non-JSON (check server URL)`)
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
      `Cannot reach Xtream panel (network/CORS). Confirm the server URL is browser-reachable.`,
    )
  }
  if (!res.ok) {
    throw new Error(`Xtream auth HTTP ${res.status} — check server URL`)
  }
  let json: unknown
  try {
    json = await res.json()
  } catch {
    throw new Error('Xtream auth returned non-JSON — is this a player_api.php panel?')
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
 * Ingest live + VOD + series from an Xtream panel.
 * On network/auth failure, returns demo pack with usedDemoFallback=true.
 */
export async function ingestXtream(
  creds: XtreamCredentials,
  options: { signal?: AbortSignal; demoOnFailure?: boolean; timeoutMs?: number } = {},
): Promise<XtreamIngestResult> {
  const demoOnFailure = options.demoOnFailure !== false
  const timeoutMs = options.timeoutMs ?? 4_000

  if (!creds.server.trim() || !creds.username.trim() || !creds.password) {
    const err = new Error('Xtream requires server URL, username, and password')
    if (!demoOnFailure) throw err
    return {
      ok: false,
      source: { ...DEMO_SOURCE, createdAt: Date.now() },
      channels: DEMO_CHANNELS,
      usedDemoFallback: true,
      message: `Xtream unavailable (${err.message}). Loaded demo pack instead.`,
      liveCount: DEMO_CHANNELS.filter((c) => c.kind === 'live').length,
      vodCount: DEMO_CHANNELS.filter((c) => c.kind === 'movie').length,
      seriesCount: DEMO_CHANNELS.filter((c) => c.kind === 'series').length,
    }
  }

  const sourceBase: PlaylistSource = {
    id: `xtream_${Date.now().toString(36)}`,
    name: `Xtream · ${creds.username}`,
    type: 'xtream',
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
      if (!ok) throw new Error('Xtream authentication failed — invalid username/password')

      const [liveRows, vodRows, seriesRows] = await Promise.all([
        fetchAction(creds, 'get_live_streams', signal),
        fetchAction(creds, 'get_vod_streams', signal),
        fetchAction(creds, 'get_series', signal),
      ])

      const live = liveRows
        .map((row) => mapRow(row, creds, 'live', 'Live'))
        .filter((c): c is Channel => Boolean(c))
      const vod = vodRows
        .map((row) => mapRow(row, creds, 'movie', 'VOD'))
        .filter((c): c is Channel => Boolean(c))
      const series = seriesRows
        .map((row) => mapRow(row, creds, 'series', 'Series'))
        .filter((c): c is Channel => Boolean(c))

      const channels = [...live, ...vod, ...series]
      if (!channels.length) throw new Error('Xtream returned no streams')

      const archiveCount = live.filter((c) => c.catchup).length
      return {
        ok: true,
        source: sourceBase,
        channels,
        usedDemoFallback: false,
        message: `Imported ${live.length} live (${archiveCount} with catch-up), ${vod.length} VOD, ${series.length} series.`,
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
    return await withTimeout(run(), timeoutMs + 500, 'Xtream ingest')
  } catch (err) {
    if (!demoOnFailure) throw err
    return {
      ok: false,
      source: { ...DEMO_SOURCE, createdAt: Date.now() },
      channels: DEMO_CHANNELS,
      usedDemoFallback: true,
      message: `Xtream unavailable (${formatXtreamError(err)}). Loaded demo pack instead.`,
      liveCount: DEMO_CHANNELS.filter((c) => c.kind === 'live').length,
      vodCount: DEMO_CHANNELS.filter((c) => c.kind === 'movie').length,
      seriesCount: DEMO_CHANNELS.filter((c) => c.kind === 'series').length,
    }
  }
}

/** Demo catchup stub: replay the channel URL with a documented timeshift offset. */
export function buildDemoCatchupStub(channel: Channel, minutesAgo: number): CatchupPlayback {
  if (!channel.catchup) {
    return {
      url: channel.url,
      label: 'Catch-up not advertised for this channel',
      supported: false,
      mode: 'unsupported',
    }
  }
  // Public demo HLS has no real archive — surface a clear stub URL marker for UI/docs.
  const stub = `${channel.url}${channel.url.includes('?') ? '&' : '?'}aether_catchup=${minutesAgo}m`
  return {
    url: stub,
    label: `Timeshift stub · ${minutesAgo} min (demo streams have no archive)`,
    supported: true,
    mode: 'demo_stub',
  }
}

/**
 * Resolve catch-up playback URL.
 * Prefer real Xtream timeshift.php when the active source has panel credentials
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
    (channel.id.startsWith('xtream_')
      ? channel.id.replace(/^xtream_(?:live|movie|series)_/, '')
      : null)

  if (
    source?.type === 'xtream' &&
    source.url &&
    source.username &&
    source.password &&
    streamId
  ) {
    const startUnix = Math.floor(Date.now() / 1000) - minutesAgo * 60
    const durationSec = Math.max(60, minutesAgo * 60)
    const url = buildXtreamCatchupUrl(
      { server: source.url, username: source.username, password: source.password },
      streamId,
      startUnix,
      durationSec,
    )
    return {
      url,
      label: `Xtream timeshift · ${minutesAgo} min ago`,
      supported: true,
      mode: 'xtream',
    }
  }

  return buildDemoCatchupStub(channel, minutesAgo)
}

export function xtreamDemoEpg() {
  return refreshDemoEpg()
}
