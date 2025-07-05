import React from 'react'
import { motion } from 'framer-motion'
import { PlayIcon } from '@heroicons/react/24/outline'

const PlayerPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <PlayIcon className="w-20 h-20 text-primary-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Video Player</h1>
        <p className="text-gray-400">
          Select a channel to start streaming
        </p>
      </motion.div>
    </div>
  )
}

export default PlayerPage