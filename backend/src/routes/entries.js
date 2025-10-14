const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const { authenticateToken } = require('../middleware/auth');
const { entry: entryLimiter } = require('../middleware/rateLimiter');
const emotionAnalysis = require('../services/emotionAnalysis');
const { getDatabase, isUsingLocalDb } = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

// Configure multer for audio file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/audio');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const extension = path.extname(file.originalname) || '.webm';
    cb(null, `voice_${uniqueId}_${Date.now()}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Allow audio files
    if (file.mimetype.startsWith('audio/') || 
        file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});

/**
 * POST /api/entries
 * Create a new daily entry with voice analysis
 */
router.post('/', authenticateToken, entryLimiter, upload.single('audio'), async (req, res) => {
  try {
    const { transcript, question_prompt, privacy_mode = false } = req.body;
    const userId = req.user.id;
    const audioFile = req.file;

    logger.info(`Creating new entry for user ${userId}`, {
      hasAudio: !!audioFile,
      hasTranscript: !!transcript,
      transcriptLength: transcript?.length || 0,
      transcriptPreview: transcript ? transcript.substring(0, 100) + '...' : '(empty)',
      privacyMode: privacy_mode
    });

    // Validate input
    if (!transcript && !audioFile) {
      return res.status(400).json({
        error: 'Either transcript or audio file is required'
      });
    }

    // Initialize analysis results
    let textAnalysis = null;
    let audioAnalysis = null;
    let finalAnalysis = null;

    // Analyze text if transcript provided
    if (transcript) {
      logger.info(`🤖 Calling AI emotion analysis for transcript: "${transcript.substring(0, 50)}..."`)
      textAnalysis = await emotionAnalysis.analyzeText(transcript);
      logger.info(`✅ AI emotion analysis completed:`, {
        emotion: textAnalysis.emotion,
        confidence: textAnalysis.confidence,
        reasoning: textAnalysis.reasoning?.substring(0, 100)
      })
    }

    // Analyze audio if file provided
    if (audioFile) {
      audioAnalysis = await emotionAnalysis.analyzeAudio(audioFile.path);
    }

    // Fuse results if both modalities available
    if (textAnalysis && audioAnalysis) {
      finalAnalysis = emotionAnalysis.fuseEmotionResults(textAnalysis, audioAnalysis);
    } else {
      finalAnalysis = textAnalysis || audioAnalysis;
    }

    // Generate supportive response
    const supportiveResponse = emotionAnalysis.generateSupportiveResponse(
      finalAnalysis.emotion,
      finalAnalysis.intensity
    );

    // Create entry data
    const entryData = {
      user_id: userId,
      emotion: finalAnalysis.emotion,
      intensity: finalAnalysis.intensity,
      confidence: finalAnalysis.confidence,
      transcript: privacy_mode ? null : transcript,
      audio_path: privacy_mode ? null : audioFile?.path,
      question_prompt,
      supportive_response: supportiveResponse,
      analysis_data: {
        text: textAnalysis,
        audio: audioAnalysis,
        final: finalAnalysis
      },
      privacy_mode
    };

    // Save to database
    const db = getDatabase();
    let entry;
    
    if (isUsingLocalDb()) {
      // Local file database
      entry = await db.createEntry(entryData);
    } else {
      // PostgreSQL
      const result = await db.query(
        `INSERT INTO entries (user_id, emotion, intensity, confidence, transcript, audio_path, question_prompt, supportive_response, analysis_data, privacy_mode)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [entryData.user_id, entryData.emotion, entryData.intensity, entryData.confidence, entryData.transcript, entryData.audio_path, entryData.question_prompt, JSON.stringify(entryData.supportive_response), JSON.stringify(entryData.analysis_data), entryData.privacy_mode]
      );
      entry = result.rows[0];
    }

    logger.info(`Entry created successfully: ${entry.id}`, {
      emotion: entry.emotion,
      intensity: entry.intensity,
      confidence: entry.confidence
    });

    // Return response
    res.status(201).json({
      success: true,
      entry: {
        id: entry.id,
        emotion: entry.emotion,
        intensity: entry.intensity,
        confidence: entry.confidence,
        supportive_response: entry.supportive_response,
        created_at: entry.created_at
      }
    });

  } catch (error) {
    logger.error('Entry creation failed:', error);

    // Clean up uploaded file if error occurred
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        logger.error('Failed to clean up uploaded file:', unlinkError);
      }
    }

    res.status(500).json({
      error: 'Failed to create entry',
      message: error.message
    });
  }
});

