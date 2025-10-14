/**
 * Session Completion Service
 * Generates mental health scores, actionable recommendations,
 * and community/resource suggestions based on conversation
 */

const axios = require('axios');
const logger = require('../utils/logger');

// Gemini API Configuration (matching frontend integration)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyC34bRrVdXL9Y8Mw7_n8f4HSduUrmfNWOU';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Calculate mental health wellness score (0-100)
 */
function calculateWellnessScore(qaHistory) {
  if (!qaHistory || qaHistory.length === 0) {
    return 50; // Neutral baseline
  }

  // Emotional scoring
  const emotionScores = {
    happy: 90,
    excited: 85,
    calm: 80,
    peaceful: 85,
    hopeful: 75,
    neutral: 60,
    confused: 45,
    anxious: 35,
    sad: 30,
    angry: 25,
    stressed: 30
  };

  // Calculate weighted average based on intensity
  let totalScore = 0;
  let totalWeight = 0;

  qaHistory.forEach(qa => {
    const baseScore = emotionScores[qa.emotion] || 50;
    const intensity = qa.intensity || 0.5;
    
    // Lower intensity = closer to neutral (60)
    // Higher intensity = stronger emotion (closer to base score)
    const score = baseScore * intensity + 60 * (1 - intensity);
    
    totalScore += score;
    totalWeight += 1;
  });

  const averageScore = Math.round(totalScore / totalWeight);
  return Math.max(0, Math.min(100, averageScore)); // Clamp to 0-100
}

/**
 * Generate personalized recommendations
 */
function generateRecommendations(qaHistory, wellnessScore, dominantEmotion) {
  const recommendations = {
    immediate: [],
    daily: [],
    weekly: [],
    professional: []
  };

  // Immediate actions (based on current state)
  if (dominantEmotion === 'anxious' || dominantEmotion === 'stressed') {
    recommendations.immediate.push({
      icon: '🧘',
      title: 'Try 5-Minute Breathing Exercise',
      description: 'Box breathing: Inhale 4s, hold 4s, exhale 4s, hold 4s',
      actionable: true
    });
    recommendations.immediate.push({
      icon: '🚶',
      title: 'Take a Short Walk',
      description: 'Even 10 minutes outside can reduce stress by 20%',
      actionable: true
    });
  }

  if (dominantEmotion === 'sad') {
    recommendations.immediate.push({
      icon: '☀️',
      title: 'Get Some Sunlight',
      description: 'Natural light boosts serotonin levels',
      actionable: true
    });
    recommendations.immediate.push({
      icon: '🎵',
      title: 'Listen to Uplifting Music',
      description: 'Music therapy can improve mood within minutes',
      actionable: true
    });
  }

  if (dominantEmotion === 'angry') {
    recommendations.immediate.push({
      icon: '✍️',
      title: 'Journal Your Feelings',
      description: 'Writing helps process and release anger constructively',
      actionable: true
    });
    recommendations.immediate.push({
      icon: '💪',
      title: 'Physical Activity',
      description: 'Exercise releases tension and improves mood',
      actionable: true
    });
  }

  // Daily practices
  recommendations.daily.push({
    icon: '📝',
    title: 'Gratitude Practice',
    description: 'Write down 3 things you are grateful for',
    duration: '5 minutes'
  });

  recommendations.daily.push({
    icon: '🧘‍♀️',
    title: 'Mindfulness Meditation',
    description: 'Guided meditation for emotional awareness',
    duration: '10 minutes'
  });

  // Weekly activities
  recommendations.weekly.push({
    icon: '🤝',
    title: 'Social Connection',
    description: 'Meet friends or join a community group',
    frequency: '2-3 times per week'
  });

  recommendations.weekly.push({
    icon: '🎨',
    title: 'Creative Expression',
    description: 'Art, music, writing - any creative outlet',
    frequency: 'Once a week'
  });

  // Professional help (if needed)
  if (wellnessScore < 40) {
    recommendations.professional.push({
      icon: '👨‍⚕️',
      title: 'Consider Professional Support',
      description: 'A therapist can provide personalized strategies',
      urgent: true
    });
    
    recommendations.professional.push({
      icon: '📞',
      title: 'Crisis Support Available',
      description: 'National Mental Health Hotline: 1-800-662-HELP',
      urgent: true
    });
  } else if (wellnessScore < 60) {
    recommendations.professional.push({
      icon: '🗣️',
      title: 'Talk to Someone',
      description: 'Share your feelings with a trusted friend or counselor',
      urgent: false
    });
  }

  return recommendations;
}

