import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  DocumentArrowUpIcon,
  LinkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { parseM3U, parseM3UFromFile, parseM3UFromUrl, validateM3U } from '../../utils/m3uParser'
import { Channel } from './ChannelList'

interface PlaylistImporterProps {
  onChannelsImported: (channels: Channel[]) => void
  onClose: () => void
  isOpen: boolean
}

const PlaylistImporter: React.FC<PlaylistImporterProps> = ({
  onChannelsImported,
  onClose,
  isOpen
}) => {
  const [importMethod, setImportMethod] = useState<'file' | 'url'>('file')
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    channels: Channel[]
    totalChannels: number
    groups: string[]
    errors: string[]
  } | null>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setResult(null)

    try {
      const parsed = await parseM3UFromFile(file)
      setResult({
        success: parsed.errors.length === 0,
        channels: parsed.channels,
        totalChannels: parsed.totalChannels,
        groups: parsed.groups,
        errors: parsed.errors
      })
    } catch (error) {
      setResult({
        success: false,
        channels: [],
        totalChannels: 0,
        groups: [],
        errors: [`Failed to parse file: ${error}`]
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUrlImport = async () => {
    if (!url.trim()) return

    setIsLoading(true)
    setResult(null)

    try {
      const parsed = await parseM3UFromUrl(url.trim())
      setResult({
        success: parsed.errors.length === 0,
        channels: parsed.channels,
        totalChannels: parsed.totalChannels,
        groups: parsed.groups,
        errors: parsed.errors
      })
    } catch (error) {
      setResult({
        success: false,
        channels: [],
        totalChannels: 0,
        groups: [],
        errors: [`Failed to fetch playlist: ${error}`]
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = () => {
    if (result?.channels) {
      onChannelsImported(result.channels)
      onClose()
    }
  }

  const handleReset = () => {
    setResult(null)
    setUrl('')
    setImportMethod('file')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-dark-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Import Playlist</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {!result ? (
          <>
            {/* Import Method Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Import Method
              </label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setImportMethod('file')}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    importMethod === 'file'
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                  }`}
                >
                  <DocumentArrowUpIcon className="w-5 h-5 mr-2" />
                  Upload File
                </button>
                <button
                  onClick={() => setImportMethod('url')}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    importMethod === 'url'
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                  }`}
                >
                  <LinkIcon className="w-5 h-5 mr-2" />
                  From URL
                </button>
              </div>
            </div>

            {/* File Upload */}
            {importMethod === 'file' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Select M3U File
                </label>
                <div className="border-2 border-dashed border-dark-600 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
                  <DocumentArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300 mb-2">
                    Drop your M3U file here or click to browse
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Supports .m3u and .m3u8 files
                  </p>
                  <input
                    type="file"
                    accept=".m3u,.m3u8"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="playlist-file"
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="playlist-file"
                    className="btn-primary cursor-pointer"
                  >
                    Choose File
                  </label>
                </div>
              </div>
            )}

            {/* URL Input */}
            {importMethod === 'url' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Playlist URL
                </label>
                <div className="flex space-x-3">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/playlist.m3u"
                    className="flex-1 px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleUrlImport}
                    disabled={!url.trim() || isLoading}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Import
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Enter the direct URL to your M3U playlist file
                </p>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                <p className="text-gray-300">Processing playlist...</p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Results */}
            <div className="mb-6">
              {result.success ? (
                <div className="flex items-center mb-4">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 mr-3" />
                  <h3 className="text-lg font-semibold text-white">Import Successful!</h3>
                </div>
              ) : (
                <div className="flex items-center mb-4">
                  <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500 mr-3" />
                  <h3 className="text-lg font-semibold text-white">Import Completed with Issues</h3>
                </div>
              )}

              {/* Statistics */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-dark-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-400">Total Channels</h4>
                  <p className="text-2xl font-bold text-white">{result.totalChannels}</p>
                </div>
                <div className="bg-dark-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-400">Groups</h4>
                  <p className="text-2xl font-bold text-white">{result.groups.length}</p>
                </div>
              </div>

              {/* Groups Preview */}
              {result.groups.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">Channel Groups</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.groups.slice(0, 10).map((group) => (
                      <span
                        key={group}
                        className="px-3 py-1 bg-primary-500 bg-opacity-20 text-primary-300 rounded-full text-sm"
                      >
                        {group}
                      </span>
                    ))}
                    {result.groups.length > 10 && (
                      <span className="px-3 py-1 bg-dark-600 text-gray-400 rounded-full text-sm">
                        +{result.groups.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-red-400 mb-3">Issues Found</h4>
                  <div className="bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 rounded-lg p-4 max-h-32 overflow-y-auto">
                    {result.errors.map((error, index) => (
                      <p key={index} className="text-red-400 text-sm mb-1">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Channel Preview */}
              {result.channels.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">Channel Preview</h4>
                  <div className="bg-dark-700 rounded-lg p-4 max-h-48 overflow-y-auto">
                    {result.channels.slice(0, 5).map((channel) => (
                      <div key={channel.id} className="flex items-center py-2 border-b border-dark-600 last:border-b-0">
                        <div className="w-8 h-8 bg-dark-600 rounded mr-3 flex items-center justify-center">
                          {channel.logo ? (
                            <img src={channel.logo} alt="" className="w-full h-full object-cover rounded" />
                          ) : (
                            <span className="text-xs text-gray-400">{channel.number}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{channel.name}</p>
                          {channel.group && (
                            <p className="text-gray-400 text-xs truncate">{channel.group}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {result.channels.length > 5 && (
                      <p className="text-gray-400 text-sm text-center py-2">
                        ... and {result.channels.length - 5} more channels
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              {result.channels.length > 0 && (
                <button
                  onClick={handleImport}
                  className="btn-primary flex-1"
                >
                  Import {result.totalChannels} Channels
                </button>
              )}
              <button
                onClick={handleReset}
                className="btn-secondary"
              >
                Import Another
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default PlaylistImporter