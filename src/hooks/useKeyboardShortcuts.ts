import { useEffect } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../context/AppContext'

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate()
  const { setSidebarOpen, sidebarOpen } = useAppStore()

  // Navigation shortcuts
  useHotkeys('ctrl+1', () => navigate('/'), { preventDefault: true })
  useHotkeys('ctrl+2', () => navigate('/channels'), { preventDefault: true })
  useHotkeys('ctrl+3', () => navigate('/epg'), { preventDefault: true })
  useHotkeys('ctrl+4', () => navigate('/recordings'), { preventDefault: true })
  useHotkeys('ctrl+5', () => navigate('/settings'), { preventDefault: true })

  // UI shortcuts
  useHotkeys('ctrl+b', () => setSidebarOpen(!sidebarOpen), { preventDefault: true })
  useHotkeys('ctrl+/', () => {
    // Show keyboard shortcuts help
    console.log('Keyboard shortcuts help')
  }, { preventDefault: true })

  // Player shortcuts (will be extended when player is implemented)
  useHotkeys('space', (e) => {
    // Only handle if not in an input field
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return
    }
    e.preventDefault()
    // Toggle play/pause
    console.log('Toggle play/pause')
  })

  useHotkeys('f', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return
    }
    e.preventDefault()
    // Toggle fullscreen
    console.log('Toggle fullscreen')
  })

  useHotkeys('m', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return
    }
    e.preventDefault()
    // Toggle mute
    console.log('Toggle mute')
  })

  useHotkeys('up', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return
    }
    e.preventDefault()
    // Volume up
    console.log('Volume up')
  })

  useHotkeys('down', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return
    }
    e.preventDefault()
    // Volume down
    console.log('Volume down')
  })

  useHotkeys('left', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return
    }
    e.preventDefault()
    // Seek backward
    console.log('Seek backward')
  })

  useHotkeys('right', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return
    }
    e.preventDefault()
    // Seek forward
    console.log('Seek forward')
  })

  useHotkeys('ctrl+shift+d', () => {
    // Toggle developer tools
    console.log('Toggle developer tools')
  }, { preventDefault: true })

  // Channel shortcuts
  useHotkeys('ctrl+up', () => {
    // Previous channel
    console.log('Previous channel')
  }, { preventDefault: true })

  useHotkeys('ctrl+down', () => {
    // Next channel
    console.log('Next channel')
  }, { preventDefault: true })

  useEffect(() => {
    // Show keyboard shortcuts on first load
    const hasSeenShortcuts = localStorage.getItem('hasSeenKeyboardShortcuts')
    if (!hasSeenShortcuts) {
      setTimeout(() => {
        console.log('Keyboard shortcuts available! Press Ctrl+/ to see all shortcuts.')
        localStorage.setItem('hasSeenKeyboardShortcuts', 'true')
      }, 2000)
    }
  }, [])
}