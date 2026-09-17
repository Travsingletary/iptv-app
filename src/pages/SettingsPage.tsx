import { useEffect, useState, type FormEvent } from 'react'
import { useIptvStore } from '../store/useIptvStore'
import { getActiveProfile } from '../lib/profiles'
import {
  getAuthSnapshot,
  onAuthChange,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  type AuthSnapshot,
} from '../lib/supabaseAuth'
import { probeAiModeStatus, type AiModeStatus } from '../lib/aiMode'
import {
  AI_PROVIDER_PRESETS,
  clearAiByokKey,
  clearAiByokSettings,
  getProviderPreset,
  loadAiByokSettings,
  maskApiKey,
  resolveByokEndpoint,
  saveAiByokSettings,
  type AiByokSettings,
  type AiProviderId,
} from '../lib/aiByok'
import { probeProviderConnection } from '../lib/providerAdapter'
import {
  isWebsiteAccountUrl,
  normalizePortalBase,
  parsePanelOrPlaylistUrl,
  WEBSITE_ACCOUNT_URL_HINT,
} from '../lib/panelCredentials'

function AuthSection() {
  const [auth, setAuth] = useState<AuthSnapshot | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    void getAuthSnapshot().then(setAuth)
    return onAuthChange(setAuth)
  }, [])

  if (!auth || auth.mode === 'disabled') {
    return (
      <section className="glass-panel space-y-3 rounded-3xl p-5 md:p-6">
        <div>
          <h2 className="font-display text-lg font-semibold">Account</h2>
          <p className="mt-1 text-sm text-mist-300">
            Optional Supabase Auth for production RLS. Without credentials the app stays fully
            usable in demo mode.
          </p>
        </div>
        <p
          data-testid="auth-demo-state"
          className="rounded-xl border border-white/10 bg-ink-850/80 px-3 py-2 text-sm text-mist-300"
        >
          Auth disabled — set <span className="font-mono text-sand-100">VITE_SUPABASE_URL</span> and{' '}
          <span className="font-mono text-sand-100">VITE_SUPABASE_ANON_KEY</span> to enable sign-in.
        </p>
      </section>
    )
  }

  const onSignIn = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    const result = await signInWithPassword(email, password)
    setMessage(result.ok ? 'Signed in.' : result.error)
    setBusy(false)
  }

  const onSignUp = async () => {
    setBusy(true)
    setMessage(null)
    const result = await signUpWithPassword(email, password)
    setMessage(
      result.ok
        ? 'Sign-up submitted. Check email confirmation if your project requires it.'
        : result.error,
    )
    setBusy(false)
  }

  const onSignOut = async () => {
    setBusy(true)
    setMessage(null)
    const result = await signOut()
    setMessage(result.ok ? 'Signed out.' : result.error)
    setBusy(false)
  }

  return (
    <section className="glass-panel space-y-4 rounded-3xl p-5 md:p-6">
      <div>
        <h2 className="font-display text-lg font-semibold">Account</h2>
        <p className="mt-1 text-sm text-mist-300">
          Sign in so reminder sync and telemetry can scope rows by{' '}
          <span className="font-mono text-xs">auth.uid()</span> (see{' '}
          <span className="font-mono text-xs">supabase/RLS.md</span>).
        </p>
      </div>
      {auth.mode === 'signed_in' ? (
        <div className="space-y-3">
          <p data-testid="auth-signed-in" className="text-sm text-sand-100">
            Signed in as <span className="font-medium">{auth.email ?? auth.userId}</span>
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onSignOut()}
            className="rounded-full border border-white/15 px-4 py-2 text-sm hover:border-ember-400/50 disabled:opacity-40"
            data-tv-focus
          >
            Sign out
          </button>
        </div>
      ) : (
        <form onSubmit={onSignIn} className="space-y-3">
          <label className="block text-sm">
            Email
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-ink-850 px-3 py-2 outline-none focus:border-ember-400/50"
              data-tv-focus
              data-testid="auth-email"
            />
          </label>
          <label className="block text-sm">
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-ink-850 px-3 py-2 outline-none focus:border-ember-400/50"
              data-tv-focus
              data-testid="auth-password"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={busy || !email.trim() || !password}
              className="rounded-full bg-sand-50 px-4 py-2 text-sm font-semibold text-ink-950 disabled:opacity-40"
              data-tv-focus
            >
              Sign in
            </button>
            <button
              type="button"
              disabled={busy || !email.trim() || !password}
              onClick={() => void onSignUp()}
              className="rounded-full border border-white/15 px-4 py-2 text-sm disabled:opacity-40"
              data-tv-focus
            >
              Sign up
            </button>
          </div>
        </form>
      )}
      {message && (
        <p className="rounded-xl border border-ember-400/30 bg-ember-500/10 px-3 py-2 text-sm text-sand-100">
          {message}
        </p>
      )}
    </section>
  )
}

