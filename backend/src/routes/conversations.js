/**
 * Conversation Routes
 * Handles multi-turn interactive Q&A sessions
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const conversationFlow = require('../services/conversationFlow');
const emotionAnalysis = require('../services/emotionAnalysis');
const sessionCompletion = require('../services/sessionCompletion');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// In-memory storage for active conversations (in production, use database)
const activeConversations = new Map();

/**
 * Helper: Get user location from IP address
 */
async function getUserLocation(req) {
  try {
    // Get IP address (handle localhost and proxies)
    let ip = req.ip || req.connection.remoteAddress;
    
    // Clean IPv6 localhost
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
      ip = '127.0.0.1';
    }
    
    // Remove IPv6 prefix
    if (ip.startsWith('::ffff:')) {
      ip = ip.substring(7);
    }

    logger.info('🌍 Detecting user location...', { 
      originalIp: req.ip,
      cleanedIp: ip,
      isLocalhost: ip === '127.0.0.1' || ip === 'localhost'
    });

    // For localhost/development, return a default location (Bangalore for testing)
    if (ip === '127.0.0.1' || ip === 'localhost') {
      const defaultLocation = {
        ip: '127.0.0.1',
        city: 'Bangalore',
        region: 'Karnataka',
        country: 'India',
        latitude: 12.9716,
        longitude: 77.5946,
        timezone: 'Asia/Kolkata',
        isDevelopment: true
      };
      
      logger.info('🏠 Using default development location (Bangalore)', defaultLocation);
      return defaultLocation;
    }

    // Use ip-api.com for free IP geolocation
    const response = await axios.get(`http://ip-api.com/json/${ip}`, {
      timeout: 3000
    });

    if (response.data.status === 'success') {
      const location = {
        ip: ip,
        city: response.data.city,
        region: response.data.regionName,
        country: response.data.country,
        latitude: response.data.lat,
        longitude: response.data.lon,
        timezone: response.data.timezone,
        isp: response.data.isp,
        isDevelopment: false
      };

      logger.info('✅ User location detected', location);
      return location;
    } else {
      logger.warn('⚠️ IP geolocation failed, using fallback', { 
        ip, 
        response: response.data 
      });
      return null;
    }

  } catch (error) {
    logger.error('❌ Failed to get user location', { 
      error: error.message,
      stack: error.stack
    });
    return null;
  }
}

/**
 * POST /api/conversations/start
 * Start a new interactive conversation session
 */
router.post('/start', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = uuidv4();

    // Create conversation session
    const conversation = {
      id: conversationId,
      userId,
      startTime: new Date(),
      qaHistory: [],
      currentQuestionNumber: 1,
      status: 'active'
    };

    activeConversations.set(conversationId, conversation);

    // Get initial question
    const initialQuestion = conversationFlow.getInitialQuestion();

    logger.info(`Started conversation ${conversationId} for user ${userId}`);

    res.json({
      success: true,
      conversationId,
      question: initialQuestion,
      questionNumber: 1,
      totalQuestions: 5
    });

  } catch (error) {
    logger.error('Failed to start conversation:', error);
    res.status(500).json({
      error: 'Failed to start conversation',
      message: error.message
    });
  }
});

/**
 * POST /api/conversations/:id/respond
 * Submit a response and get the next question
 */
