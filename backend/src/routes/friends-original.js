const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const friendMatchingService = require('../services/friendMatching');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/friends
 * Get friend recommendations for the authenticated user
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 5, min_score = 0.2 } = req.query;

    logger.info(`Fetching friend recommendations for user ${userId}`, {
      limit: parseInt(limit),
      min_score: parseFloat(min_score)
    });

    // TODO: Get user data from database
    // For now, using mock data
    const currentUser = {
      id: userId,
      display_name: 'Current User',
      city: 'San Francisco',
      age: 28,
      interests: ['hiking', 'music', 'reading', 'yoga']
    };

    // Generate mock potential friends
    const potentialFriends = friendMatchingService.generateMockFriends(20);
    
    // Generate mock entries for current user and friends
    const currentUserEntries = friendMatchingService.generateMockEntries(userId, 8);
    const allUserEntries = {};
    
    // Generate entries for each potential friend
    potentialFriends.forEach(friend => {
      allUserEntries[friend.id] = friendMatchingService.generateMockEntries(friend.id, 5);
    });

    // Find matches
    const matches = await friendMatchingService.findMatches(
      currentUser,
      potentialFriends,
      currentUserEntries,
      allUserEntries
    );

    // Filter by minimum score and limit results
    const filteredMatches = matches
      .filter(match => match.score >= parseFloat(min_score))
      .slice(0, parseInt(limit));

    // Format response
    const friendRecommendations = filteredMatches.map(match => ({
      user: {
        id: match.user.id,
        display_name: match.user.display_name,
        city: match.user.city,
        age: match.user.age,
        interests: match.user.interests,
        avatar_color: match.user.avatar_color,
        last_active: match.user.last_active
      },
      match_score: match.score,
      compatibility: match.compatibility,
      reasoning: match.reasoning,
      breakdown: {
        location: match.breakdown.location,
        mood: match.breakdown.mood,
        interests: match.breakdown.interests,
        overall: match.score
      },
      suggested_action: generateSuggestedAction(match)
    }));

    logger.info(`Generated ${friendRecommendations.length} friend recommendations`, {
      userId,
      averageScore: friendRecommendations.reduce((sum, r) => sum + r.match_score, 0) / friendRecommendations.length
    });

    res.json({
      success: true,
      recommendations: friendRecommendations,
      metadata: {
        total_evaluated: potentialFriends.length,
        returned: friendRecommendations.length,
        min_score_filter: parseFloat(min_score),
        generated_at: new Date()
      }
    });

  } catch (error) {
    logger.error('Failed to fetch friend recommendations:', error);
    res.status(500).json({
      error: 'Failed to fetch friend recommendations',
      message: error.message
    });
  }
});

/**
 * GET /api/friends/nearby
 * Get friends in the same city
 */
router.get('/nearby', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { city, radius = 25 } = req.query;

    logger.info(`Fetching nearby friends for user ${userId}`, { city, radius });

    // TODO: Implement location-based query
    // For now, filter mock friends by city
    const mockFriends = friendMatchingService.generateMockFriends(15);
    const userCity = city || 'San Francisco'; // Default or from user profile

    const nearbyFriends = mockFriends
      .filter(friend => friend.city.toLowerCase() === userCity.toLowerCase())
      .slice(0, 10)
      .map(friend => ({
        ...friend,
        distance: Math.floor(Math.random() * parseInt(radius)), // Mock distance
        online_status: Math.random() > 0.7 ? 'online' : 'offline'
      }));

    res.json({
      success: true,
      nearby_friends: nearbyFriends,
      search_location: userCity,
      radius_km: parseInt(radius)
    });

  } catch (error) {
    logger.error('Failed to fetch nearby friends:', error);
    res.status(500).json({
      error: 'Failed to fetch nearby friends',
      message: error.message
    });
  }
});

/**
 * POST /api/friends/connect
 * Send a connection request to another user
 */
router.post('/connect', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { target_user_id, message } = req.body;

    if (!target_user_id) {
      return res.status(400).json({
        error: 'target_user_id is required'
      });
    }

    logger.info(`Connection request from ${userId} to ${target_user_id}`, {
      hasMessage: !!message
    });

    // TODO: Implement connection request logic
    // - Check if connection already exists
    // - Create connection request record
    // - Send notification to target user

    // For now, simulate successful connection request
    const connectionRequest = {
      id: `conn_${Date.now()}`,
      from_user_id: userId,
      to_user_id: target_user_id,
      message: message || 'Hi! I found you through MindMate and thought we might connect.',
      status: 'pending',
      created_at: new Date()
    };

    res.status(201).json({
      success: true,
      connection_request: connectionRequest,
      message: 'Connection request sent successfully'
    });

  } catch (error) {
    logger.error('Failed to send connection request:', error);
    res.status(500).json({
      error: 'Failed to send connection request',
      message: error.message
    });
  }
});

