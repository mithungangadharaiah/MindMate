import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mic, Heart, Users, MapPin, Calendar, Settings } from 'lucide-react'
import { useVoice } from '../contexts/VoiceContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const Home: React.FC = () => {
  const navigate = useNavigate()
  const { speak, hasPermission, requestMicrophonePermission } = useVoice()
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) {
      setGreeting('Good morning')
    } else if (hour < 17) {
      setGreeting('Good afternoon')
    } else {
      setGreeting('Good evening')
    }
  }, [])

  const handleVoiceSessionStart = async () => {
    if (hasPermission === false) {
      const granted = await requestMicrophonePermission()
      if (!granted) {
        toast.error('Microphone access is required for voice sessions')
        return
      }
    }

    // Speak greeting before starting
    await speak(`${greeting}! I'm Hrudhi, your MindMate companion. Let's check in with your emotions today.`)
    navigate('/voice')
  }

  const quickActions = [
    {
      icon: Users,
      title: 'Find Friends',
      description: 'Connect with like-minded people',
      color: 'bg-gradient-to-r from-pink-400 to-purple-500',
      onClick: () => navigate('/friends')
    },
    {
      icon: MapPin,
      title: 'Mood Places',
      description: 'Discover places for your mood',
      color: 'bg-gradient-to-r from-blue-400 to-cyan-500',
      onClick: () => navigate('/places')
    },
    {
      icon: Calendar,
      title: 'Timeline',
      description: 'View your emotional journey',
      color: 'bg-gradient-to-r from-green-400 to-teal-500',
      onClick: () => navigate('/timeline')
    }
  ]

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="content-wrapper"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 style={{ 
                fontSize: 'var(--font-size-3xl)', 
                fontFamily: 'Comfortaa, cursive',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--spacing-xs)'
              }}>
                {greeting}! 👋
              </h1>
              <p style={{ color: 'var(--color-text-muted)' }}>Ready to check in with yourself?</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/profile')}
              className="btn btn--ghost"
              style={{ 
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--border-radius-full)',
                backgroundColor: 'white',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <Settings style={{ width: '24px', height: '24px', color: 'var(--color-text-secondary)' }} />
            </motion.button>
          </div>
        </motion.div>

        {/* Main Voice Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          style={{ padding: '0 var(--spacing-lg)', marginBottom: 'var(--spacing-3xl)' }}
        >
          <div className="card card--elevated text-center">
            <div className="flex justify-center" style={{ marginBottom: 'var(--spacing-xl)' }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleVoiceSessionStart}
                className="voice-button"
                type="button"
              >
                <Mic style={{ width: '40px', height: '40px', position: 'relative', zIndex: 20 }} />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 'var(--border-radius-full)',
                    background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
                    opacity: 0.2,
                    pointerEvents: 'none'
                  }}
                />
              </motion.button>
            </div>
            
            <h2 style={{ 
              fontSize: 'var(--font-size-2xl)', 
              fontFamily: 'Comfortaa, cursive',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              Talk to Hrudhi
            </h2>
            <p style={{ 
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--line-height-relaxed)'
            }}>
              Share what's on your mind in 30-40 seconds. I'll listen and help you understand your emotions.
            </p>
            
            {hasPermission === false && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  marginTop: 'var(--spacing-lg)',
                  padding: 'var(--spacing-md)',
                  backgroundColor: 'var(--color-warning-50)',
                  border: '1px solid var(--color-warning-200)',
                  borderRadius: 'var(--border-radius-md)'
                }}
              >
                <p style={{ color: 'var(--color-warning-600)', fontSize: 'var(--font-size-sm)' }}>
                  🎤 Microphone access needed for voice features
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ padding: '0 var(--spacing-lg)', marginBottom: 'var(--spacing-2xl)' }}
        >
          <h3 style={{ 
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--spacing-lg)'
          }}>
            Quick Actions
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-lg)' }}>
            {quickActions.map((action, index) => (
              <motion.button
                key={action.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={action.onClick}
                className="card card--interactive"
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-lg)',
                  textAlign: 'left',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  padding: 'var(--spacing-md)',
                  borderRadius: 'var(--border-radius-xl)',
                  background: action.color.replace('bg-gradient-to-r from-', 'linear-gradient(135deg, ').replace(' to-', ', ').replace('pink-400', '#f472b6').replace('purple-500', '#a855f7').replace('blue-400', '#60a5fa').replace('cyan-500', '#06b6d4').replace('green-400', '#4ade80').replace('teal-500', '#14b8a6')
                }}>
                  <action.icon style={{ width: '24px', height: '24px', color: 'white' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ 
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-primary)',
                    marginBottom: 'var(--spacing-xs)'
                  }}>
                    {action.title}
                  </h4>
                  <p style={{ 
                    color: 'var(--color-text-secondary)',
                    fontSize: 'var(--font-size-sm)'
                  }}>
                    {action.description}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Daily Inspiration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{ padding: '0 var(--spacing-lg)', marginBottom: 'var(--spacing-2xl)' }}
        >
          <div style={{
            background: 'linear-gradient(135deg, var(--color-secondary-400), var(--color-primary-400))',
            borderRadius: 'var(--border-radius-lg)',
            padding: 'var(--spacing-xl)',
            color: 'var(--color-text-inverse)'
          }}>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              marginBottom: 'var(--spacing-md)'
            }}>
              <Heart style={{ width: '20px', height: '20px' }} />
              <h3 style={{ fontWeight: 'var(--font-weight-semibold)' }}>Daily Inspiration</h3>
            </div>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: 'var(--line-height-relaxed)'
            }}>
              "Every emotion you feel is valid. Today, let yourself experience whatever comes up with kindness and curiosity."
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Home