import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useIptvStore } from '../../store/useIptvStore'

/**
 * TV-first remote chrome:
 * - Immersive: tiny low-contrast Menu control (physical remote preferred; keeps web/e2e working)
 * - Overlay open: Back to TV
 */
export function RemoteFab() {
  const menuOpen = useIptvStore((s) => s.menuOpen)
  const toggleMenu = useIptvStore((s) => s.toggleMenu)
  const setMenuOpen = useIptvStore((s) => s.setMenuOpen)
  const prefs = useIptvStore((s) => s.prefs)

  return (
    <div className="pointer-events-none absolute bottom-5 left-5 z-50 flex flex-col items-start gap-2 md:bottom-8 md:left-8">
      {menuOpen ? (
        <motion.button
          type="button"
          data-tv-focus
          data-testid="remote-back"
          aria-label="Dismiss menu"
          className="pointer-events-auto flex items-center gap-2 rounded-full border border-ember-400/50 bg-ink-900/90 px-3.5 py-2 text-xs font-medium text-sand-50 shadow-lg backdrop-blur-md hover:border-ember-400/80"
          initial={prefs.reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setMenuOpen(false)}
        >
          <ArrowLeft size={14} />
          Back to TV
        </motion.button>
      ) : (
        <button
          type="button"
          data-tv-focus
          data-testid="remote-toggle"
          aria-label="Open menu"
          title="Menu (R)"
          className="pointer-events-auto rounded-full border border-white/10 bg-ink-950/50 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-mist-400/80 backdrop-blur-sm transition hover:border-ember-400/40 hover:text-sand-100"
          onClick={() => toggleMenu()}
        >
          Menu
        </button>
      )}
    </div>
  )
}
