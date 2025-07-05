import React from 'react'
import { motion } from 'framer-motion'
import { TvIcon, PlusIcon } from '@heroicons/react/24/outline'

const ChannelsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-2xl font-bold text-white">Channels</h1>
        <button className="btn-primary flex items-center">
          <PlusIcon className="w-4 h-4 mr-2" />
          Import Playlist
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-8 text-center"
      >
        <TvIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">No Channels Available</h2>
        <p className="text-gray-400 mb-6">
          Import your M3U playlist to start watching channels
        </p>
        <button className="btn-primary">
          Import Your First Playlist
        </button>
      </motion.div>
    </div>
  )
}

export default ChannelsPage