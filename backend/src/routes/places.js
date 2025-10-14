const express = require('express');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { getDatabase, isUsingLocalDb } = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/places
 * Get mood-matched places for the user
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { mood, city, radius = 25, limit = 10 } = req.query;
    const userId = req.user?.id;

    if (!mood) {
      return res.status(400).json({
        error: 'mood parameter is required'
      });
    }

    logger.info(`Fetching mood-matched places`, {
      mood,
      city,
      radius: parseInt(radius),
      userId
    });

    // Mock places data with mood matching
    const moodPlaces = generateMoodMatchedPlaces(mood, city || 'San Francisco');
    
    // Sort by mood match score and limit results
    const sortedPlaces = moodPlaces
      .sort((a, b) => b.mood_match_score - a.mood_match_score)
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      places: sortedPlaces,
      metadata: {
        mood,
        city: city || 'San Francisco',
        radius_km: parseInt(radius),
        total_found: sortedPlaces.length,
        generated_at: new Date()
      }
    });

  } catch (error) {
    logger.error('Failed to fetch mood-matched places:', error);
    res.status(500).json({
      error: 'Failed to fetch places',
      message: error.message
    });
  }
});

/**
 * GET /api/places/categories
 * Get available place categories for mood matching
 */
router.get('/categories', (req, res) => {
  try {
    const categories = {
      happy: [
        'parks', 'cafes', 'events', 'social_venues', 'outdoor_activities',
        'entertainment', 'festivals', 'community_centers'
      ],
      sad: [
        'quiet_cafes', 'libraries', 'gardens', 'museums', 'nature_spots',
        'bookstores', 'art_galleries', 'peaceful_places'
      ],
      anxious: [
        'meditation_centers', 'yoga_studios', 'quiet_parks', 'libraries',
        'low_key_cafes', 'nature_trails', 'wellness_centers', 'calm_spaces'
      ],
      angry: [
        'gyms', 'sports_facilities', 'hiking_trails', 'rock_climbing',
        'martial_arts', 'running_tracks', 'boxing_gyms', 'physical_activities'
      ],
      calm: [
        'gardens', 'meditation_centers', 'quiet_beaches', 'nature_preserves',
        'tea_houses', 'zen_gardens', 'peaceful_cafes', 'scenic_spots'
      ],
      neutral: [
        'cafes', 'bookstores', 'casual_restaurants', 'local_shops',
        'community_spaces', 'regular_activities', 'everyday_places'
      ]
    };

    res.json({
      success: true,
      categories
    });

  } catch (error) {
    logger.error('Failed to fetch place categories:', error);
    res.status(500).json({
      error: 'Failed to fetch categories',
      message: error.message
    });
  }
});

/**
 * GET /api/places/:id
 * Get detailed information about a specific place
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const placeId = req.params.id;
    const userId = req.user?.id;

    logger.info(`Fetching place details for ${placeId}`, { userId });

    // TODO: Implement database/API lookup for place details
    // For now, return mock detailed place data
    const mockPlace = {
      id: placeId,
      name: 'Golden Gate Park',
      type: 'park',
      address: '501 Stanyan St, San Francisco, CA 94117',
      city: 'San Francisco',
      coordinates: {
        lat: 37.7694,
        lng: -122.4862
      },
      description: 'A large urban park with gardens, trails, and peaceful spots perfect for reflection.',
      mood_tags: ['calm', 'happy', 'peaceful'],
      mood_match_reasons: {
        calm: 'Wide open spaces and peaceful gardens provide a tranquil environment',
        happy: 'Beautiful scenery and recreational activities lift spirits',
        sad: 'Quiet benches and natural beauty offer comfort and solitude'
      },
      rating: 4.6,
      price_level: 1, // 1-4 scale
      photos: [
        'https://example.com/photo1.jpg',
        'https://example.com/photo2.jpg'
      ],
      opening_hours: {
        monday: '5:00 AM - 10:00 PM',
        tuesday: '5:00 AM - 10:00 PM',
        wednesday: '5:00 AM - 10:00 PM',
        thursday: '5:00 AM - 10:00 PM',
        friday: '5:00 AM - 10:00 PM',
        saturday: '5:00 AM - 10:00 PM',
        sunday: '5:00 AM - 10:00 PM'
      },
      contact: {
        phone: '+1 (415) 831-2700',
        website: 'https://sfrecpark.org/destination/golden-gate-park/'
      },
      amenities: ['parking', 'restrooms', 'wheelchair_accessible', 'free_entry'],
      distance_km: 2.5,
      estimated_visit_time: '1-3 hours'
    };

    res.json({
      success: true,
      place: mockPlace
    });

  } catch (error) {
    logger.error('Failed to fetch place details:', error);
    res.status(500).json({
      error: 'Failed to fetch place details',
      message: error.message
    });
  }
});

/**
 * POST /api/places/:id/visit
 * Mark a place as visited and optionally rate the mood match
 */
