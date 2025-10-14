import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, MapPin, Heart, MessageCircle, Clock, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

interface Friend {
  id: string
  name: string
  avatar: string
  current_emotion: string
  emotion_intensity: number
  last_active: string
  location: string
  bio: string
  match_score: number
}

const Friends: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'similar' | 'nearby'>('similar')

  useEffect(() => {
    fetchFriends()
  }, [filter])

  const fetchFriends = async () => {
    try {
      setLoading(true)
      // In production, this would call API with filter
      // For now, using demo data
      const demoFriends: Friend[] = [
        {
          id: '1',
          name: 'Sarah Chen',
          avatar: '👩‍💼',
          current_emotion: 'calm',
          emotion_intensity: 0.7,
          last_active: '5 minutes ago',
          location: 'Coffee Shop near you',
          bio: 'Finding peace in small moments',
          match_score: 95
        },
        {
          id: '2',
          name: 'Alex Kumar',
          avatar: '👨‍💻',
          current_emotion: 'happy',
          emotion_intensity: 0.8,
          last_active: '12 minutes ago',
          location: 'Park nearby',
          bio: 'Grateful for every sunrise',
          match_score: 88
        },
        {
          id: '3',
          name: 'Emma Wilson',
          avatar: '👩‍🎨',
          current_emotion: 'excited',
          emotion_intensity: 0.9,
          last_active: '20 minutes ago',
          location: 'Art Gallery',
          bio: 'Creative soul seeking inspiration',
          match_score: 82
        },
        {
          id: '4',
          name: 'James Lee',
          avatar: '👨‍🏫',
          current_emotion: 'calm',
          emotion_intensity: 0.6,
          last_active: '1 hour ago',
          location: 'Library',
          bio: 'Learning something new every day',
          match_score: 78
        },
        {
          id: '5',
          name: 'Maya Patel',
          avatar: '👩‍🔬',
          current_emotion: 'focused',
          emotion_intensity: 0.7,
          last_active: '2 hours ago',
          location: 'Co-working Space',
          bio: 'Making progress, one step at a time',
          match_score: 75
        }
      ]

      // Sort by match score
      const sortedFriends = demoFriends.sort((a, b) => b.match_score - a.match_score)
      setFriends(sortedFriends)
    } catch (error) {
      console.error('Failed to fetch friends:', error)
      toast.error('Failed to load friend suggestions')
    } finally {
      setLoading(false)
    }
  }

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      happy: 'from-yellow-400 to-orange-500',
      sad: 'from-blue-400 to-indigo-500',
      anxious: 'from-orange-400 to-red-500',
      calm: 'from-green-400 to-teal-500',
      angry: 'from-red-500 to-orange-600',
      neutral: 'from-gray-400 to-gray-600',
      excited: 'from-pink-400 to-purple-500',
      focused: 'from-indigo-400 to-blue-500'
    }
    return colors[emotion.toLowerCase()] || 'from-purple-400 to-pink-500'
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
      focused: '🎯'
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
          <p className="text-gray-600 text-lg">Finding your emotional matches...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 pb-20">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-handwriting font-bold text-gray-800 mb-2">
            Find Your Tribe
          </h1>
          <p className="text-gray-600">Connect with people feeling similar emotions</p>
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6 bg-white p-2 rounded-2xl shadow-md">
          <button
            onClick={() => setFilter('similar')}
            className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${
              filter === 'similar'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Similar Vibes
          </button>
          <button
            onClick={() => setFilter('nearby')}
            className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${
              filter === 'nearby'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Nearby
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${
              filter === 'all'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Friends List */}
      <div className="px-6 space-y-4">
        {friends.map((friend, index) => (
          <motion.div
            key={friend.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-5 shadow-lg"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start space-x-3">
                <div className="text-4xl">{friend.avatar}</div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-lg">{friend.name}</h3>
                  <p className="text-gray-600 text-sm flex items-center mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    {friend.last_active}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1 rounded-full">
                  <span className="text-purple-700 font-bold text-sm">{friend.match_score}% match</span>
                </div>
              </div>
            </div>

            <p className="text-gray-700 mb-3 italic">"{friend.bio}"</p>

            {/* Emotion Badge */}
            <div className="flex items-center space-x-2 mb-3">
              <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getEmotionColor(friend.current_emotion)} flex items-center space-x-2`}>
                <span className="text-lg">{getEmotionEmoji(friend.current_emotion)}</span>
                <span className="text-white text-sm font-medium capitalize">{friend.current_emotion}</span>
              </div>
              <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${friend.emotion_intensity * 100}%` }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                  className={`h-full bg-gradient-to-r ${getEmotionColor(friend.current_emotion)}`}
                />
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center text-gray-600 text-sm mb-4">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{friend.location}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-xl font-medium flex items-center justify-center space-x-2"
                onClick={() => toast.success(`Chat feature coming soon! Stay tuned.`)}
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-white border-2 border-purple-500 text-purple-500 py-2 px-4 rounded-xl font-medium flex items-center justify-center space-x-2"
                onClick={() => toast.success(`Added ${friend.name} to favorites!`)}
              >
                <Heart className="w-4 h-4" />
                <span>Connect</span>
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {friends.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No matches yet</h3>
          <p className="text-gray-600">Check back later for friend suggestions!</p>
        </div>
      )}
    </div>
  )
}

export default Friends