router.post('/:id/respond', authenticateToken, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user.id;
    const { transcript, audioBlob } = req.body;

    // Get conversation
    const conversation = activeConversations.get(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found'
      });
    }

    if (conversation.userId !== userId) {
      return res.status(403).json({
        error: 'Unauthorized'
      });
    }

    // Analyze emotion from transcript
    logger.info(`Analyzing response ${conversation.currentQuestionNumber} for conversation ${conversationId}`);
    const emotionResult = await emotionAnalysis.analyzeText(transcript);

    // Store Q&A pair
    const qa = {
      questionNumber: conversation.currentQuestionNumber,
      question: conversation.qaHistory.length === 0 
        ? conversationFlow.getInitialQuestion() 
        : conversation.qaHistory[conversation.qaHistory.length - 1].nextQuestion,
      answer: transcript,
      emotion: emotionResult.emotion,
      intensity: emotionResult.intensity,
      confidence: emotionResult.confidence,
      timestamp: new Date()
    };

    conversation.qaHistory.push(qa);
    conversation.currentQuestionNumber++;

    // Determine if conversation is complete
    if (conversation.currentQuestionNumber > 5) {
      // Conversation complete
      conversation.status = 'complete';
      conversation.endTime = new Date();

      // 🌍 Get user location for personalized place recommendations
      const userLocation = await getUserLocation(req);

      // Generate summary
      const summary = conversationFlow.summarizeConversation(conversation.qaHistory);
      
      // 🎯 Generate comprehensive session completion with recommendations (now async with location)
      logger.info('🎯 Generating session completion report...', {
        conversationId,
        qaCount: conversation.qaHistory.length,
        hasLocation: !!userLocation,
        location: userLocation ? `${userLocation.city}, ${userLocation.country}` : 'Unknown'
      });
      
      const sessionReport = await sessionCompletion.generateSessionCompletion(
        conversation.qaHistory, 
        userLocation
      );

      logger.info(`✅ Session completion report generated for ${conversationId}`, {
        qaCount: conversation.qaHistory.length,
        dominantEmotion: summary.dominantEmotion,
        wellnessScore: sessionReport.wellnessScore,
        placesRecommended: sessionReport.places?.length || 0,
        userCity: userLocation?.city || 'Unknown'
      });

      res.json({
        success: true,
        complete: true,
        summary: {
          ...summary,
          conversationId,
          duration: Math.round((conversation.endTime - conversation.startTime) / 1000) // seconds
        },
        emotion: emotionResult,
        // 🌟 Add comprehensive recommendations
        sessionReport: {
          wellnessScore: sessionReport.wellnessScore,
          wellnessMessage: sessionReport.wellnessMessage,
          wellnessColor: sessionReport.wellnessColor,
          encouragement: sessionReport.encouragement,
          recommendations: sessionReport.recommendations,
          placesToVisit: sessionReport.places,
          communities: sessionReport.communities
        }
      });

      // Clean up after a delay
      setTimeout(() => {
        activeConversations.delete(conversationId);
      }, 60000); // Delete after 1 minute

    } else {
      // 🔥 AI-POWERED: Generate next question using Gemini AI
      const isLastQuestion = conversation.currentQuestionNumber >= 5;
      
      logger.info(`Generating AI-powered ${isLastQuestion ? 'closing' : 'follow-up'} question ${conversation.currentQuestionNumber} for conversation ${conversationId}`);
      
      const nextQuestion = await conversationFlow.generateAIFollowUp(
        conversation.qaHistory,
        emotionResult.emotion,
        isLastQuestion
      );

      // Store next question reference
      qa.nextQuestion = nextQuestion;

      logger.info(`✅ AI Question: "${nextQuestion}"`);

      res.json({
        success: true,
        complete: false,
        question: nextQuestion,
        questionNumber: conversation.currentQuestionNumber,
        totalQuestions: 5,
        emotion: emotionResult
      });
    }

  } catch (error) {
    logger.error('Failed to process conversation response:', error);
    res.status(500).json({
      error: 'Failed to process response',
      message: error.message
    });
  }
});

/**
 * GET /api/conversations/:id
 * Get conversation details
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user.id;

    const conversation = activeConversations.get(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found'
      });
    }

    if (conversation.userId !== userId) {
      return res.status(403).json({
        error: 'Unauthorized'
      });
    }

    res.json({
      success: true,
      conversation: {
        id: conversation.id,
        status: conversation.status,
        questionNumber: conversation.currentQuestionNumber,
        totalQuestions: 5,
        qaHistory: conversation.qaHistory
      }
    });

  } catch (error) {
    logger.error('Failed to get conversation:', error);
    res.status(500).json({
      error: 'Failed to get conversation',
      message: error.message
    });
  }
});

module.exports = router;
