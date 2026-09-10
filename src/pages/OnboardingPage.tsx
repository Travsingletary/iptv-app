import { motion } from 'framer-motion'
import { Radio, Tv, Clapperboard, Sparkles } from 'lucide-react'
import { useIptvStore } from '../store/useIptvStore'

const FEATURES = [
  {
    icon: Tv,
    title: 'TV Guide',
    body: 'Timeline EPG with now-line, jump-to-live, and one-tap tune.',
  },
  {
    icon: Radio,
    title: 'Live zap',
    body: 'Channel list, groups, favorites, and smooth HLS playback.',
  },
  {
    icon: Clapperboard,
    title: 'On demand',
    body: 'Poster rails and title detail sheets for movies & series.',
  },
]

export function OnboardingPage() {
  const loadDemo = useIptvStore((s) => s.loadDemo)
  const setView = useIptvStore((s) => s.setView)
  const completeOnboarding = useIptvStore((s) => s.completeOnboarding)

  return (
    <div className="relative flex h-full min-h-0 items-center justify-center overflow-hidden bg-hero-wash bg-grain px-6">
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="text-center"
        >
          <img
            src="/brand/steadystream-logo.png"
            alt="SteadyStream"
            className="mx-auto mb-6 h-28 w-auto object-contain drop-shadow-[0_0_28px_rgba(212,175,55,0.35)] md:h-36"
          />
          <h1 className="sr-only">SteadyStream</h1>
          <p className="mx-auto mt-2 max-w-xl text-base text-sand-100/80 md:text-lg">
            Cable guide. Netflix rails. TiviMate-grade control — rebuilt as the
            SteadyStream premium IPTV player.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                className="rounded-2xl border border-white/10 bg-ink-900/70 p-5 backdrop-blur"
              >
                <Icon className="text-ember-400" size={22} />
                <h2 className="mt-3 font-display text-lg font-semibold">
                  {f.title}
                </h2>
                <p className="mt-1 text-sm text-mist-300">{f.body}</p>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          <button
            type="button"
            onClick={() => {
              loadDemo()
              completeOnboarding()
            }}
            className="inline-flex items-center gap-2 rounded-full bg-sand-50 px-6 py-3.5 text-sm font-semibold text-ink-950 shadow-glow"
          >
            <Sparkles size={16} />
            Enter with demo pack
          </button>
          <button
            type="button"
            onClick={() => {
              completeOnboarding()
              setView('settings')
            }}
            className="rounded-full border border-white/20 bg-ink-900/60 px-6 py-3.5 text-sm font-medium backdrop-blur"
          >
            Import MegaOTT / M3U
          </button>
        </motion.div>
      </div>
    </div>
  )
}
