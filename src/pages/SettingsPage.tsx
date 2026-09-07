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

  useEffect(() => {
    void probeAiModeStatus().then(setStatus)
  }, [])

  return (
    <section className="glass-panel space-y-3 rounded-3xl p-5 md:p-6">
      <div>
        <h2 className="font-display text-lg font-semibold">Assistant AI</h2>
        <p className="mt-1 text-sm text-mist-300">
          Mock AI is fully featured without keys. Live AI needs{' '}
          <span className="font-mono text-xs">OPENAI_API_KEY</span> on the server (or{' '}
          <span className="font-mono text-xs">VITE_OPENAI_API_KEY</span> for static hosting).
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
        <p className="text-sm text-mist-300">{status?.detail ?? 'Probing assistant API…'}</p>
      </div>
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
                selected
                  ? 'border-ember-400/40 bg-ember-500/10'
                  : 'border-white/8 bg-ink-850/80'
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
          <li
            key={rule.id}
            className="rounded-xl border border-white/8 bg-ink-850/80 px-4 py-3"
          >
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
                  onChange={(e) =>
                    setParams(rule.id, { bufferingSeconds: Number(e.target.value) })
                  }
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
                  onChange={(e) =>
                    setParams(rule.id, { leadMinutes: Number(e.target.value) })
                  }
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
  const loadDemo = useIptvStore((s) => s.loadDemo)
  const importM3UText = useIptvStore((s) => s.importM3UText)
  const importM3UUrl = useIptvStore((s) => s.importM3UUrl)
  const importXtream = useIptvStore((s) => s.importXtream)
  const removeSource = useIptvStore((s) => s.removeSource)
  const refreshDemoGuide = useIptvStore((s) => s.refreshDemoGuide)

  const [name, setName] = useState('My Playlist')
  const [url, setUrl] = useState('')
  const [paste, setPaste] = useState('')
  const [xtreamServer, setXtreamServer] = useState('')
  const [xtreamUser, setXtreamUser] = useState('')
  const [xtreamPass, setXtreamPass] = useState('')
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


  const onXtreamImport = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setStatus(null)
    try {
      const result = await importXtream({
        server: xtreamServer.trim(),
        username: xtreamUser.trim(),
        password: xtreamPass,
      })
      setStatus(result.message)
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Xtream import failed')
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
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-ember-400">
          Preferences
        </p>
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
        </div>
      </section>

      <section className="glass-panel space-y-4 rounded-3xl p-5 md:p-6">
        <h2 className="font-display text-lg font-semibold">Import M3U</h2>
        <p className="text-sm text-mist-300">
          Paste a playlist or fetch from URL. Xtream-style panel URLs that return
          M3U work here too. Browser CORS may block some remotes — paste works
          offline.
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
              placeholder="https://…/playlist.m3u"
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
              placeholder="#EXTM3U&#10;#EXTINF:-1 tvg-id=&quot;…&quot; group-title=&quot;News&quot;,Channel&#10;https://…"
              className="mt-1 w-full rounded-xl border border-white/10 bg-ink-850 px-3 py-2 font-mono text-xs outline-none focus:border-ember-400/50"
            />
          </label>
          <button
            type="submit"
            disabled={!paste.trim()}
            className="rounded-full border border-white/15 px-4 py-2 text-sm disabled:opacity-40"
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


      <section className="glass-panel space-y-4 rounded-3xl p-5 md:p-6">
        <h2 className="font-display text-lg font-semibold">Xtream Codes login</h2>
        <p className="text-sm text-mist-300">
          Required fields: <span className="font-medium text-sand-100">Server URL</span> (panel
          base, e.g. <span className="font-mono text-xs">http://host:port</span>),{' '}
          <span className="font-medium text-sand-100">username</span>, and{' '}
          <span className="font-medium text-sand-100">password</span>. Aether calls{' '}
          <span className="font-mono text-xs">player_api.php</span> for live / VOD / series. Channels
          with <span className="font-mono text-xs">tv_archive=1</span> unlock real timeshift URLs;
          demo streams use a documented catch-up stub instead. On failure the app loads the demo pack.
        </p>
        <form onSubmit={onXtreamImport} className="space-y-3">
          <label className="block text-sm">
            Server URL
            <input
              value={xtreamServer}
              onChange={(e) => setXtreamServer(e.target.value)}
              placeholder="http://host:port"
              className="mt-1 w-full rounded-xl border border-white/10 bg-ink-850 px-3 py-2 outline-none focus:border-ember-400/50"
              data-tv-focus
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              Username
              <input
                value={xtreamUser}
                onChange={(e) => setXtreamUser(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-ink-850 px-3 py-2 outline-none focus:border-ember-400/50"
                data-tv-focus
              />
            </label>
            <label className="block text-sm">
              Password
              <input
                type="password"
                value={xtreamPass}
                onChange={(e) => setXtreamPass(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-ink-850 px-3 py-2 outline-none focus:border-ember-400/50"
                data-tv-focus
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={busy || !xtreamServer.trim() || !xtreamUser.trim() || !xtreamPass}
            className="rounded-full bg-sand-50 px-4 py-2 text-sm font-semibold text-ink-950 disabled:opacity-40"
            data-tv-focus
          >
            {busy ? 'Connecting…' : 'Connect Xtream'}
          </button>
        </form>
        {status && (
          <p
            data-testid="xtream-status"
            className="rounded-xl border border-ember-400/30 bg-ember-500/10 px-3 py-2 text-sm text-sand-100"
          >
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
        <label className="block text-sm">
          Auto-hide player controls ({prefs.autoHideControlsMs} ms)
          <input
            type="range"
            min={2000}
            max={8000}
            step={200}
            value={prefs.autoHideControlsMs}
            onChange={(e) =>
              setPrefs({ autoHideControlsMs: Number(e.target.value) })
            }
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
    </div>
  )
}
