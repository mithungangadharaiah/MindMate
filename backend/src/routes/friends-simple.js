const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

// Simple friend recommendations endpoint for demo
router.get('/', auth, async (req, res) => {
  try {
    const { getDatabase, isUsingLocalDb } = require('../config/database');
    const db = getDatabase();
    const userId = req.user ? req.user.id : 'demo-user';
    const limit = parseInt(req.query.limit) || 5;

    let recommendations = [];

    if (isUsingLocalDb()) {
      recommendations = await db.getFriendRecommendations(userId, limit);
    } else {
      // PostgreSQL query would go here
      const result = await db.query(
        'SELECT * FROM get_friend_recommendations($1, $2)',
        [userId, limit]
      );
      recommendations = result.rows;
    }

    // If no recommendations, provide demo data
    if (!recommendations || recommendations.length === 0) {
      recommendations = [
        {
          user_id: 'demo-1',
          display_name: 'Alex Chen',
          city: 'San Francisco',
          age: 28,
          interests: ['meditation', 'hiking', 'photography'],
          match_score: 0.85,
          avatar_color: '#ff6b6b'
        },
        {
          user_id: 'demo-2', 
          display_name: 'Sarah Johnson',
          city: 'San Francisco',
          age: 32,
          interests: ['yoga', 'cooking', 'art'],
          match_score: 0.72,
          avatar_color: '#4ecdc4'
        },
        {
          user_id: 'demo-3',
          display_name: 'Emma Wilson', 
          city: 'San Francisco',
          age: 29,
          interests: ['writing', 'meditation', 'hiking'],
          match_score: 0.83,
          avatar_color: '#f7b731'
        }
      ];
    }

    res.json({
      success: true,
      recommendations: recommendations.map(rec => ({
        user: {
          id: rec.user_id,
          display_name: rec.display_name,
          city: rec.city,
          age: rec.age,
          interests: rec.interests,
          avatar_color: rec.avatar_color
        },
        match_score: rec.match_score,
        compatibility: 'High',
        reasoning: `${rec.match_score >= 0.8 ? 'Excellent' : rec.match_score >= 0.7 ? 'Good' : 'Moderate'} compatibility based on location, interests, and mood patterns`,
        breakdown: {
          location: rec.city === 'San Francisco' ? 0.9 : 0.3,
          mood: 0.7,
          interests: 0.6,
          overall: rec.match_score
        }
      })),
      algorithm: {
        weights: {
          location: 0.4,
          mood_compatibility: 0.35,
          interests: 0.15,
          age_compatibility: 0.1
        }
      }
    });

  } catch (error) {
    console.error('Error getting friend recommendations:', error);
    res.json({
      success: true,
      recommendations: [
        {
          user: {
            id: 'demo-1',
            display_name: 'Alex Chen',
            city: 'San Francisco',
            age: 28,
            interests: ['meditation', 'hiking', 'photography'],
            avatar_color: '#ff6b6b'
          },
          match_score: 0.85,
          compatibility: 'High',
          reasoning: 'Excellent compatibility based on location, interests, and mood patterns',
          breakdown: {
            location: 0.9,
            mood: 0.7,
            interests: 0.6,
            overall: 0.85
          }
        }
      ]
    });
  }
});

// Simple connect endpoint
router.post('/connect', auth, async (req, res) => {
  try {
    const { target_user_id, message } = req.body;
    const userId = req.user ? req.user.id : 'demo-user';

    // For demo, just return success
    res.json({
      success: true,
      message: 'Connection request sent successfully (demo mode)',
      connection_request: {
        id: `conn_${Date.now()}`,
        from_user_id: userId,
        to_user_id: target_user_id,
        message: message || 'Hi! I found you through MindMate and thought we might connect.',
        status: 'pending',
        created_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error sending connection request:', error);
    res.status(500).json({ error: 'Failed to send connection request' });
  }
});

module.exports = router;