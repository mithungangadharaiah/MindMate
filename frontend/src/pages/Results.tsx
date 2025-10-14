import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { Heart, Users, MapPin, TrendingUp, Sparkles, ArrowRight, Volume2, MessageCircle, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { isBackendAvailable } from '../config/api'
import { LocalStorageService } from '../services/storage'

interface EmotionResult {
  id: string
  emotion: string
  intensity: number
  confidence: number
  transcript?: string
  supportive_response?: {
    message: string
    tone: string
  }
  analysis_data?: any
  created_at: string
}

const Results: React.FC = () => {
  const { entryId } = useParams<{ entryId: string }>()
  const navigate = useNavigate()
  const [result, setResult] = useState<EmotionResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [showConversationPrompt, setShowConversationPrompt] = useState(false)
  const [startingConversation, setStartingConversation] = useState(false)

  useEffect(() => {
    if (entryId) {
      fetchResults()
    }
  }, [entryId])

  useEffect(() => {
    // Show conversation prompt 3 seconds after results load
    if (result && !loading) {
      const timer = setTimeout(() => {
        setShowConversationPrompt(true)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [result, loading])

  const fetchResults = async () => {
    try {
      // Check if backend is available
      const hasBackend = await isBackendAvailable()
      
      if (!hasBackend) {
        // Use localStorage
        console.info('🔒 Loading from localStorage')
        const entry = LocalStorageService.getEntry(entryId!)
        
        if (!entry) {
          throw new Error('Entry not found')
        }
        
        // Transform to expected format
        setResult({
          id: entry.id,
          emotion: entry.emotionalState?.dominant_emotion || 'neutral',
          intensity: Object.values(entry.emotionalState?.emotions || {})[0] || 0.5,
          confidence: entry.emotionalState?.confidence || 0.8,
          transcript: entry.transcript,
          supportive_response: {
            message: "Thank you for sharing. Your feelings are valid and important.",
            tone: "supportive"
          },
          analysis_data: entry.emotionalState,
          created_at: entry.timestamp,
        })
        
        setLoading(false)
        return
      }
      
      // Use backend API
      const response = await fetch(`http://localhost:5000/api/entries/${entryId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch results')
      }

      const data = await response.json()
      setResult(data.entry)
    } catch (error) {
      console.error('Failed to fetch results:', error)
      toast.error('Failed to load results')
    } finally {
      setLoading(false)
    }
  }

  const startInteractiveSession = async () => {
    setStartingConversation(true)
    try {
      const response = await fetch('http://localhost:5000/api/conversations/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer demo-token`
        },
        body: JSON.stringify({
          initialEmotion: result?.emotion,
          initialTranscript: result?.transcript
        })
      })

      if (!response.ok) {
        throw new Error('Failed to start conversation')
      }

      const data = await response.json()
      
      // Navigate to AUTOMATIC interactive session page
      navigate(`/interactive-auto?conversationId=${data.conversationId}`)
      
    } catch (error) {
      console.error('Failed to start conversation:', error)
      toast.error('Could not start interactive session')
      setStartingConversation(false)
    }
  }

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      happy: 'from-yellow-400 via-orange-400 to-pink-500',
      sad: 'from-blue-400 via-indigo-500 to-purple-600',
      anxious: 'from-orange-400 via-red-400 to-pink-500',
      calm: 'from-green-400 via-teal-400 to-blue-500',
      angry: 'from-red-500 via-orange-600 to-yellow-500',
      neutral: 'from-gray-400 via-gray-500 to-gray-600',
      excited: 'from-pink-400 via-purple-500 to-indigo-500',
      peaceful: 'from-emerald-400 via-teal-500 to-cyan-500'
    }
    return colors[emotion.toLowerCase()] || 'from-purple-400 via-pink-500 to-red-500'
  }

  const getEmotionEmoji = (emotion: string) => {
    const emojis: Record<string, string> = {
      happy: '😊',
      sad: '😢',
      anxious: '😰',
      calm: '😌',
      angry: '😠',
      neutral: '😐',
      excited: '🤩',
      peaceful: '🧘'
    }
    return emojis[emotion.toLowerCase()] || '💭'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 mx-auto mb-4"
          >
            <Sparkles className="w-16 h-16 text-purple-600" />
          </motion.div>
          <p className="text-gray-600 text-lg">Analyzing your emotions...</p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No results found</h2>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Return Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-12 pb-8"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className={`w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-r ${getEmotionColor(result.emotion)} flex items-center justify-center shadow-2xl`}
          >
            <span className="text-6xl">{getEmotionEmoji(result.emotion)}</span>
          </motion.div>

          <h1 className="text-3xl font-handwriting font-bold text-gray-800 mb-2">
            Your Emotional Snapshot
          </h1>
          <p className="text-gray-600">Here's what I heard from your voice...</p>
        </div>
      </motion.div>

      {/* Main Emotion Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="px-6 mb-6"
      >
        <div className="bg-white rounded-3xl p-8 shadow-xl">
          <div className="text-center mb-6">
            <h2 className="text-4xl font-bold text-gray-800 capitalize mb-2">
              {result.emotion}
            </h2>
            <p className="text-gray-600">Primary emotion detected</p>
          </div>

          {/* Intensity Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Intensity</span>
              <span>{Math.round(result.intensity * 100)}%</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.intensity * 100}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className={`h-full bg-gradient-to-r ${getEmotionColor(result.emotion)}`}
              />
            </div>
          </div>

          {/* Confidence */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Confidence</span>
              <span>{Math.round(result.confidence * 100)}%</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.confidence * 100}%` }}
                transition={{ duration: 1, delay: 0.7 }}
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500"
              />
            </div>
          </div>

          {/* Transcript - Show First */}
          {result.transcript && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-2xl border-2 border-purple-200 mb-6"
            >
              <div className="flex items-start space-x-3 mb-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Volume2 className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 mb-1">What You Shared</h3>
                  <p className="text-gray-600 text-sm">This is what I heard from your voice...</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-purple-100">
                <p className="text-gray-800 leading-relaxed">
                  "{result.transcript}"
                </p>
              </div>
            </motion.div>
          )}

          {/* AI Response */}
          {result.supportive_response && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className={`bg-gradient-to-r ${getEmotionColor(result.emotion)} p-6 rounded-2xl text-white mb-6`}
            >
              <div className="flex items-start space-x-3">
                <Volume2 className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold mb-1">Hrudhi's Response:</p>
                  <p className="leading-relaxed">{result.supportive_response.message}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
        className="px-6"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          What would you like to do next?
        </h3>
        
        <div className="space-y-3">
          {/* Find Friends */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/friends')}
            className="w-full bg-white rounded-2xl p-4 shadow-lg flex items-center justify-between text-left"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-pink-400 to-purple-500">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Find Friends</h4>
                <p className="text-gray-600 text-sm">Connect with people feeling similar emotions</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </motion.button>

          {/* Discover Places */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/places')}
            className="w-full bg-white rounded-2xl p-4 shadow-lg flex items-center justify-between text-left"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-400 to-cyan-500">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Discover Places</h4>
                <p className="text-gray-600 text-sm">Find locations matching your {result.emotion} mood</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </motion.button>

          {/* View Timeline */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/timeline')}
            className="w-full bg-white rounded-2xl p-4 shadow-lg flex items-center justify-between text-left"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-400 to-teal-500">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">View Timeline</h4>
                <p className="text-gray-600 text-sm">See your emotional journey over time</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </motion.button>

          {/* Record Another */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/voice')}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 shadow-lg flex items-center justify-center text-white"
          >
            <Heart className="w-5 h-5 mr-2" />
            <span className="font-semibold">Record Another Session</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Interactive Conversation Prompt Modal */}
      <AnimatePresence>
        {showConversationPrompt && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowConversationPrompt(false)}
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50"
            >
              <div className="bg-white rounded-3xl p-8 shadow-2xl">
                {/* Close button */}
                <button
                  onClick={() => setShowConversationPrompt(false)}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Icon */}
                <div className="text-center mb-6">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                    className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
                  >
                    <MessageCircle className="w-10 h-10 text-white" />
                  </motion.div>
                  
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Let's Talk More! 💬
                  </h2>
                  <p className="text-gray-600">
                    I'd love to ask you a few questions to better understand how you're feeling
                  </p>
                </div>

                {/* Benefits */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-purple-600 text-sm">✓</span>
                    </div>
                    <p className="text-gray-700 text-sm">
                      <strong>5 quick questions</strong> tailored to your {result?.emotion} mood
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-purple-600 text-sm">✓</span>
                    </div>
                    <p className="text-gray-700 text-sm">
                      <strong>Real-time emotion analysis</strong> after each response
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-purple-600 text-sm">✓</span>
                    </div>
                    <p className="text-gray-700 text-sm">
                      <strong>Deeper insights</strong> into your emotional patterns
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={startInteractiveSession}
                    disabled={startingConversation}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl py-4 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {startingConversation ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="mr-2"
                        >
                          <Sparkles className="w-5 h-5" />
                        </motion.div>
                        Starting...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Yes, Let's Talk!
                      </>
                    )}
                  </motion.button>

                  <button
                    onClick={() => setShowConversationPrompt(false)}
                    className="w-full text-gray-600 py-3 font-medium hover:text-gray-800"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Results