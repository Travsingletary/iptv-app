import React from 'react'
import { useStreamStore } from '../store/streamStore'
import { Channel } from '../types/stream'
import { ChevronRight, Loader2 } from 'lucide-react'

export const ChannelGuide: React.FC = () => {
  const { 
    channels, 
    currentChannel, 
    isLoading, 
    error, 
    setCurrentChannel, 
    loadChannels,
    loadPrograms 
  } = useStreamStore()

  React.useEffect(() => {
    loadChannels()
  }, [loadChannels])

  React.useEffect(() => {
    if (currentChannel) {
      loadPrograms(currentChannel.id)
    }
  }, [currentChannel, loadPrograms])

  const handleChannelSelect = (channel: Channel) => {
    if (channel.isActive) {
      setCurrentChannel(channel)
    }
  }

  if (error) {
    return (
      <div className="p-4 text-center" data-testid="error-message">
        <div className="text-red-500 mb-2">⚠️ Error</div>
        <p className="text-sm text-gray-400">{error}</p>
        <button 
          onClick={loadChannels}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col" data-testid="channel-guide">
      <header className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold">Channels</h2>
      </header>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center" data-testid="loading-indicator">
            <Loader2 className="animate-spin mx-auto mb-2" size={24} />
            <p className="text-sm text-gray-400">Loading channels...</p>
          </div>
        ) : (
          <div className="p-2">
            {channels.map((channel) => (
              <ChannelItem
                key={channel.id}
                channel={channel}
                isSelected={currentChannel?.id === channel.id}
                onSelect={handleChannelSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface ChannelItemProps {
  channel: Channel
  isSelected: boolean
  onSelect: (channel: Channel) => void
}

const ChannelItem: React.FC<ChannelItemProps> = ({ 
  channel, 
  isSelected, 
  onSelect 
}) => {
  const handleClick = () => {
    onSelect(channel)
  }

  return (
    <button
      onClick={handleClick}
      disabled={!channel.isActive}
      className={`
        w-full p-3 rounded-lg mb-2 text-left transition-all duration-200
        ${isSelected 
          ? 'bg-blue-600 text-white' 
          : channel.isActive 
            ? 'bg-gray-800 hover:bg-gray-700 text-white' 
            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
        }
      `}
      data-testid={`channel-item-${channel.id}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{channel.logo}</div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono">{channel.number}</span>
              <span className="font-medium">{channel.name}</span>
            </div>
            {!channel.isActive && (
              <div className="text-xs text-gray-500 mt-1">Unavailable</div>
            )}
          </div>
        </div>
        
        {channel.isActive && (
          <ChevronRight 
            size={16} 
            className={isSelected ? 'text-white' : 'text-gray-400'} 
          />
        )}
      </div>
    </button>
  )
}