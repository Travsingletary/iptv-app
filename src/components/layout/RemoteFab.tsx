import { motion } from 'framer-motion'
import { ArrowLeft, Circle, MoreHorizontal } from 'lucide-react'
import { useIptvStore } from '../../store/useIptvStore'

/**
 * Persistent remote / OK affordance — toggles the TV overlay menu.
 * Fire Stick map (wired in App via fireStickRemote):
 * OK/Enter opens menu when immersive · Back dismisses · Menu/R toggles · ↑↓ zap.
 */
export function RemoteFab() {
  const menuOpen = useIptvStore((s) => s.menuOpen)
  const toggleMenu = useIptvStore((s) => s.toggleMenu)
  const setMenuOpen = useIptvStore((s) => s.setMenuOpen)
  const prefs = useIptvStore((s) => s.prefs)

  return (
    <div className="pointer-events-none absolute bottom-5 left-5 z-50 flex flex-col items-start gap-2 md:bottom-8 md:left-8">
      {menuOpen && (
        <motion.button
          type="button"
          data-tv-focus
          data-testid="remote-back"
          aria-label="Dismiss menu"
          className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/15 bg-ink-900/85 px-3.5 py-2 text-xs font-medium text-sand-50 shadow-lg backdrop-blur-md hover:border-ember-400/50 focus-visible:focus-ring"
          initial={prefs.reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setMenuOpen(false)}
        >
          <ArrowLeft size={14} />
          Back to TV
        </motion.button>
      )}
      <motion.button
        type="button"
        data-tv-focus
        data-testid="remote-toggle"
        aria-label={menuOpen ? 'Close remote menu' : 'Open remote menu'}
        aria-pressed={menuOpen}
        title="Remote menu (R)"
        className={`pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-2xl border shadow-lg backdrop-blur-md transition focus-visible:focus-ring ${
          menuOpen
            ? 'border-ember-400/60 bg-ember-500/25 text-ember-300'
            : 'border-white/20 bg-ink-900/80 text-sand-50 hover:border-ember-400/50'
        }`}
        whileTap={prefs.reduceMotion ? undefined : { scale: 0.92 }}
        onClick={() => toggleMenu()}
      >
        <span className="absolute inset-1.5 rounded-xl border border-white/10" />
        <MoreHorizontal
          size={14}
          className="absolute top-2.5 text-mist-400"
          aria-hidden
        />
        <Circle
          size={22}
          className={menuOpen ? 'fill-ember-400/30 text-ember-300' : 'text-sand-50'}
          strokeWidth={2.25}
        />
        <span className="sr-only">OK / Remote</span>
      </motion.button>
    </div>
  )
}
