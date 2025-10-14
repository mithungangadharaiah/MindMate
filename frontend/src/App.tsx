import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'

import { useAuthStore } from './stores/authStore'
import { VoiceProvider } from './contexts/VoiceContext'

// Layout Components
import Layout from './components/Layout'
import ProtectedRoute from './components/Auth/ProtectedRoute'

// Pages
import Home from './pages/Home'
import Onboarding from './pages/Onboarding'
import Login from './pages/Login'
import Register from './pages/Register'
import VoiceSession from './pages/VoiceSession'
import InteractiveSession from './pages/InteractiveSession'
import InteractiveSessionAuto from './pages/InteractiveSessionAuto'
import VoiceTest from './pages/VoiceTest'
import Results from './pages/Results'
import Timeline from './pages/Timeline'
import Friends from './pages/Friends'
import Places from './pages/Places'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'

function App() {
  const { user, isLoading, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    return (
      <div className="page-wrapper">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="container"
          style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}
        >
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4" style={{ width: '64px', height: '64px' }} />
            <h1 className="text-2xl font-bold text-primary mb-2" style={{ 
              fontFamily: 'Comfortaa, cursive',
              background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              MindMate
            </h1>
            <p style={{ color: 'var(--color-text-muted)' }}>Loading your companion...</p>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <VoiceProvider>
      <div className="page-wrapper">
        <AnimatePresence mode="wait">
          <Routes>
            {/* Public Routes */}
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/voice-test" element={<VoiceTest />} />
            
            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Home />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/voice"
              element={
                <ProtectedRoute>
                  <VoiceSession />
                </ProtectedRoute>
              }
            />
            <Route
              path="/interactive"
              element={
                <ProtectedRoute>
                  <InteractiveSession />
                </ProtectedRoute>
              }
            />
            <Route
              path="/interactive-auto"
              element={
                <ProtectedRoute>
                  <InteractiveSessionAuto />
                </ProtectedRoute>
              }
            />
            <Route
              path="/results/:entryId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Results />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/timeline"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Timeline />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/friends"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Friends />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/places"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Places />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Redirects */}
            <Route
              path="/welcome"
              element={
                user ? <Navigate to="/" replace /> : <Navigate to="/onboarding" replace />
              }
            />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
        
        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              color: '#374151',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </VoiceProvider>
  )
}

export default App