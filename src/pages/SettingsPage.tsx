import React from 'react'
import { motion } from 'framer-motion'
import { Cog6ToothIcon } from '@heroicons/react/24/outline'

const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-8 text-center"
      >
        <Cog6ToothIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Settings</h2>
        <p className="text-gray-400 mb-6">
          Configure your streaming preferences and account settings
        </p>
      </motion.div>
    </div>
  )
}

export default SettingsPage