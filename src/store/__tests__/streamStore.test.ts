import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useStreamStore } from '../streamStore'
import { mockChannels, mockPrograms } from '../../utils/mockData'

// Mock the mockData module to control test data
vi.mock('../../utils/mockData', () => ({
  mockChannels: [
    {
      id: 'test-channel-1',
      number: '1',
      name: 'Test Channel 1',
      logo: '📺',
      streamUrl: 'test-url',
      isActive: true,
    },
    {
      id: 'test-channel-2',
      number: '2',
      name: 'Test Channel 2',
      logo: '🎬',
      streamUrl: '',
      isActive: false,
    },
  ],
  mockPrograms: [
    {
      id: 'test-program-1',
      channelId: 'test-channel-1',
      title: 'Test Program 1',
      description: 'Test description',
      startTime: new Date('2024-01-01T20:00:00'),
      endTime: new Date('2024-01-01T21:00:00'),
      category: 'Test',
      rating: 'TV-G',
      isLive: true,
    },
    {
      id: 'test-program-2',
      channelId: 'test-channel-1',
      title: 'Test Program 2',
      description: 'Test description 2',
      startTime: new Date('2024-01-01T21:00:00'),
      endTime: new Date('2024-01-01T22:00:00'),
      category: 'Test',
      rating: 'TV-PG',
      isLive: false,
    },
  ],
}))

describe('StreamStore', () => {
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

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useStreamStore.getState()
      
      expect(state.currentChannel).toBeNull()
      expect(state.currentProgram).toBeNull()
      expect(state.channels).toEqual([])
      expect(state.programs).toEqual([])
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('setCurrentChannel', () => {
    it('should set current channel and find live program', () => {
      const { setCurrentChannel } = useStreamStore.getState()
      const testChannel = mockChannels[0]
      const testProgram = mockPrograms[0]

      // Set up programs first
      useStreamStore.setState({ programs: mockPrograms })
      
      setCurrentChannel(testChannel)
      
      const state = useStreamStore.getState()
      expect(state.currentChannel).toEqual(testChannel)
      expect(state.currentProgram).toEqual(testProgram)
    })

    it('should set current channel without program if no live program exists', () => {
      const { setCurrentChannel } = useStreamStore.getState()
      const testChannel = mockChannels[1]

      // Set up programs that don't match the channel
      useStreamStore.setState({ programs: mockPrograms })
      
      setCurrentChannel(testChannel)
      
      const state = useStreamStore.getState()
      expect(state.currentChannel).toEqual(testChannel)
      expect(state.currentProgram).toBeNull()
    })
  })

  describe('setCurrentProgram', () => {
    it('should set current program', () => {
      const { setCurrentProgram } = useStreamStore.getState()
      const testProgram = mockPrograms[0]
      
      setCurrentProgram(testProgram)
      
      const state = useStreamStore.getState()
      expect(state.currentProgram).toEqual(testProgram)
    })

    it('should clear current program when set to null', () => {
      const { setCurrentProgram } = useStreamStore.getState()
      
      // Set a program first
      useStreamStore.setState({ currentProgram: mockPrograms[0] })
      
      setCurrentProgram(null)
      
      const state = useStreamStore.getState()
      expect(state.currentProgram).toBeNull()
    })
  })

  describe('loadChannels', () => {
    it('should load channels successfully', async () => {
      const { loadChannels } = useStreamStore.getState()
      
      await loadChannels()
      
      const state = useStreamStore.getState()
      expect(state.channels).toEqual(mockChannels)
      expect(state.currentChannel).toEqual(mockChannels[0])
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should set loading state during channel loading', async () => {
      const { loadChannels } = useStreamStore.getState()
      
      const loadingPromise = loadChannels()
      
      // Check loading state immediately
      const loadingState = useStreamStore.getState()
      expect(loadingState.isLoading).toBe(true)
      expect(loadingState.error).toBeNull()
      
      await loadingPromise
      
      const finalState = useStreamStore.getState()
      expect(finalState.isLoading).toBe(false)
    })
  })

  describe('loadPrograms', () => {
    it('should load programs for a channel', async () => {
      const { loadPrograms } = useStreamStore.getState()
      
      await loadPrograms('test-channel-1')
      
      const state = useStreamStore.getState()
      expect(state.programs).toEqual(mockPrograms)
      expect(state.currentProgram).toEqual(mockPrograms[0]) // First live program
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should set loading state during program loading', async () => {
      const { loadPrograms } = useStreamStore.getState()
      
      const loadingPromise = loadPrograms('test-channel-1')
      
      // Check loading state immediately
      const loadingState = useStreamStore.getState()
      expect(loadingState.isLoading).toBe(true)
      expect(loadingState.error).toBeNull()
      
      await loadingPromise
      
      const finalState = useStreamStore.getState()
      expect(finalState.isLoading).toBe(false)
    })

    it('should filter programs by channel ID', async () => {
      const { loadPrograms } = useStreamStore.getState()
      
      await loadPrograms('test-channel-2')
      
      const state = useStreamStore.getState()
      // No programs for test-channel-2 in mock data
      expect(state.programs).toEqual([])
      expect(state.currentProgram).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('should set error state', () => {
      const { setError } = useStreamStore.getState()
      
      setError('Test error message')
      
      const state = useStreamStore.getState()
      expect(state.error).toBe('Test error message')
    })

    it('should clear error state', () => {
      const { setError } = useStreamStore.getState()
      
      // Set error first
      useStreamStore.setState({ error: 'Some error' })
      
      setError(null)
      
      const state = useStreamStore.getState()
      expect(state.error).toBeNull()
    })
  })

  describe('Loading State', () => {
    it('should set loading state', () => {
      const { setLoading } = useStreamStore.getState()
      
      setLoading(true)
      
      const state = useStreamStore.getState()
      expect(state.isLoading).toBe(true)
    })

    it('should clear loading state', () => {
      const { setLoading } = useStreamStore.getState()
      
      // Set loading first
      useStreamStore.setState({ isLoading: true })
      
      setLoading(false)
      
      const state = useStreamStore.getState()
      expect(state.isLoading).toBe(false)
    })
  })
})