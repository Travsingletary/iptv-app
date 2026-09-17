import { motion } from 'framer-motion'
import {
  Clapperboard,
  Radio,
  Settings,
  Tv,
} from 'lucide-react'
import type { AppView } from '../../types/iptv'
import { useIptvStore } from '../../store/useIptvStore'
import { formatClock } from '../../lib/time'
import { useEffect, useState } from 'react'

/** TV-first primary destinations — Home / Favorites / Multi-view live under Settings. */
const NAV: { id: AppView; label: string; icon: typeof Tv }[] = [
  { id: 'live', label: 'Live TV', icon: Radio },
  { id: 'guide', label: 'Guide', icon: Tv },
  { id: 'vod', label: 'On Demand', icon: Clapperboard },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function SideNav({
  overlay = false,
  compact = false,
}: {
  overlay?: boolean
  /** Live side-rail mode: icon-only so more of the TV stays visible. */
  compact?: boolean
}) {
  const view = useIptvStore((s) => s.view)
  const setView = useIptvStore((s) => s.setView)
  const setMultiViewLayout = useIptvStore((s) => s.setMultiViewLayout)
  const prefs = useIptvStore((s) => s.prefs)
  const reduceMotion = useIptvStore((s) => s.prefs.reduceMotion)
  const [clock, setClock] = useState(formatClock())

  useEffect(() => {
    const id = window.setInterval(() => setClock(formatClock()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  // Deep-link views kept off the primary rail still highlight Settings when active.
  const activeId: AppView =
    view === 'home' || view === 'favorites' || view === 'multiview' ? 'settings' : view

  return (
    <aside
      className={`flex h-full flex-col border-r border-white/10 ${
        compact ? 'w-[4.5rem]' : 'w-56'
      } ${overlay ? 'bg-ink-950/90 shadow-[8px_0_40px_rgba(0,0,0,0.45)]' : 'bg-ink-900/90'}`}
      data-testid={compact ? 'side-nav-compact' : 'side-nav'}
      data-tv-first-nav="true"
    >
      <div className={`flex items-center gap-2 px-3 py-4 ${compact ? 'justify-center' : ''}`}>
        <img
          src="/brand/steadystream-mark.svg"
          alt=""
          className="h-9 w-9 rounded-lg object-cover"
        />
        {!compact && (
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold tracking-wide text-sand-50">
              SteadyStream
            </p>
            {prefs.showClock && (
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist-400">
                {clock}
              </p>
            )}
          </div>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2 pb-4">
        {NAV.map(({ id, label, icon: Icon }) => {
          const selected = activeId === id
          return (
            <button
              key={id}
              type="button"
              data-tv-focus
              data-testid={`nav-${id}`}
              aria-current={selected ? 'page' : undefined}
              onClick={() => {
                if (id === 'multiview') setMultiViewLayout(2)
                setView(id)
              }}
              className={`group relative z-10 flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                compact ? 'justify-center px-2' : ''
              } ${
                selected
                  ? 'bg-ember-500/15 text-sand-50'
                  : 'text-mist-300 hover:bg-white/5 hover:text-sand-50'
              }`}
            >
              {selected && (
                <motion.span
                  layoutId={reduceMotion ? undefined : 'nav-pill'}
                  className="pointer-events-none absolute inset-0 rounded-xl bg-ember-500/15 ring-2 ring-ember-400/50"
                  transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                />
              )}
              <Icon size={compact ? 22 : 18} className="relative z-10 shrink-0 text-ember-400" />
              {!compact && (
                <span className="relative z-10 text-sm font-medium">{label}</span>
              )}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
