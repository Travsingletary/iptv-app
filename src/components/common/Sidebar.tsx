import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  HomeIcon, 
  TvIcon, 
  CalendarIcon, 
  VideoCameraIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useAppStore } from '../../context/AppContext'

export const Sidebar: React.FC = () => {
  const { sidebarOpen, setSidebarOpen } = useAppStore()

  const navigation = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Channels', href: '/channels', icon: TvIcon },
    { name: 'EPG', href: '/epg', icon: CalendarIcon },
    { name: 'Recordings', href: '/recordings', icon: VideoCameraIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ]

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50 h-full bg-dark-800 border-r border-dark-700 transition-all duration-300
        ${sidebarOpen ? 'w-64' : 'w-16'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-700">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-white">Steady Stream</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-dark-700 text-white"
          >
            {sidebarOpen ? (
              <XMarkIcon className="w-5 h-5" />
            ) : (
              <Bars3Icon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) => `
                flex items-center px-3 py-2 rounded-lg transition-colors duration-200
                ${isActive 
                  ? 'bg-primary-600 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-dark-700'
                }
              `}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && (
                <span className="ml-3 font-medium">{item.name}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-dark-700">
          {sidebarOpen && (
            <div className="text-xs text-gray-500 text-center">
              v1.0.0
            </div>
          )}
        </div>
      </div>
    </>
  )
}