router.post('/:id/visit', authenticateToken, async (req, res) => {
  try {
    const placeId = req.params.id;
    const userId = req.user.id;
    const { mood_match_rating, notes, visited_at } = req.body;

    logger.info(`Recording place visit`, {
      placeId,
      userId,
      mood_match_rating
    });

    // TODO: Store visit record in database
    const visitRecord = {
      id: `visit_${Date.now()}`,
      user_id: userId,
      place_id: placeId,
      mood_match_rating: mood_match_rating || null,
      notes: notes || null,
      visited_at: visited_at ? new Date(visited_at) : new Date(),
      created_at: new Date()
    };

    res.status(201).json({
      success: true,
      visit: visitRecord,
      message: 'Visit recorded successfully'
    });

  } catch (error) {
    logger.error('Failed to record place visit:', error);
    res.status(500).json({
      error: 'Failed to record visit',
      message: error.message
    });
  }
});

/**
 * GET /api/places/user/history
 * Get user's place visit history
 */
router.get('/user/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    logger.info(`Fetching place visit history for user ${userId}`);

    // TODO: Implement database query for user's visit history
    // For now, return mock data
    const mockHistory = [
      {
        id: 'visit_1',
        place: {
          id: 'place_1',
          name: 'Golden Gate Park',
          type: 'park',
          city: 'San Francisco'
        },
        mood_at_visit: 'calm',
        mood_match_rating: 4.5,
        notes: 'Perfect for a peaceful afternoon walk',
        visited_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      }
    ];

    res.json({
      success: true,
      history: mockHistory,
      pagination: {
        total: mockHistory.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: false
      }
    });

  } catch (error) {
    logger.error('Failed to fetch place visit history:', error);
    res.status(500).json({
      error: 'Failed to fetch history',
      message: error.message
    });
  }
});

/**
 * Generate mood-matched places for demo/mock purposes
 * @param {string} mood - User's current mood
 * @param {string} city - User's city
 * @returns {Array} Array of mood-matched places
 */
