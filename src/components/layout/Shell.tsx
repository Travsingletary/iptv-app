import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { SideNav } from './SideNav'
import { useIptvStore } from '../../store/useIptvStore'

export function Shell({ children }: { children: ReactNode }) {
  const view = useIptvStore((s) => s.view)
  const prefs = useIptvStore((s) => s.prefs)

  return (
    <div className="relative flex h-full min-h-0 bg-hero-wash bg-grain">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(232,160,69,0.08),transparent_35%)]" />
      <SideNav />
      <main className="relative min-w-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            className="h-full overflow-y-auto"
            initial={
              prefs.reduceMotion
                ? false
                : { opacity: 0, y: 14, filter: 'blur(4px)' }
            }
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={
              prefs.reduceMotion
                ? undefined
                : { opacity: 0, y: -10, filter: 'blur(3px)' }
            }
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
