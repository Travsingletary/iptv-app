import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDebouncedLocalStorage } from './debouncedStorage'

describe('createDebouncedLocalStorage', () => {
  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  it('coalesces rapid setItem into one write after delay', () => {
    vi.useFakeTimers()
    const storage = createDebouncedLocalStorage(500)
    const spy = vi.spyOn(Storage.prototype, 'setItem')

    storage.setItem('aether-iptv-v2', '{"n":1}')
    storage.setItem('aether-iptv-v2', '{"n":2}')
    storage.setItem('aether-iptv-v2', '{"n":3}')
    expect(spy).not.toHaveBeenCalled()

    vi.advanceTimersByTime(500)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0]?.[1]).toBe('{"n":3}')
    spy.mockRestore()
  })

  it('getItem returns pending value before flush', () => {
    vi.useFakeTimers()
    const storage = createDebouncedLocalStorage(800)
    storage.setItem('k', 'pending')
    expect(storage.getItem('k')).toBe('pending')
  })
})
