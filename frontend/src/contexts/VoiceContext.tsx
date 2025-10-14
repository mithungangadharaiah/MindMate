import React, { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react'
import toast from 'react-hot-toast'

interface VoiceContextType {
  // TTS (Text-to-Speech)
  speak: (text: string, options?: SpeechSynthesisUtteranceOptions) => Promise<void>
  stopSpeaking: () => void
  isSpeaking: boolean
  
  // ASR (Automatic Speech Recognition)
  startListening: () => Promise<boolean>
  stopListening: () => void
  isListening: boolean
  
  // Audio Recording
  startRecording: () => Promise<boolean>
  stopRecording: () => Promise<Blob | null>
  isRecording: boolean
  
  // Permissions
  checkMicrophonePermission: () => Promise<boolean>
  requestMicrophonePermission: () => Promise<boolean>
  hasPermission: boolean | null
  
  // Recognition Results
  transcript: string
  confidence: number
  
  // Audio Analysis
  audioLevel: number
}

interface SpeechSynthesisUtteranceOptions {
  voice?: SpeechSynthesisVoice | null
  rate?: number
  pitch?: number
  volume?: number
}

const VoiceContext = createContext<VoiceContextType | null>(null)

export const useVoice = () => {
  const context = useContext(VoiceContext)
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider')
  }
  return context
}

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // TTS State
  const [isSpeaking, setIsSpeaking] = useState(false)
  const speechSynthRef = useRef<SpeechSynthesis | null>(null)
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  
  // ASR State
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [confidence, setConfidence] = useState(0)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  
  // Permission State
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)

  useEffect(() => {
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      speechSynthRef.current = window.speechSynthesis
    }

    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition() as SpeechRecognition
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true  // Keep listening for better continuous speech
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'en-IN'  // Indian English accent
        recognitionRef.current.maxAlternatives = 5  // More alternatives for better accuracy
        
        // Additional settings for better Indian English recognition
        if (recognitionRef.current.serviceURI) {
          recognitionRef.current.serviceURI = 'https://speech.googleapis.com/v1/speech:recognize'
        }
        
        recognitionRef.current.onresult = (event) => {
          // Accumulate all final results from this session
          let sessionTranscript = ''
          let bestConfidence = 0
          
          for (let i = 0; i < event.results.length; i++) {
            const result = event.results[i]
            if (result.isFinal) {
              // Find the best alternative from multiple options
              let bestTranscript = result[0].transcript
              let bestScore = result[0].confidence || 0.5
              
              // Check all alternatives for better matches
              for (let j = 0; j < result.length && j < 5; j++) {
                const alternative = result[j]
                const confidence = alternative.confidence || 0.5
                if (confidence > bestScore) {
                  bestTranscript = alternative.transcript
                  bestScore = confidence
                }
              }
              
              sessionTranscript += bestTranscript + ' '
              bestConfidence = Math.max(bestConfidence, bestScore)
              console.log(`✅ Final: "${bestTranscript}" (${(bestScore * 100).toFixed(0)}%)`)
              
              // Log all alternatives for debugging
              if (result.length > 1) {
                console.log('🔄 Alternatives:', Array.from(result).map((alt: any, idx) => 
                  `${idx}: "${alt.transcript}" (${((alt.confidence || 0.5) * 100).toFixed(0)}%)`
                ))
              }
            }
          }
          
          // Update transcript with ALL accumulated final results
          // Lower confidence threshold for Indian English (was 0.8, now 0.4)
          if (sessionTranscript.trim() && bestConfidence >= 0.4) {
            setTranscript(sessionTranscript.trim())
            setConfidence(bestConfidence)
            console.log(`📝 Session transcript: "${sessionTranscript.trim()}" (confidence: ${(bestConfidence * 100).toFixed(0)}%)`)
          } else if (sessionTranscript.trim()) {
            // Still show low-confidence results but mark them
            setTranscript(sessionTranscript.trim())
            setConfidence(bestConfidence)
            console.warn(`⚠️ Low confidence transcript: "${sessionTranscript.trim()}" (${(bestConfidence * 100).toFixed(0)}%)`)
          }
        }
        
        recognitionRef.current.onend = () => {
          setIsListening(false)
          console.log('🔇 Speech recognition ended')
        }
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
          
          // Handle different error types
          switch (event.error) {
            case 'not-allowed':
              toast.error('Microphone access denied. Please enable microphone permissions.')
              break
            case 'no-speech':
              console.warn('⚠️ No speech detected - this is normal for silence')
              break
            case 'audio-capture':
              toast.error('Audio capture failed. Please check your microphone.')
              break
            case 'network':
              console.warn('⚠️ Network error in speech recognition - retrying...')
              break
            case 'aborted':
              console.log('🛑 Speech recognition aborted')
              break
            default:
              console.warn(`⚠️ Speech recognition error: ${event.error}`)
          }
        }
        
        // Add start handler for better debugging
        recognitionRef.current.onstart = () => {
          console.log('🎤 Speech recognition started')
          setIsListening(true)
        }
      }
    }

    // Check initial permission
    checkMicrophonePermission()

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const speak = useCallback(async (text: string, options: SpeechSynthesisUtteranceOptions = {}) => {
    if (!speechSynthRef.current) {
      console.warn('Speech synthesis not supported')
      return
    }

    // Stop any current speech
    stopSpeaking()

    const utterance = new SpeechSynthesisUtterance(text)
    
    // Configure voice settings for warm, empathetic Hrudhi persona
    utterance.rate = options.rate || 1.0  // Natural speaking pace
    utterance.pitch = options.pitch || 1.15  // Slightly higher for warmth
    utterance.volume = options.volume || 0.9  // Clear and present
    
    // Find a warm, friendly voice (prefer female voices with natural tone)
    const voices = speechSynthRef.current.getVoices()
    const preferredVoice = voices.find(voice => 
      voice.name.toLowerCase().includes('natural') ||
      voice.name.toLowerCase().includes('salli') ||
      voice.name.toLowerCase().includes('joanna') ||
      voice.name.toLowerCase().includes('samantha') ||
      voice.name.toLowerCase().includes('female') || 
      voice.name.toLowerCase().includes('woman') ||
      voice.name.toLowerCase().includes('zira')
    ) || voices.find(voice => voice.lang.startsWith('en-IN')) || 
       voices.find(voice => voice.lang.startsWith('en')) || 
       voices[0]
    
    if (preferredVoice) {
      utterance.voice = preferredVoice
      console.log(`🎤 Using voice: ${preferredVoice.name}`)
    }

    return new Promise<void>((resolve) => {
      utterance.onstart = () => {
        setIsSpeaking(true)
      }
      
      utterance.onend = () => {
        setIsSpeaking(false)
        currentUtteranceRef.current = null
        resolve()
      }
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event)
        setIsSpeaking(false)
        currentUtteranceRef.current = null
        resolve()
      }

      currentUtteranceRef.current = utterance
      speechSynthRef.current!.speak(utterance)
    })
  }, [])

  const stopSpeaking = useCallback(() => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel()
      setIsSpeaking(false)
      currentUtteranceRef.current = null
    }
  }, [])

  const startListening = useCallback(async (): Promise<boolean> => {
    if (!recognitionRef.current) {
      console.warn('Speech recognition not supported')
      return false
    }

    if (isListening) {
      return true
    }

    try {
      // Clear previous transcript and reset state
      setTranscript('')
      setConfidence(0)
      
      // Ensure recognition is stopped before starting
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore errors from stopping
        }
        
        // Wait a brief moment for cleanup
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      setIsListening(true)
      recognitionRef.current.start()
      console.log('🎤 Starting speech recognition...')
      return true
    } catch (error: any) {
      console.error('Failed to start listening:', error)
      setIsListening(false)
      
      // Handle specific errors
      if (error.name === 'InvalidStateError') {
        console.warn('⚠️ Speech recognition already running, attempting to restart...')
        // Try to restart after a brief delay
        setTimeout(() => {
          startListening()
        }, 500)
      }
      
      return false
    }
  }, [isListening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }, [isListening])

  const checkMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      const hasAccess = permission.state === 'granted'
      setHasPermission(hasAccess)
      return hasAccess
    } catch (error) {
      console.warn('Could not check microphone permission:', error)
      return false
    }
  }, [])

  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop()) // Stop immediately after getting permission
      setHasPermission(true)
      return true
    } catch (error) {
      console.error('Microphone permission denied:', error)
      setHasPermission(false)
      toast.error('Microphone access is required for voice features')
      return false
    }
  }, [])

  const analyzeAudioLevel = useCallback(() => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)
    
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
    const normalizedLevel = average / 255
    setAudioLevel(normalizedLevel)

    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudioLevel)
    }
  }, [isRecording])

  const startRecording = useCallback(async (): Promise<boolean> => {
    if (isRecording) return true

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      })
      
      audioStreamRef.current = stream
      audioChunksRef.current = []

      // Set up audio context for level analysis
      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)

      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      
      // Start audio level analysis
      analyzeAudioLevel()

      // 🔥 START SPEECH RECOGNITION TO CAPTURE TRANSCRIPT!
      if (recognitionRef.current) {
        try {
          setTranscript('') // Clear previous transcript
          recognitionRef.current.continuous = true // Keep listening throughout recording
          recognitionRef.current.interimResults = true // Show interim results
          recognitionRef.current.start()
          setIsListening(true)
          console.log('✅ Speech recognition started with recording')
        } catch (error) {
          console.warn('Could not start speech recognition:', error)
          // Continue recording even if speech recognition fails
        }
      }

      return true
    } catch (error) {
      console.error('Failed to start recording:', error)
      toast.error('Could not access microphone for recording')
      return false
    }
  }, [isRecording, analyzeAudioLevel])

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    if (!isRecording || !mediaRecorderRef.current) {
      return null
    }

    // 🔥 STOP SPEECH RECOGNITION FIRST TO CAPTURE FINAL TRANSCRIPT
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop()
        setIsListening(false)
        console.log('✅ Speech recognition stopped, transcript captured:', transcript)
      } catch (error) {
        console.warn('Could not stop speech recognition:', error)
      }
    }

    return new Promise((resolve) => {
      mediaRecorderRef.current!.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        
        // Cleanup
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(track => track.stop())
          audioStreamRef.current = null
        }
        
        if (audioContextRef.current) {
          audioContextRef.current.close()
          audioContextRef.current = null
        }

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }

        setIsRecording(false)
        setAudioLevel(0)
        analyserRef.current = null
        mediaRecorderRef.current = null
        
        resolve(audioBlob)
      }

      mediaRecorderRef.current!.stop()
    })
  }, [isRecording, isListening, transcript])

  const value: VoiceContextType = {
    // TTS
    speak,
    stopSpeaking,
    isSpeaking,
    
    // ASR
    startListening,
    stopListening,
    isListening,
    
    // Recording
    startRecording,
    stopRecording,
    isRecording,
    
    // Permissions
    checkMicrophonePermission,
    requestMicrophonePermission,
    hasPermission,
    
    // Results
    transcript,
    confidence,
    
    // Audio
    audioLevel,
  }

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  )
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}