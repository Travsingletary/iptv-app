import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PlayIcon } from '@heroicons/react/24/outline'
import VideoPlayer from '../components/video/VideoPlayer'
import ChannelList, { Channel } from '../components/channel/ChannelList'

// Demo channels for testing
const DEMO_CHANNELS: Channel[] = [
  {
    id: '1',
    name: 'Big Buck Bunny',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/220px-Big_buck_bunny_poster_big.jpg',
    group: 'Demo',
    number: 1,
    description: 'Demo video - Big Buck Bunny',
    isFavorite: false,
    isOnline: true
  },
  {
    id: '2',
    name: 'Elephant Dream',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    group: 'Demo',
    number: 2,
    description: 'Demo video - Elephant Dream',
    isFavorite: false,
    isOnline: true
  },
  {
    id: '3',
    name: 'Sintel',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    group: 'Demo',
    number: 3,
    description: 'Demo video - Sintel',
    isFavorite: true,
    isOnline: true
  }
]

const PlayerPage: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>(DEMO_CHANNELS)
  const [selectedChannel, setSelectedChannel] = useState<Channel | undefined>()
  const [showChannelList, setShowChannelList] = useState(true)

  const handleChannelSelect = (channel: Channel) => {
    setSelectedChannel(channel)
  }

  const handleToggleFavorite = (channelId: string) => {
    setChannels(prev => 
      prev.map(ch => 
        ch.id === channelId 
          ? { ...ch, isFavorite: !ch.isFavorite }
          : ch
      )
    )
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'c':
          e.preventDefault()
          setShowChannelList(!showChannelList)
          break
        case 'Escape':
          e.preventDefault()
          setShowChannelList(true)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showChannelList])

  if (!selectedChannel) {
    return (
      <div className="min-h-screen bg-black flex">
        {/* Channel List */}
        <div className="w-1/3 min-w-96 p-4">
          <ChannelList
            channels={channels}
            selectedChannel={selectedChannel}
            onChannelSelect={handleChannelSelect}
            onToggleFavorite={handleToggleFavorite}
          />
        </div>

        {/* Player Area */}
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <PlayIcon className="w-20 h-20 text-primary-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Ready to Stream</h1>
            <p className="text-gray-400 mb-4">
              Select a channel from the list to start watching
            </p>
            <p className="text-sm text-gray-500">
              Press 'C' to toggle channel list • Press 'Escape' to show controls
            </p>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex">
      {/* Channel List - Toggle with 'C' key */}
      {showChannelList && (
        <motion.div
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          className="w-1/3 min-w-96 p-4"
        >
          <ChannelList
            channels={channels}
            selectedChannel={selectedChannel}
            onChannelSelect={handleChannelSelect}
            onToggleFavorite={handleToggleFavorite}
          />
        </motion.div>
      )}

      {/* Video Player */}
      <div className="flex-1 relative">
        <VideoPlayer
          src={selectedChannel.url}
          title={selectedChannel.name}
          poster={selectedChannel.logo}
          autoplay={true}
          className="w-full h-screen"
          onTimeUpdate={(time) => {
            // Save playback position
            localStorage.setItem(`playback_${selectedChannel.id}`, time.toString())
          }}
          onEnded={() => {
            // Auto-play next channel
            const currentIndex = channels.findIndex(ch => ch.id === selectedChannel.id)
            const nextChannel = channels[currentIndex + 1]
            if (nextChannel) {
              setSelectedChannel(nextChannel)
            }
          }}
        />

        {/* Channel Info Overlay */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 3, duration: 1 }}
          className="absolute top-4 left-4 bg-black bg-opacity-75 rounded-lg p-4 text-white"
        >
          <div className="flex items-center space-x-3">
            {selectedChannel.logo && (
              <img
                src={selectedChannel.logo}
                alt={selectedChannel.name}
                className="w-12 h-12 object-cover rounded"
              />
            )}
            <div>
              <h3 className="font-bold">{selectedChannel.name}</h3>
              {selectedChannel.group && (
                <p className="text-sm text-gray-300">{selectedChannel.group}</p>
              )}
              {selectedChannel.number && (
                <p className="text-xs text-gray-400">Channel {selectedChannel.number}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Controls Hint */}
        <div className="absolute top-4 right-4 text-white text-sm bg-black bg-opacity-50 rounded px-3 py-2">
          Press 'C' to toggle channels
        </div>
      </div>
    </div>
  )
}

export default PlayerPage