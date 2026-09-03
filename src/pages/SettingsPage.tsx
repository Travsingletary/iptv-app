import { useState, type FormEvent } from 'react'
import { useIptvStore } from '../store/useIptvStore'

export function SettingsPage() {
  const sources = useIptvStore((s) => s.sources)
  const prefs = useIptvStore((s) => s.prefs)
  const setPrefs = useIptvStore((s) => s.setPrefs)
  const loadDemo = useIptvStore((s) => s.loadDemo)
  const importM3UText = useIptvStore((s) => s.importM3UText)
  const importM3UUrl = useIptvStore((s) => s.importM3UUrl)
  const removeSource = useIptvStore((s) => s.removeSource)
  const refreshDemoGuide = useIptvStore((s) => s.refreshDemoGuide)

  const [name, setName] = useState('My Playlist')
  const [url, setUrl] = useState('')
  const [paste, setPaste] = useState('')
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
