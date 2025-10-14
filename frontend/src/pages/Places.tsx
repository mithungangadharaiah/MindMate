import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Star, Navigation, Clock, Heart, ExternalLink, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

interface Place {
  id: string
  name: string
  type: string
  emotion_tags: string[]
  description: string
  distance: string
  rating: number
  image: string
  hours: string
  price_level: number
  match_score: number
}

const Places: React.FC = () => {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmotion, setSelectedEmotion] = useState<string>('all')

  const emotions = [
    { name: 'all', emoji: '🌟', label: 'All' },
    { name: 'happy', emoji: '😊', label: 'Happy' },
    { name: 'calm', emoji: '😌', label: 'Calm' },
    { name: 'sad', emoji: '😢', label: 'Sad' },
    { name: 'anxious', emoji: '😰', label: 'Anxious' },
    { name: 'excited', emoji: '🤩', label: 'Excited' }
  ]

  useEffect(() => {
    fetchPlaces()
  }, [selectedEmotion])

  const fetchPlaces = async () => {
    try {
      setLoading(true)
      // In production, this would call API with emotion filter
      // For now, using demo data
      const demoPlaces: Place[] = [
        {
          id: '1',
          name: 'Sunset Park',
          type: 'Park',
          emotion_tags: ['calm', 'happy', 'peaceful'],
          description: 'Beautiful park with walking trails and serene lake views. Perfect for peaceful reflection.',
          distance: '0.5 km away',
          rating: 4.8,
          image: '🌳',
          hours: 'Open 24 hours',
          price_level: 0,
          match_score: 95
        },
        {
          id: '2',
          name: 'Cozy Corner Café',
          type: 'Café',
          emotion_tags: ['calm', 'neutral', 'focused'],
          description: 'Quiet café with comfortable seating and great coffee. Ideal for work or contemplation.',
          distance: '1.2 km away',
          rating: 4.6,
          image: '☕',
          hours: 'Mon-Sun: 7am - 10pm',
          price_level: 2,
          match_score: 92
        },
        {
          id: '3',
          name: 'Adventure Zone',
          type: 'Entertainment',
          emotion_tags: ['excited', 'happy', 'energetic'],
          description: 'Exciting activities including rock climbing, zip-lining, and obstacle courses.',
          distance: '3.5 km away',
          rating: 4.9,
          image: '🎢',
          hours: 'Mon-Sun: 10am - 9pm',
          price_level: 3,
          match_score: 88
        },
        {
          id: '4',
          name: 'Mindful Meditation Center',
          type: 'Wellness',
          emotion_tags: ['calm', 'anxious', 'stressed'],
          description: 'Tranquil space offering meditation sessions, yoga classes, and breathing exercises.',
          distance: '2.0 km away',
          rating: 4.7,
          image: '🧘',
          hours: 'Mon-Sat: 6am - 8pm',
          price_level: 2,
          match_score: 90
        },
        {
          id: '5',
          name: 'Lakeside Viewpoint',
          type: 'Nature',
          emotion_tags: ['calm', 'sad', 'reflective'],
          description: 'Peaceful spot overlooking the lake. Great for quiet contemplation and soul-searching.',
          distance: '4.2 km away',
          rating: 4.5,
          image: '🌊',
          hours: 'Open 24 hours',
          price_level: 0,
          match_score: 87
        },
        {
          id: '6',
          name: 'Joyful Dance Studio',
          type: 'Activity',
          emotion_tags: ['happy', 'excited', 'energetic'],
          description: 'Vibrant dance classes for all levels. Express yourself through movement and music.',
          distance: '2.8 km away',
          rating: 4.8,
          image: '💃',
          hours: 'Mon-Sun: 9am - 9pm',
          price_level: 2,
          match_score: 85
        },
        {
          id: '7',
          name: 'Quiet Library',
          type: 'Library',
          emotion_tags: ['calm', 'focused', 'neutral'],
          description: 'Peaceful library with extensive collection and comfortable reading areas.',
          distance: '1.5 km away',
          rating: 4.6,
          image: '📚',
          hours: 'Mon-Sat: 8am - 8pm',
          price_level: 0,
          match_score: 83
        },
        {
          id: '8',
          name: 'Art Gallery Downtown',
          type: 'Culture',
          emotion_tags: ['calm', 'inspired', 'reflective'],
          description: 'Contemporary art gallery featuring local and international artists.',
          distance: '3.0 km away',
          rating: 4.7,
          image: '🎨',
          hours: 'Tue-Sun: 10am - 6pm',
          price_level: 1,
          match_score: 86
        }
      ]

      // Filter by emotion if selected
      let filtered = demoPlaces
      if (selectedEmotion !== 'all') {
        filtered = demoPlaces.filter(place => 
          place.emotion_tags.includes(selectedEmotion)
        )
      }

      // Sort by match score
      filtered.sort((a, b) => b.match_score - a.match_score)
      setPlaces(filtered)
    } catch (error) {
      console.error('Failed to fetch places:', error)
      toast.error('Failed to load places')
    } finally {
      setLoading(false)
    }
  }

  const getPriceLevel = (level: number) => {
    return '$'.repeat(level || 1).padEnd(3, '·')
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
          <p className="text-gray-600 text-lg">Discovering perfect places for you...</p>
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
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-400 to-cyan-500 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-handwriting font-bold text-gray-800 mb-2">
            Mood-Matching Places
          </h1>
          <p className="text-gray-600">Find locations that resonate with how you feel</p>
        </motion.div>

        {/* Emotion Filter */}
        <div className="flex overflow-x-auto space-x-2 pb-2 mb-6 scrollbar-hide">
          {emotions.map((emotion) => (
            <button
              key={emotion.name}
              onClick={() => setSelectedEmotion(emotion.name)}
              className={`flex-shrink-0 px-4 py-2 rounded-full font-medium transition-all ${
                selectedEmotion === emotion.name
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="mr-2">{emotion.emoji}</span>
              {emotion.label}
            </button>
          ))}
        </div>
      </div>

      {/* Places List */}
      <div className="px-6 space-y-4">
        {places.map((place, index) => (
          <motion.div
            key={place.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-5 shadow-lg"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start space-x-3">
                <div className="text-4xl">{place.image}</div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-lg">{place.name}</h3>
                  <p className="text-gray-600 text-sm">{place.type}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1 rounded-full">
                  <span className="text-purple-700 font-bold text-sm">{place.match_score}% match</span>
                </div>
              </div>
            </div>

            <p className="text-gray-700 mb-3">{place.description}</p>

            {/* Emotion Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {place.emotion_tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium capitalize"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Navigation className="w-4 h-4 mr-2" />
                <span>{place.distance}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                <span>{place.hours.split(':')[0]}</span>
              </div>
              <div className="flex items-center">
                <Star className="w-4 h-4 mr-2 text-yellow-500" />
                <span>{place.rating} rating</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">💰</span>
                <span>{getPriceLevel(place.price_level)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-xl font-medium flex items-center justify-center space-x-2"
                onClick={() => toast.success(`Getting directions to ${place.name}...`)}
              >
                <Navigation className="w-4 h-4" />
                <span>Directions</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-white border-2 border-purple-500 text-purple-500 py-2 px-4 rounded-xl font-medium flex items-center justify-center space-x-2"
                onClick={() => toast.success(`Saved ${place.name} to favorites!`)}
              >
                <Heart className="w-4 h-4" />
                <span>Save</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 bg-gray-100 rounded-xl text-gray-600 hover:bg-gray-200"
                onClick={() => toast.success('Opening details...')}
              >
                <ExternalLink className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {places.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No places found</h3>
          <p className="text-gray-600">Try selecting a different emotion filter</p>
        </div>
      )}
    </div>
  )
}

export default Places