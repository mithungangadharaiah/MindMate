import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Volume2, Square } from 'lucide-react';

const VoiceTest: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');

  const requestMicrophonePermission = async () => {
    try {
      setError('');
      console.log('Requesting microphone permission...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log('Microphone permission granted!', stream);
      setHasPermission(true);
      
      // Stop the stream immediately as we just wanted permission
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (err: any) {
      console.error('Microphone permission denied:', err);
      setError(`Microphone access denied: ${err.message}`);
      setHasPermission(false);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      setError('');
      console.log('Starting recording...');
      
      if (hasPermission === null) {
        const granted = await requestMicrophonePermission();
        if (!granted) return;
      }

      // Check if browser supports Speech Recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        throw new Error('Speech Recognition not supported in this browser');
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsRecording(true);
        setTranscript('Listening...');
      };

      recognition.onresult = (event: any) => {
        console.log('Speech recognition result:', event);
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript + interimTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event);
        setError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsRecording(false);
      };

      recognition.start();
      
    } catch (err: any) {
      console.error('Failed to start recording:', err);
      setError(`Failed to start recording: ${err.message}`);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    // In a real implementation, you'd stop the recognition here
  };

  const testTextToSpeech = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Hello! This is a test of the text to speech functionality.');
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;
      speechSynthesis.speak(utterance);
    } else {
      setError('Text-to-speech not supported in this browser');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            🎤 Voice Test Page
          </h1>

          {/* Permission Status */}
          <div className="mb-6 p-4 rounded-xl bg-gray-50">
            <h3 className="font-semibold mb-2">Microphone Permission Status:</h3>
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              hasPermission === true ? 'bg-green-100 text-green-700' :
              hasPermission === false ? 'bg-red-100 text-red-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {hasPermission === true ? '✅ Granted' :
               hasPermission === false ? '❌ Denied' :
               '⏳ Not Requested'}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 font-medium">❌ Error: {error}</p>
            </div>
          )}

          {/* Controls */}
          <div className="space-y-4 mb-6">
            <motion.button
              onClick={requestMicrophonePermission}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              🎤 Request Microphone Permission
            </motion.button>

            <motion.button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={hasPermission === false}
              className={`w-full py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                isRecording 
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white' 
                  : 'bg-gradient-to-r from-green-500 to-teal-600 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              whileHover={{ scale: hasPermission !== false ? 1.02 : 1 }}
              whileTap={{ scale: hasPermission !== false ? 0.98 : 1 }}
            >
              {isRecording ? (
                <>
                  <Square className="w-5 h-5" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  Start Voice Recognition
                </>
              )}
            </motion.button>

            <motion.button
              onClick={testTextToSpeech}
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Volume2 className="w-5 h-5" />
              Test Text-to-Speech
            </motion.button>
          </div>

          {/* Transcript Display */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <h3 className="font-semibold mb-2">Speech Recognition Result:</h3>
            <div className="min-h-[100px] p-3 bg-white rounded-lg border">
              {transcript || 'No speech detected yet...'}
            </div>
          </div>

          {/* Debug Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <h3 className="font-semibold mb-2">Browser Support:</h3>
            <ul className="text-sm space-y-1">
              <li>🎤 getUserMedia: {navigator.mediaDevices ? '✅' : '❌'}</li>
              <li>🗣️ Speech Recognition: {(window as any).SpeechRecognition || (window as any).webkitSpeechRecognition ? '✅' : '❌'}</li>
              <li>🔊 Speech Synthesis: {'speechSynthesis' in window ? '✅' : '❌'}</li>
            </ul>
          </div>

          <div className="mt-6 text-center">
            <a 
              href="/login" 
              className="text-purple-600 hover:text-purple-700 font-semibold"
            >
              ← Back to Login
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VoiceTest;