function AiModeSection() {
  const [status, setStatus] = useState<AiModeStatus | null>(null)
  const [settings, setSettings] = useState<AiByokSettings>(() => loadAiByokSettings())
  const [keyDraft, setKeyDraft] = useState('')
  const [editingKey, setEditingKey] = useState(false)
  const [probeMsg, setProbeMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const refreshStatus = () => {
    void probeAiModeStatus().then(setStatus)
  }

  useEffect(() => {
    refreshStatus()
  }, [])

  const preset = getProviderPreset(settings.provider)
  const keySaved = Boolean(settings.apiKey.trim())
  const showCustomBase = settings.provider === 'custom' || Boolean(settings.baseUrl)

  const persist = (patch: Partial<AiByokSettings>) => {
    const next = saveAiByokSettings(patch)
    setSettings(next)
    refreshStatus()
    return next
  }

  const onSaveKey = () => {
    const trimmed = keyDraft.trim()
    if (!trimmed) return
    persist({ apiKey: trimmed })
    setKeyDraft('')
    setEditingKey(false)
    setProbeMsg('API key saved on this device.')
  }

  const onClearKey = () => {
    const next = clearAiByokKey()
    setSettings(next)
    setKeyDraft('')
    setEditingKey(false)
    setProbeMsg('API key cleared — Mock AI active.')
    refreshStatus()
  }

  const onClearAll = () => {
    const next = clearAiByokSettings()
    setSettings(next)
    setKeyDraft('')
    setEditingKey(false)
    setProbeMsg('AI settings reset.')
    refreshStatus()
  }

  const onTest = async () => {
    setBusy(true)
    setProbeMsg(null)
    try {
      const current = loadAiByokSettings()
      const endpoint = resolveByokEndpoint(current)
      if (!endpoint) {
        setProbeMsg('Add an API key (and base URL for Custom) before testing.')
        return
      }
      const result = await probeProviderConnection({
        apiKey: endpoint.apiKey,
        provider: endpoint.provider,
        baseUrl: endpoint.transportBaseUrl,
        model: endpoint.model,
      })
      setProbeMsg(result.ok ? `Live OK — ${result.detail}` : `Probe failed — ${result.detail}`)
      refreshStatus()
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="glass-panel space-y-4 rounded-3xl p-5 md:p-6" data-testid="ai-byok-section">
      <div>
        <h2 className="font-display text-lg font-semibold">Assistant AI</h2>
        <p className="mt-1 text-sm text-mist-300">
          Paste your own API key from any provider. Keys stay in this device&apos;s local storage
          (Capacitor WebView / browser) — never committed to git. Without a key the assistant stays
          honest <span className="text-sand-100">Mock AI</span>.
        </p>
      </div>

      <div
        data-testid="ai-mode-indicator"
        className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-ink-850/80 px-4 py-3"
      >
        <span
          className={`rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] ${
            status?.mode === 'live'
              ? 'border border-ember-400/40 bg-ember-500/15 text-ember-300'
              : 'border border-white/15 bg-ink-900 text-mist-200'
          }`}
        >
          {status?.label ?? 'Checking…'}
        </span>
        <p className="text-sm text-mist-300" data-testid="ai-mode-detail">
          {status?.detail ?? 'Probing…'}
        </p>
      </div>

      <label className="block text-sm">
        Provider
        <select
          value={settings.provider}
          onChange={(e) => {
            const provider = e.target.value as AiProviderId
            const nextPreset = getProviderPreset(provider)
            persist({
              provider,
              // Clear custom base when switching away from custom unless user already overrode.
              baseUrl: provider === 'custom' ? settings.baseUrl : '',
              model: settings.model || nextPreset.defaultModel,
            })
            setProbeMsg(null)
          }}
          className="mt-1 w-full rounded-xl border border-white/10 bg-ink-850 px-3 py-2.5 outline-none focus:border-ember-400/50"
          data-tv-focus
          data-testid="ai-provider-select"
          aria-label="AI provider"
        >
          {AI_PROVIDER_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs text-mist-400" data-testid="ai-provider-hint">
        {preset.hint}
        {preset.corsRisk === 'high' ? ' High CORS risk in browser/APK.' : ''}
      </p>

      <div className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <label className="block min-w-[12rem] flex-1 text-sm">
            API key
            {editingKey || !keySaved ? (
              <input
                type="password"
                autoComplete="off"
                value={keyDraft}
                onChange={(e) => setKeyDraft(e.target.value)}
                placeholder="sk-… or provider key"
                className="mt-1 w-full rounded-xl border border-white/10 bg-ink-850 px-3 py-2.5 font-mono text-sm outline-none focus:border-ember-400/50"
                data-tv-focus
                data-testid="ai-api-key-input"
                aria-label="AI API key"
              />
            ) : (
              <input
                type="text"
                readOnly
                value={maskApiKey(settings.apiKey)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-ink-850/80 px-3 py-2.5 font-mono text-sm text-mist-200"
                data-testid="ai-api-key-masked"
                aria-label="Masked AI API key"
              />
            )}
          </label>
          <div className="flex flex-wrap gap-2">
            {editingKey || !keySaved ? (
              <button
                type="button"
                disabled={!keyDraft.trim()}
                onClick={onSaveKey}
                className="rounded-full bg-sand-50 px-4 py-2 text-sm font-semibold text-ink-950 disabled:opacity-40"
                data-tv-focus
                data-testid="ai-save-key"
              >
                Save key
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditingKey(true)
                  setKeyDraft('')
                }}
                className="rounded-full border border-white/15 px-4 py-2 text-sm"
                data-tv-focus
                data-testid="ai-replace-key"
              >
                Replace
              </button>
            )}
            <button
              type="button"
              disabled={!keySaved}
              onClick={onClearKey}
              className="rounded-full border border-white/15 px-4 py-2 text-sm text-red-200 disabled:opacity-40"
              data-tv-focus
              data-testid="ai-clear-key"
            >
              Clear key
            </button>
          </div>
        </div>
        <p className="text-xs text-mist-400">
          Warning: the key is stored in localStorage on this device. Anyone with device access can
          read it. Do not use production billing keys on shared Fire Sticks.
        </p>
      </div>

      <label className="block text-sm">
        Model override (optional)
        <input
          value={settings.model}
          onChange={(e) => persist({ model: e.target.value })}
          placeholder={preset.defaultModel}
          className="mt-1 w-full rounded-xl border border-white/10 bg-ink-850 px-3 py-2 outline-none focus:border-ember-400/50"
          data-tv-focus
          data-testid="ai-model-input"
          aria-label="AI model override"
        />
      </label>

      {(showCustomBase || settings.provider === 'custom') && (
        <label className="block text-sm">
          Base URL {settings.provider === 'custom' ? '(required)' : '(optional override)'}
          <input
            value={settings.baseUrl}
            onChange={(e) => persist({ baseUrl: e.target.value })}
            placeholder={preset.defaultBaseUrl || 'https://host/v1'}
            className="mt-1 w-full rounded-xl border border-white/10 bg-ink-850 px-3 py-2 font-mono text-xs outline-none focus:border-ember-400/50"
            data-tv-focus
            data-testid="ai-base-url-input"
            aria-label="AI base URL"
          />
        </label>
      )}

      {settings.provider !== 'custom' && !settings.baseUrl && (
        <button
          type="button"
          className="text-xs text-mist-300 underline decoration-white/20 hover:text-sand-100"
          onClick={() => persist({ baseUrl: preset.defaultBaseUrl })}
          data-tv-focus
        >
          Override base URL…
        </button>
      )}

      <label className="block text-sm">
        API proxy URL (optional, OpenAI-compatible relay)
        <input
          value={settings.proxyUrl}
          onChange={(e) => persist({ proxyUrl: e.target.value })}
          placeholder="https://your-relay.example.com/v1"
          className="mt-1 w-full rounded-xl border border-white/10 bg-ink-850 px-3 py-2 font-mono text-xs outline-none focus:border-ember-400/50"
          data-tv-focus
          data-testid="ai-proxy-url-input"
          aria-label="AI API proxy URL"
        />
      </label>
      <p className="text-xs text-mist-400">
        When set, SteadyStream calls <span className="font-mono">proxy/chat/completions</span> with
        your key — use this if OpenAI/Anthropic block browser CORS. OpenRouter and Groq usually work
        direct from the Fire Stick WebView.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || !keySaved}
          onClick={() => void onTest()}
          className="rounded-full border border-ember-400/40 bg-ember-500/10 px-4 py-2 text-sm text-ember-200 disabled:opacity-40"
          data-tv-focus
          data-testid="ai-test-connection"
        >
          {busy ? 'Testing…' : 'Test connection'}
        </button>
        <button
          type="button"
          onClick={onClearAll}
          className="rounded-full border border-white/15 px-4 py-2 text-sm"
          data-tv-focus
          data-testid="ai-reset-settings"
        >
          Reset AI settings
        </button>
      </div>

      {probeMsg && (
        <p
          data-testid="ai-probe-message"
          className="rounded-xl border border-ember-400/30 bg-ember-500/10 px-3 py-2 text-sm text-sand-100"
        >
          {probeMsg}
        </p>
      )}
    </section>
  )
}

function ProfilesSection() {
  const profiles = useIptvStore((s) => s.profiles)
  const createProfile = useIptvStore((s) => s.createProfile)
  const switchProfile = useIptvStore((s) => s.switchProfile)
  const updateActiveProfile = useIptvStore((s) => s.updateActiveProfile)
  const removeProfile = useIptvStore((s) => s.removeProfile)
  const [name, setName] = useState('')
  const [tags, setTags] = useState('sports')
  const active = getActiveProfile(profiles)

  return (
    <section className="glass-panel space-y-4 rounded-3xl p-5 md:p-6">
      <div>
        <h2 className="font-display text-lg font-semibold">Household profiles</h2>
        <p className="mt-1 text-sm text-mist-300">
          Separate favorites bias and assistant memory per viewer. Active: {active.name}.
        </p>
      </div>
      <ul className="space-y-2">
        {profiles.profiles.map((profile) => {
          const selected = profile.id === profiles.activeProfileId
          return (
            <li
              key={profile.id}
              className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                selected ? 'border-ember-400/40 bg-ember-500/10' : 'border-white/8 bg-ink-850/80'
              }`}
            >
              <button
                type="button"
                onClick={() => switchProfile(profile.id)}
                className="min-w-0 flex-1 text-left"
                aria-label={`Switch to profile ${profile.name}`}
              >
                <p className="text-sm font-medium text-sand-50">{profile.name}</p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-mist-400">
                  {profile.interestTags.length
                    ? profile.interestTags.join(' · ')
                    : 'no interest tags'}
                  {' · '}
                  {profile.favorites.length} favorites
                </p>
              </button>
              {profiles.profiles.length > 1 && (
                <button
                  type="button"
                  className="text-xs text-red-300 hover:text-red-200"
                  onClick={() => removeProfile(profile.id)}
                >
                  Remove
                </button>
              )}
            </li>
          )
        })}
      </ul>
      <label className="block text-sm">
        Active profile interest tags (comma-separated)
        <input
          value={active.interestTags.join(', ')}
          onChange={(e) =>
            updateActiveProfile({
              interestTags: e.target.value
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean),
            })
          }
          className="mt-1 w-full rounded-xl border border-white/10 bg-ink-850 px-3 py-2 outline-none focus:border-ember-400/50"
          aria-label="Active profile interest tags"
        />
      </label>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          createProfile(
            name.trim(),
            tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean),
          )
          setName('')
        }}
      >
        <label className="block min-w-[10rem] flex-1 text-sm">
          New profile name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-ink-850 px-3 py-2 outline-none focus:border-ember-400/50"
          />
        </label>
        <label className="block min-w-[10rem] flex-1 text-sm">
          Interests
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-ink-850 px-3 py-2 outline-none focus:border-ember-400/50"
          />
        </label>
        <button
          type="submit"
          disabled={!name.trim()}
          className="rounded-full bg-sand-50 px-4 py-2 text-sm font-semibold text-ink-950 disabled:opacity-40"
        >
          Add profile
        </button>
      </form>
    </section>
  )
}

function AutomationRulesSection() {
  const rules = useIptvStore((s) => s.automationRules)
  const setEnabled = useIptvStore((s) => s.setAutomationRuleEnabled)
  const setParams = useIptvStore((s) => s.setAutomationRuleParams)

  return (
    <section className="glass-panel space-y-4 rounded-3xl p-5 md:p-6">
      <div>
        <h2 className="font-display text-lg font-semibold">Automation rules</h2>
        <p className="mt-1 text-sm text-mist-300">
          Phase 3 agent automations. Rules persist locally; toasts fire when triggered.
        </p>
      </div>
      <ul className="space-y-3">
        {rules.map((rule) => (
          <li key={rule.id} className="rounded-xl border border-white/8 bg-ink-850/80 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-sand-50">{rule.label}</p>
                <p className="mt-0.5 text-xs text-mist-400">{rule.description}</p>
              </div>
              <label className="flex shrink-0 items-center gap-2 text-xs text-mist-200">
                Enabled
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={(e) => setEnabled(rule.id, e.target.checked)}
                  className="accent-ember-400"
                  aria-label={`Toggle ${rule.label}`}
                />
              </label>
            </div>
            {rule.kind === 'buffering_fallback_suggest' && (
              <label className="mt-3 block text-xs text-mist-300">
                Buffering threshold ({rule.bufferingSeconds}s)
                <input
                  type="range"
                  min={3}
                  max={20}
                  step={1}
                  value={rule.bufferingSeconds}
                  onChange={(e) => setParams(rule.id, { bufferingSeconds: Number(e.target.value) })}
                  className="mt-1 w-full accent-ember-400"
                />
              </label>
            )}
            {rule.kind === 'favorite_start_remind' && (
              <label className="mt-3 block text-xs text-mist-300">
                Lead time ({rule.leadMinutes} min)
                <input
                  type="range"
                  min={1}
                  max={15}
                  step={1}
                  value={rule.leadMinutes}
                  onChange={(e) => setParams(rule.id, { leadMinutes: Number(e.target.value) })}
                  className="mt-1 w-full accent-ember-400"
                />
              </label>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function SettingsPage() {
  const sources = useIptvStore((s) => s.sources)
  const prefs = useIptvStore((s) => s.prefs)
  const setPrefs = useIptvStore((s) => s.setPrefs)
  const setView = useIptvStore((s) => s.setView)
  const loadDemo = useIptvStore((s) => s.loadDemo)
  const importM3UText = useIptvStore((s) => s.importM3UText)
  const importM3UUrl = useIptvStore((s) => s.importM3UUrl)
  const importXtream = useIptvStore((s) => s.importXtream)
  const refreshLiveCatalog = useIptvStore((s) => s.refreshLiveCatalog)
  const removeSource = useIptvStore((s) => s.removeSource)
  const refreshDemoGuide = useIptvStore((s) => s.refreshDemoGuide)
  const liveCount = useIptvStore((s) => s.channels.filter((c) => c.kind === 'live').length)
  const vodCategoryCount = useIptvStore((s) => s.vodCategories.length)

  const [name, setName] = useState('My Playlist')
  const [url, setUrl] = useState('')
  const [paste, setPaste] = useState('')
  const [portalUrl, setPortalUrl] = useState('')
  const [portalUser, setPortalUser] = useState('')
  const [portalPass, setPortalPass] = useState('')
  const [playlistLink, setPlaylistLink] = useState('')
  const [parseHint, setParseHint] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onUrlImport = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setStatus(null)
    try {
      await importM3UUrl(name || 'Playlist', url.trim())
      setStatus('Playlist imported from URL.')
      setUrl('')
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setBusy(false)
    }
  }

  const connectPanel = async (provider: 'megaott' | 'xtream') => {
    if (isWebsiteAccountUrl(portalUrl)) {
      setStatus(WEBSITE_ACCOUNT_URL_HINT)
      return
    }
    setBusy(true)
    setStatus(null)
    try {
      const result = await importXtream({
        server: portalUrl.trim(),
        username: portalUser.trim(),
        password: portalPass,
        provider,
      })
      setStatus(result.message)
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Panel import failed')
    } finally {
      setBusy(false)
    }
  }

  const onMegaOttConnect = async (e: FormEvent) => {
    e.preventDefault()
    await connectPanel('megaott')
  }

  const onAdvancedXtreamConnect = async (e: FormEvent) => {
    e.preventDefault()
    await connectPanel('xtream')
  }

  const onPlaylistLinkApply = () => {
    const parsed = parsePanelOrPlaylistUrl(playlistLink, 'megaott')
    setParseHint(parsed.hint)
    if (parsed.credentials) {
      setPortalUrl(parsed.credentials.server)
      setPortalUser(parsed.credentials.username)
      setPortalPass(parsed.credentials.password)
      setStatus(
        parsed.isPlaylistUrl
          ? 'Credentials filled from playlist URL — click Connect MegaOTT (or Import M3U URL if the browser can fetch it).'
          : 'Credentials filled — click Connect MegaOTT.',
      )
    } else if (isWebsiteAccountUrl(playlistLink)) {
      setStatus(parsed.hint)
    } else if (normalizePortalBase(playlistLink)) {
      setPortalUrl(normalizePortalBase(playlistLink))
      setStatus('Portal host filled — enter username and password from your MegaOTT email or app.')
    }
  }

  const onPlaylistLinkImportM3U = async () => {
    setBusy(true)
    setStatus(null)
    try {
      const parsed = parsePanelOrPlaylistUrl(playlistLink, 'megaott')
      if (parsed.credentials) {
        setPortalUrl(parsed.credentials.server)
        setPortalUser(parsed.credentials.username)
        setPortalPass(parsed.credentials.password)
      }
      // Prefer API ingest when we have credentials (richer VOD/series + catch-up metadata)
      if (parsed.credentials) {
        const result = await importXtream({
          ...parsed.credentials,
          provider: 'megaott',
        })
        setStatus(result.message)
        return
      }
      await importM3UUrl(name || 'MegaOTT playlist', playlistLink.trim())
      setStatus('MegaOTT playlist imported from URL.')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Import failed'
      setStatus(
        /Failed to fetch|CORS|NetworkError|network/i.test(msg)
          ? `${msg} — browser CORS often blocks remote playlists; paste the M3U contents below or use portal login.`
          : msg,
      )
    } finally {
      setBusy(false)
    }
  }

  const onPasteImport = (e: FormEvent) => {
    e.preventDefault()
    setStatus(null)
    try {
      importM3UText(name || 'Playlist', paste)
      setStatus(`Imported ${useIptvStore.getState().channels.length} channels.`)
      setPaste('')
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Import failed')
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-8 md:px-10">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-ember-400">Preferences</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight md:text-4xl">
          Settings
        </h1>
      </header>

      <section className="glass-panel space-y-4 rounded-3xl p-5 md:p-6">
        <h2 className="font-display text-lg font-semibold">Playlist sources</h2>
        <ul className="space-y-2">
          {sources.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-xl border border-white/8 bg-ink-850/80 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{s.name}</p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-mist-400">
                  {s.type}
                </p>
              </div>
              {s.type !== 'demo' && (
                <button
                  type="button"
                  className="text-xs text-red-300 hover:text-red-200"
                  onClick={() => removeSource(s.id)}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              loadDemo()
              setStatus('Demo pack restored with live sample streams + EPG.')
            }}
            className="rounded-full border border-white/15 px-4 py-2 text-sm hover:border-ember-400/50"
          >
            Load demo pack
          </button>
          <button
            type="button"
            onClick={() => {
              refreshDemoGuide()
              setStatus('Guide refreshed to current time.')
            }}
            className="rounded-full border border-white/15 px-4 py-2 text-sm hover:border-ember-400/50"
          >
            Refresh demo EPG
          </button>
          <button
            type="button"
            data-testid="refresh-live-catalog"
            data-tv-focus
            disabled={busy}
            onClick={() => {
              void (async () => {
                setBusy(true)
                setStatus(null)
                try {
                  const result = await refreshLiveCatalog()
                  setStatus(result.message)
                } catch (err) {
                  setStatus(err instanceof Error ? err.message : 'Refresh failed')
                } finally {
                  setBusy(false)
                }
              })()
            }}
            className="rounded-full border border-ember-400/40 bg-ember-500/10 px-4 py-2 text-sm text-ember-200 hover:border-ember-400/70 disabled:opacity-40"
          >
            {busy ? 'Refreshing…' : 'Refresh live catalog'}
          </button>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-mist-400" data-testid="catalog-counts">
          {liveCount.toLocaleString()} live in memory
          {vodCategoryCount > 0
            ? ` · ${vodCategoryCount.toLocaleString()} VOD categories (titles load on browse)`
            : ''}
        </p>
      </section>

      <section
        className="glass-panel space-y-4 rounded-3xl p-5 md:p-6"
        data-testid="megaott-section"
      >
        <div>
          <h2 className="font-display text-lg font-semibold">MegaOTT</h2>
          <p className="mt-1 text-sm text-mist-300">
            Use the streaming DNS / Server / Portal host from your MegaOTT welcome email, WhatsApp,
            or player app — usually <span className="font-mono text-xs">http://host:port</span> —
            plus username and password. Do not paste the website account page (for example{' '}
            <span className="font-mono text-xs">https://megaott.net/login</span>); that is not the
            IPTV API. MegaOTT panels speak Xtream-compatible{' '}
            <span className="font-mono text-xs">player_api.php</span>. Channels with{' '}
            <span className="font-mono text-xs">tv_archive=1</span> unlock real catch-up; otherwise
            you get a MegaOTT archive stub. On failure the demo pack loads.
          </p>
        </div>
        <form onSubmit={onMegaOttConnect} className="space-y-3">
          <label className="block text-sm">
            Portal / server URL
            <input
              value={portalUrl}
              onChange={(e) => setPortalUrl(e.target.value)}
              placeholder="http://host:port"
              className="mt-1 w-full rounded-xl border border-white/10 bg-ink-850 px-3 py-2 outline-none focus:border-ember-400/50"
              data-tv-focus
              data-testid="megaott-portal"
              aria-label="MegaOTT portal URL"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              Username
              <input
                value={portalUser}
                onChange={(e) => setPortalUser(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-ink-850 px-3 py-2 outline-none focus:border-ember-400/50"
                data-tv-focus
                data-testid="megaott-username"
                aria-label="MegaOTT username"
              />
            </label>
            <label className="block text-sm">
              Password
              <input
                type="password"
                value={portalPass}
                onChange={(e) => setPortalPass(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-ink-850 px-3 py-2 outline-none focus:border-ember-400/50"
                data-tv-focus
                data-testid="megaott-password"
                aria-label="MegaOTT password"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={busy || !portalUrl.trim() || !portalUser.trim() || !portalPass}
            className="rounded-full bg-sand-50 px-4 py-2 text-sm font-semibold text-ink-950 disabled:opacity-40"
            data-tv-focus
            data-testid="megaott-connect"
          >
            {busy ? 'Connecting…' : 'Connect MegaOTT'}
          </button>
        </form>

        <div className="space-y-3 border-t border-white/8 pt-4">
          <p className="text-sm text-mist-300">
            Or paste a MegaOTT <span className="font-mono text-xs">get.php</span> / M3U link — we
            extract host + credentials. If the browser blocks URL fetch (CORS), use Connect MegaOTT
            above or paste playlist text in Import M3U.
          </p>
          <label className="block text-sm">
            Playlist / get.php URL
            <input
              value={playlistLink}
              onChange={(e) => setPlaylistLink(e.target.value)}
              placeholder="http://host:port/get.php?username=…&password=…&type=m3u_plus"
              className="mt-1 w-full rounded-xl border border-white/10 bg-ink-850 px-3 py-2 font-mono text-xs outline-none focus:border-ember-400/50"
              data-tv-focus
              data-testid="megaott-playlist-url"
            />
          </label>
          {parseHint && (
            <p className="text-xs text-mist-400" data-testid="megaott-parse-hint">
              {parseHint}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!playlistLink.trim()}
              onClick={onPlaylistLinkApply}
              className="rounded-full border border-white/15 px-4 py-2 text-sm disabled:opacity-40"
              data-tv-focus
            >
              Fill fields from URL
            </button>
            <button
              type="button"
              disabled={busy || !playlistLink.trim()}
              onClick={() => void onPlaylistLinkImportM3U()}
              className="rounded-full border border-white/15 px-4 py-2 text-sm disabled:opacity-40"
              data-tv-focus
            >
              {busy ? 'Importing…' : 'Connect from playlist URL'}
            </button>
          </div>
        </div>

        <details className="rounded-xl border border-white/8 bg-ink-850/50 px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium text-sand-100" data-tv-focus>
            Xtream-compatible API (advanced)
          </summary>
          <p className="mt-2 text-xs text-mist-400">
            Same portal fields — labels the source as Xtream instead of MegaOTT. Use when your panel
            is not MegaOTT-branded.
          </p>
          <form onSubmit={onAdvancedXtreamConnect} className="mt-3">
            <button
              type="submit"
              disabled={busy || !portalUrl.trim() || !portalUser.trim() || !portalPass}
              className="rounded-full border border-white/15 px-4 py-2 text-sm disabled:opacity-40"
              data-tv-focus
            >
              {busy ? 'Connecting…' : 'Connect as Xtream'}
            </button>
          </form>
        </details>

        {status && (
          <p
            data-testid="xtream-status"
            className="rounded-xl border border-ember-400/30 bg-ember-500/10 px-3 py-2 text-sm text-sand-100"
          >
            {status}
          </p>
        )}
      </section>

      <section className="glass-panel space-y-4 rounded-3xl p-5 md:p-6">
        <h2 className="font-display text-lg font-semibold">Import M3U</h2>
        <p className="text-sm text-mist-300">
          Paste a MegaOTT (or any) playlist, or fetch from URL. Browser CORS may block remote{' '}
          <span className="font-mono text-xs">get.php</span> links — paste works offline and is the
          reliable fallback.
        </p>
        <label className="block text-sm">
          Display name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-ink-850 px-3 py-2 outline-none focus:border-ember-400/50"
          />
        </label>
        <form onSubmit={onUrlImport} className="space-y-3">
          <label className="block text-sm">
            Playlist URL
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…/playlist.m3u or get.php?…"
              className="mt-1 w-full rounded-xl border border-white/10 bg-ink-850 px-3 py-2 outline-none focus:border-ember-400/50"
            />
          </label>
          <button
            type="submit"
            disabled={busy || !url.trim()}
            className="rounded-full bg-sand-50 px-4 py-2 text-sm font-semibold text-ink-950 disabled:opacity-40"
          >
            {busy ? 'Importing…' : 'Import from URL'}
          </button>
        </form>
        <form onSubmit={onPasteImport} className="space-y-3">
          <label className="block text-sm">
            Or paste M3U contents
            <textarea
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              rows={6}
              placeholder='#EXTM3U&#10;#EXTINF:-1 tvg-id="…" group-title="News",Channel&#10;https://…'
              className="mt-1 w-full rounded-xl border border-white/10 bg-ink-850 px-3 py-2 font-mono text-xs outline-none focus:border-ember-400/50"
              data-testid="m3u-paste"
            />
          </label>
          <button
            type="submit"
            disabled={!paste.trim()}
            className="rounded-full border border-white/15 px-4 py-2 text-sm disabled:opacity-40"
            data-testid="m3u-paste-import"
          >
            Import pasted playlist
          </button>
        </form>
        {status && (
          <p className="rounded-xl border border-ember-400/30 bg-ember-500/10 px-3 py-2 text-sm text-sand-100">
            {status}
          </p>
        )}
      </section>

      <AuthSection />

      <AiModeSection />

      <ProfilesSection />

      <AutomationRulesSection />

      <section className="glass-panel space-y-4 rounded-3xl p-5 md:p-6">
        <h2 className="font-display text-lg font-semibold">Playback & UI</h2>
        <label className="flex items-center justify-between gap-4 text-sm" data-testid="category-browse-mode">
          <span>
            Live categories
            <span className="mt-0.5 block text-xs text-mist-400">
              Provider folders = MegaOTT groups. Smart = News/Sports buckets.
            </span>
          </span>
          <select
            data-tv-focus
            data-testid="category-browse-select"
            className="rounded-lg border border-white/15 bg-ink-850 px-3 py-2 text-sm"
            value={prefs.categoryBrowseMode ?? 'provider'}
            onChange={(e) =>
              setPrefs({
                categoryBrowseMode: e.target.value === 'smart' ? 'smart' : 'provider',
              })
            }
          >
            <option value="provider">Provider folders</option>
            <option value="smart">Smart buckets</option>
          </select>
        </label>
        <label className="flex items-center justify-between gap-4 text-sm">
          Show Assistant button on TV
          <input
            type="checkbox"
            data-tv-focus
            data-testid="show-assistant-fab"
            checked={Boolean(prefs.showAssistantFab)}
            onChange={(e) => setPrefs({ showAssistantFab: e.target.checked })}
            className="accent-ember-400"
          />
        </label>
        <button
          type="button"
          data-tv-focus
          data-testid="open-assistant-from-settings"
          className="rounded-full border border-ember-400/40 bg-ember-500/10 px-4 py-2 text-sm text-ember-200"
          onClick={() => window.dispatchEvent(new Event('steadystream-open-assistant'))}
        >
          Open Assistant
        </button>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            data-tv-focus
            data-testid="open-favorites-page"
            className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-mist-200"
            onClick={() => setView('favorites')}
          >
            Favorites
          </button>
          <button
            type="button"
            data-tv-focus
            data-testid="open-home-page"
            className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-mist-200"
            onClick={() => setView('home')}
          >
            Home hub
          </button>
          <button
            type="button"
            data-tv-focus
            data-testid="open-multiview"
            className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-mist-200"
            onClick={() => useIptvStore.getState().setMultiViewLayout(2)}
          >
            Multi-view
          </button>
        </div>
        <label className="flex items-center justify-between gap-4 text-sm">
          Show clock in sidebar
          <input
            type="checkbox"
            checked={prefs.showClock}
            onChange={(e) => setPrefs({ showClock: e.target.checked })}
            className="accent-ember-400"
          />
        </label>
        <label className="flex items-center justify-between gap-4 text-sm">
          Reduce motion
          <input
            type="checkbox"
            checked={prefs.reduceMotion}
            onChange={(e) => setPrefs({ reduceMotion: e.target.checked })}
            className="accent-ember-400"
          />
        </label>
        <label
          className="flex items-center justify-between gap-4 text-sm"
          data-testid="a11y-large-text"
        >
          Large text
          <input
            type="checkbox"
            checked={Boolean(prefs.largeText)}
            onChange={(e) => setPrefs({ largeText: e.target.checked })}
            className="accent-ember-400"
            data-tv-focus
          />
        </label>
        <label
          className="flex items-center justify-between gap-4 text-sm"
          data-testid="a11y-high-contrast"
        >
          High contrast
          <input
            type="checkbox"
            checked={Boolean(prefs.highContrast)}
            onChange={(e) => setPrefs({ highContrast: e.target.checked })}
            className="accent-ember-400"
            data-tv-focus
          />
        </label>
        <label className="block text-sm">
          Auto-hide player controls ({prefs.autoHideControlsMs} ms)
          <input
            type="range"
            min={2000}
            max={8000}
            step={200}
            value={prefs.autoHideControlsMs}
            onChange={(e) => setPrefs({ autoHideControlsMs: Number(e.target.value) })}
            className="mt-2 w-full accent-ember-400"
          />
        </label>
        <label className="block text-sm">
          Guide window ({prefs.guideHours} hours)
          <input
            type="range"
            min={3}
            max={8}
            step={1}
            value={prefs.guideHours}
            onChange={(e) => setPrefs({ guideHours: Number(e.target.value) })}
            className="mt-2 w-full accent-ember-400"
          />
        </label>
      </section>

      <section className="glass-panel space-y-3 rounded-3xl p-5 md:p-6">
        <div className="flex items-center gap-4">
          <img
            src="/brand/steadystream-logo.png"
            alt="SteadyStream"
            className="h-16 w-auto object-contain"
          />
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-ember-400">About</p>
            <h2 className="font-display text-lg font-semibold text-ember-400">SteadyStream</h2>
            <p className="mt-1 text-sm text-mist-300">
              Premium IPTV player · v1.0.0 · package id{' '}
              <span className="font-mono text-sand-100">tv.aether.player</span>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
