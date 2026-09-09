import { useEffect } from 'react'
import { Shell } from './components/layout/Shell'
import { HomePage } from './pages/HomePage'
import { LivePage } from './pages/LivePage'
import { GuidePage } from './pages/GuidePage'
import { VodPage } from './pages/VodPage'
import { FavoritesPage } from './pages/FavoritesPage'
import { SettingsPage } from './pages/SettingsPage'
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
      // Mosaic renders on the Shell canvas; overlay only shows SideNav.
      return null
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
  const setMenuOpen = useIptvStore((s) => s.setMenuOpen)
  const toggleMenu = useIptvStore((s) => s.toggleMenu)
  const channels = useIptvStore((s) => s.channels)
  const player = useIptvStore((s) => s.player)

  useEffect(() => {
    refreshDemoGuide()
  }, [refreshDemoGuide])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const state = useIptvStore.getState()
      const view = state.view
      const menuOpen = state.menuOpen
      const seedFocus =
        view === 'multiview' || view === 'settings' || view === 'guide' || view === 'vod'

      // Remote: open/close overlay menu (R / OK-style Enter when menu closed)
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        toggleMenu()
        return
      }
      if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault()
        if (menuOpen) {
          setMenuOpen(false)
        } else {
          setPlayer({ overlayVisible: !state.player.overlayVisible })
        }
        return
      }
      if ((e.key === 'Enter' || e.key === 'OK') && !menuOpen) {
        const active = document.activeElement as HTMLElement | null
        const tag = active?.tagName
        // Don't steal OK/Enter from focused controls — only body-level OK opens menu
        if (
          active &&
          active !== document.body &&
          tag !== 'HTML' &&
          tag !== 'BODY'
        ) {
          return
        }
        e.preventDefault()
        setMenuOpen(true)
        return
      }

      // Spatial D-pad navigation when focus is already on a control
      if (handleTvDirectionalKey(e, document, { seedIfUnfocused: seedFocus || menuOpen }))
        return

      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && (seedFocus || menuOpen)) {
        return
      }

      // Channel zap only in immersive TV (menu dismissed)
      const live = channels.filter((c) => c.kind === 'live')
      const idx = live.findIndex((c) => c.id === player.channelId)

      if (e.key === ' ') {
        e.preventDefault()
        setPlayer({ paused: !useIptvStore.getState().player.paused })
      } else if (!menuOpen && e.key === 'ArrowUp' && idx >= 0) {
        e.preventDefault()
        playChannel(live[(idx - 1 + live.length) % live.length].id)
      } else if (!menuOpen && e.key === 'ArrowDown' && idx >= 0) {
        e.preventDefault()
        playChannel(live[(idx + 1) % live.length].id)
      } else if (e.key === 'm' || e.key === 'M') {
        setPlayer({ muted: !useIptvStore.getState().player.muted })
      } else if (e.key === 'g' || e.key === 'G') {
        setView('guide')
      } else if (e.key === 'h' || e.key === 'H') {
        setView('home')
      } else if (e.key === 'v' || e.key === 'V') {
        useIptvStore.getState().setMultiViewLayout(
          useIptvStore.getState().player.multiViewLayout === 4 ? 4 : 2,
        )
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    channels,
    player.channelId,
    playChannel,
    setPlayer,
    setView,
    setMenuOpen,
    toggleMenu,
  ])

  if (!onboarded) return <OnboardingPage />

  return (
    <Shell>
      <ViewRouter />
    </Shell>
  )
}
