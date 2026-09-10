import { useMemo, useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Radio,
  Tv,
  Clapperboard,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  KeyRound,
} from 'lucide-react'
import { useIptvStore } from '../store/useIptvStore'
import {
  isWebsiteAccountUrl,
  normalizePortalBase,
  WEBSITE_ACCOUNT_URL_HINT,
} from '../lib/panelCredentials'

const TOUR = [
  {
    icon: Tv,
    title: 'TV Guide',
    body: 'Scroll the timeline EPG, jump to now, and tune with D-pad or click.',
  },
  {
    icon: Radio,
    title: 'Live zap',
    body: 'Smart category chips, ranked search, logos, and fast channel switching.',
  },
  {
    icon: Clapperboard,
    title: 'On demand',
    body: 'Lazy MegaOTT VOD categories — posters, detail, play on the TV canvas.',
  },
]

type Step = 'welcome' | 'connect' | 'tour'

export function OnboardingPage() {
  const loadDemo = useIptvStore((s) => s.loadDemo)
  const setView = useIptvStore((s) => s.setView)
  const completeOnboarding = useIptvStore((s) => s.completeOnboarding)
  const importXtream = useIptvStore((s) => s.importXtream)

  const [step, setStep] = useState<Step>('welcome')
  const [tourIndex, setTourIndex] = useState(0)
  const [portalUrl, setPortalUrl] = useState('')
  const [portalUser, setPortalUser] = useState('')
  const [portalPass, setPortalPass] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const tourItem = TOUR[tourIndex]
  const TourIcon = tourItem.icon

  const canConnect = useMemo(
    () => Boolean(portalUrl.trim() && portalUser.trim() && portalPass),
    [portalUrl, portalUser, portalPass],
  )

  const finish = (view: 'home' | 'settings' | 'live' = 'home') => {
    completeOnboarding()
    setView(view)
  }

  const onConnect = async (e: FormEvent) => {
    e.preventDefault()
    if (isWebsiteAccountUrl(portalUrl)) {
      setStatus(WEBSITE_ACCOUNT_URL_HINT)
      return
    }
    const server = normalizePortalBase(portalUrl) || portalUrl.trim()
    setBusy(true)
    setStatus(null)
    try {
      const result = await importXtream({
        server,
        username: portalUser.trim(),
        password: portalPass,
        provider: 'megaott',
      })
      setStatus(result.message)
      setStep('tour')
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Connect failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="relative flex h-full min-h-0 items-center justify-center overflow-hidden bg-hero-wash bg-grain px-6"
      data-testid="onboarding-page"
    >
      <motion.div
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-ember-500/20 blur-3xl"
        animate={{ x: [0, 30, 0], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-mist-500/20 blur-3xl"
        animate={{ y: [0, -24, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 w-full max-w-4xl">
        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <img
                src="/brand/steadystream-logo.png"
                alt="SteadyStream"
                className="mx-auto mb-6 h-28 w-auto object-contain drop-shadow-[0_0_28px_rgba(212,175,55,0.35)] md:h-36"
              />
              <h1 className="sr-only">SteadyStream</h1>
              <p className="mx-auto mt-2 max-w-xl text-base text-sand-100/80 md:text-lg">
                Cable guide. Netflix rails. TiviMate-grade control — rebuilt as the SteadyStream
                premium IPTV player.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  data-tv-focus
                  data-testid="onboarding-demo"
                  onClick={() => {
                    loadDemo()
                    setStep('tour')
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-sand-50 px-6 py-3.5 text-sm font-semibold text-ink-950 shadow-glow"
                >
                  <Sparkles size={16} />
                  Enter with demo pack
                </button>
                <button
                  type="button"
                  data-tv-focus
                  data-testid="onboarding-connect"
                  onClick={() => setStep('connect')}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-ink-900/60 px-6 py-3.5 text-sm font-medium backdrop-blur"
                >
                  <KeyRound size={16} />
                  Add MegaOTT / playlist
                </button>
              </div>
            </motion.div>
          )}

          {step === 'connect' && (
            <motion.div
              key="connect"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mx-auto max-w-xl"
            >
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-ember-400">Setup</p>
              <h2 className="mt-1 font-display text-3xl font-bold">Connect MegaOTT</h2>
              <p className="mt-2 text-sm text-mist-300">
                Use the portal DNS from your welcome email — not the megaott.net login website.
              </p>
              <form onSubmit={onConnect} className="mt-6 space-y-3">
                <label className="block text-sm">
                  Portal URL
                  <input
                    data-tv-focus
                    data-testid="onboarding-portal-url"
                    value={portalUrl}
                    onChange={(e) => setPortalUrl(e.target.value)}
                    placeholder="http://host:port"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-ink-850 px-3 py-2.5 text-sm outline-none focus:border-ember-400/50"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm">
                    Username
                    <input
                      data-tv-focus
                      data-testid="onboarding-portal-user"
                      value={portalUser}
                      onChange={(e) => setPortalUser(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-ink-850 px-3 py-2.5 text-sm outline-none focus:border-ember-400/50"
                    />
                  </label>
                  <label className="block text-sm">
                    Password
                    <input
                      data-tv-focus
                      data-testid="onboarding-portal-pass"
                      type="password"
                      value={portalPass}
                      onChange={(e) => setPortalPass(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-ink-850 px-3 py-2.5 text-sm outline-none focus:border-ember-400/50"
                    />
                  </label>
                </div>
                {status && (
                  <p className="rounded-xl border border-white/10 bg-ink-900/70 px-3 py-2 text-sm text-sand-100">
                    {status}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    data-tv-focus
                    onClick={() => setStep('welcome')}
                    className="rounded-full border border-white/15 px-4 py-2.5 text-sm"
                  >
                    <ChevronLeft size={16} className="mr-1 inline" />
                    Back
                  </button>
                  <button
                    type="submit"
                    data-tv-focus
                    data-testid="onboarding-connect-submit"
                    disabled={!canConnect || busy}
                    className="rounded-full bg-ember-400 px-5 py-2.5 text-sm font-semibold text-ink-950 disabled:opacity-40"
                  >
                    {busy ? 'Connecting…' : 'Connect & continue'}
                  </button>
                  <button
                    type="button"
                    data-tv-focus
                    onClick={() => {
                      finish('settings')
                    }}
                    className="rounded-full border border-white/15 px-4 py-2.5 text-sm text-mist-300"
                  >
                    Skip to Settings
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 'tour' && (
            <motion.div
              key="tour"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mx-auto max-w-lg text-center"
              data-testid="onboarding-tour"
            >
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-ember-400">
                Quick tour · {tourIndex + 1}/{TOUR.length}
              </p>
              <div className="mt-6 rounded-3xl border border-white/10 bg-ink-900/70 p-8 backdrop-blur">
                <TourIcon className="mx-auto text-ember-400" size={28} />
                <h2 className="mt-4 font-display text-2xl font-bold">{tourItem.title}</h2>
                <p className="mt-2 text-sm text-mist-300">{tourItem.body}</p>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                {tourIndex > 0 && (
                  <button
                    type="button"
                    data-tv-focus
                    onClick={() => setTourIndex((i) => i - 1)}
                    className="rounded-full border border-white/15 px-4 py-2.5 text-sm"
                  >
                    Back
                  </button>
                )}
                {tourIndex < TOUR.length - 1 ? (
                  <button
                    type="button"
                    data-tv-focus
                    data-testid="onboarding-tour-next"
                    onClick={() => setTourIndex((i) => i + 1)}
                    className="inline-flex items-center gap-1 rounded-full bg-sand-50 px-5 py-2.5 text-sm font-semibold text-ink-950"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    data-tv-focus
                    data-testid="onboarding-tour-done"
                    onClick={() => finish('live')}
                    className="rounded-full bg-ember-400 px-6 py-2.5 text-sm font-semibold text-ink-950"
                  >
                    Start watching
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
