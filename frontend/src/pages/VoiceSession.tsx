import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Mic, Square, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { useVoice } from '../contexts/VoiceContext'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'
import { isBackendAvailable } from '../config/api'
import { LocalStorageService } from '../services/storage'

// Voice session questions
const DAILY_QUESTIONS = [
  "Tell me in about thirty seconds: what was one moment from today that sticks with you?",
  "How are you feeling right now, and what's been on your mind today?",
  "What's one thing that happened today that you'd like to share with me?",
  "Take a moment to reflect - what emotion has been most present for you today?",
  "In your own words, how would you describe your day and how you're feeling?",
  "What's something from today that you'd like to talk through with me?",
  "Tell me about your day - what's been the strongest feeling you've experienced?",
  "Share with me what's been in your heart and mind today.",
]

const VoiceSession: React.FC = () => {
  const navigate = useNavigate()
  const { user, token } = useAuthStore()
  const {
    speak,
    stopSpeaking,
    isSpeaking,
    startRecording,
    stopRecording,
    isRecording,
    transcript,
    audioLevel
  } = useVoice()

  const [phase, setPhase] = useState<'intro' | 'question' | 'countdown' | 'recording' | 'processing' | 'complete'>('intro')
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [countdown, setCountdown] = useState(3)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [processingStage, setProcessingStage] = useState('')

  // Initialize session
  useEffect(() => {
    if (phase === 'intro') {
      initializeSession()
    }
  }, [phase])

  // Recording timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (phase === 'recording' && isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 40) {
            handleStopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [phase, isRecording])

  // Countdown effect
  useEffect(() => {
    if (phase === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (phase === 'countdown' && countdown === 0) {
      handleStartRecording()
    }
  }, [phase, countdown])

  const initializeSession = async () => {
    try {
      // Select random question
      const question = DAILY_QUESTIONS[Math.floor(Math.random() * DAILY_QUESTIONS.length)]
      setCurrentQuestion(question)

      if (!isMuted) {
        await speak("Hi! I'm Hrudhi, your MindMate companion. I'm here to listen.")
        await new Promise(resolve => setTimeout(resolve, 500))
        await speak(question)
      }

      setPhase('question')
    } catch (error) {
      console.error('Failed to initialize session:', error)
      toast.error('Failed to start voice session')
    }
  }

  const handleStartCountdown = () => {
    setPhase('countdown')
    setCountdown(3)
    setRecordingTime(0)
  }

  const handleStartRecording = async () => {
    try {
      const success = await startRecording()
      if (success) {
        setPhase('recording')
      } else {
        toast.error('Failed to start recording')
      }
    } catch (error) {
      console.error('Recording failed:', error)
      toast.error('Recording failed. Please try again.')
    }
  }

  const handleStopRecording = async () => {
    try {
      const blob = await stopRecording()
      if (blob) {
        setAudioBlob(blob)
        setPhase('processing')
        await processRecording(blob)
      }
    } catch (error) {
      console.error('Failed to stop recording:', error)
      toast.error('Failed to process recording')
    }
  }

  const processRecording = async (blob: Blob) => {
    try {
      setProcessingStage('Analyzing your voice...')
      
      console.log('📝 Processing recording with transcript:', transcript)
      console.log('📊 Transcript length:', transcript?.length || 0)

      // Check if backend is available
      const hasBackend = await isBackendAvailable()
      
      if (!hasBackend) {
        // Use localStorage fallback
        console.info('🔒 Using localStorage (offline mode)')
        
        setProcessingStage('Analyzing your emotions...')
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        const entryId = `entry-${Date.now()}`
        const analysis = LocalStorageService.generateMockAnalysis(transcript || '')
        
        const entry = {
          id: entryId,
          userId: 'local-user',
          timestamp: new Date().toISOString(),
          transcript: transcript || '',
          emotionalState: analysis,
          insights: analysis.insights,
        }
        
        LocalStorageService.saveEntry(entry)
        
        setProcessingStage('Complete!')
        await new Promise(resolve => setTimeout(resolve, 500))
        
        setPhase('complete')
        
        // Navigate to results
        setTimeout(() => {
          navigate(`/results/${entryId}`)
        }, 1500)
        
        return
      }
      
      // Backend is available - use API
      const formData = new FormData()
      formData.append('audio', blob, 'voice_recording.webm')
      formData.append('transcript', transcript || '')
      formData.append('question_prompt', currentQuestion)
      formData.append('privacy_mode', 'false')

      console.log('🚀 Sending to backend:', {
        audioSize: blob.size,
        transcript: transcript || '(empty)',
        question: currentQuestion
      })

      const response = await fetch('http://localhost:5000/api/entries', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to process recording')
      }

      const result = await response.json()
      
      setProcessingStage('Understanding your emotions...')
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Speak supportive response
      if (!isMuted && result.entry?.supportive_response?.message) {
        await speak(result.entry.supportive_response.message)
      }

      setPhase('complete')
      
      // Navigate to results after a short delay
      setTimeout(() => {
        navigate(`/results/${result.entry.id}`)
      }, 2000)

    } catch (error) {
      console.error('Processing failed:', error)
      toast.error('Failed to analyze recording. Please try again.')
      setPhase('question')
    }
  }

  const handleRestart = () => {
    stopSpeaking()
    setPhase('intro')
    setRecordingTime(0)
    setAudioBlob(null)
    // Transcript will reset when recording starts again
  }

  const handleExit = () => {
    stopSpeaking()
    navigate('/')
  }

  const toggleMute = () => {
    if (isSpeaking) {
      stopSpeaking()
    }
    setIsMuted(!isMuted)
  }

  const getPhaseContent = () => {
    switch (phase) {
      case 'intro':
        return (
          <div className="text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                width: '96px',
                height: '96px',
                borderRadius: 'var(--border-radius-full)',
                background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
                margin: '0 auto var(--spacing-xl)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Volume2 style={{ width: '48px', height: '48px', color: 'white' }} />
            </motion.div>
            <h2 style={{
              fontSize: 'var(--font-size-2xl)',
              fontFamily: 'Comfortaa, cursive',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              Setting up your session...
            </h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>I'm preparing to listen to you</p>
          </div>
        )

      case 'question':
        return (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                width: '96px',
                height: '96px',
                borderRadius: 'var(--border-radius-full)',
                background: 'linear-gradient(135deg, var(--color-accent-400), var(--color-accent-500))',
                margin: '0 auto var(--spacing-xl)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Mic style={{ width: '48px', height: '48px', color: 'white' }} />
            </motion.div>
            <h2 style={{
              fontSize: 'var(--font-size-2xl)',
              fontFamily: 'Comfortaa, cursive',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              Your daily question
            </h2>
            <p style={{
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-lg)',
              lineHeight: 'var(--line-height-relaxed)',
              marginBottom: 'var(--spacing-2xl)',
              padding: '0 var(--spacing-lg)'
            }}>
              "{currentQuestion}"
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartCountdown}
              className="btn btn--primary btn--large"
              style={{ fontSize: 'var(--font-size-lg)' }}
            >
              Start Recording
            </motion.button>
          </div>
        )

      case 'countdown':
        return (
          <div className="text-center">
            <motion.div
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              style={{
                width: '128px',
                height: '128px',
                borderRadius: 'var(--border-radius-full)',
                background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
                margin: '0 auto var(--spacing-xl)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <span style={{ fontSize: '2.5rem', fontWeight: 'var(--font-weight-bold)', color: 'white' }}>
                {countdown}
              </span>
            </motion.div>
            <h2 style={{
              fontSize: 'var(--font-size-2xl)',
              fontFamily: 'Comfortaa, cursive',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              Get ready...
            </h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Recording will start in {countdown} seconds
            </p>
          </div>
        )

      case 'recording':
        return (
          <div className="text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              style={{
                width: '128px',
                height: '128px',
                borderRadius: 'var(--border-radius-full)',
                background: 'linear-gradient(135deg, var(--color-danger-500), #ff6b6b)',
                margin: '0 auto var(--spacing-xl)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              <Mic style={{ width: '64px', height: '64px', color: 'white' }} />
              {/* Audio level visualization */}
              <motion.div
                animate={{ scale: [1, 1 + audioLevel * 0.5] }}
                transition={{ duration: 0.1 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 'var(--border-radius-full)',
                  background: '#ff6b6b',
                  opacity: 0.3
                }}
              />
            </motion.div>
            
            <h2 style={{
              fontSize: 'var(--font-size-2xl)',
              fontFamily: 'Comfortaa, cursive',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              I'm listening...
            </h2>
            
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <div style={{
                fontSize: '3rem',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-danger-500)',
                marginBottom: 'var(--spacing-sm)'
              }}>
                {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
              </div>
              <div style={{
                width: '256px',
                height: '8px',
                backgroundColor: 'var(--color-primary-100)',
                borderRadius: 'var(--border-radius-full)',
                margin: '0 auto',
                overflow: 'hidden'
              }}>
                <motion.div
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--color-danger-500), var(--color-primary-500))',
                    width: `${(recordingTime / 40) * 100}%`
                  }}
                />
              </div>
              <p style={{ 
                color: 'var(--color-text-secondary)', 
                fontSize: 'var(--font-size-sm)', 
                marginTop: 'var(--spacing-sm)' 
              }}>
                Speak naturally for 30-40 seconds
              </p>
            </div>

            {/* Enhanced Waveform */}
            <div className="waveform" style={{ marginBottom: 'var(--spacing-xl)' }}>
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="waveform-bar"
                  style={{
                    height: `${8 + (audioLevel * 30) + Math.sin(Date.now() * 0.01 + i) * 10}px`,
                  }}
                />
              ))}
            </div>

            {/* Live transcript if available */}
            {transcript && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  backgroundColor: 'var(--color-background-tertiary)',
                  borderRadius: 'var(--border-radius-md)',
                  padding: 'var(--spacing-lg)',
                  margin: '0 var(--spacing-lg) var(--spacing-lg)'
                }}
              >
                <p style={{
                  color: 'var(--color-text-secondary)',
                  fontSize: 'var(--font-size-sm)',
                  fontStyle: 'italic'
                }}>
                  "{transcript}"
                </p>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStopRecording}
              className="btn"
              style={{
                background: 'linear-gradient(135deg, var(--color-danger-500), #ff6b6b)',
                color: 'white',
                padding: 'var(--spacing-md) var(--spacing-2xl)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                margin: '0 auto'
              }}
            >
              <Square style={{ width: '20px', height: '20px' }} />
              <span>Stop Recording</span>
            </motion.button>
          </div>
        )

      case 'processing':
        return (
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-24 h-24 rounded-full bg-gradient-primary mx-auto mb-6 flex items-center justify-center"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-12 h-12 rounded-full bg-white/30"
              />
            </motion.div>
            <h2 className="text-2xl font-handwriting font-bold text-gray-800 mb-4">
              Processing your emotions...
            </h2>
            <p className="text-gray-600">{processingStage}</p>
            <div className="loading-dots mt-4">
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
            </div>
          </div>
        )

      case 'complete':
        return (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-24 h-24 rounded-full bg-gradient-to-r from-green-400 to-teal-500 mx-auto mb-6 flex items-center justify-center"
            >
              <span className="text-3xl">✓</span>
            </motion.div>
            <h2 className="text-2xl font-handwriting font-bold text-gray-800 mb-4">
              Thank you for sharing
            </h2>
            <p className="text-gray-600 mb-6">
              I've analyzed your emotions and prepared some insights for you.
            </p>
            <div className="loading-dots">
              <div className="loading-dot bg-green-500"></div>
              <div className="loading-dot bg-green-500"></div>
              <div className="loading-dot bg-green-500"></div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex flex-col">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 flex items-center justify-between">
        <button
          onClick={handleExit}
          className="text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Exit
        </button>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleMute}
            className={`p-2 rounded-full ${isMuted ? 'bg-gray-200' : 'bg-blue-100'}`}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          
          {(phase === 'question' || phase === 'complete') && (
            <button
              onClick={handleRestart}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <div className="card card--elevated">
            <AnimatePresence mode="wait">
              {getPhaseContent()}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Progress Indicator */}
      <div style={{ padding: '0 var(--spacing-lg) var(--spacing-2xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-sm)' }}>
          {['intro', 'question', 'recording', 'processing', 'complete'].map((step, index) => (
            <div
              key={step}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: 'var(--border-radius-full)',
                backgroundColor: index <= ['intro', 'question', 'countdown', 'recording', 'processing', 'complete'].indexOf(phase)
                  ? 'var(--color-primary-500)'
                  : 'var(--color-primary-200)',
                transition: 'background-color var(--duration-fast) var(--easing-smooth)'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default VoiceSession