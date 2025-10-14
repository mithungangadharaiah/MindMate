const natural = require('natural');
const sentiment = require('sentiment');
const logger = require('../utils/logger');

/**
 * MindMate AI-Powered Emotion Detection Service
 * 
 * This service uses AI (OpenAI/Anthropic) to analyze emotional tone
 * from voice transcripts, providing nuanced and context-aware emotion detection.
 */

class EmotionAnalysisService {
  constructor() {
    this.sentimentAnalyzer = new sentiment();
    this.tokenizer = new natural.WordTokenizer();
    this.useAI = !!(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
    
    // Determine which AI provider is configured
    let aiProvider = 'none';
    if (process.env.GEMINI_API_KEY) aiProvider = 'Google Gemini';
    else if (process.env.OPENAI_API_KEY) aiProvider = 'OpenAI';
    else if (process.env.ANTHROPIC_API_KEY) aiProvider = 'Anthropic';
    
    logger.info('Emotion Analysis Service initialized', {
      mode: this.useAI ? 'AI-powered' : 'keyword-based fallback',
      provider: aiProvider
    });
  }

  /**
   * Analyze text using AI for emotional content
   * @param {string} text - The text to analyze
   * @returns {Object} Emotion analysis result
   */
  async analyzeText(text) {
    try {
      if (!text || typeof text !== 'string') {
        throw new Error('Invalid text input for emotion analysis');
      }

      // If AI is available, use it
      if (this.useAI) {
        return await this.analyzeTextWithAI(text);
      }

      // Fallback to keyword-based analysis
      return await this.analyzeTextWithKeywords(text);

    } catch (error) {
      logger.error('Text emotion analysis failed:', error);
      throw new Error(`Text emotion analysis failed: ${error.message}`);
    }
  }

  /**
   * AI-powered emotion analysis using OpenAI or Anthropic
   * @param {string} text - The transcript to analyze
   * @returns {Object} Emotion analysis result
   */
  async analyzeTextWithAI(text) {
    try {
      const prompt = `You are an empathetic AI emotion analyzer for a mental wellness app called MindMate. 

Analyze the following voice transcript and determine the speaker's emotional state.

Transcript: "${text}"

You must respond with a valid JSON object (no markdown, no code blocks) in this exact format:
{
  "emotion": "<one of: happy, sad, anxious, calm, angry, neutral, excited, peaceful>",
  "intensity": <number between 0.0 and 1.0>,
  "confidence": <number between 0.0 and 1.0>,
  "reasoning": "<brief explanation of why you chose this emotion>",
  "tone_indicators": ["<key phrases or words that influenced your decision>"]
}

Consider:
- The overall emotional tone and context
- Subtle cues like "I'm not feeling great" means sad/down, not neutral
- Words like "unhappy", "terrible", "awful" indicate negative emotions
- The speaker's choice of words and phrasing
- Any contradictions or mixed emotions (choose the dominant one)

Respond ONLY with the JSON object, nothing else.`;

      let result;

      // Try Gemini first (if available)
      if (process.env.GEMINI_API_KEY) {
        result = await this.callGemini(prompt);
      }
      // Try OpenAI as fallback
      else if (process.env.OPENAI_API_KEY) {
        result = await this.callOpenAI(prompt);
      } 
      // Try Anthropic as last resort
      else if (process.env.ANTHROPIC_API_KEY) {
        result = await this.callAnthropic(prompt);
      }
      else {
        throw new Error('No AI API key configured');
      }

      logger.info(`AI emotion analysis completed: ${result.emotion} (${result.intensity})`, {
        textPreview: text.substring(0, 50) + '...',
        emotion: result.emotion,
        confidence: result.confidence,
        reasoning: result.reasoning
      });

      return {
        emotion: result.emotion,
        intensity: parseFloat(result.intensity.toFixed(2)),
        confidence: parseFloat(result.confidence.toFixed(2)),
        sentiment: {
          score: 0,
          comparative: 0,
          positive: [],
          negative: []
        },
        ai_analysis: {
          reasoning: result.reasoning,
          tone_indicators: result.tone_indicators
        },
        metadata: {
          textLength: text.length,
          analysis_method: 'ai_powered',
          model: process.env.GEMINI_API_KEY ? 'gemini' : process.env.OPENAI_API_KEY ? 'openai' : 'anthropic'
        }
      };

    } catch (error) {
      logger.error('AI emotion analysis failed, falling back to keywords:', error);
      return await this.analyzeTextWithKeywords(text);
    }
  }

  /**
   * Call Google Gemini API for emotion analysis
   */
  async callGemini(prompt) {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';
      
      // 🔥 FIX: Use v1beta for Gemini 2.0 Flash (experimental)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 500,
            }
          })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini API error: ${error}`);
      }

      const data = await response.json();
      
      // Extract text from Gemini response
      const content = data.candidates[0].content.parts[0].text.trim();
      
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      return JSON.parse(cleanContent);
    } catch (error) {
      logger.error('Gemini API call failed:', error);
      throw error;
    }
  }

  /**
   * Call OpenAI API for emotion analysis
   */
  async callOpenAI(prompt) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an empathetic emotion analyzer. Always respond with valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${error}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content.trim();
      
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      return JSON.parse(cleanContent);
    } catch (error) {
      logger.error('OpenAI API call failed:', error);
      throw error;
    }
  }

  /**
   * Call Anthropic API for emotion analysis
   */
  async callAnthropic(prompt) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
          max_tokens: 500,
          temperature: 0.3,
          messages: [
            { role: 'user', content: prompt }
          ]
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic API error: ${error}`);
      }

      const data = await response.json();
      const content = data.content[0].text.trim();
      
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      return JSON.parse(cleanContent);
    } catch (error) {
      logger.error('Anthropic API call failed:', error);
      throw error;
    }
  }

  /**
   * Keyword-based emotion analysis (fallback when no AI)
   * @param {string} text - The text to analyze
   * @returns {Object} Emotion analysis result
   */
  async analyzeTextWithKeywords(text) {
    const cleanText = text.toLowerCase().trim();
    const tokens = this.tokenizer.tokenize(cleanText);
    
    // Get sentiment score
    const sentimentResult = this.sentimentAnalyzer.analyze(text);
    
    // Emotion keywords mapping
    const emotionKeywords = {
      happy: [
        'happy', 'joy', 'excited', 'amazing', 'wonderful', 'great', 'fantastic',
        'love', 'perfect', 'awesome', 'brilliant', 'cheerful', 'delighted',
        'thrilled', 'ecstatic', 'blissful', 'content', 'satisfied', 'pleased'
      ],
      sad: [
        'sad', 'depressed', 'down', 'upset', 'terrible', 'awful', 'horrible',
        'disappointed', 'heartbroken', 'miserable', 'gloomy', 'melancholy',
        'sorrowful', 'dejected', 'despondent', 'grief', 'mourning', 'crying',
        'unhappy', 'unfortunate', 'regret', 'lonely', 'alone', 'isolated',
        'hurt', 'pain', 'suffering', 'blue', 'low', 'hopeless', 'discouraged'
      ],
      angry: [
        'angry', 'mad', 'furious', 'irritated', 'annoyed', 'frustrated',
        'outraged', 'livid', 'enraged', 'hostile', 'aggressive', 'bitter',
        'resentful', 'indignant', 'irate', 'rage', 'wrath', 'hatred'
      ],
      anxious: [
        'anxious', 'worried', 'nervous', 'stressed', 'overwhelmed', 'panic',
        'scared', 'afraid', 'fearful', 'concerned', 'troubled', 'uneasy',
        'restless', 'tense', 'apprehensive', 'paranoid', 'insecure', 'dread'
      ],
      calm: [
        'calm', 'peaceful', 'relaxed', 'serene', 'tranquil', 'composed',
        'zen', 'balanced', 'centered', 'still', 'quiet', 'soothed',
        'restful', 'gentle', 'mild', 'placid', 'undisturbed', 'harmonious'
      ],
      neutral: [
        'okay', 'fine', 'normal', 'regular', 'average', 'ordinary',
        'usual', 'standard', 'typical', 'moderate', 'balanced', 'stable'
      ]
    };

    // Compile regex patterns
    const emotionPatterns = {};
    Object.keys(emotionKeywords).forEach(emotion => {
      emotionPatterns[emotion] = new RegExp(
        `\\b(${emotionKeywords[emotion].join('|')})\\b`,
        'gi'
      );
    });
    
    // Count emotion keywords
    const emotionScores = {};
    let totalMatches = 0;

    Object.keys(emotionPatterns).forEach(emotion => {
      const matches = (cleanText.match(emotionPatterns[emotion]) || []).length;
      emotionScores[emotion] = matches;
      totalMatches += matches;
    });

    // Determine primary emotion
    let primaryEmotion = 'neutral';
    let maxScore = 0;
    let intensity = 0.5;

    if (totalMatches > 0) {
      Object.entries(emotionScores).forEach(([emotion, score]) => {
        if (score > maxScore) {
          maxScore = score;
          primaryEmotion = emotion;
        }
      });

      intensity = Math.min(
        (maxScore / tokens.length * 10) + Math.abs(sentimentResult.score / 10),
        1.0
      );
    } else {
      // Use sentiment as fallback - CHECK FOR NEGATIVE KEYWORDS FIRST
      const hasNegativeWords = /\b(un|not|never|no|dis|hate|terrible|awful|bad|worse|worst|unfortunately|sadly)\w*/gi.test(cleanText);
      
      if (hasNegativeWords || sentimentResult.score < -1) {
        primaryEmotion = 'sad';
        intensity = Math.min(Math.abs(sentimentResult.score) / 8, 0.8);
      } else if (sentimentResult.score > 3) {
        primaryEmotion = 'happy';
        intensity = Math.min(sentimentResult.score / 10, 0.9);
      } else {
        primaryEmotion = 'neutral';
        intensity = 0.5;
      }
    }

    // Calculate confidence
    const confidence = totalMatches > 0 
      ? Math.min(0.7 + (maxScore * 0.1), 0.9)
      : Math.min(0.4 + (Math.abs(sentimentResult.score) * 0.05), 0.7);

    logger.info(`Keyword-based emotion analysis completed: ${primaryEmotion} (${intensity})`, {
      textPreview: text.substring(0, 50) + '...',
      emotion: primaryEmotion,
      confidence
    });

    return {
      emotion: primaryEmotion,
      intensity: parseFloat(intensity.toFixed(2)),
      confidence: parseFloat(confidence.toFixed(2)),
      sentiment: {
        score: sentimentResult.score,
        comparative: sentimentResult.comparative,
        positive: sentimentResult.positive,
        negative: sentimentResult.negative
      },
      emotionScores,
      metadata: {
        textLength: text.length,
        tokenCount: tokens.length,
        totalMatches,
        analysis_method: 'keyword_sentiment_hybrid'
      }
    };
  }

  /**
   * Analyze audio for emotional content (speech features)
   * This is a mock implementation - replace with real audio analysis
   * @param {string} audioPath - Path to audio file
   * @returns {Object} Audio emotion analysis result
   */
  async analyzeAudio(audioPath) {
    try {
      // MOCK IMPLEMENTATION
      logger.info(`Mock audio analysis for: ${audioPath}`);

      // Simulate random but realistic audio emotion features
      const mockFeatures = this._generateMockAudioFeatures();

      const result = {
        emotion: mockFeatures.emotion,
        intensity: mockFeatures.intensity,
        confidence: 0.6,
        audioFeatures: {
          pitch_mean: mockFeatures.pitch_mean,
          pitch_std: mockFeatures.pitch_std,
          energy_mean: mockFeatures.energy_mean,
          speaking_rate: mockFeatures.speaking_rate,
          voice_quality: mockFeatures.voice_quality
        },
        metadata: {
          analysis_method: 'mock_audio_classifier',
          audioPath,
          warning: 'This is mock data - integrate real audio emotion classifier'
        }
      };

      logger.info(`Audio emotion analysis completed (MOCK): ${result.emotion}`, {
        audioPath,
        emotion: result.emotion
      });

      return result;

    } catch (error) {
      logger.error('Audio emotion analysis failed:', error);
      throw new Error(`Audio emotion analysis failed: ${error.message}`);
    }
  }

  /**
   * Combine text and audio emotion analysis results
   * @param {Object} textResult - Text emotion analysis result
   * @param {Object} audioResult - Audio emotion analysis result
   * @returns {Object} Fused emotion analysis result
   */
  fuseEmotionResults(textResult, audioResult) {
    try {
      // Weighted fusion: text (AI or keywords) is more reliable than mock audio
      const textWeight = 0.8;
      const audioWeight = 0.2;

      // If emotions match, boost confidence
      const emotionsMatch = textResult.emotion === audioResult.emotion;
      
      let finalEmotion = textResult.emotion;
      let finalIntensity = (textResult.intensity * textWeight) + (audioResult.intensity * audioWeight);
      let finalConfidence = (textResult.confidence * textWeight) + (audioResult.confidence * audioWeight);

      // Boost confidence if both modalities agree
      if (emotionsMatch) {
        finalConfidence = Math.min(finalConfidence * 1.2, 0.95);
      } else {
        // Reduce confidence if modalities disagree
        finalConfidence = finalConfidence * 0.8;
        
        // Choose emotion with higher confidence
        if (audioResult.confidence > textResult.confidence) {
          finalEmotion = audioResult.emotion;
        }
      }

      const result = {
        emotion: finalEmotion,
        intensity: parseFloat(finalIntensity.toFixed(2)),
        confidence: parseFloat(finalConfidence.toFixed(2)),
        fusion: {
          text: textResult,
          audio: audioResult,
          weights: { text: textWeight, audio: audioWeight },
          agreement: emotionsMatch
        },
        metadata: {
          analysis_method: 'multimodal_fusion',
          emotionsMatch
        }
      };

      logger.info(`Emotion fusion completed: ${finalEmotion} (confidence: ${finalConfidence})`, {
        textEmotion: textResult.emotion,
        audioEmotion: audioResult.emotion,
        finalEmotion,
        agreement: emotionsMatch
      });

      return result;

    } catch (error) {
      logger.error('Emotion fusion failed:', error);
      throw new Error(`Emotion fusion failed: ${error.message}`);
    }
  }

  /**
   * Generate a supportive response based on detected emotion
   * @param {string} emotion - Detected emotion
   * @param {number} intensity - Emotion intensity (0-1)
   * @returns {Object} Supportive response
   */
  generateSupportiveResponse(emotion, intensity) {
    const responses = {
      happy: {
        high: [
          "I can hear the joy in your voice! That's wonderful to hear.",
          "Your happiness is contagious! Thanks for sharing that bright moment.",
          "What a beautiful thing to share! I'm so glad you're feeling this way."
        ],
        medium: [
          "It sounds like you're having a good day. That's lovely!",
          "I can sense some positive energy there. Nice to hear!",
          "That sounds really nice. I'm glad you shared that with me."
        ],
        low: [
          "I hear a little spark of happiness there. That's sweet.",
          "Even small moments of joy matter. Thank you for sharing.",
          "There's something gentle and positive in what you shared."
        ]
      },
      sad: {
        high: [
          "I hear the heaviness in your words. It's okay to feel this way.",
          "That sounds really difficult. Thank you for trusting me with this.",
          "I can feel the sadness you're carrying. You're not alone in this."
        ],
        medium: [
          "It sounds like you're going through a tough time right now.",
          "I can sense some sadness there. That's completely valid.",
          "Sometimes days feel heavier than others. I hear you."
        ],
        low: [
          "There's a gentle sadness in what you shared. That's okay.",
          "I sense you might be feeling a bit down. That's natural.",
          "Everyone has moments like this. Thank you for sharing."
        ]
      },
      anxious: {
        high: [
          "I can hear the worry in your voice. Let's take this one step at a time.",
          "That sounds overwhelming. Remember to breathe - you've got this.",
          "I sense a lot of concern there. It's okay to feel anxious sometimes."
        ],
        medium: [
          "It sounds like you have some things on your mind right now.",
          "I can sense some worry there. That's completely understandable.",
          "Sometimes our minds can feel busy. I hear that in your voice."
        ],
        low: [
          "There's a little tension I'm picking up on. That's normal.",
          "I sense you might be feeling a bit unsettled. That happens.",
          "Everyone feels a bit anxious sometimes. You're doing okay."
        ]
      },
      angry: {
        high: [
          "I can hear the frustration in your voice. Those feelings are valid.",
          "It sounds like something really got to you today. That's tough.",
          "I sense some strong emotions there. It's okay to feel angry."
        ],
        medium: [
          "It sounds like something's bothering you. That's understandable.",
          "I can sense some frustration there. Everyone feels that way sometimes.",
          "There's some tension in what you shared. That's completely normal."
        ],
        low: [
          "I sense a bit of irritation there. That's part of being human.",
          "Everyone gets frustrated sometimes. I hear a little of that.",
          "There's a slight edge to your voice. That's okay."
        ]
      },
      calm: {
        high: [
          "Your voice sounds so peaceful right now. That's beautiful.",
          "I can sense the tranquility in what you shared. How lovely.",
          "There's such a calm energy in your words. That's wonderful."
        ],
        medium: [
          "You sound quite centered today. That's really nice.",
          "I can sense some peace in your voice. That's good to hear.",
          "There's a gentle calm in what you shared. That's lovely."
        ],
        low: [
          "You sound fairly relaxed right now. That's nice.",
          "I sense a quiet stability in your voice. That's good.",
          "There's a gentle ease in what you shared."
        ]
      },
      neutral: {
        high: [
          "Thank you for sharing your thoughts with me today.",
          "I appreciate you taking the time to reflect and share.",
          "Your voice sounds steady and thoughtful. Thank you for this moment."
        ],
        medium: [
          "Thanks for checking in and sharing your day with me.",
          "I appreciate you taking a moment to reflect.",
          "Thank you for sharing what's on your mind."
        ],
        low: [
          "Thank you for sharing. Every moment of reflection matters.",
          "I appreciate you taking time to check in today.",
          "Thanks for sharing your thoughts, however small."
        ]
      }
    };

    const intensityLevel = intensity > 0.7 ? 'high' : intensity > 0.4 ? 'medium' : 'low';
    const emotionResponses = responses[emotion] || responses.neutral;
    const levelResponses = emotionResponses[intensityLevel] || emotionResponses.medium;
    
    const randomResponse = levelResponses[Math.floor(Math.random() * levelResponses.length)];

    return {
      message: randomResponse,
      emotion,
      intensity,
      intensityLevel,
      tone: emotion === 'sad' || emotion === 'anxious' ? 'supportive' : 'encouraging'
    };
  }

  /**
   * Generate mock audio features for demonstration
   */
  _generateMockAudioFeatures() {
    const emotions = ['happy', 'sad', 'angry', 'anxious', 'calm', 'neutral'];
    const emotion = emotions[Math.floor(Math.random() * emotions.length)];
    
    const features = {
      happy: {
        pitch_mean: 180 + Math.random() * 40,
        pitch_std: 15 + Math.random() * 10,
        energy_mean: 0.6 + Math.random() * 0.3,
        speaking_rate: 4.5 + Math.random() * 1.0,
        intensity: 0.6 + Math.random() * 0.3
      },
      sad: {
        pitch_mean: 120 + Math.random() * 30,
        pitch_std: 8 + Math.random() * 5,
        energy_mean: 0.2 + Math.random() * 0.2,
        speaking_rate: 2.5 + Math.random() * 1.0,
        intensity: 0.4 + Math.random() * 0.4
      },
      angry: {
        pitch_mean: 200 + Math.random() * 50,
        pitch_std: 20 + Math.random() * 15,
        energy_mean: 0.7 + Math.random() * 0.2,
        speaking_rate: 5.0 + Math.random() * 1.5,
        intensity: 0.7 + Math.random() * 0.2
      },
      anxious: {
        pitch_mean: 160 + Math.random() * 60,
        pitch_std: 18 + Math.random() * 12,
        energy_mean: 0.5 + Math.random() * 0.3,
        speaking_rate: 4.0 + Math.random() * 2.0,
        intensity: 0.5 + Math.random() * 0.3
      },
      calm: {
        pitch_mean: 140 + Math.random() * 20,
        pitch_std: 6 + Math.random() * 4,
        energy_mean: 0.3 + Math.random() * 0.2,
        speaking_rate: 3.0 + Math.random() * 0.5,
        intensity: 0.3 + Math.random() * 0.3
      },
      neutral: {
        pitch_mean: 150 + Math.random() * 30,
        pitch_std: 10 + Math.random() * 5,
        energy_mean: 0.4 + Math.random() * 0.2,
        speaking_rate: 3.5 + Math.random() * 1.0,
        intensity: 0.4 + Math.random() * 0.2
      }
    };

    return {
      emotion,
      ...features[emotion],
      voice_quality: Math.random() * 0.8 + 0.2
    };
  }
}

module.exports = new EmotionAnalysisService();