/**
 * GET /api/entries/:id
 * Get a specific entry by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const entryId = req.params.id;
    const userId = req.user.id;

    logger.info(`Fetching entry ${entryId} for user ${userId}`);

    // Fetch the actual entry from database
    const db = getDatabase();
    
    if (isUsingLocalDb()) {
      // Local file database
      const entry = await db.getEntry(entryId, userId);
      
      if (!entry) {
        return res.status(404).json({
          error: 'Entry not found'
        });
      }

      res.json({
        success: true,
        entry
      });
    } else {
      // PostgreSQL
      const result = await db.query(
        'SELECT * FROM entries WHERE id = $1 AND user_id = $2',
        [entryId, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Entry not found'
        });
      }

      res.json({
        success: true,
        entry: result.rows[0]
      });
    }

  } catch (error) {
    logger.error('Failed to fetch entry:', error);
    res.status(500).json({
      error: 'Failed to fetch entry',
      message: error.message
    });
  }
});

/**
 * DELETE /api/entries/:id
 * Delete a specific entry
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const entryId = req.params.id;
    const userId = req.user.id;

    logger.info(`Deleting entry ${entryId} for user ${userId}`);

    // TODO: Implement database deletion with user ownership check
    // Also delete associated audio file
    
    res.json({
      success: true,
      message: 'Entry deleted successfully'
    });

  } catch (error) {
    logger.error('Failed to delete entry:', error);
    res.status(500).json({
      error: 'Failed to delete entry',
      message: error.message
    });
  }
});

/**
 * GET /api/entries/stats/summary
 * Get emotion statistics for user
 */
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 7 } = req.query;

    logger.info(`Fetching emotion stats for user ${userId} (${days} days)`);

    // TODO: Implement database aggregation
    // For now, return mock stats
    const mockStats = {
      period_days: parseInt(days),
      total_entries: 12,
      emotion_breakdown: {
        happy: 5,
        calm: 3,
        neutral: 2,
        anxious: 1,
        sad: 1
      },
      average_intensity: 0.65,
      trend: 'improving', // 'improving', 'declining', 'stable'
      most_common_emotion: 'happy',
      streak: {
        current: 5,
        longest: 8
      }
    };

    res.json({
      success: true,
      stats: mockStats
    });

  } catch (error) {
    logger.error('Failed to fetch emotion stats:', error);
    res.status(500).json({
      error: 'Failed to fetch stats',
      message: error.message
    });
  }
});

/**
 * GET /api/entries
 * Get all entries for the authenticated user
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const db = getDatabase();

    logger.info(`Fetching all entries for user ${userId}`);

    let entries = [];
    if (isUsingLocalDb()) {
      entries = await db.getUserEntries(userId);
    } else {
      // PostgreSQL query
      const result = await db.query(
        'SELECT * FROM entries WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      entries = result.rows;
    }

    logger.info(`Retrieved ${entries.length} entries for user ${userId}`);

    res.json(entries);

  } catch (error) {
    logger.error('Failed to fetch entries:', error);
    res.status(500).json({
      error: 'Failed to fetch entries',
      message: error.message
    });
  }
});

/**
 * POST /api/entries/:id/feedback
 * Provide feedback on emotion analysis accuracy
 */
router.post('/:id/feedback', authenticateToken, async (req, res) => {
  try {
    const entryId = req.params.id;
    const userId = req.user.id;
    const { correct_emotion, feedback_type, comments } = req.body;

    logger.info(`Receiving feedback for entry ${entryId}`, {
      userId,
      correct_emotion,
      feedback_type
    });

    // TODO: Store feedback for model improvement
    
    res.json({
      success: true,
      message: 'Feedback recorded successfully'
    });

  } catch (error) {
    logger.error('Failed to record feedback:', error);
    res.status(500).json({
      error: 'Failed to record feedback',
      message: error.message
    });
  }
});

module.exports = router;