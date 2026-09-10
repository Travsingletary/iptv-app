import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { SideNav } from './SideNav'
import { RemoteFab } from './RemoteFab'
import { useIptvStore } from '../../store/useIptvStore'
import { AssistantPanel } from '../assistant/AssistantPanel'
import { ReminderToasts } from '../assistant/ReminderToasts'
import { AutomationToasts } from '../assistant/AutomationToasts'
import { VideoPlayer } from '../player/VideoPlayer'
import { PlayerChrome } from '../player/PlayerChrome'
import { MultiViewPage } from '../../pages/MultiViewPage'

/**
 * TV-first shell: live/VOD video is the always-on canvas.
 * Home/Guide/Live list/Settings/etc. animate in as overlays over dimmed video.
 * Remote FAB (and keyboard) toggles the overlay menu.
 */
export function Shell({ children }: { children: ReactNode }) {
  const view = useIptvStore((s) => s.view)
  const menuOpen = useIptvStore((s) => s.menuOpen)
  const prefs = useIptvStore((s) => s.prefs)
  const player = useIptvStore((s) => s.player)
  const channels = useIptvStore((s) => s.channels)
  const playChannel = useIptvStore((s) => s.playChannel)
  const setPlayer = useIptvStore((s) => s.setPlayer)
  const setView = useIptvStore((s) => s.setView)

  const channel = channels.find((c) => c.id === player.channelId)
  const isMultiView = view === 'multiview'
  const showVideoCanvas = Boolean(channel) && !isMultiView
  /** Live list is a side rail so the TV + chrome stay visible (TiviMate). */
  const liveRail = menuOpen && view === 'live'
  const fullOverlay = menuOpen && view !== 'live' && view !== 'multiview'

  // Keep a live channel tuned so the canvas is never empty after onboarding.
  useEffect(() => {
    if (player.channelId || isMultiView) return
    const live = channels.find((c) => c.kind === 'live') || channels[0]
    if (live) playChannel(live.id)
  }, [player.channelId, channels, playChannel, isMultiView])

  const reduce = prefs.reduceMotion
  const panelTransition = reduce
    ? { duration: 0.01 }
    : { type: 'spring' as const, stiffness: 380, damping: 34, mass: 0.85 }

  return (
    <div className="relative h-full min-h-0 overflow-hidden bg-ink-950">
      {/* Layer 0 — always-on TV canvas */}
      {showVideoCanvas && (
        <div
          className="absolute inset-0 z-0 bg-black"
          onMouseMove={() => setPlayer({ overlayVisible: true })}
          onClick={() => {
            if (!menuOpen) setPlayer({ overlayVisible: true })
          }}
        >
          <VideoPlayer />
          <PlayerChrome onOpenGuide={() => setView('guide')} />
        </div>
      )}

      {isMultiView && (
        <div className="absolute inset-0 z-0 bg-ink-950">
          <MultiViewPage />
        </div>
      )}

      {!showVideoCanvas && !isMultiView && !menuOpen && (
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-hero-wash bg-grain text-mist-300">
          <p className="font-display text-lg">Press Remote to open the menu</p>
        </div>
      )}

      {/* Dimmer when a full content overlay covers the TV */}
      <AnimatePresence>
        {fullOverlay && showVideoCanvas && (
          <motion.div
            key="tv-dimmer"
            className="pointer-events-none absolute inset-0 z-10 bg-ink-950/60"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.28 }}
          />
        )}
      </AnimatePresence>

      {/* Overlay chrome: rail + content panel */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="tv-overlay"
            className={`absolute inset-0 z-30 flex min-h-0 ${
              liveRail || isMultiView ? 'pointer-events-none' : ''
            }`}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <motion.div
              className="pointer-events-auto relative z-30 h-full shrink-0"
              initial={reduce ? false : { x: -72, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={reduce ? undefined : { x: -56, opacity: 0 }}
              transition={panelTransition}
            >
              <SideNav overlay />
            </motion.div>

            {!isMultiView && (
              <motion.main
                className={`pointer-events-auto relative min-w-0 ${
                  liveRail ? 'w-full max-w-md shrink-0' : 'flex-1 overflow-hidden'
                }`}
                initial={
                  reduce
                    ? false
                    : liveRail
                      ? { opacity: 0, x: -24 }
                      : { opacity: 0, y: 18, scale: 0.98 }
                }
                animate={
                  liveRail
                    ? { opacity: 1, x: 0 }
                    : { opacity: 1, y: 0, scale: 1 }
                }
                exit={
                  reduce
                    ? undefined
                    : liveRail
                      ? { opacity: 0, x: -16 }
                      : { opacity: 0, y: 12, scale: 0.985 }
                }
                transition={panelTransition}
              >
                <div
                  className={`h-full min-h-0 ${
                    liveRail
                      ? 'border-r border-white/10 bg-ink-950/92 shadow-[12px_0_40px_rgba(0,0,0,0.5)] backdrop-blur-xl'
                      : showVideoCanvas
                        ? 'bg-ink-900/80 backdrop-blur-xl md:m-3 md:rounded-2xl md:ring-1 md:ring-white/10'
                        : 'bg-hero-wash bg-grain'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={view}
                      className="h-full overflow-y-auto"
                      initial={reduce ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduce ? undefined : { opacity: 0, y: -8 }}
                      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {children}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.main>
            )}

            {isMultiView && (
              <motion.div
                className="pointer-events-none flex flex-1 items-start justify-end p-4 md:p-6"
                initial={reduce ? false : { opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0 }}
              >
                <p className="pointer-events-none rounded-full border border-white/15 bg-ink-950/70 px-4 py-2 text-xs text-sand-100/90 backdrop-blur">
                  Mosaic is live — Remote / Back dismisses the menu
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AssistantPanel />
      <ReminderToasts />
      <AutomationToasts />
      <RemoteFab />
    </div>
  )
}
