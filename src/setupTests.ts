import '@testing-library/jest-dom'

// Simple mock implementations without vitest globals
const mockFn = () => {
  const fn = (..._args: any[]) => fn
  fn.mockImplementation = (impl: any) => {
    Object.assign(fn, impl())
    return fn
  }
  return fn
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockFn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: mockFn(),
    removeListener: mockFn(),
    addEventListener: mockFn(),
    removeEventListener: mockFn(),
    dispatchEvent: mockFn(),
  })),
})

// Mock IntersectionObserver
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: mockFn().mockImplementation(() => ({
    disconnect: mockFn(),
    observe: mockFn(),
    unobserve: mockFn(),
  })),
})

// Mock ResizeObserver
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: mockFn().mockImplementation(() => ({
    disconnect: mockFn(),
    observe: mockFn(),
    unobserve: mockFn(),
  })),
})