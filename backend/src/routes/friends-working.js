const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getDatabase, isUsingLocalDb } = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/friends
 * Get friend recommendations for the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id || 'demo-user';
    const { limit = 5, min_score = 0.2 } = req.query;

    logger.info(`Fetching friend recommendations for user ${userId}`, {
      limit: parseInt(limit),
      min_score: parseFloat(min_score)
    });

    const db = getDatabase();
    let recommendations = [];

    if (isUsingLocalDb()) {
      recommendations = await db.getFriendRecommendations(userId, parseInt(limit));
    } else {
      // PostgreSQL implementation would go here
      const result = await db.query(
        'SELECT * FROM get_friend_recommendations($1, $2, $3)',
        [userId, parseInt(limit), parseFloat(min_score)]
      );
      recommendations = result.rows;
    }

    // Transform recommendations to expected format
    const formattedRecommendations = recommendations.map(rec => ({
      user: {
        id: rec.user_id,
        display_name: rec.display_name,
        city: rec.city,
        age: rec.age,
        interests: rec.interests,
        avatar_color: rec.avatar_color || '#ff6b6b'
      },
      match_score: rec.match_score,
      compatibility: rec.match_score >= 0.8 ? 'High' : rec.match_score >= 0.6 ? 'Medium' : 'Low',
      reasoning: `Matched based on ${rec.city} location and shared interests`,
      breakdown: {
        location: 0.4,
        mood: 0.35,
        interests: 0.15,
        age: 0.1
      }
    }));

    res.json({
      success: true,
      recommendations: formattedRecommendations,
      total: formattedRecommendations.length,
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
    logger.error('Error fetching friend recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch friend recommendations'
    });
  }
});

/**
 * POST /api/friends/connect
 * Send a connection request to another user
 */
router.post('/connect', async (req, res) => {
  try {
    const userId = req.user?.id || 'demo-user';
    const { target_user_id, message } = req.body;

    if (!target_user_id) {
      return res.status(400).json({
        success: false,
        error: 'target_user_id is required'
      });
    }

    logger.info(`User ${userId} sending connection request to ${target_user_id}`);

    // For demo purposes, just return success
    const connectionRequest = {
      id: `conn_${Date.now()}`,
      from_user_id: userId,
      to_user_id: target_user_id,
      message: message || 'Hi! I found you through MindMate and thought we might connect.',
      status: 'pending',
      created_at: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Connection request sent successfully',
      connection_request: connectionRequest
    });

  } catch (error) {
    logger.error('Error sending connection request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send connection request'
    });
  }
});

/**
 * GET /api/friends/connections
 * Get user's connections and pending requests
 */
router.get('/connections', async (req, res) => {
  try {
    const userId = req.user?.id || 'demo-user';
    
    logger.info(`Fetching connections for user ${userId}`);

    // Demo data for connections
    const connections = [
      {
        id: 'conn_1',
        user: {
          id: 'user_1',
          display_name: 'Alex Chen',
          city: 'San Francisco',
          avatar_color: '#ff6b6b'
        },
        status: 'accepted',
        connected_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      }
    ];

    const pendingRequests = [
      {
        id: 'conn_2',
        user: {
          id: 'user_2',
          display_name: 'Sarah Johnson',
          city: 'San Francisco',
          avatar_color: '#4ecdc4'
        },
        status: 'pending',
        created_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      }
    ];

    res.json({
      success: true,
      connections,
      pending_requests: pendingRequests,
      totals: {
        connections: connections.length,
        pending: pendingRequests.length
      }
    });

  } catch (error) {
    logger.error('Error fetching connections:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch connections'
    });
  }
});

module.exports = router;