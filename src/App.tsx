import { useEffect } from 'react'
import { Shell } from './components/layout/Shell'
import { HomePage } from './pages/HomePage'
import { LivePage } from './pages/LivePage'
import { GuidePage } from './pages/GuidePage'
import { VodPage } from './pages/VodPage'
import { FavoritesPage } from './pages/FavoritesPage'
import { SettingsPage } from './pages/SettingsPage'
import { handleTvDirectionalKey } from './lib/tvFocus'
import { hasActiveTvControl, resolveRemoteAction } from './lib/fireStickRemote'
import { OnboardingPage } from './pages/OnboardingPage'
import { useIptvStore } from './store/useIptvStore'
import {
  cancelDigitEntry,
  commitDigitEntry,
  handleChannelDigit,
  playPreviousChannel,
  zapByDirection,
} from './lib/surfingControls'

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

function focusSeedForView(view: string, menuOpen: boolean, overlayVisible: boolean) {
  if (menuOpen) return true
  if (view === 'multiview' || view === 'settings' || view === 'guide' || view === 'vod') {
    return true
  }
  // Player chrome buttons / scrub when chrome is visible
  if (overlayVisible) return true
  return false
}

export default function App() {
  const onboarded = useIptvStore((s) => s.onboarded)
  const refreshDemoGuide = useIptvStore((s) => s.refreshDemoGuide)
  const setPlayer = useIptvStore((s) => s.setPlayer)
  const setView = useIptvStore((s) => s.setView)
  const setMenuOpen = useIptvStore((s) => s.setMenuOpen)
  const toggleMenu = useIptvStore((s) => s.toggleMenu)
  const menuOpen = useIptvStore((s) => s.menuOpen)
  const prefs = useIptvStore((s) => s.prefs)

  useEffect(() => {
    refreshDemoGuide()
  }, [refreshDemoGuide])

  // Accessibility prefs → documentElement classes (large text / high contrast).
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('a11y-large-text', Boolean(prefs.largeText))
    root.classList.toggle('a11y-high-contrast', Boolean(prefs.highContrast))
    root.classList.toggle('a11y-reduce-motion', Boolean(prefs.reduceMotion))
  }, [prefs.largeText, prefs.highContrast, prefs.reduceMotion])

  // Seed focus on onboarding for Fire Stick / keyboard.
  useEffect(() => {
    if (onboarded) return
    const id = window.requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>('[data-testid="onboarding-page"] [data-tv-focus]')
        ?.focus()
    })
    return () => window.cancelAnimationFrame(id)
  }, [onboarded])

  // When the Remote overlay opens, seed focus onto Live list (TiviMate) or SideNav.
  useEffect(() => {
    if (!menuOpen) return
    const id = window.requestAnimationFrame(() => {
      const view = useIptvStore.getState().view
      if (view === 'live') {
        const onAir = document.querySelector<HTMLElement>(
          '[data-testid="live-channel-on-air"], [data-on-air="true"]',
        )
        if (onAir) {
          onAir.focus()
          return
        }
        document
          .querySelector<HTMLElement>('[data-testid="live-channel-list"] [data-tv-focus]')
          ?.focus()
        return
      }
      const first = document.querySelector<HTMLElement>(
        'aside [data-tv-focus], [data-testid="remote-back"], [data-tv-focus]',
      )
      first?.focus()
    })
    return () => window.cancelAnimationFrame(id)
  }, [menuOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      const isTextField =
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        (tag === 'INPUT' &&
          (target as HTMLInputElement).type !== 'range' &&
          (target as HTMLInputElement).type !== 'checkbox' &&
          (target as HTMLInputElement).type !== 'radio' &&
          (target as HTMLInputElement).type !== 'button')
      if (isTextField) return

      const state = useIptvStore.getState()
      const view = state.view
      const menuOpen = state.menuOpen
      const overlayVisible = state.player.overlayVisible
      // Onboarding owns D-pad / Enter before shell remote map.
      if (!state.onboarded) {
        if (handleTvDirectionalKey(e, document, { seedIfUnfocused: true })) return
        return
      }

      const focusMode = focusSeedForView(view, menuOpen, overlayVisible)
      const focused = hasActiveTvControl(document.activeElement)

      // Immersive number-pad channel entry (encourage surfing by LCN / index).
      if (
        !menuOpen &&
        /^[0-9]$/.test(e.key) &&
        view !== 'multiview' &&
        view !== 'settings'
      ) {
        e.preventDefault()
        handleChannelDigit(e.key)
        return
      }
      if (
        state.surfing.digitEntryActive &&
        (e.key === 'Enter' || e.key === 'OK' || e.key === 'Select')
      ) {
        e.preventDefault()
        commitDigitEntry()
        return
      }
      if (state.surfing.digitEntryActive && (e.key === 'Escape' || e.key === 'Backspace')) {
        e.preventDefault()
        cancelDigitEntry()
        return
      }

      const action = resolveRemoteAction(
        e,
        { menuOpen, overlayVisible, focusMode },
        { hasFocusedControl: focused },
      )

      if (action === 'toggle-menu') {
        e.preventDefault()
        toggleMenu()
        return
      }
      if (action === 'open-live-browser') {
        e.preventDefault()
        // TiviMate: ← (or second OK) opens the Live channel side panel over video.
        setView('live')
        return
      }
      if (action === 'show-chrome') {
        e.preventDefault()
        setPlayer({ overlayVisible: true })
        return
      }
      if (action === 'open-guide') {
        e.preventDefault()
        setView('guide')
        return
      }
      if (action === 'previous-channel') {
        e.preventDefault()
        playPreviousChannel()
        return
      }
      if (action === 'open-menu') {
        e.preventDefault()
        setMenuOpen(true)
        return
      }
      if (action === 'dismiss-menu') {
        e.preventDefault()
        setMenuOpen(false)
        return
      }
      if (action === 'hide-chrome') {
        e.preventDefault()
        setPlayer({ overlayVisible: false })
        return
      }
      if (action === 'noop-immersive') {
        e.preventDefault()
        return
      }
      if (action === 'select-focused') {
        // Native activation for the focused control (Enter on <button>, etc.).
        return
      }

      // Channel zap before spatial focus so chrome buttons do not steal ↑↓.
      if (action === 'channel-zap-up') {
        e.preventDefault()
        zapByDirection(-1)
        return
      }
      if (action === 'channel-zap-down') {
        e.preventDefault()
        zapByDirection(1)
        return
      }

      // Spatial D-pad (overlay / chrome left-right)
      if (
        handleTvDirectionalKey(e, document, {
          seedIfUnfocused: focusMode,
        })
      ) {
        return
      }

      if (action === 'focus-nav') {
        // Directional key with nowhere to move.
        return
      }

      if (e.key === ' ') {
        e.preventDefault()
        setPlayer({ paused: !useIptvStore.getState().player.paused })
      } else if (e.key === 'm' || e.key === 'M') {
        setPlayer({ muted: !useIptvStore.getState().player.muted })
      } else if (e.key === 'g' || e.key === 'G') {
        setView('guide')
      } else if (e.key === 'h' || e.key === 'H') {
        setView('live')
      } else if (e.key === 'v' || e.key === 'V') {
        useIptvStore
          .getState()
          .setMultiViewLayout(useIptvStore.getState().player.multiViewLayout === 4 ? 4 : 2)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setPlayer, setView, setMenuOpen, toggleMenu])

  if (!onboarded) return <OnboardingPage />

  return (
    <Shell>
      <ViewRouter />
    </Shell>
  )
}
