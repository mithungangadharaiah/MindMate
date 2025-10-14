import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MessageCircle, Brain, Mic, Loader2 } from 'lucide-react'
import { useVoice } from '../contexts/VoiceContext'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

/**
 * Fully Automatic Interactive Session
 * - Asks 5 questions automatically
 * - Auto-starts recording after each question
 * - Auto-stops after 10 seconds of silence
 * - No button clicks required!
 */
const InteractiveSessionAuto: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { token } = useAuthStore()
  const {
    speak,
    isSpeaking,
    startRecording,
    stopRecording,
    isRecording,
    transcript
  } = useVoice()

  const [conversationId, setConversationId] = useState<string | null>(null)
  const [phase, setPhase] = useState<'starting' | 'speaking' | 'recording' | 'thinking' | 'complete'>('starting')
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [questionNumber, setQuestionNumber] = useState(1)
  const [qaHistory, setQAHistory] = useState<any[]>([])
  const [currentEmotion, setCurrentEmotion] = useState('neutral')
  const [recordingTime, setRecordingTime] = useState(0)
  const [sessionReport, setSessionReport] = useState<any>(null)
  
  const lastTranscriptRef = useRef('')
  const silenceTimeoutRef = useRef<number>()
  const recordingTimeoutRef = useRef<number>()

  // Start conversation on mount
  useEffect(() => {
    const convId = searchParams.get('conversationId')
    if (convId) {
      setConversationId(convId)
      askFirstQuestion()
    } else {
      startNewConversation()
    }
    
    return () => {
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current)
      if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current)
    }
  }, [])

  // Auto-start recording after question is spoken
  useEffect(() => {
    if (phase === 'speaking' && !isSpeaking) {
      // Question finished speaking, wait 1.5 seconds then start recording
      const timeout = setTimeout(() => {
        autoStartRecording()
      }, 1500)
      return () => clearTimeout(timeout)
    }
  }, [phase, isSpeaking])

  // Auto-stop on silence - Smart detection: 10 seconds allows for thinking pauses
  useEffect(() => {
    if (phase === 'recording' && transcript !== lastTranscriptRef.current) {
      lastTranscriptRef.current = transcript
      
      // Clear previous timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
      }
      
      // Auto-stop after 5 seconds of silence for better conversation flow
      // Only if we have captured some speech
      if (transcript.trim().length > 0) {
        silenceTimeoutRef.current = window.setTimeout(() => {
          autoStopRecording()
        }, 5000) // Reduced to 5 seconds for snappier conversation
      }
    }
  }, [transcript, phase])

  // Max recording time: 45 seconds (increased for thoughtful responses)
  useEffect(() => {
    if (phase === 'recording') {
      recordingTimeoutRef.current = window.setTimeout(() => {
        autoStopRecording()
      }, 45000) // Increased from 30s to 45s
      
      return () => {
        if (recordingTimeoutRef.current) {
          clearTimeout(recordingTimeoutRef.current)
        }
      }
    }
  }, [phase])

  // Recording time counter
  useEffect(() => {
    let interval: number
    if (phase === 'recording') {
      interval = window.setInterval(() => {
        setRecordingTime(prev => Math.min(prev + 1, 45))
      }, 1000)
    } else {
      setRecordingTime(0)
    }
    return () => clearInterval(interval)
  }, [phase])

  const startNewConversation = async () => {
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
        
        // Auto-speak question
        setPhase('speaking')
        await speak(data.question)
      } else {
        throw new Error('Failed to start conversation')
      }
    } catch (error) {
      console.error('Failed to start conversation:', error)
      toast.error('Failed to start session')
      navigate('/dashboard')
    }
  }

  const askFirstQuestion = async () => {
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
      setCurrentQuestion(data.question)
      setQuestionNumber(data.questionNumber)
      
      setPhase('speaking')
      await speak(data.question)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to start')
    }
  }

  const autoStartRecording = async () => {
    try {
      setPhase('recording')
      await startRecording()
    } catch (error) {
      console.error('Failed to start recording:', error)
      toast.error('Microphone error')
    }
  }

  const autoStopRecording = async () => {
    try {
      await stopRecording()
      setPhase('thinking')

      // Submit response
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
        // Store Q&A
        const qa = {
          question: currentQuestion,
          answer: transcript,
          emotion: data.emotion.emotion,
          intensity: data.emotion.intensity
        }
        setQAHistory(prev => [...prev, qa])
        setCurrentEmotion(data.emotion.emotion)

        if (data.complete) {
          // Store session report (wellness score, recommendations, places, communities)
          if (data.sessionReport) {
            console.log('💖 Session Report received:', JSON.stringify(data.sessionReport, null, 2))
            
            // Validate the report structure
            const report = {
              wellnessScore: data.sessionReport.wellnessScore || 50,
              wellnessMessage: String(data.sessionReport.wellnessMessage || 'Session Complete'),
              wellnessColor: String(data.sessionReport.wellnessColor || '#10b981'),
              encouragement: String(data.sessionReport.encouragement || 'Thank you for sharing'),
              recommendations: data.sessionReport.recommendations || {},
              placesToVisit: Array.isArray(data.sessionReport.placesToVisit) ? data.sessionReport.placesToVisit : [],
              communities: Array.isArray(data.sessionReport.communities) ? data.sessionReport.communities : []
            }
            
            console.log('✅ Validated report:', report)
            setSessionReport(report)
          }
          
          // Show summary (don't auto-navigate - let user read the report!)
          setPhase('complete')
          
          console.log('🎉 Session complete! Saving conversation...')
          
          // Save conversation to database as entry (but don't navigate yet)
          await saveConversationAsEntry(data.summary)
        } else {
          // Next question
          setCurrentQuestion(data.question)
          setQuestionNumber(data.questionNumber)
          
          setPhase('speaking')
          await speak(data.question)
        }
      }
    } catch (error) {
      console.error('Error processing response:', error)
      toast.error('Processing error')
    }
  }

  const saveConversationAsEntry = async (summary: any) => {
    try {
      // Create a combined transcript from all answers
      const fullTranscript = qaHistory.map(qa => qa.answer).join('. ')
      
      console.log('💾 Saving conversation to timeline...', {
        transcript: fullTranscript,
        conversationId,
        summary
      })
      
      const response = await fetch('http://localhost:5000/api/entries', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transcript: fullTranscript,
          conversationId: conversationId,
          conversation_summary: summary
        })
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('❌ Failed to save conversation:', error)
        throw new Error('Failed to save conversation')
      }
      
      const savedEntry = await response.json()
      console.log('✅ Conversation saved successfully:', savedEntry)
      return savedEntry
    } catch (error) {
      console.error('Error saving conversation:', error)
    }
  }

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      happy: 'from-yellow-400 to-orange-400',
      sad: 'from-blue-400 to-indigo-500',
      anxious: 'from-red-400 to-pink-500',
      calm: 'from-green-400 to-teal-400',
      confused: 'from-purple-400 to-pink-400',
      hopeful: 'from-green-300 to-emerald-400',
      neutral: 'from-gray-400 to-slate-500'
    }
    return colors[emotion] || 'from-purple-400 to-pink-400'
  }

  const getPhaseMessage = () => {
    switch (phase) {
      case 'starting':
        return '✨ Preparing your session...'
      case 'speaking':
        return '🗣️ Listen to the question...'
      case 'recording':
        return `🎤 Listening... (${recordingTime}s)`
      case 'thinking':
        return '🧠 Analyzing your emotions...'
      case 'complete':
        return '🎉 Session complete!'
      default:
        return ''
    }
  }

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <MessageCircle style={{ width: '32px', height: '32px', color: 'var(--color-secondary-400)' }} />
          <div>
            <h1 style={{ 
              fontSize: 'var(--font-size-2xl)', 
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)'
            }}>
              Automatic Session
            </h1>
            <p style={{ 
              fontSize: 'var(--font-size-sm)', 
              color: 'var(--color-text-secondary)'
            }}>
              Question {questionNumber} of 5
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          marginTop: 'var(--spacing-lg)',
          width: '100%',
          backgroundColor: 'var(--color-primary-100)',
          borderRadius: 'var(--border-radius-full)',
          height: '8px',
          overflow: 'hidden'
        }}>
          <motion.div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, var(--color-secondary-500), var(--color-primary-500))'
            }}
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
            <div className="card card--elevated">
              <Brain style={{ 
                width: '48px', 
                height: '48px', 
                color: 'var(--color-secondary-400)',
                margin: '0 auto var(--spacing-lg)'
              }} />
              <p style={{
                fontSize: 'var(--font-size-2xl)',
                color: 'var(--color-text-primary)',
                fontWeight: 'var(--font-weight-medium)',
                lineHeight: 'var(--line-height-relaxed)'
              }}>
                {currentQuestion || 'Starting...'}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Visual Indicator */}
        <div className="relative mb-8">
          {phase === 'recording' && (
            <motion.div
              className={`absolute inset-0 rounded-full bg-gradient-to-r ${getEmotionColor(currentEmotion)} blur-3xl`}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.4, 0.7, 0.4]
              }}
              transition={{
                duration: 2,
                repeat: Infinity
              }}
            />
          )}

          <div className={`relative w-32 h-32 rounded-full flex items-center justify-center ${
            phase === 'recording'
              ? 'bg-gradient-to-r from-red-500 to-pink-500'
              : phase === 'speaking'
              ? 'bg-gradient-to-r from-blue-500 to-purple-500'
              : phase === 'thinking'
              ? 'bg-gradient-to-r from-purple-500 to-indigo-500'
              : 'bg-gradient-to-r from-gray-600 to-gray-700'
          }`}>
            {phase === 'recording' ? (
              <Mic className="w-16 h-16" style={{ color: 'var(--color-text-inverse)' }} />
            ) : phase === 'thinking' ? (
              <Loader2 className="w-16 h-16 animate-spin" style={{ color: 'var(--color-text-inverse)' }} />
            ) : (
              <Brain className="w-16 h-16" style={{ color: 'var(--color-text-inverse)' }} />
            )}
          </div>
        </div>

        {/* Phase message */}
        <motion.p
          key={phase}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xl font-medium mb-4"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {getPhaseMessage()}
        </motion.p>

        {/* Current transcript */}
        {transcript && phase === 'recording' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl w-full bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30"
          >
            <div className="flex items-start gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-red-500 mt-2 animate-pulse" />
              <p className="text-base flex-1 leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>"{transcript}"</p>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
              <span className="text-slate-400 text-xs">
                {transcript.trim().split(/\s+/).filter(w => w.length > 0).length} words captured
              </span>
              <span className="text-slate-400 text-xs">
                ⏱️ {recordingTime}s / 45s
              </span>
            </div>
          </motion.div>
        )}

        {/* Auto message */}
        <p className="mt-6 text-slate-400 text-sm text-center max-w-md">
          {phase === 'recording' 
            ? '💭 Speak naturally. Take your time - pauses for thinking are okay! I\'ll wait 10 seconds of silence before moving on.' 
            : 'Everything happens automatically - just speak when prompted!'}
        </p>
      </div>

      {/* Completion Summary - Rich Report */}
      {phase === 'complete' && sessionReport && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 overflow-y-auto p-6 z-50"
        >
          <div className="max-w-4xl mx-auto py-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                Your Session Summary 💖
              </h2>
              <p className="text-purple-200 text-lg">
                Based on our conversation, here's your personalized wellness report
              </p>
            </div>

            {/* Wellness Score */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 mb-6">
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center w-40 h-40 mb-4">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke={sessionReport.wellnessColor || '#10b981'}
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 70}`}
                      strokeDashoffset={`${2 * Math.PI * 70 * (1 - sessionReport.wellnessScore / 100)}`}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{sessionReport.wellnessScore}</span>
                    <span className="text-sm text-purple-200">/ 100</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  {String(sessionReport.wellnessMessage || 'Wellness Assessment Complete')}
                </h3>
                <p className="text-purple-200 text-lg leading-relaxed">
                  {String(sessionReport.encouragement || 'Thank you for sharing your thoughts with me.')}
                </p>
              </div>
            </div>

            {/* Recommendations */}
            {sessionReport.recommendations && (
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 mb-6">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                  <span>💡</span> Personalized Recommendations
                </h3>
                
                <div className="space-y-6">
                  {/* Immediate Actions */}
                  {sessionReport.recommendations.immediate?.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-purple-200 mb-3">🎯 Right Now</h4>
                      <div className="space-y-2">
                        {sessionReport.recommendations.immediate.map((action: any, idx: number) => (
                          <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">{String(action.icon || '💡')}</span>
                              <div>
                                <h5 className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>{String(action.title || action)}</h5>
                                {action.description && <p className="text-purple-200 text-sm">{String(action.description)}</p>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Daily Practices */}
                  {sessionReport.recommendations.daily?.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-purple-200 mb-3">📅 Daily Practices</h4>
                      <div className="space-y-2">
                        {sessionReport.recommendations.daily.map((action: any, idx: number) => (
                          <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">{String(action.icon || '📅')}</span>
                              <div>
                                <h5 className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>{String(action.title || action)}</h5>
                                {action.description && <p className="text-purple-200 text-sm">{String(action.description)}</p>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Weekly Goals */}
                  {sessionReport.recommendations.weekly?.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-purple-200 mb-3">🎨 This Week</h4>
                      <div className="space-y-2">
                        {sessionReport.recommendations.weekly.map((action: any, idx: number) => (
                          <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">{String(action.icon || '🎨')}</span>
                              <div>
                                <h5 className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>{String(action.title || action)}</h5>
                                {action.description && <p className="text-purple-200 text-sm">{String(action.description)}</p>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Professional Support */}
                  {sessionReport.recommendations.professional?.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-purple-200 mb-3">🩺 Professional Support</h4>
                      <div className="space-y-2">
                        {sessionReport.recommendations.professional.map((action: any, idx: number) => (
                          <div key={idx} className="bg-red-500/20 rounded-xl p-4 border border-red-400/30">
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">{String(action.icon || '🩺')}</span>
                              <div>
                                <h5 className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>{String(action.title || action)}</h5>
                                {action.description && <p className="text-red-200 text-sm">{String(action.description)}</p>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Places to Visit */}
            {sessionReport.placesToVisit?.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 mb-6">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                  <span>📍</span> Places That Might Help
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {sessionReport.placesToVisit.map((place: any, idx: number) => (
                    <div key={idx} className="bg-white/5 rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="text-3xl mb-2">{String(place.icon || '📍')}</div>
                      <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>{String(place.name || 'Place')}</h4>
                      <p className="text-sm text-purple-200">{String(place.description || '')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Community Connections */}
            {sessionReport.communities?.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 mb-6">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                  <span>🤝</span> Find Your Community
                </h3>
                <div className="space-y-4">
                  {sessionReport.communities.map((community: any, idx: number) => (
                    <div key={idx} className="bg-white/5 rounded-xl p-5 border border-white/10">
                      <div className="flex items-start gap-4">
                        <div className="text-3xl">{String(community.icon || '🤝')}</div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>{String(community.name || 'Community')}</h4>
                          <p className="text-purple-200 mb-3">{String(community.description || '')}</p>
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(community.examples) && community.examples.map((example: string, i: number) => (
                              <span key={i} className="px-3 py-1 bg-purple-500/20 rounded-full text-sm text-purple-200">
                                {String(example)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="text-center">
              <button
                onClick={() => navigate('/timeline', { replace: true, state: { refresh: Date.now() } })}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-12 py-4 rounded-2xl text-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-2xl"
              >
                View Your Timeline 📊
              </button>
              <p className="text-purple-200 mt-4 text-sm">
                Your conversation has been saved
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Simple Completion (fallback if no report) */}
      {phase === 'complete' && !sessionReport && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50"
        >
          <div className="bg-white rounded-3xl p-8 max-w-lg">
            <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">
              🎉 Session Complete!
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Thank you for sharing. Your conversation has been saved to your timeline.
            </p>
            
            {qaHistory.length > 0 && (
              <div className="space-y-3 mb-6">
                <p className="text-sm text-gray-500 font-medium">Your Emotional Journey:</p>
                {qaHistory.map((qa, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getEmotionColor(qa.emotion)}`} />
                    <span className="text-gray-700 text-sm capitalize">{qa.emotion}</span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-center text-gray-500 text-sm">
              Redirecting to timeline...
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default InteractiveSessionAuto