/**
 * GET /api/friends/requests
 * Get pending connection requests
 */
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = 'received' } = req.query; // 'received' or 'sent'

    logger.info(`Fetching ${type} connection requests for user ${userId}`);

    // TODO: Implement database query for connection requests
    // For now, return mock data
    const mockRequests = [
      {
        id: 'req_1',
        from_user: {
          id: 'user_123',
          display_name: 'Alex Chen',
          city: 'San Francisco',
          avatar_color: '#4ECDC4'
        },
        to_user_id: userId,
        message: 'Hi! I noticed we have similar moods lately. Would love to connect!',
        status: 'pending',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      }
    ];

    res.json({
      success: true,
      requests: mockRequests,
      type
    });

  } catch (error) {
    logger.error('Failed to fetch connection requests:', error);
    res.status(500).json({
      error: 'Failed to fetch connection requests',
      message: error.message
    });
  }
});

/**
 * PUT /api/friends/requests/:id
 * Respond to a connection request
 */
router.put('/requests/:id', authenticateToken, async (req, res) => {
  try {
    const requestId = req.params.id;
    const userId = req.user.id;
    const { action } = req.body; // 'accept' or 'decline'

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({
        error: 'Action must be either "accept" or "decline"'
      });
    }

    logger.info(`${action}ing connection request ${requestId} for user ${userId}`);

    // TODO: Implement connection request response logic
    // - Verify user has permission to respond to this request
    // - Update request status
    // - If accepted, create friendship record

    res.json({
      success: true,
      message: `Connection request ${action}ed successfully`,
      action
    });

  } catch (error) {
    logger.error('Failed to respond to connection request:', error);
    res.status(500).json({
      error: 'Failed to respond to connection request',
      message: error.message
    });
  }
});

/**
 * GET /api/friends/connections
 * Get user's established connections/friendships
 */
router.get('/connections', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    logger.info(`Fetching connections for user ${userId}`);

    // TODO: Implement database query for user's friends
    // For now, return mock connections
    const mockConnections = [
      {
        id: 'conn_1',
        friend: {
          id: 'user_456',
          display_name: 'Sam Rivera',
          city: 'San Francisco',
          avatar_color: '#FF6B6B',
          last_active: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
        },
        connected_since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        last_interaction: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        mood_compatibility: 0.85
      }
    ];

    res.json({
      success: true,
      connections: mockConnections,
      total: mockConnections.length
    });

  } catch (error) {
    logger.error('Failed to fetch connections:', error);
    res.status(500).json({
      error: 'Failed to fetch connections',
      message: error.message
    });
  }
});

/**
 * Generate suggested action for a friend match
 * @param {Object} match - Friend match object
 * @returns {Object} Suggested action
 */
function generateSuggestedAction(match) {
  const score = match.score;
  const reasoning = match.reasoning.toLowerCase();

  if (score >= 0.8) {
    return {
      type: 'high_priority_connect',
      title: 'Send a warm message',
      description: `This looks like an excellent match! Consider sharing something about ${getSharedInterest(match.breakdown)}.`,
      urgency: 'high'
    };
  } else if (score >= 0.6) {
    return {
      type: 'connect',
      title: 'Reach out',
      description: `You both ${reasoning}. This could be a great connection!`,
      urgency: 'medium'
    };
  } else if (score >= 0.4) {
    return {
      type: 'low_priority_connect',
      title: 'Consider connecting',
      description: `There's some compatibility here. Maybe send a friendly hello?`,
      urgency: 'low'
    };
  } else {
    return {
      type: 'observe',
      title: 'Keep an eye on this person',
      description: 'Limited compatibility right now, but people change!',
      urgency: 'low'
    };
  }
}

/**
 * Get shared interest based on match breakdown
 * @param {Object} breakdown - Match score breakdown
 * @returns {string} Shared interest description
 */
function getSharedInterest(breakdown) {
  if (breakdown.interests > 0.5) {
    return 'your shared interests';
  } else if (breakdown.mood > 0.6) {
    return 'your similar emotional patterns';
  } else if (breakdown.location > 0.8) {
    return 'being in the same city';
  } else {
    return 'your potential compatibility';
  }
}

module.exports = router;