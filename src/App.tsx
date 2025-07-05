import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

import { useAuth } from '@hooks/useAuth'
import { useKeyboardShortcuts } from '@hooks/useKeyboardShortcuts'
import { LoadingSpinner } from '@components/ui/LoadingSpinner'
import { Layout } from '@components/common/Layout'
import { AuthGuard } from '@components/common/AuthGuard'

// Lazy load pages for better performance
const HomePage = React.lazy(() => import('@pages/HomePage'))
const ChannelsPage = React.lazy(() => import('@pages/ChannelsPage'))
const EPGPage = React.lazy(() => import('@pages/EPGPage'))
const RecordingsPage = React.lazy(() => import('@pages/RecordingsPage'))
const SettingsPage = React.lazy(() => import('@pages/SettingsPage'))
const PlayerPage = React.lazy(() => import('@pages/PlayerPage'))
const LoginPage = React.lazy(() => import('@pages/LoginPage'))

const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth()
  
  // Enable keyboard shortcuts globally
  useKeyboardShortcuts()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-900">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <AnimatePresence mode="wait">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <LoadingSpinner size="large" />
          </div>
        }>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <AuthGuard>
                <Layout>
                  <HomePage />
                </Layout>
              </AuthGuard>
            } />
            
            <Route path="/channels" element={
              <AuthGuard>
                <Layout>
                  <ChannelsPage />
                </Layout>
              </AuthGuard>
            } />
            
            <Route path="/epg" element={
              <AuthGuard>
                <Layout>
                  <EPGPage />
                </Layout>
              </AuthGuard>
            } />
            
            <Route path="/recordings" element={
              <AuthGuard>
                <Layout>
                  <RecordingsPage />
                </Layout>
              </AuthGuard>
            } />
            
            <Route path="/settings" element={
              <AuthGuard>
                <Layout>
                  <SettingsPage />
                </Layout>
              </AuthGuard>
            } />
            
            <Route path="/player/:channelId?" element={
              <AuthGuard>
                <PlayerPage />
              </AuthGuard>
            } />
            
            {/* Redirect to login if not authenticated */}
            <Route path="*" element={
              isAuthenticated ? <Navigate to="/" replace /> : <Navigate to="/login" replace />
            } />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </div>
  )
}

export default App