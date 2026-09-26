import { describe, expect, it } from 'vitest'
import {
  buildGetPhpPlaylistUrl,
  detectPanelProvider,
  isWebsiteAccountUrl,
  normalizePortalBase,
  parsePanelOrPlaylistUrl,
  providerDisplayName,
  WEBSITE_ACCOUNT_URL_HINT,
} from './panelCredentials'

describe('panelCredentials', () => {
  it('detects MegaOTT from host or hint text', () => {
    expect(detectPanelProvider('http://megaott.example:8080')).toBe('megaott')
    expect(detectPanelProvider('http://dns.example:8080', 'MegaOTT welcome')).toBe('megaott')
    expect(detectPanelProvider('http://panel.example:8080')).toBe('xtream')
  })

  it('normalizes portal base from get.php and player_api URLs', () => {
    expect(
      normalizePortalBase(
        'http://host.example:8080/get.php?username=u&password=p&type=m3u_plus',
      ),
    ).toBe('http://host.example:8080')
    expect(
      normalizePortalBase('http://host.example:8080/player_api.php?username=u&password=p'),
    ).toBe('http://host.example:8080')
    expect(normalizePortalBase('host.example:8080')).toBe('http://host.example:8080')
  })

  it('unwraps meza.in Samsung/LG DNS rewriter paths to the real panel host', () => {
    expect(normalizePortalBase('http://meza.in/iranksxt.fhvpnw.com')).toBe(
      'http://iranksxt.fhvpnw.com',
    )
    expect(normalizePortalBase('http://meza.in/panel.example:8080')).toBe(
      'http://panel.example:8080',
    )
  })

  it('extracts credentials from get.php playlist URLs without echoing secrets in hint', () => {
    const parsed = parsePanelOrPlaylistUrl(
      'http://cdn.megaott.tv:8080/get.php?username=alice&password=s3cret&type=m3u_plus&output=ts',
      'megaott',
    )
    expect(parsed.isPlaylistUrl).toBe(true)
    expect(parsed.credentials).toEqual({
      server: 'http://cdn.megaott.tv:8080',
      username: 'alice',
      password: 's3cret',
      provider: 'megaott',
    })
    expect(parsed.hint).toMatch(/MegaOTT playlist/i)
    expect(parsed.hint).not.toContain('s3cret')
    expect(parsed.hint).not.toContain('alice')
  })

  it('extracts credentials from live path style URLs', () => {
    const parsed = parsePanelOrPlaylistUrl(
      'http://panel.example:8080/live/bob/passw0rd/42.m3u8',
      'xtream',
    )
    expect(parsed.credentials?.username).toBe('bob')
    expect(parsed.credentials?.password).toBe('passw0rd')
    expect(parsed.credentials?.server).toBe('http://panel.example:8080')
  })

  it('returns portal-only hint when URL has no credentials', () => {
    const parsed = parsePanelOrPlaylistUrl('http://portal.megaott.net:25461', 'megaott')
    expect(parsed.credentials).toBeNull()
    expect(parsed.hint).toMatch(/username and password/i)
  })

  it('rejects website account URLs such as megaott.net/login', () => {
    expect(isWebsiteAccountUrl('https://megaott.net/login')).toBe(true)
    expect(isWebsiteAccountUrl('https://www.megaott.net/')).toBe(true)
    expect(isWebsiteAccountUrl('http://portal.megaott.net:25461')).toBe(false)
    expect(
      isWebsiteAccountUrl(
        'http://cdn.megaott.tv:8080/get.php?username=u&password=p&type=m3u_plus',
      ),
    ).toBe(false)

    const parsed = parsePanelOrPlaylistUrl('https://megaott.net/login', 'megaott')
    expect(parsed.credentials).toBeNull()
    expect(parsed.hint).toBe(WEBSITE_ACCOUNT_URL_HINT)
    expect(normalizePortalBase('https://megaott.net/login')).toBe('')
  })

  it('builds get.php playlist URL', () => {
    const url = buildGetPhpPlaylistUrl({
      server: 'http://host.example:8080/',
      username: 'u',
      password: 'p',
    })
    expect(url).toBe(
      'http://host.example:8080/get.php?username=u&password=p&type=m3u_plus&output=ts',
    )
  })

  it('labels providers for UI copy', () => {
    expect(providerDisplayName('megaott')).toBe('MegaOTT')
    expect(providerDisplayName('xtream')).toBe('Xtream')
  })
})
