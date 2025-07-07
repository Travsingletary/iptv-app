import React from 'react'
import { Program } from '../types/stream'
import { Clock, Star } from 'lucide-react'

interface ProgramInfoProps {
  program: Program
  className?: string
}

export const ProgramInfo: React.FC<ProgramInfoProps> = ({ 
  program, 
  className = '' 
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    })
  }

  const getProgressPercentage = () => {
    const now = new Date()
    const total = program.endTime.getTime() - program.startTime.getTime()
    const elapsed = now.getTime() - program.startTime.getTime()
    return Math.max(0, Math.min(100, (elapsed / total) * 100))
  }

  return (
    <div 
      className={`bg-black bg-opacity-75 rounded-lg p-4 text-white ${className}`}
      data-testid="program-info"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {program.isLive && (
              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded font-bold">
                LIVE
              </span>
            )}
            <span className="text-sm text-gray-300">{program.category}</span>
            {program.rating && (
              <span className="text-xs bg-gray-600 px-2 py-1 rounded">
                {program.rating}
              </span>
            )}
          </div>
          
          <h3 className="text-lg font-bold mb-1" data-testid="program-title">
            {program.title}
          </h3>
          
          <p className="text-sm text-gray-300 mb-2" data-testid="program-description">
            {program.description}
          </p>
          
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span data-testid="program-time">
                {formatTime(program.startTime)} - {formatTime(program.endTime)}
              </span>
            </div>
          </div>
        </div>

        <button 
          className="text-gray-400 hover:text-yellow-400 transition-colors"
          data-testid="favorite-button"
          aria-label="Add to favorites"
        >
          <Star size={20} />
        </button>
      </div>

      {/* Progress bar for live programs */}
      {program.isLive && (
        <div className="mt-3">
          <div className="w-full bg-gray-700 rounded-full h-1">
            <div 
              className="bg-blue-500 h-1 rounded-full transition-all duration-1000"
              style={{ width: `${getProgressPercentage()}%` }}
              data-testid="progress-bar"
            />
          </div>
        </div>
      )}
    </div>
  )
}