/**
 * Suggest places to visit based on emotional state (AI-powered with location awareness)
 */
async function suggestPlaces(dominantEmotion, qaHistory, userLocation = null) {
  try {
    logger.info('🏞️ Starting AI place recommendation generation...', {
      dominantEmotion,
      userLocation: userLocation || 'Location not provided',
      qaHistoryLength: qaHistory.length
    });

    // Build context from conversation
    const conversationContext = qaHistory
      .map(qa => `Q: ${qa.question}\nA: ${qa.answer} (Emotion: ${qa.emotion})`)
      .join('\n\n');

    // Build location-aware prompt
    const locationContext = userLocation 
      ? `User's Location: ${userLocation.city}, ${userLocation.region}, ${userLocation.country}
IP Location Data: Latitude ${userLocation.latitude}, Longitude ${userLocation.longitude}

IMPORTANT: Recommend SPECIFIC, REAL places in ${userLocation.city}, ${userLocation.country} that the user can visit TODAY. Sort recommendations from CLOSEST to FARTHEST from coordinates (${userLocation.latitude}, ${userLocation.longitude}).`
      : `Location: Not available (provide general recommendations)`;

    const prompt = `You are a mental health wellness advisor with knowledge of local mental health resources worldwide. Based on this conversation and the person's emotional state, suggest 3 SPECIFIC, REAL places they can visit to improve their well-being.

Conversation Summary:
${conversationContext}

Dominant Emotion: ${dominantEmotion}

${locationContext}

Generate 3 place recommendations in the following JSON format:
[
  {
    "icon": "emoji (single emoji that represents the place)",
    "name": "${userLocation ? 'Specific Place Name in ' + userLocation.city : 'Place Type (e.g., Nature Parks)'}",
    "description": "Brief therapeutic benefit (max 60 characters)",
    "type": "category (outdoor/indoor/activity/social/wellness/event)",
    "address": "${userLocation ? 'Full street address with postal code' : 'General location type'}",
    "distance": "${userLocation ? 'Distance in km from user location' : 'N/A'}"
  }
]

${userLocation ? `
CRITICAL RULES FOR ${userLocation.city}:
1. ONLY recommend REAL, EXISTING places in ${userLocation.city}, ${userLocation.country}
2. Provide EXACT street addresses with postal codes
3. Calculate ACTUAL distance from (${userLocation.latitude}, ${userLocation.longitude})
4. Sort from NEAREST to FARTHEST (closest first)
5. Choose places that are OPEN TO PUBLIC and currently operational
6. Examples: "Cubbon Park, MG Road", "NIMHANS Counseling Center, Hosur Road", "Bangalore Yoga Institute, Indiranagar"

Prioritize based on emotion:
- Anxious: Parks, quiet cafes, yoga studios, meditation centers
- Sad: Botanical gardens, art galleries, community centers, swimming pools  
- Angry: Gyms, sports complexes, hiking trails, martial arts studios
- Stressed: Spas, libraries, nature reserves, wellness centers
` : `
GENERAL RULES (No location data):
1. Recommend TYPES of places (not specific names)
2. Keep descriptions therapeutic and encouraging
3. Mix indoor/outdoor based on emotion
4. Focus on accessibility and public spaces
`}

Return ONLY valid JSON array, no other text or markdown.`;

    logger.info('📤 Sending request to Gemini AI...', {
      promptLength: prompt.length,
      model: GEMINI_MODEL,
      hasLocation: !!userLocation,
      apiUrl: GEMINI_URL
    });

    // Use direct REST API call (matching frontend integration)
    const response = await axios.post(GEMINI_URL, {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from Gemini API');
    }

    const responseText = response.data.candidates[0].content.parts[0].text;
    
    logger.info('📥 Gemini AI response received', { 
      responseLength: responseText.length,
      preview: responseText.substring(0, 300) + '...'
    });

    // Parse JSON from response (handle markdown code blocks)
    let jsonText = responseText;
    
    // Remove markdown code blocks if present
    if (jsonText.includes('```json')) {
      const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }
    } else if (jsonText.includes('```')) {
      const jsonMatch = jsonText.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }
    }
    
    // Extract JSON array
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      logger.error('❌ No JSON array found in Gemini response', { responseText });
      throw new Error('No JSON array found in response');
    }

    const places = JSON.parse(jsonMatch[0]);
    
    logger.info('✅ Successfully parsed AI place recommendations', {
      placeCount: places.length,
      places: places.map(p => ({
        name: p.name,
        type: p.type,
        distance: p.distance || 'N/A',
        hasAddress: !!p.address
      }))
    });
    
    return places;

  } catch (error) {
    logger.error('❌ Failed to generate AI place recommendations:', error);
    
    // Fallback to static recommendations
    const placeSuggestions = {
      anxious: [
        { icon: '🌳', name: 'Nature Parks', description: 'Green spaces reduce anxiety by 30%', type: 'outdoor' },
        { icon: '☕', name: 'Quiet Cafés', description: 'Calm environment for reflection', type: 'indoor' },
        { icon: '🎨', name: 'Art Museums', description: 'Art therapy benefits for stress relief', type: 'indoor' }
      ],
      sad: [
        { icon: '☀️', name: 'Botanical Gardens', description: 'Natural beauty lifts mood', type: 'outdoor' },
        { icon: '🎭', name: 'Comedy Shows', description: 'Laughter is powerful medicine', type: 'event' },
        { icon: '🏊', name: 'Swimming Pools', description: 'Water activities boost happiness', type: 'activity' }
      ],
      stressed: [
        { icon: '🧘', name: 'Yoga Studios', description: 'Mind-body connection for stress relief', type: 'wellness' },
        { icon: '📚', name: 'Libraries', description: 'Peaceful environment for mental rest', type: 'indoor' },
        { icon: '🌊', name: 'Beaches/Waterfronts', description: 'Water sounds calm the nervous system', type: 'outdoor' }
      ],
      angry: [
        { icon: '🏃', name: 'Gym/Sports Centers', description: 'Physical release of tension', type: 'activity' },
        { icon: '🥊', name: 'Boxing/Martial Arts', description: 'Controlled energy release', type: 'activity' },
        { icon: '🌲', name: 'Hiking Trails', description: 'Nature + exercise combination', type: 'outdoor' }
      ],
      lonely: [
        { icon: '🎪', name: 'Community Centers', description: 'Meet people with shared interests', type: 'social' },
        { icon: '☕', name: 'Co-working Spaces', description: 'Work around others', type: 'social' },
        { icon: '🎮', name: 'Gaming Cafés', description: 'Connect through shared hobbies', type: 'social' }
      ],
      neutral: [
        { icon: '🎨', name: 'Creative Workshops', description: 'Explore new interests', type: 'activity' },
        { icon: '🌆', name: 'City Exploration', description: 'Discover new places', type: 'outdoor' },
        { icon: '🎵', name: 'Live Music Venues', description: 'Emotional connection through music', type: 'event' }
      ]
    };

    return placeSuggestions[dominantEmotion] || placeSuggestions.neutral;
  }
}

