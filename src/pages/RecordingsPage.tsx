import React from 'react'
import { motion } from 'framer-motion'
import { VideoCameraIcon, PlusIcon } from '@heroicons/react/24/outline'

const RecordingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-2xl font-bold text-white">Recordings</h1>
        <button className="btn-primary flex items-center">
          <PlusIcon className="w-4 h-4 mr-2" />
          Schedule Recording
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-8 text-center"
      >
        <VideoCameraIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">No Recordings</h2>
        <p className="text-gray-400 mb-6">
          Schedule recordings from the EPG to start building your library
        </p>
        <button className="btn-primary">
          Browse EPG
        </button>
      </motion.div>
    </div>
  )
}

export default RecordingsPage