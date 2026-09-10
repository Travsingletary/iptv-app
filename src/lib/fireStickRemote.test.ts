import { describe, expect, it } from 'vitest'
import {
  hasActiveTvControl,
  isBackKey,
  isMenuKey,
  isSelectKey,
  resolveRemoteAction,
} from './fireStickRemote'

describe('fireStickRemote keys', () => {
  it('detects OK / Select / Enter', () => {
    expect(isSelectKey({ key: 'Enter', code: 'Enter' })).toBe(true)
    expect(isSelectKey({ key: 'OK', code: '' })).toBe(true)
    expect(isSelectKey({ key: 'Select', code: '' })).toBe(true)
    expect(isSelectKey({ key: 'a', code: 'KeyA' })).toBe(false)
  })

  it('detects Back / Escape / Backspace', () => {
    expect(isBackKey({ key: 'Escape', code: 'Escape' })).toBe(true)
    expect(isBackKey({ key: 'Backspace', code: 'Backspace' })).toBe(true)
    expect(isBackKey({ key: 'BrowserBack', code: '' })).toBe(true)
    expect(isBackKey({ key: 'Enter', code: 'Enter' })).toBe(false)
  })

  it('detects Menu / ContextMenu / Android keyCode 82', () => {
    expect(isMenuKey({ key: 'ContextMenu', code: 'ContextMenu', keyCode: 0 })).toBe(true)
    expect(isMenuKey({ key: 'Unidentified', code: '', keyCode: 82 })).toBe(true)
    expect(isMenuKey({ key: 'm', code: 'KeyM', keyCode: 77 })).toBe(false)
  })
})

describe('resolveRemoteAction', () => {
  const immersive = {
    menuOpen: false,
    overlayVisible: false,
    focusMode: false,
  }
  const chromeOnly = {
    menuOpen: false,
    overlayVisible: true,
    focusMode: false,
  }
  const overlay = {
    menuOpen: true,
    overlayVisible: true,
    focusMode: true,
  }

  it('OK opens menu when immersive and nothing focused', () => {
    expect(
      resolveRemoteAction({ key: 'Enter', code: 'Enter', keyCode: 13 }, immersive, {
        hasFocusedControl: false,
      }),
    ).toBe('open-menu')
  })

  it('OK activates focused control when overlay open', () => {
    expect(
      resolveRemoteAction({ key: 'Enter', code: 'Enter', keyCode: 13 }, overlay, {
        hasFocusedControl: true,
      }),
    ).toBe('select-focused')
  })

  it('Back dismisses overlay then hides chrome then noops', () => {
    expect(
      resolveRemoteAction({ key: 'Escape', code: 'Escape', keyCode: 27 }, overlay),
    ).toBe('dismiss-menu')
    expect(
      resolveRemoteAction({ key: 'Escape', code: 'Escape', keyCode: 27 }, chromeOnly),
    ).toBe('hide-chrome')
    expect(
      resolveRemoteAction({ key: 'Escape', code: 'Escape', keyCode: 27 }, immersive),
    ).toBe('noop-immersive')
  })

  it('Menu / R toggles overlay', () => {
    expect(
      resolveRemoteAction({ key: 'r', code: 'KeyR', keyCode: 82 }, immersive),
    ).toBe('toggle-menu')
    expect(
      resolveRemoteAction({ key: 'ContextMenu', code: 'ContextMenu', keyCode: 93 }, overlay),
    ).toBe('toggle-menu')
  })

  it('Up/Down zap when immersive; focus-nav when overlay', () => {
    expect(
      resolveRemoteAction({ key: 'ArrowUp', code: 'ArrowUp', keyCode: 38 }, immersive),
    ).toBe('channel-zap-up')
    expect(
      resolveRemoteAction({ key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 }, immersive),
    ).toBe('channel-zap-down')
    expect(
      resolveRemoteAction({ key: 'ArrowUp', code: 'ArrowUp', keyCode: 38 }, overlay),
    ).toBe('focus-nav')
  })

  it('Left/Right are focus-nav when rails/chrome present', () => {
    expect(
      resolveRemoteAction({ key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37 }, chromeOnly),
    ).toBe('focus-nav')
    expect(
      resolveRemoteAction({ key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 }, overlay),
    ).toBe('focus-nav')
    expect(
      resolveRemoteAction({ key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37 }, immersive),
    ).toBe('ignore')
  })
})

describe('hasActiveTvControl', () => {
  it('treats body as unfocused', () => {
    const body = document.createElement('body')
    expect(hasActiveTvControl(body)).toBe(false)
    const btn = document.createElement('button')
    expect(hasActiveTvControl(btn)).toBe(true)
  })
})
