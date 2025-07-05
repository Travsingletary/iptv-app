import React from 'react'
import { motion } from 'framer-motion'
import { 
  TvIcon, 
  CalendarIcon, 
  VideoCameraIcon,
  PlayIcon,
  StarIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

const HomePage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-600 to-accent-600 rounded-lg p-8 text-white"
      >
        <h1 className="text-3xl font-bold mb-2">Welcome to Steady Stream</h1>
        <p className="text-lg opacity-90">
          Your premium IPTV streaming experience starts here
        </p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <div className="flex items-center">
            <TvIcon className="w-8 h-8 text-primary-500 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-white">Channels</h3>
              <p className="text-gray-400">0 available</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <div className="flex items-center">
            <VideoCameraIcon className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-white">Recordings</h3>
              <p className="text-gray-400">0 scheduled</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <div className="flex items-center">
            <CalendarIcon className="w-8 h-8 text-accent-500 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-white">EPG</h3>
              <p className="text-gray-400">Up to date</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card p-6"
      >
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="btn-secondary flex items-center justify-center p-4">
            <PlayIcon className="w-5 h-5 mr-2" />
            Watch Live TV
          </button>
          <button className="btn-secondary flex items-center justify-center p-4">
            <StarIcon className="w-5 h-5 mr-2" />
            Favorite Channels
          </button>
          <button className="btn-secondary flex items-center justify-center p-4">
            <ClockIcon className="w-5 h-5 mr-2" />
            Recently Watched
          </button>
          <button className="btn-secondary flex items-center justify-center p-4">
            <VideoCameraIcon className="w-5 h-5 mr-2" />
            Schedule Recording
          </button>
        </div>
      </motion.div>

      {/* Getting Started */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card p-6"
      >
        <h2 className="text-xl font-semibold text-white mb-4">Getting Started</h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              1
            </div>
            <div>
              <h3 className="font-medium text-white">Import Your Playlist</h3>
              <p className="text-gray-400 text-sm">
                Go to Channels and import your M3U playlist to get started
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              2
            </div>
            <div>
              <h3 className="font-medium text-white">Configure EPG</h3>
              <p className="text-gray-400 text-sm">
                Set up your Electronic Program Guide for better viewing experience
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              3
            </div>
            <div>
              <h3 className="font-medium text-white">Start Watching</h3>
              <p className="text-gray-400 text-sm">
                Select a channel and enjoy your streaming experience
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default HomePage