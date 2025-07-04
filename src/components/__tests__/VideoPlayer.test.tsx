import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VideoPlayer } from '../VideoPlayer'
import { Channel } from '../../types/stream'

const mockActiveChannel: Channel = {
  id: 'test-channel-1',
  number: '1',
  name: 'Test Channel',
  logo: '📺',
  streamUrl: 'test-url',
  isActive: true,
}

const mockInactiveChannel: Channel = {
  id: 'test-channel-2',
  number: '2',
  name: 'Inactive Channel',
  logo: '🚫',
  streamUrl: '',
  isActive: false,
}

describe('VideoPlayer', () => {
  describe('Placeholder State', () => {
    it('should show placeholder when no channel is provided', () => {
      render(<VideoPlayer channel={null} />)
      
      expect(screen.getByTestId('video-player-placeholder')).toBeInTheDocument()
      expect(screen.getByText('Select a channel to start watching')).toBeInTheDocument()
      expect(screen.getByText('📺')).toBeInTheDocument()
    })

    it('should show placeholder when channel is inactive', () => {
      render(<VideoPlayer channel={mockInactiveChannel} />)
      
      expect(screen.getByTestId('video-player-placeholder')).toBeInTheDocument()
      expect(screen.getByText('Channel unavailable')).toBeInTheDocument()
    })

    it('should apply custom className to placeholder', () => {
      render(<VideoPlayer channel={null} className="custom-class" />)
      
      const placeholder = screen.getByTestId('video-player-placeholder')
      expect(placeholder).toHaveClass('custom-class')
    })
  })

  describe('Active Player State', () => {
    it('should render video player when channel is active', () => {
      render(<VideoPlayer channel={mockActiveChannel} />)
      
      expect(screen.getByTestId('video-player')).toBeInTheDocument()
      expect(screen.getByText('Test Channel')).toBeInTheDocument()
      expect(screen.getByText('Channel 1')).toBeInTheDocument()
      expect(screen.getByText('📺')).toBeInTheDocument()
    })

    it('should apply custom className to video player', () => {
      render(<VideoPlayer channel={mockActiveChannel} className="custom-class" />)
      
      const player = screen.getByTestId('video-player')
      expect(player).toHaveClass('custom-class')
    })

    it('should show paused state initially', () => {
      render(<VideoPlayer channel={mockActiveChannel} />)
      
      expect(screen.getByText('⏸ PAUSED')).toBeInTheDocument()
    })
  })

  describe('Play/Pause Functionality', () => {
    it('should toggle play/pause state when button is clicked', () => {
      render(<VideoPlayer channel={mockActiveChannel} />)
      
      const playPauseButton = screen.getByTestId('play-pause-button')
      
      // Initially paused
      expect(screen.getByText('⏸ PAUSED')).toBeInTheDocument()
      expect(playPauseButton).toHaveAttribute('aria-label', 'Play')
      
      // Click to play
      fireEvent.click(playPauseButton)
      
      expect(screen.getByText('● LIVE')).toBeInTheDocument()
      expect(playPauseButton).toHaveAttribute('aria-label', 'Pause')
      
      // Click to pause
      fireEvent.click(playPauseButton)
      
      expect(screen.getByText('⏸ PAUSED')).toBeInTheDocument()
      expect(playPauseButton).toHaveAttribute('aria-label', 'Play')
    })

    it('should show correct icon for play/pause state', () => {
      render(<VideoPlayer channel={mockActiveChannel} />)
      
      const playPauseButton = screen.getByTestId('play-pause-button')
      
      // Initially shows play icon (component loads paused)
      expect(playPauseButton.querySelector('svg')).toBeInTheDocument()
      
      // Click to play
      fireEvent.click(playPauseButton)
      
      // Should now show pause icon
      expect(playPauseButton.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('Mute Functionality', () => {
    it('should have mute button with correct aria-label', () => {
      render(<VideoPlayer channel={mockActiveChannel} />)
      
      const muteButton = screen.getByTestId('mute-button')
      expect(muteButton).toHaveAttribute('aria-label', 'Mute')
    })

    it('should toggle mute state when button is clicked', () => {
      render(<VideoPlayer channel={mockActiveChannel} />)
      
      const muteButton = screen.getByTestId('mute-button')
      
      // Initially unmuted
      expect(muteButton).toHaveAttribute('aria-label', 'Mute')
      
      // Click to mute
      fireEvent.click(muteButton)
      
      expect(muteButton).toHaveAttribute('aria-label', 'Unmute')
      
      // Click to unmute
      fireEvent.click(muteButton)
      
      expect(muteButton).toHaveAttribute('aria-label', 'Mute')
    })
  })

  describe('Display Information', () => {
    it('should display channel information correctly', () => {
      render(<VideoPlayer channel={mockActiveChannel} />)
      
      expect(screen.getByText('Test Channel')).toBeInTheDocument()
      expect(screen.getByText('Channel 1')).toBeInTheDocument()
      expect(screen.getByText('Now playing: Test Channel')).toBeInTheDocument()
    })

    it('should display channel logo', () => {
      render(<VideoPlayer channel={mockActiveChannel} />)
      
      expect(screen.getByText('📺')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for controls', () => {
      render(<VideoPlayer channel={mockActiveChannel} />)
      
      expect(screen.getByTestId('play-pause-button')).toHaveAttribute('aria-label', 'Play')
      expect(screen.getByTestId('mute-button')).toHaveAttribute('aria-label', 'Mute')
    })

    it('should update ARIA labels when state changes', () => {
      render(<VideoPlayer channel={mockActiveChannel} />)
      
      const playPauseButton = screen.getByTestId('play-pause-button')
      const muteButton = screen.getByTestId('mute-button')
      
      // Click play button
      fireEvent.click(playPauseButton)
      expect(playPauseButton).toHaveAttribute('aria-label', 'Pause')
      
      // Click mute button
      fireEvent.click(muteButton)
      expect(muteButton).toHaveAttribute('aria-label', 'Unmute')
    })
  })

  describe('Edge Cases', () => {
    it('should handle channel with missing properties gracefully', () => {
      const partialChannel: Channel = {
        id: 'partial',
        number: '99',
        name: 'Partial Channel',
        isActive: true,
        // Missing logo and streamUrl
      }
      
      render(<VideoPlayer channel={partialChannel} />)
      
      expect(screen.getByTestId('video-player')).toBeInTheDocument()
      expect(screen.getByText('Partial Channel')).toBeInTheDocument()
      expect(screen.getByText('Channel 99')).toBeInTheDocument()
    })

    it('should handle empty channel name', () => {
      const emptyNameChannel: Channel = {
        ...mockActiveChannel,
        name: '',
      }
      
      render(<VideoPlayer channel={emptyNameChannel} />)
      
      expect(screen.getByTestId('video-player')).toBeInTheDocument()
      expect(screen.getByText('Now playing:')).toBeInTheDocument()
    })
  })
})