/**
 * Suggest community connections based on conversation
 */
function suggestCommunities(qaHistory, dominantEmotion) {
  const communities = [];

  // Analyze conversation topics
  const transcript = qaHistory.map(qa => qa.answer.toLowerCase()).join(' ');

  // Topic-based communities
  if (transcript.includes('work') || transcript.includes('career') || transcript.includes('job')) {
    communities.push({
      icon: '💼',
      name: 'Professional Support Groups',
      description: 'Connect with others navigating career challenges',
      type: 'online-and-local'
    });
  }

  if (transcript.includes('family') || transcript.includes('relationship')) {
    communities.push({
      icon: '👨‍👩‍👧',
      name: 'Family Support Networks',
      description: 'Share experiences with others in similar situations',
      type: 'local'
    });
  }

  if (transcript.includes('creative') || transcript.includes('art') || transcript.includes('music')) {
    communities.push({
      icon: '🎨',
      name: 'Creative Communities',
      description: 'Express yourself through art with like-minded people',
      type: 'workshops'
    });
  }

  // Emotion-based communities
  if (dominantEmotion === 'anxious' || dominantEmotion === 'stressed') {
    communities.push({
      icon: '🧘',
      name: 'Mindfulness & Meditation Groups',
      description: 'Practice stress management together',
      type: 'weekly-meetups'
    });
  }

  if (dominantEmotion === 'sad') {
    communities.push({
      icon: '💝',
      name: 'Peer Support Circles',
      description: 'Share your journey with understanding peers',
      type: 'support-group'
    });
  }

  // Always include general wellness
  communities.push({
    icon: '🌟',
    name: 'Mental Health Awareness Groups',
    description: 'Learn and grow with others on wellness journeys',
    type: 'educational'
  });

  communities.push({
    icon: '🤝',
    name: 'Local Volunteer Organizations',
    description: 'Helping others boosts your own well-being',
    type: 'volunteer'
  });

  return communities;
}

