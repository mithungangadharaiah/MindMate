import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useAuthStore } from '../stores/authStore';
import { useLocation } from 'react-router-dom';

interface Entry {
  id: string;
  user_id: string;
  transcript: string;
  emotion: string;
  intensity: number;
  confidence: number;
  created_at: string;
  ai_analysis?: {
    reasoning?: string;
  };
}

const emotionColors: Record<string, string> = {
  happy: 'bg-yellow-100 border-yellow-500 text-yellow-900',
  sad: 'bg-blue-100 border-blue-500 text-blue-900',
  anxious: 'bg-red-100 border-red-500 text-red-900',
  calm: 'bg-green-100 border-green-500 text-green-900',
  angry: 'bg-orange-100 border-orange-500 text-orange-900',
  neutral: 'bg-gray-100 border-gray-500 text-gray-900',
  excited: 'bg-pink-100 border-pink-500 text-pink-900',
  peaceful: 'bg-teal-100 border-teal-500 text-teal-900',
};

const Timeline: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, token } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setLoading(true);
        console.log('📥 Fetching timeline entries...');
        
        const response = await fetch('http://localhost:5000/api/entries', {
          headers: {
            'Authorization': `Bearer ${token || 'demo-token'}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch entries');
        }

        const data = await response.json();
        console.log('📋 Received entries:', data);
        console.log('📋 Data type:', typeof data, 'Is array:', Array.isArray(data));
        
        // Ensure data is an array before sorting
        const entriesArray = Array.isArray(data) ? data : [];
        console.log('📋 Entries array:', entriesArray);
        console.log('📋 Entries array length:', entriesArray.length);
        
        // Sort entries by date, newest first
        const sortedEntries = entriesArray.sort((a: Entry, b: Entry) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          console.log(`Comparing: ${dateA} vs ${dateB}`);
          return dateB - dateA;
        });
        
        console.log(`✅ Loaded ${sortedEntries.length} entries`, sortedEntries);
        setEntries(sortedEntries);
        console.log('✅ State updated with entries');
      } catch (err) {
        console.error('Error fetching entries:', err);
        setError(err instanceof Error ? err.message : 'Failed to load timeline');
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [user, location.state]); // Re-fetch when location state changes

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your timeline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">⚠️ {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <motion.div
        className="min-h-screen flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">📝 Timeline</h1>
          <p className="text-xl text-gray-600 mb-6">Your emotional journey timeline</p>
          <p className="text-gray-500">No entries yet. Start recording to see your timeline!</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">📝 Your Timeline</h1>
        <p className="text-gray-600 mb-8">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </p>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-purple-200"></div>

          {/* Timeline entries */}
          <div className="space-y-8">
            {entries.map((entry, index) => {
              const emotionColor = emotionColors[entry.emotion] || emotionColors.neutral;
              const date = new Date(entry.created_at);
              
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative pl-20"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-6 w-5 h-5 rounded-full bg-purple-600 border-4 border-white shadow"></div>

                  {/* Entry card */}
                  <div className={`border-l-4 rounded-lg p-6 shadow-md ${emotionColor}`}>
                    {/* Date & Time */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold">
                        {format(date, 'MMMM d, yyyy')}
                      </span>
                      <span className="text-xs opacity-75">
                        {format(date, 'h:mm a')}
                      </span>
                    </div>

                    {/* Emotion badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">
                        {entry.emotion === 'happy' && '😊'}
                        {entry.emotion === 'sad' && '😢'}
                        {entry.emotion === 'anxious' && '😰'}
                        {entry.emotion === 'calm' && '😌'}
                        {entry.emotion === 'angry' && '😠'}
                        {entry.emotion === 'neutral' && '😐'}
                        {entry.emotion === 'excited' && '🤗'}
                        {entry.emotion === 'peaceful' && '☮️'}
                      </span>
                      <div>
                        <p className="font-bold capitalize">{entry.emotion}</p>
                        <p className="text-xs opacity-75">
                          Intensity: {(entry.intensity * 100).toFixed(0)}% • 
                          Confidence: {(entry.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    {/* Transcript */}
                    <p className="text-gray-800 mb-3 italic">
                      "{entry.transcript}"
                    </p>

                    {/* AI Reasoning (if available) */}
                    {entry.ai_analysis?.reasoning && (
                      <div className="mt-3 pt-3 border-t border-current opacity-75">
                        <p className="text-sm">
                          💭 {entry.ai_analysis.reasoning}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Timeline;