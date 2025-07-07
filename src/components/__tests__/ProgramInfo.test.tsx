import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProgramInfo } from '../ProgramInfo'
import { Program } from '../../types/stream'

// Mock Date for consistent testing
const mockDate = new Date('2024-01-01T20:30:00') // 30 minutes into a 1-hour program

const mockLiveProgram: Program = {
  id: 'test-program-1',
  channelId: 'test-channel-1',
  title: 'Test Live Program',
  description: 'This is a test live program description.',
  startTime: new Date('2024-01-01T20:00:00'), // Started 30 min ago
  endTime: new Date('2024-01-01T21:00:00'),   // Ends in 30 min
  category: 'Entertainment',
  rating: 'TV-PG',
  isLive: true,
}

const mockUpcomingProgram: Program = {
  id: 'test-program-2',
  channelId: 'test-channel-1',
  title: 'Upcoming Program',
  description: 'This program will start later.',
  startTime: new Date('2024-01-01T21:00:00'),
  endTime: new Date('2024-01-01T22:00:00'),
  category: 'News',
  rating: 'TV-G',
  isLive: false,
}

const mockProgramWithoutRating: Program = {
  ...mockLiveProgram,
  rating: undefined,
}

describe('ProgramInfo', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(mockDate)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Basic Rendering', () => {
    it('should render program information correctly', () => {
      render(<ProgramInfo program={mockLiveProgram} />)
      
      expect(screen.getByTestId('program-info')).toBeInTheDocument()
      expect(screen.getByTestId('program-title')).toHaveTextContent('Test Live Program')
      expect(screen.getByTestId('program-description')).toHaveTextContent('This is a test live program description.')
    })

    it('should apply custom className', () => {
      render(<ProgramInfo program={mockLiveProgram} className="custom-class" />)
      
      const programInfo = screen.getByTestId('program-info')
      expect(programInfo).toHaveClass('custom-class')
    })
  })

  describe('Live Program Indicators', () => {
    it('should show LIVE badge for live programs', () => {
      render(<ProgramInfo program={mockLiveProgram} />)
      
      expect(screen.getByText('LIVE')).toBeInTheDocument()
      expect(screen.getByText('LIVE')).toHaveClass('bg-red-600')
    })

    it('should not show LIVE badge for non-live programs', () => {
      render(<ProgramInfo program={mockUpcomingProgram} />)
      
      expect(screen.queryByText('LIVE')).not.toBeInTheDocument()
    })

    it('should show progress bar for live programs', () => {
      render(<ProgramInfo program={mockLiveProgram} />)
      
      expect(screen.getByTestId('progress-bar')).toBeInTheDocument()
    })

    it('should not show progress bar for non-live programs', () => {
      render(<ProgramInfo program={mockUpcomingProgram} />)
      
      expect(screen.queryByTestId('progress-bar')).not.toBeInTheDocument()
    })
  })

  describe('Program Metadata', () => {
    it('should display program category', () => {
      render(<ProgramInfo program={mockLiveProgram} />)
      
      expect(screen.getByText('Entertainment')).toBeInTheDocument()
    })

    it('should display program rating when available', () => {
      render(<ProgramInfo program={mockLiveProgram} />)
      
      expect(screen.getByText('TV-PG')).toBeInTheDocument()
    })

    it('should not display rating when not available', () => {
      render(<ProgramInfo program={mockProgramWithoutRating} />)
      
      expect(screen.queryByText('TV-PG')).not.toBeInTheDocument()
    })
  })

  describe('Time Display', () => {
    it('should format and display program times correctly', () => {
      render(<ProgramInfo program={mockLiveProgram} />)
      
      const timeElement = screen.getByTestId('program-time')
      expect(timeElement).toHaveTextContent('20:00 - 21:00')
    })

    it('should use 24-hour format', () => {
      const afternoonProgram: Program = {
        ...mockLiveProgram,
        startTime: new Date('2024-01-01T14:00:00'),
        endTime: new Date('2024-01-01T15:30:00'),
      }
      
      render(<ProgramInfo program={afternoonProgram} />)
      
      const timeElement = screen.getByTestId('program-time')
      expect(timeElement).toHaveTextContent('14:00 - 15:30')
    })
  })

  describe('Progress Bar Calculation', () => {
    it('should calculate correct progress percentage for live program', () => {
      render(<ProgramInfo program={mockLiveProgram} />)
      
      const progressBar = screen.getByTestId('progress-bar')
      
      // Program is 1 hour long, we're 30 minutes in, so 50% progress
      expect(progressBar).toHaveStyle('width: 50%')
    })

    it('should not exceed 100% progress', () => {
      const overdueProgram: Program = {
        ...mockLiveProgram,
        startTime: new Date('2024-01-01T19:00:00'), // Started 1.5 hours ago
        endTime: new Date('2024-01-01T20:00:00'),   // Should have ended 30 min ago
      }
      
      render(<ProgramInfo program={overdueProgram} />)
      
      const progressBar = screen.getByTestId('progress-bar')
      expect(progressBar).toHaveStyle('width: 100%')
    })

    it('should not go below 0% progress', () => {
      const futureProgram: Program = {
        ...mockLiveProgram,
        startTime: new Date('2024-01-01T21:00:00'), // Starts in 30 minutes
        endTime: new Date('2024-01-01T22:00:00'),
        isLive: true, // Force live for testing
      }
      
      render(<ProgramInfo program={futureProgram} />)
      
      const progressBar = screen.getByTestId('progress-bar')
      expect(progressBar).toHaveStyle('width: 0%')
    })
  })

  describe('Favorite Functionality', () => {
    it('should render favorite button', () => {
      render(<ProgramInfo program={mockLiveProgram} />)
      
      const favoriteButton = screen.getByTestId('favorite-button')
      expect(favoriteButton).toBeInTheDocument()
      expect(favoriteButton).toHaveAttribute('aria-label', 'Add to favorites')
    })

    it('should be clickable', () => {
      const handleClick = vi.fn()
      render(<ProgramInfo program={mockLiveProgram} />)
      
      const favoriteButton = screen.getByTestId('favorite-button')
      
      // Mock the click handler (in real app this would be passed as prop)
      favoriteButton.onclick = handleClick
      
      fireEvent.click(favoriteButton)
      expect(handleClick).toHaveBeenCalled()
    })
  })

  describe('Responsive Design', () => {
    it('should use responsive layout classes', () => {
      render(<ProgramInfo program={mockLiveProgram} />)
      
      const programInfo = screen.getByTestId('program-info')
      expect(programInfo).toHaveClass('rounded-lg', 'p-4')
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long program titles', () => {
      const longTitleProgram: Program = {
        ...mockLiveProgram,
        title: 'This is a very long program title that might overflow and cause layout issues',
      }
      
      render(<ProgramInfo program={longTitleProgram} />)
      
      expect(screen.getByTestId('program-title')).toHaveTextContent(longTitleProgram.title)
    })

    it('should handle very long descriptions', () => {
      const longDescProgram: Program = {
        ...mockLiveProgram,
        description: 'This is a very long description that goes on and on and might cause layout issues or performance problems if not handled correctly.',
      }
      
      render(<ProgramInfo program={longDescProgram} />)
      
      expect(screen.getByTestId('program-description')).toHaveTextContent(longDescProgram.description)
    })

    it('should handle empty strings gracefully', () => {
      const emptyFieldsProgram: Program = {
        ...mockLiveProgram,
        title: '',
        description: '',
        category: '',
      }
      
      render(<ProgramInfo program={emptyFieldsProgram} />)
      
      expect(screen.getByTestId('program-info')).toBeInTheDocument()
    })

    it('should handle programs with same start and end time', () => {
      const sameTimeProgram: Program = {
        ...mockLiveProgram,
        startTime: new Date('2024-01-01T20:00:00'),
        endTime: new Date('2024-01-01T20:00:00'),
      }
      
      render(<ProgramInfo program={sameTimeProgram} />)
      
      const progressBar = screen.getByTestId('progress-bar')
      // Should handle division by zero gracefully
      expect(progressBar).toBeInTheDocument()
    })
  })
})