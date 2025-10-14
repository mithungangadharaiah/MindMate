const { cosine } = require('ml-distance');
const logger = require('../utils/logger');

/**
 * MindMate Friend Matching Service
 * 
 * Implements algorithm to match users based on:
 * - Location proximity (city matching)
 * - Mood similarity (last 3 entries)
 * - Interest overlap (Jaccard similarity)
 */

class FriendMatchingService {
  constructor() {
    // Emotion vector mappings for similarity calculation
    this.emotionVectors = {
      happy: [1, 0.8, 0.2, 0.1, 0.3, 0.5],
      sad: [0.1, 0.2, 1, 0.3, 0.1, 0.4],
      angry: [0.2, 0.1, 0.4, 1, 0.2, 0.3],
      anxious: [0.3, 0.2, 0.6, 0.7, 1, 0.4],
      calm: [0.6, 0.9, 0.1, 0.1, 0.2, 1],
      neutral: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
    };

    logger.info('Friend Matching Service initialized');
  }

  /**
   * Find friend matches for a user
   * @param {Object} targetUser - The user to find matches for
   * @param {Array} potentialFriends - Array of potential friend users
   * @param {Array} targetUserEntries - Recent entries for target user
   * @param {Object} allUserEntries - Entries for all potential friends
   * @returns {Array} Sorted array of friend matches with scores
   */
  async findMatches(targetUser, potentialFriends, targetUserEntries, allUserEntries) {
    try {
      const matches = [];

      for (const friend of potentialFriends) {
        if (friend.id === targetUser.id) continue; // Skip self

        const friendEntries = allUserEntries[friend.id] || [];
        const score = this.calculateMatchScore(targetUser, friend, targetUserEntries, friendEntries);
        
        matches.push({
          user: friend,
          score: score.total,
          breakdown: score.breakdown,
          reasoning: this.generateMatchReasoning(score.breakdown),
          lastSeen: friend.last_active || new Date(),
          compatibility: this.getCompatibilityLevel(score.total)
        });
      }

      // Sort by score (highest first) and return top matches
      const sortedMatches = matches
        .sort((a, b) => b.score - a.score)
        .slice(0, 10); // Top 10 matches

      logger.info(`Generated ${sortedMatches.length} friend matches for user ${targetUser.id}`);
      
      return sortedMatches;

    } catch (error) {
      logger.error('Friend matching failed:', error);
      throw new Error(`Friend matching failed: ${error.message}`);
    }
  }

  /**
   * Calculate overall match score between two users
   * @param {Object} user1 - Target user
   * @param {Object} user2 - Potential friend
   * @param {Array} user1Entries - Recent entries for user1
   * @param {Array} user2Entries - Recent entries for user2
   * @returns {Object} Match score with breakdown
   */
  calculateMatchScore(user1, user2, user1Entries, user2Entries) {
    // Weights for different factors
    const weights = {
      location: 0.4,
      mood: 0.35,
      interests: 0.15,
      age: 0.05,
      activity: 0.05
    };

    const breakdown = {
      location: this.calculateLocationMatch(user1, user2),
      mood: this.calculateMoodSimilarity(user1Entries, user2Entries),
      interests: this.calculateInterestOverlap(user1.interests || [], user2.interests || []),
      age: this.calculateAgeCompatibility(user1.age, user2.age),
      activity: this.calculateActivityMatch(user1Entries, user2Entries)
    };

    // Calculate weighted total
    const total = Object.keys(weights).reduce((sum, factor) => {
      return sum + (breakdown[factor] * weights[factor]);
    }, 0);

    return {
      total: parseFloat(total.toFixed(3)),
      breakdown,
      weights
    };
  }

  /**
   * Calculate location-based matching score
   * @param {Object} user1 - First user
   * @param {Object} user2 - Second user
   * @returns {number} Location match score (0-1)
   */
  calculateLocationMatch(user1, user2) {
    if (!user1.city || !user2.city) return 0.1;

    const city1 = user1.city.toLowerCase().trim();
    const city2 = user2.city.toLowerCase().trim();

    if (city1 === city2) {
      return 1.0; // Same city
    }

    // Check for similar city names (basic string similarity)
    const similarity = this.calculateStringSimilarity(city1, city2);
    
    if (similarity > 0.8) {
      return 0.8; // Very similar city names
    } else if (similarity > 0.6) {
      return 0.5; // Somewhat similar
    } else {
      return 0.1; // Different cities
    }
  }

  /**
   * Calculate mood similarity based on recent entries
   * @param {Array} entries1 - User 1's recent entries
   * @param {Array} entries2 - User 2's recent entries
   * @returns {number} Mood similarity score (0-1)
   */
  calculateMoodSimilarity(entries1, entries2) {
    if (!entries1.length || !entries2.length) return 0.2;

    // Get last 3 entries for each user
    const recent1 = entries1.slice(-3);
    const recent2 = entries2.slice(-3);

    // Convert emotions to vectors
    const vector1 = this.getMoodVector(recent1);
    const vector2 = this.getMoodVector(recent2);

    // Calculate cosine similarity
    try {
      const similarity = 1 - cosine(vector1, vector2);
      return Math.max(0, Math.min(1, similarity)); // Clamp to [0,1]
    } catch (error) {
      logger.warn('Failed to calculate mood similarity:', error);
      return 0.2;
    }
  }

  /**
   * Calculate interest overlap using Jaccard similarity
   * @param {Array} interests1 - User 1's interests
   * @param {Array} interests2 - User 2's interests
   * @returns {number} Interest overlap score (0-1)
   */
  calculateInterestOverlap(interests1, interests2) {
    if (!interests1.length || !interests2.length) return 0.1;

    const set1 = new Set(interests1.map(i => i.toLowerCase()));
    const set2 = new Set(interests2.map(i => i.toLowerCase()));

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size; // Jaccard similarity
  }

  /**
   * Calculate age compatibility score
   * @param {number} age1 - First user's age
   * @param {number} age2 - Second user's age
   * @returns {number} Age compatibility score (0-1)
   */
  calculateAgeCompatibility(age1, age2) {
    if (!age1 || !age2) return 0.5;

    const ageDiff = Math.abs(age1 - age2);
    
    if (ageDiff <= 3) return 1.0;
    if (ageDiff <= 7) return 0.8;
    if (ageDiff <= 12) return 0.6;
    if (ageDiff <= 18) return 0.4;
    return 0.2;
  }

  /**
   * Calculate activity level matching
   * @param {Array} entries1 - User 1's entries
   * @param {Array} entries2 - User 2's entries
   * @returns {number} Activity match score (0-1)
   */
  calculateActivityMatch(entries1, entries2) {
    const activity1 = entries1.length;
    const activity2 = entries2.length;

    if (activity1 === 0 && activity2 === 0) return 0.5;
    
    const maxActivity = Math.max(activity1, activity2);
    const minActivity = Math.min(activity1, activity2);
    
    return maxActivity === 0 ? 0 : minActivity / maxActivity;
  }

  /**
   * Convert mood entries to numerical vector for similarity calculation
   * @param {Array} entries - User's recent entries
   * @returns {Array} Mood vector
   */
  getMoodVector(entries) {
    if (!entries.length) return [0, 0, 0, 0, 0, 0];

    // Average the emotion vectors
    const vectors = entries.map(entry => {
      const emotion = entry.emotion || 'neutral';
      return this.emotionVectors[emotion] || this.emotionVectors.neutral;
    });

    // Calculate average across all dimensions
    const avgVector = [];
    for (let i = 0; i < 6; i++) {
      const sum = vectors.reduce((acc, vector) => acc + vector[i], 0);
      avgVector.push(sum / vectors.length);
    }

    return avgVector;
  }

  /**
   * Calculate string similarity using Jaccard similarity on character bigrams
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Similarity score (0-1)
   */
  calculateStringSimilarity(str1, str2) {
    if (str1 === str2) return 1.0;
    if (!str1 || !str2) return 0.0;

    const bigrams1 = this.getBigrams(str1);
    const bigrams2 = this.getBigrams(str2);

    const set1 = new Set(bigrams1);
    const set2 = new Set(bigrams2);

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  /**
   * Get character bigrams from a string
   * @param {string} str - Input string
   * @returns {Array} Array of bigrams
   */
  getBigrams(str) {
    const bigrams = [];
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.push(str.substring(i, i + 2));
    }
    return bigrams;
  }

  /**
   * Generate human-readable reasoning for match score
   * @param {Object} breakdown - Score breakdown
   * @returns {string} Match reasoning
   */
  generateMatchReasoning(breakdown) {
    const reasons = [];

    if (breakdown.location > 0.8) {
      reasons.push("lives in your city");
    } else if (breakdown.location > 0.4) {
      reasons.push("lives nearby");
    }

    if (breakdown.mood > 0.7) {
      reasons.push("has very similar recent moods");
    } else if (breakdown.mood > 0.5) {
      reasons.push("shares some emotional patterns");
    }

    if (breakdown.interests > 0.5) {
      reasons.push("shares many interests");
    } else if (breakdown.interests > 0.2) {
      reasons.push("has some common interests");
    }

    if (breakdown.age > 0.7) {
      reasons.push("is around your age");
    }

    if (breakdown.activity > 0.6) {
      reasons.push("has similar activity level");
    }

    if (reasons.length === 0) {
      return "might be an interesting connection";
    }

    if (reasons.length === 1) {
      return reasons[0];
    }

    if (reasons.length === 2) {
      return reasons.join(" and ");
    }

    return reasons.slice(0, -1).join(", ") + ", and " + reasons[reasons.length - 1];
  }

  /**
   * Get compatibility level description
   * @param {number} score - Match score
   * @returns {string} Compatibility level
   */
  getCompatibilityLevel(score) {
    if (score >= 0.8) return "Excellent";
    if (score >= 0.6) return "Great";
    if (score >= 0.4) return "Good";
    if (score >= 0.2) return "Fair";
    return "Limited";
  }

  /**
   * Generate mock friend data for development/demo
   * @param {number} count - Number of mock friends to generate
   * @returns {Array} Array of mock friend objects
   */
  generateMockFriends(count = 10) {
    const cities = ['San Francisco', 'New York', 'Austin', 'Seattle', 'Portland', 'Denver', 'Boston', 'Chicago'];
    const interests = [
      'reading', 'music', 'hiking', 'cooking', 'yoga', 'photography', 'travel',
      'meditation', 'art', 'writing', 'fitness', 'movies', 'gaming', 'dancing'
    ];
    const names = [
      'Alex Chen', 'Sam Rivera', 'Taylor Kim', 'Jordan Smith', 'Casey Wong',
      'Riley Johnson', 'Avery Davis', 'Morgan Lee', 'Quinn Anderson', 'Sage Wilson'
    ];

    const mockFriends = [];

    for (let i = 0; i < count; i++) {
      const userInterests = interests
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 5) + 2);

      mockFriends.push({
        id: `mock_user_${i + 1}`,
        display_name: names[i % names.length],
        city: cities[Math.floor(Math.random() * cities.length)],
        age: Math.floor(Math.random() * 30) + 20,
        interests: userInterests,
        last_active: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        avatar_color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][Math.floor(Math.random() * 5)]
      });
    }

    return mockFriends;
  }

  /**
   * Generate mock entries for demo users
   * @param {string} userId - User ID
   * @param {number} count - Number of entries to generate
   * @returns {Array} Array of mock entries
   */
  generateMockEntries(userId, count = 5) {
    const emotions = ['happy', 'sad', 'anxious', 'calm', 'neutral'];
    const mockTexts = {
      happy: [
        "Had an amazing day at the park with friends!",
        "Got a promotion at work today, feeling grateful!",
        "Beautiful sunset tonight, feeling blessed."
      ],
      sad: [
        "Missing my family today, feeling a bit lonely.",
        "Tough day at work, everything felt overwhelming.",
        "Rainy weather matching my mood today."
      ],
      anxious: [
        "Big presentation tomorrow, feeling nervous.",
        "Lots of uncertainty lately, mind racing.",
        "Can't shake this worried feeling today."
      ],
      calm: [
        "Peaceful morning meditation in the garden.",
        "Quiet evening with a good book and tea.",
        "Feeling centered after a nice walk."
      ],
      neutral: [
        "Regular day today, nothing special happening.",
        "Just checking in, feeling okay overall.",
        "Normal Tuesday, going through the motions."
      ]
    };

    const entries = [];
    
    for (let i = 0; i < count; i++) {
      const emotion = emotions[Math.floor(Math.random() * emotions.length)];
      const texts = mockTexts[emotion];
      const text = texts[Math.floor(Math.random() * texts.length)];
      
      entries.push({
        id: `entry_${userId}_${i}`,
        user_id: userId,
        emotion,
        intensity: Math.random() * 0.6 + 0.2,
        confidence: Math.random() * 0.3 + 0.6,
        transcript: text,
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      });
    }

    return entries.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }
}

module.exports = new FriendMatchingService();