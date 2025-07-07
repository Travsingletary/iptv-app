import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

// Mock the store to prevent real API calls
import { useStreamStore } from './store/streamStore'

beforeEach(() => {
  // Reset store state before each test
  useStreamStore.setState({
    currentChannel: null,
    currentProgram: null,
    channels: [],
    programs: [],
    isLoading: false,
    error: null,
  })
})

describe('App Integration', () => {
  it('should render main application structure', () => {
    render(<App />)
    
    // Check for main elements
    expect(screen.getByText('SteadyStream Core')).toBeDefined()
    
    // Should have video player area (placeholder when no channel selected)
    expect(screen.getByText('Select a channel to start watching')).toBeDefined()
    
    // Should have channel guide section
    expect(screen.getByText('Channels')).toBeDefined()
  })

  it('should have responsive layout structure', () => {
    render(<App />)
    
    // Check for main layout elements using more specific selectors
    expect(screen.getByText('SteadyStream Core')).toBeDefined()
    
    const main = screen.getByRole('main')
    expect(main).toBeDefined()
  })

  it('should show loading state in channel guide', () => {
    // Set loading state
    useStreamStore.setState({ isLoading: true })
    
    render(<App />)
    
    expect(screen.getByText('Loading channels...')).toBeDefined()
  })

  it('should render with channels when store has data', () => {
    // Set up state with channels and programs
    useStreamStore.setState({ 
      currentChannel: {
        id: 'test-channel',
        number: '1',
        name: 'Test Channel',
        isActive: true
      },
      currentProgram: {
        id: 'test-program',
        channelId: 'test-channel',
        title: 'Test Program',
        description: 'Test description',
        startTime: new Date(),
        endTime: new Date(),
        category: 'Test',
        isLive: true
      },
      channels: [{
        id: 'test-channel',
        number: '1',
        name: 'Test Channel',
        isActive: true
      }],
      programs: [],
      isLoading: false,
      error: null
    })
    
    render(<App />)
    
    // Should show video player with content
    expect(screen.getByTestId('video-player')).toBeDefined()
    expect(screen.getByText('Test Channel')).toBeDefined()
    
    // Should show program info
    expect(screen.getByTestId('program-info')).toBeDefined()
    expect(screen.getByText('Test Program')).toBeDefined()
  })
})