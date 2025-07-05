import React from 'react'
import { 
  MagnifyingGlassIcon,
  UserCircleIcon,
  BellIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../hooks/useAuth'

export const Header: React.FC = () => {
  const { user, signOut } = useAuth()

  return (
    <header className="bg-dark-800 border-b border-dark-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search channels, programs..."
              className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* User menu */}
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white">
            <BellIcon className="w-5 h-5" />
          </button>
          
          <div className="relative group">
            <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-dark-700 text-white">
              <UserCircleIcon className="w-6 h-6" />
              {user?.name && (
                <span className="text-sm font-medium">{user.name}</span>
              )}
            </button>
            
            {/* Dropdown menu */}
            <div className="absolute right-0 mt-2 w-48 bg-dark-700 border border-dark-600 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <div className="py-1">
                <button
                  onClick={signOut}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-dark-600 hover:text-white"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}