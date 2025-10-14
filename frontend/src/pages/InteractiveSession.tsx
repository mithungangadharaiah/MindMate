import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Mic, MessageCircle, Brain, Volume2 } from 'lucide-react'
import { useVoice } from '../contexts/VoiceContext'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

const InteractiveSession: React.FC = () => {
  const navigate = useNavigate()
  const { user, token } = useAuthStore()
  const {
    speak,
    isSpeaking,
    startRecording,
    stopRecording,
    isRecording,
    transcript,
    audioLevel
  } = useVoice()

  const [conversationId, setConversationId] = useState<string | null>(null)
  const [phase, setPhase] = useState<'starting' | 'listening' | 'recording' | 'thinking' | 'complete'>('starting')
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [questionNumber, setQuestionNumber] = useState(0)
  const [qaHistory, setQAHistory] = useState<any[]>([])
  const [currentEmotion, setCurrentEmotion] = useState('')
  const [recordingTime, setRecordingTime] = useState(0)
  const [silenceTimer, setSilenceTimer] = useState(0)
  const lastTranscriptRef = useRef('')
  const silenceTimeoutRef = useRef<number>()
  const autoRecordTimeoutRef = useRef<number>()

  // Start conversation on mount
  useEffect(() => {
    startConversation()
    return () => {
      // Cleanup
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current)
      if (autoRecordTimeoutRef.current) clearTimeout(autoRecordTimeoutRef.current)
    }
  }, [])

  // Auto-start recording after question is spoken
  useEffect(() => {
    if (phase === 'listening' && !isSpeaking && !isRecording) {
      // Wait 1 second after question finishes speaking, then auto-start recording
      autoRecordTimeoutRef.current = window.setTimeout(() => {
        handleStartRecording()
      }, 1000)
    }
  }, [phase, isSpeaking, isRecording])

  // Auto-stop recording on silence detection
  useEffect(() => {
    if (phase === 'recording' && isRecording) {
      // Check if transcript has changed
      if (transcript !== lastTranscriptRef.current) {
        lastTranscriptRef.current = transcript
        setSilenceTimer(0)
        
        // Reset silence timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current)
        }
        
        // Auto-stop after 3 seconds of silence
        silenceTimeoutRef.current = window.setTimeout(() => {
          if (transcript.trim().length > 0) {
            handleStopRecording()
          }
        }, 3000)
      }
    }
  }, [transcript, phase, isRecording])

  // Recording timer (max 30 seconds)
  useEffect(() => {
    let interval: number
    if (phase === 'recording' && isRecording) {
      interval = window.setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 30) {
            handleStopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    } else {
      setRecordingTime(0)
    }
    return () => clearInterval(interval)
  }, [phase, isRecording])

  const startConversation = async () => {
    try {
      setPhase('starting')
      
      const response = await fetch('http://localhost:5000/api/conversations/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      
      if (data.success) {
        setConversationId(data.conversationId)
        setCurrentQuestion(data.question)
        setQuestionNumber(data.questionNumber)
        
        // Speak the question
        if (!isMuted) {
          await speak(data.question)
        }
        
        setPhase('listening')
      } else {
        throw new Error('Failed to start conversation')
      }
    } catch (error) {
      console.error('Failed to start conversation:', error)
      toast.error('Failed to start interactive session')
      navigate('/dashboard')
    }
  }

  const handleStartRecording = async () => {
    try {
      setPhase('recording')
      await startRecording()
    } catch (error) {
      console.error('Failed to start recording:', error)
      toast.error('Failed to start recording')
    }
  }

  const handleStopRecording = async () => {
    try {
      const blob = await stopRecording()
      setPhase('thinking')

      // Submit response to backend
      const response = await fetch(`http://localhost:5000/api/conversations/${conversationId}/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transcript: transcript || "I don't know"
        })
      })

      const data = await response.json()

      if (data.success) {
        // Store this Q&A
        const qa = {
          question: currentQuestion,
          answer: transcript,
          emotion: data.emotion.emotion,
          intensity: data.emotion.intensity
        }
        setQAHistory(prev => [...prev, qa])
        setCurrentEmotion(data.emotion.emotion)

        if (data.complete) {
          // Conversation is complete, show summary
          setPhase('complete')
          
          // Navigate to results after showing summary
          setTimeout(() => {
            navigate(`/results/${conversationId}`, {
              state: { 
                summary: data.summary,
                qaHistory: qaHistory 
              }
            })
          }, 3000)
        } else {
          // Ask next question
          setCurrentQuestion(data.question)
          setQuestionNumber(data.questionNumber)
          
          setPhase('asking')
          
          // Speak the next question
          if (!isMuted) {
            await speak(data.question)
          }
          
          setTimeout(() => {
            setPhase('listening')
          }, 2000)
        }
      } else {
        throw new Error('Failed to process response')
      }
    } catch (error) {
      console.error('Failed to process recording:', error)
      toast.error('Failed to process your response')
      setPhase('listening')
    }
  }

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      happy: 'from-yellow-400 to-orange-400',
      sad: 'from-blue-400 to-indigo-500',
      anxious: 'from-red-400 to-pink-500',
      calm: 'from-green-400 to-teal-400',
      neutral: 'from-gray-400 to-slate-500'
    }
    return colors[emotion] || 'from-purple-400 to-pink-400'
  }

  const getPhaseMessage = () => {
    switch (phase) {
      case 'starting':
        return 'Starting conversation...'
      case 'listening':
        return 'Tap to speak'
      case 'recording':
        return `Recording... (${recordingTime}s / 30s)`
      case 'thinking':
        return 'Analyzing your response...'
      case 'asking':
        return 'Next question coming...'
      case 'complete':
        return 'Thank you for sharing!'
      default:
        return ''
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-purple-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">Interactive Session</h1>
              <p className="text-sm text-slate-300">Question {questionNumber} of 5</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-3 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition"
          >
            {isMuted ? (
              <VolumeX className="w-6 h-6 text-white" />
            ) : (
              <Volume2 className="w-6 h-6 text-white" />
            )}
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-4 w-full bg-white/10 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: '0%' }}
            animate={{ width: `${(questionNumber / 5) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Current Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl w-full mb-12 text-center"
          >
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <Brain className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <p className="text-2xl text-white font-medium leading-relaxed">
                {currentQuestion}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Recording Button */}
        <div className="relative">
          {/* Pulse effect when recording */}
          {isRecording && (
            <motion.div
              className={`absolute inset-0 rounded-full bg-gradient-to-r ${getEmotionColor(currentEmotion)} blur-2xl`}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}

          <motion.button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={phase !== 'listening' && phase !== 'recording'}
            className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all ${
              phase === 'listening' || phase === 'recording'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-110'
                : 'bg-gray-600 cursor-not-allowed'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            {isRecording ? (
              <Square className="w-12 h-12 text-white" />
            ) : (
              <Mic className="w-12 h-12 text-white" />
            )}
          </motion.button>
        </div>

        {/* Phase message */}
        <motion.p
          key={phase}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 text-white text-lg font-medium"
        >
          {getPhaseMessage()}
        </motion.p>

        {/* Current transcript */}
        {transcript && phase === 'recording' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 max-w-2xl w-full bg-black/30 backdrop-blur-sm rounded-xl p-4"
          >
            <p className="text-slate-300 text-sm italic">"{transcript}"</p>
          </motion.div>
        )}
      </div>

      {/* Q&A History Preview */}
      {qaHistory.length > 0 && (
        <div className="p-6">
          <div className="max-w-2xl mx-auto">
            <p className="text-slate-400 text-sm mb-3">Conversation so far:</p>
            <div className="space-y-2">
              {qaHistory.map((qa, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-3 h-3 rounded-full bg-gradient-to-r ${getEmotionColor(qa.emotion)}`} />
                    <span className="text-xs text-slate-400">Q{index + 1}</span>
                  </div>
                  <p className="text-sm text-slate-300 line-clamp-1">{qa.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InteractiveSession