function generateMoodMatchedPlaces(mood, city) {
  const basePlaces = {
    'San Francisco': [
      {
        name: 'Golden Gate Park',
        type: 'park',
        address: '501 Stanyan St, San Francisco, CA',
        rating: 4.6,
        distance_km: 2.5,
        price_level: 1
      },
      {
        name: 'Dolores Park',
        type: 'park',
        address: '19th St & Dolores St, San Francisco, CA',
        rating: 4.4,
        distance_km: 1.8,
        price_level: 1
      },
      {
        name: 'SF Museum of Modern Art',
        type: 'museum',
        address: '151 3rd St, San Francisco, CA',
        rating: 4.5,
        distance_km: 3.2,
        price_level: 3
      },
      {
        name: 'Crissy Field',
        type: 'beach_park',
        address: '1199 E Beach, San Francisco, CA',
        rating: 4.7,
        distance_km: 4.1,
        price_level: 1
      },
      {
        name: 'Blue Bottle Coffee',
        type: 'cafe',
        address: '66 Mint St, San Francisco, CA',
        rating: 4.3,
        distance_km: 1.2,
        price_level: 2
      }
    ]
  };

  const moodReasons = {
    happy: {
      park: 'Great open spaces for celebrating your good mood with nature',
      cafe: 'Vibrant atmosphere perfect for your positive energy',
      museum: 'Inspiring art to amplify your joyful state',
      beach_park: 'Beautiful views to match your bright outlook'
    },
    sad: {
      park: 'Peaceful green spaces for quiet reflection and healing',
      cafe: 'Gentle, warm environment for comfort and solitude',
      museum: 'Quiet, contemplative spaces for processing emotions',
      beach_park: 'Soothing natural sounds and open horizon for perspective'
    },
    anxious: {
      park: 'Calming nature setting to help ground your thoughts',
      cafe: 'Cozy, low-key atmosphere to ease your mind',
      museum: 'Focused, quiet environment to redirect anxious energy',
      beach_park: 'Wide open spaces to help you breathe and relax'
    },
    angry: {
      park: 'Space to walk and release tension in nature',
      cafe: 'Neutral environment to cool down and regroup',
      museum: 'Structured, calm setting to channel intense feelings',
      beach_park: 'Open area for physical movement and fresh air'
    },
    calm: {
      park: 'Serene natural setting that matches your peaceful state',
      cafe: 'Tranquil spot to maintain your sense of balance',
      museum: 'Quiet, meditative environment for continued reflection',
      beach_park: 'Harmonious natural beauty to deepen your calm'
    },
    neutral: {
      park: 'Pleasant outdoor space for a nice change of scenery',
      cafe: 'Comfortable spot for a regular break in your day',
      museum: 'Interesting cultural experience to engage your mind',
      beach_park: 'Beautiful location for a standard outdoor activity'
    }
  };

  const places = basePlaces[city] || basePlaces['San Francisco'];
  
  return places.map((place, index) => {
    const moodScore = calculateMoodScore(mood, place.type);
    const reason = moodReasons[mood]?.[place.type] || moodReasons.neutral[place.type];
    
    return {
      id: `place_${city.toLowerCase().replace(' ', '_')}_${index + 1}`,
      ...place,
      city,
      mood_match_score: moodScore,
      mood_match_reason: reason,
      mood_tags: getMoodTags(place.type),
      estimated_visit_time: getEstimatedVisitTime(place.type),
      best_time_to_visit: getBestTimeForMood(mood),
      coordinates: {
        lat: 37.7749 + (Math.random() - 0.5) * 0.1,
        lng: -122.4194 + (Math.random() - 0.5) * 0.1
      }
    };
  });
}

/**
 * Calculate mood match score for a place type
 * @param {string} mood - User's mood
 * @param {string} placeType - Type of place
 * @returns {number} Score between 0 and 1
 */
function calculateMoodScore(mood, placeType) {
  const moodPlaceScores = {
    happy: { park: 0.9, cafe: 0.8, museum: 0.7, beach_park: 0.95 },
    sad: { park: 0.8, cafe: 0.85, museum: 0.9, beach_park: 0.7 },
    anxious: { park: 0.85, cafe: 0.6, museum: 0.8, beach_park: 0.9 },
    angry: { park: 0.7, cafe: 0.4, museum: 0.6, beach_park: 0.8 },
    calm: { park: 0.95, cafe: 0.8, museum: 0.9, beach_park: 0.9 },
    neutral: { park: 0.7, cafe: 0.7, museum: 0.7, beach_park: 0.7 }
  };

  return moodPlaceScores[mood]?.[placeType] || 0.5;
}

/**
 * Get mood tags for a place type
 * @param {string} placeType - Type of place
 * @returns {Array} Mood tags
 */
function getMoodTags(placeType) {
  const typeTags = {
    park: ['calm', 'happy', 'peaceful'],
    cafe: ['social', 'cozy', 'comfortable'],
    museum: ['contemplative', 'inspiring', 'quiet'],
    beach_park: ['refreshing', 'spacious', 'natural']
  };

  return typeTags[placeType] || ['general'];
}

/**
 * Get estimated visit time for place type
 * @param {string} placeType - Type of place
 * @returns {string} Visit time estimate
 */
function getEstimatedVisitTime(placeType) {
  const visitTimes = {
    park: '1-2 hours',
    cafe: '30-60 minutes',
    museum: '2-3 hours',
    beach_park: '1-3 hours'
  };

  return visitTimes[placeType] || '1-2 hours';
}

/**
 * Get best time recommendation based on mood
 * @param {string} mood - User's mood
 * @returns {string} Time recommendation
 */
function getBestTimeForMood(mood) {
  const moodTimes = {
    happy: 'Anytime is perfect when you\'re feeling good!',
    sad: 'Mid-morning or early afternoon for gentle sunlight',
    anxious: 'Early morning or late afternoon when it\'s quieter',
    angry: 'Late morning when you have energy to channel',
    calm: 'Early morning or sunset for peaceful ambiance',
    neutral: 'Anytime that fits your schedule'
  };

  return moodTimes[mood] || moodTimes.neutral;
}

module.exports = router;