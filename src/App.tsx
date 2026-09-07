import { useEffect } from 'react'
import { Shell } from './components/layout/Shell'
import { HomePage } from './pages/HomePage'
import { LivePage } from './pages/LivePage'
import { GuidePage } from './pages/GuidePage'
import { VodPage } from './pages/VodPage'
import { FavoritesPage } from './pages/FavoritesPage'
import { SettingsPage } from './pages/SettingsPage'
import { MultiViewPage } from './pages/MultiViewPage'
import { handleTvDirectionalKey } from './lib/tvFocus'
import { OnboardingPage } from './pages/OnboardingPage'
import { useIptvStore } from './store/useIptvStore'

function ViewRouter() {
  const view = useIptvStore((s) => s.view)
  switch (view) {
    case 'live':
      return <LivePage />
    case 'guide':
      return <GuidePage />
    case 'vod':
      return <VodPage />
    case 'favorites':
      return <FavoritesPage />
    case 'settings':
      return <SettingsPage />
    case 'multiview':
      return <MultiViewPage />
    case 'home':
    default:
      return <HomePage />
  }
}

export default function App() {
  const onboarded = useIptvStore((s) => s.onboarded)
  const refreshDemoGuide = useIptvStore((s) => s.refreshDemoGuide)
  const playChannel = useIptvStore((s) => s.playChannel)
  const setPlayer = useIptvStore((s) => s.setPlayer)
  const setView = useIptvStore((s) => s.setView)
  const channels = useIptvStore((s) => s.channels)
  const player = useIptvStore((s) => s.player)

  useEffect(() => {
    refreshDemoGuide()
  }, [refreshDemoGuide])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const view = useIptvStore.getState().view
      const seedFocus =
        view === 'multiview' || view === 'settings' || view === 'guide' || view === 'vod'

      // Spatial D-pad navigation when focus is already on a control
      if (handleTvDirectionalKey(e, document, { seedIfUnfocused: seedFocus })) return

      // On mosaic / settings / guide, arrows are for focus — not channel zap
      if (
        (e.key === 'ArrowUp' || e.key === 'ArrowDown') &&
        seedFocus
      ) {
        return
      }

      const live = channels.filter((c) => c.kind === 'live')
      const idx = live.findIndex((c) => c.id === player.channelId)

      if (e.key === ' ') {
        e.preventDefault()
        setPlayer({ paused: !useIptvStore.getState().player.paused })
      } else if (e.key === 'ArrowUp' && idx >= 0) {
        e.preventDefault()
        playChannel(live[(idx - 1 + live.length) % live.length].id)
      } else if (e.key === 'ArrowDown' && idx >= 0) {
        e.preventDefault()
        playChannel(live[(idx + 1) % live.length].id)
      } else if (e.key === 'm' || e.key === 'M') {
        setPlayer({ muted: !useIptvStore.getState().player.muted })
      } else if (e.key === 'g' || e.key === 'G') {
        setView('guide')
      } else if (e.key === 'h' || e.key === 'H') {
        setView('home')
      } else if (e.key === 'v' || e.key === 'V') {
        setView('multiview')
        useIptvStore.getState().setMultiViewLayout(
          useIptvStore.getState().player.multiViewLayout === 4 ? 4 : 2,
        )
      } else if (e.key === 'Escape') {
        setPlayer({ overlayVisible: !useIptvStore.getState().player.overlayVisible })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [channels, player.channelId, playChannel, setPlayer, setView])

  if (!onboarded) return <OnboardingPage />

  return (
    <Shell>
      <ViewRouter />
    </Shell>
  )
}