/**
 * Generate complete session summary with all recommendations
 */
async function generateSessionCompletion(qaHistory, userLocation = 'general') {
  // Calculate overall metrics
  const wellnessScore = calculateWellnessScore(qaHistory);
  
  // Determine dominant emotion
  const emotionCounts = {};
  qaHistory.forEach(qa => {
    emotionCounts[qa.emotion] = (emotionCounts[qa.emotion] || 0) + 1;
  });
  const dominantEmotion = Object.keys(emotionCounts).reduce((a, b) => 
    emotionCounts[a] > emotionCounts[b] ? a : b
  );

  // Generate all components (places is now async)
  const recommendations = generateRecommendations(qaHistory, wellnessScore, dominantEmotion);
  const places = await suggestPlaces(dominantEmotion, qaHistory, userLocation);
  const communities = suggestCommunities(qaHistory, dominantEmotion);

  // Wellness message
  let wellnessMessage = '';
  let wellnessColor = '';
  
  if (wellnessScore >= 70) {
    wellnessMessage = "You are doing great! Keep up the positive momentum.";
    wellnessColor = 'text-green-600';
  } else if (wellnessScore >= 50) {
    wellnessMessage = "You are managing well. Small steps lead to big changes.";
    wellnessColor = 'text-yellow-600';
  } else if (wellnessScore >= 30) {
    wellnessMessage = "Things are challenging right now. Remember, help is available.";
    wellnessColor = 'text-orange-600';
  } else {
    wellnessMessage = "You are going through a difficult time. Please reach out for support.";
    wellnessColor = 'text-red-600';
  }

  return {
    wellnessScore,
    wellnessMessage,
    wellnessColor,
    dominantEmotion,
    emotionCounts,
    recommendations,
    places,
    communities,
    encouragement: getEncouragingMessage(dominantEmotion, wellnessScore)
  };
}

/**
 * Get personalized encouraging message
 */
function getEncouragingMessage(emotion, score) {
  const messages = {
    anxious: "Anxiety is a signal, not a life sentence. You have the strength to manage this.",
    sad: "It is okay to not be okay. Your feelings are valid, and brighter days are ahead.",
    angry: "Your anger shows you care deeply. Channel this energy into positive change.",
    stressed: "You are handling more than you think. Take it one step at a time.",
    happy: "Your joy is beautiful! Share it with others and let it multiply.",
    calm: "This inner peace you have found is precious. Protect and nurture it.",
    confused: "Not having all the answers is part of being human. Clarity will come.",
    hopeful: "Your hope is powerful. It is the first step toward positive change.",
    excited: "Your enthusiasm is contagious! Use this energy to create something meaningful.",
    peaceful: "This serenity is a gift. Return to it whenever you need grounding."
  };

  let message = messages[emotion] || "Every emotion is part of your unique human experience.";
  
  if (score < 40) {
    message += " Remember: asking for help is a sign of strength, not weakness.";
  }

  return message;
}

module.exports = {
  calculateWellnessScore,
  generateRecommendations,
  suggestPlaces,
  suggestCommunities,
  generateSessionCompletion
};
