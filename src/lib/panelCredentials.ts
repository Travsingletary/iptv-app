/**
 * Parse MegaOTT / Xtream-compatible portal or playlist URLs into credentials.
 * Supports:
 * - Portal base: http://host:port
 * - get.php?username=&password=&type=m3u_plus
 * - player_api.php?username=&password=
 * - /live/user/pass/... path style (credentials only; host is still needed)
 */

export type PanelProvider = 'megaott' | 'xtream'

export interface PanelCredentials {
  server: string
  username: string
  password: string
  provider: PanelProvider
}

export interface ParsedPanelInput {
  credentials: PanelCredentials | null
  /** True when the URL looks like an M3U playlist fetch (get.php / .m3u) rather than portal-only. */
  isPlaylistUrl: boolean
  /** Human-readable parse note (no secrets). */
  hint: string
}

function stripTrailingSlash(s: string): string {
  return s.replace(/\/$/, '')
}

export function detectPanelProvider(serverOrUrl: string, hint?: string): PanelProvider {
  const hay = `${serverOrUrl} ${hint ?? ''}`.toLowerCase()
  if (/mega\s*ott|megaott|mega-ott/.test(hay)) return 'megaott'
  return 'xtream'
}

export function providerDisplayName(provider: PanelProvider): string {
  return provider === 'megaott' ? 'MegaOTT' : 'Xtream'
}

/**
 * Normalize a portal host to an origin (scheme + host + optional port).
 * Strips get.php / player_api.php / live|movie|series path segments.
 */
export function normalizePortalBase(input: string): string {
  let raw = input.trim()
  if (!raw) return ''
  if (!/^https?:\/\//i.test(raw)) raw = `http://${raw}`

  try {
    const u = new URL(raw)
    // Drop credential-bearing path endpoints back to origin
    const path = u.pathname.replace(/\/+$/, '')
    if (
      /\/(get\.php|player_api\.php)$/i.test(path) ||
      /\/(live|movie|series)\//i.test(path) ||
      /\.m3u8?$/i.test(path)
    ) {
      return stripTrailingSlash(u.origin)
    }
    // Keep origin only — panels are typically served at host:port root
    if (path && path !== '/') {
      // Some installs put the panel under a subpath (rare); keep up to last useful segment
      const cleaned = path
        .replace(/\/(get\.php|player_api\.php).*$/i, '')
        .replace(/\/(live|movie|series)\/.*$/i, '')
      if (cleaned && cleaned !== '/') {
        return stripTrailingSlash(`${u.origin}${cleaned}`)
      }
    }
    return stripTrailingSlash(u.origin)
  } catch {
    return stripTrailingSlash(raw.replace(/\/(get\.php|player_api\.php).*$/i, ''))
  }
}

/**
 * Try to extract username/password from a MegaOTT / Xtream playlist or API URL.
 */
export function parsePanelOrPlaylistUrl(
  input: string,
  providerHint: PanelProvider = 'megaott',
): ParsedPanelInput {
  const trimmed = input.trim()
  if (!trimmed) {
    return { credentials: null, isPlaylistUrl: false, hint: 'Paste a portal or playlist URL' }
  }

  let url: URL
  try {
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`
    url = new URL(withScheme)
  } catch {
    return {
      credentials: null,
      isPlaylistUrl: false,
      hint: 'Could not parse URL — use http://host:port or a get.php link',
    }
  }

  const provider = detectPanelProvider(trimmed, providerHint)
  const server = normalizePortalBase(trimmed)
  const params = url.searchParams
  let username = params.get('username') || params.get('user') || ''
  let password = params.get('password') || params.get('pass') || ''

  // Path style: /live/USER/PASS/streamId.ext
  if (!username || !password) {
    const parts = url.pathname.split('/').filter(Boolean)
    const liveIdx = parts.findIndex((p) => /^(live|movie|series)$/i.test(p))
    if (liveIdx >= 0 && parts[liveIdx + 1] && parts[liveIdx + 2]) {
      username = decodeURIComponent(parts[liveIdx + 1])
      password = decodeURIComponent(parts[liveIdx + 2])
    }
  }

  const pathLower = url.pathname.toLowerCase()
  const isPlaylistUrl =
    /get\.php$/i.test(pathLower) ||
    /\.m3u8?$/i.test(pathLower) ||
    params.get('type')?.toLowerCase().includes('m3u') === true

  if (username && password && server) {
    return {
      credentials: { server, username, password, provider },
      isPlaylistUrl,
      hint: isPlaylistUrl
        ? `Detected ${providerDisplayName(provider)} playlist URL — credentials extracted`
        : `Detected ${providerDisplayName(provider)} panel credentials`,
    }
  }

  if (server && !username && !password) {
    return {
      credentials: null,
      isPlaylistUrl,
      hint: 'Portal host detected — enter username and password from your MegaOTT email/app',
    }
  }

  return {
    credentials: null,
    isPlaylistUrl,
    hint: 'Need portal URL plus username and password (or a full get.php link)',
  }
}

/** Build a classic get.php M3U URL from portal credentials (for docs / optional fetch). */
export function buildGetPhpPlaylistUrl(creds: Omit<PanelCredentials, 'provider'>, output = 'ts'): string {
  const base = normalizePortalBase(creds.server)
  const params = new URLSearchParams({
    username: creds.username,
    password: creds.password,
    type: 'm3u_plus',
    output,
  })
  return `${base}/get.php?${params.toString()}`
}
