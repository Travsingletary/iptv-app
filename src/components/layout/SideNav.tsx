import { motion } from 'framer-motion'
import {
  Clapperboard,
  Compass,
  Heart,
  Radio,
  Settings,
  Tv,
} from 'lucide-react'
import type { AppView } from '../../types/iptv'
import { useIptvStore } from '../../store/useIptvStore'
import { formatClock } from '../../lib/time'
import { useEffect, useState } from 'react'

const NAV: { id: AppView; label: string; icon: typeof Tv }[] = [
  { id: 'home', label: 'Home', icon: Compass },
  { id: 'live', label: 'Live TV', icon: Radio },
  { id: 'guide', label: 'Guide', icon: Tv },
  { id: 'vod', label: 'On Demand', icon: Clapperboard },
  { id: 'favorites', label: 'Favorites', icon: Heart },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function SideNav() {
  const view = useIptvStore((s) => s.view)
  const setView = useIptvStore((s) => s.setView)
  const prefs = useIptvStore((s) => s.prefs)
  const [clock, setClock] = useState(formatClock())

  useEffect(() => {
    const t = window.setInterval(() => setClock(formatClock()), 15_000)
    return () => window.clearInterval(t)
  }, [])

  return (
    <aside className="relative z-30 flex h-full w-[4.75rem] flex-col border-r border-white/8 bg-ink-900/90 backdrop-blur-xl md:w-56">
      <div className="border-b border-white/8 px-3 py-5 md:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ember-500/15 ring-1 ring-ember-400/40">
            <span className="font-display text-lg font-extrabold text-ember-400">
              Æ
            </span>
          </div>
          <div className="hidden md:block">
            <p className="font-display text-lg font-bold leading-none tracking-tight">
              Aether
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-mist-400">
              Premium IPTV
            </p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2 md:p-3">
        {NAV.map((item) => {
          const active = view === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                active
                  ? 'bg-ember-500/15 text-sand-50'
                  : 'text-mist-300 hover:bg-white/5 hover:text-sand-50'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-xl bg-ember-500/15 ring-1 ring-ember-400/30"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <Icon
                size={20}
                className={`relative z-10 ${active ? 'text-ember-400' : ''}`}
              />
              <span className="relative z-10 hidden text-sm font-medium md:inline">
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>

      {prefs.showClock && (
        <div className="hidden border-t border-white/8 px-5 py-4 md:block">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-mist-400">
            Local
          </p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
            {clock}
          </p>
        </div>
      )}
    </aside>
  )
}
