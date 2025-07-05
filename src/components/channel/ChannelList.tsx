import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TvIcon, 
  MagnifyingGlassIcon, 
  HeartIcon,
  PlayIcon,
  SignalIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

export interface Channel {
  id: string
  name: string
  url: string
  logo?: string
  group?: string
  number?: number
  isFavorite?: boolean
  isOnline?: boolean
  description?: string
}

interface ChannelListProps {
  channels: Channel[]
  selectedChannel?: Channel
  onChannelSelect: (channel: Channel) => void
  onToggleFavorite: (channelId: string) => void
  className?: string
}

const ChannelList: React.FC<ChannelListProps> = ({
  channels,
  selectedChannel,
  onChannelSelect,
  onToggleFavorite,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  // Get unique groups
  const groups = Array.from(new Set(channels.map(ch => ch.group).filter(Boolean)))

  // Filter channels
  const filteredChannels = channels.filter(channel => {
    const matchesSearch = channel.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGroup = selectedGroup === 'all' || channel.group === selectedGroup
    const matchesFavorites = !showFavoritesOnly || channel.isFavorite

    return matchesSearch && matchesGroup && matchesFavorites
  })

  const handleChannelClick = (channel: Channel) => {
    onChannelSelect(channel)
  }

  const handleFavoriteToggle = (e: React.MouseEvent, channelId: string) => {
    e.stopPropagation()
    onToggleFavorite(channelId)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedChannel) return

      const currentIndex = filteredChannels.findIndex(ch => ch.id === selectedChannel.id)
      let nextIndex = currentIndex

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          nextIndex = Math.max(0, currentIndex - 1)
          break
        case 'ArrowDown':
          e.preventDefault()
          nextIndex = Math.min(filteredChannels.length - 1, currentIndex + 1)
          break
        case 'Enter':
          e.preventDefault()
          if (selectedChannel) {
            onChannelSelect(selectedChannel)
          }
          break
      }

      if (nextIndex !== currentIndex && filteredChannels[nextIndex]) {
        onChannelSelect(filteredChannels[nextIndex])
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedChannel, filteredChannels, onChannelSelect])

  return (
    <div className={`bg-dark-800 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-dark-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Channels</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`p-2 rounded-lg transition-colors ${
                showFavoritesOnly 
                  ? 'bg-red-500 text-white' 
                  : 'bg-dark-700 text-gray-400 hover:text-white'
              }`}
            >
              <HeartIcon className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-400">
              {filteredChannels.length} channels
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search channels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
          />
        </div>

        {/* Group Filter */}
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="w-full p-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
        >
          <option value="all">All Groups</option>
          {groups.map(group => (
            <option key={group} value={group}>{group}</option>
          ))}
        </select>
      </div>

      {/* Channel List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredChannels.length === 0 ? (
          <div className="p-8 text-center">
            <TvIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No channels found</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredChannels.map((channel, index) => (
              <motion.div
                key={channel.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => handleChannelClick(channel)}
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedChannel?.id === channel.id
                    ? 'bg-primary-500 text-white'
                    : 'hover:bg-dark-700 text-gray-300'
                }`}
              >
                {/* Channel Logo */}
                <div className="flex-shrink-0 w-10 h-10 mr-3">
                  {channel.logo ? (
                    <img
                      src={channel.logo}
                      alt={channel.name}
                      className="w-full h-full object-cover rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full bg-dark-600 rounded flex items-center justify-center ${channel.logo ? 'hidden' : ''}`}>
                    <TvIcon className="w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {/* Channel Info */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center space-x-2">
                    {channel.number && (
                      <span className="text-xs bg-dark-600 px-2 py-1 rounded text-gray-300">
                        {channel.number}
                      </span>
                    )}
                    <h3 className="font-medium truncate">{channel.name}</h3>
                  </div>
                  {channel.group && (
                    <p className="text-xs text-gray-400 truncate">{channel.group}</p>
                  )}
                  {channel.description && (
                    <p className="text-xs text-gray-400 truncate">{channel.description}</p>
                  )}
                </div>

                {/* Channel Actions */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {/* Online Status */}
                  <div className={`w-2 h-2 rounded-full ${
                    channel.isOnline !== false ? 'bg-green-500' : 'bg-red-500'
                  }`} />

                  {/* Favorite Button */}
                  <button
                    onClick={(e) => handleFavoriteToggle(e, channel.id)}
                    className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                  >
                    {channel.isFavorite ? (
                      <HeartSolidIcon className="w-4 h-4 text-red-500" />
                    ) : (
                      <HeartIcon className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {/* Play Button */}
                  {selectedChannel?.id === channel.id && (
                    <PlayIcon className="w-4 h-4 text-white" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChannelList