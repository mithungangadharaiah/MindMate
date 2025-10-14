// Local JSON Database Service for Demo
// Provides file-based storage when no database is available

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class LocalDatabase {
  constructor() {
    this.dataDir = path.join(__dirname, '..', 'data');
    this.users = [];
    this.entries = [];
    this.places = [];
    this.friendConnections = [];
    this.dailyQuestions = [];
    
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    try {
      // Create data directory
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // Load existing data or create initial data
      await this.loadOrCreateData();
      
      this.initialized = true;
      console.log('✅ Local database initialized with demo data');
    } catch (error) {
      console.error('❌ Failed to initialize local database:', error);
      throw error;
    }
  }

  async loadOrCreateData() {
    try {
      // Try to load existing data
      const usersData = await this.readFile('users.json');
      const entriesData = await this.readFile('entries.json');
      const placesData = await this.readFile('places.json');
      const connectionsData = await this.readFile('connections.json');
      const questionsData = await this.readFile('questions.json');

      this.users = usersData || [];
      this.entries = entriesData || [];
      this.places = placesData || [];
      this.friendConnections = connectionsData || [];
      this.dailyQuestions = questionsData || [];

      // If no data exists, create demo data
      if (this.users.length === 0) {
        await this.createDemoData();
      }
    } catch (error) {
      console.log('Creating initial demo data...');
      await this.createDemoData();
    }
  }

  async readFile(filename) {
    try {
      const filePath = path.join(this.dataDir, filename);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  async writeFile(filename, data) {
    const filePath = path.join(this.dataDir, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  async createDemoData() {
    // Create demo users
    this.users = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'alex@example.com',
        password_hash: '$2b$10$GRLdNijSMhkdCjGl1w3qEu7rZuQU4/C9kZGCZWaE1QpN6x8jSXcWm',
        display_name: 'Alex Chen',
        city: 'San Francisco',
        age: 28,
        interests: ['meditation', 'hiking', 'photography', 'reading'],
        avatar_color: '#ff6b6b',
        privacy_settings: {
          off_record_mode: false,
          data_retention_days: 90,
          share_mood_insights: true,
          allow_friend_matching: true
        },
        created_at: new Date().toISOString()
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'sarah@example.com',
        password_hash: '$2b$10$GRLdNijSMhkdCjGl1w3qEu7rZuQU4/C9kZGCZWaE1QpN6x8jSXcWm',
        display_name: 'Sarah Johnson',
        city: 'San Francisco',
        age: 32,
        interests: ['yoga', 'cooking', 'gardening', 'art'],
        avatar_color: '#4ecdc4',
        privacy_settings: {
          off_record_mode: false,
          data_retention_days: 90,
          share_mood_insights: true,
          allow_friend_matching: true
        },
        created_at: new Date().toISOString()
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        email: 'demo@mindmate.local',
        password_hash: '$2b$10$GRLdNijSMhkdCjGl1w3qEu7rZuQU4/C9kZGCZWaE1QpN6x8jSXcWm',
        display_name: 'Demo User',
        city: 'San Francisco',
        age: 25,
        interests: ['music', 'technology', 'wellness', 'friends'],
        avatar_color: '#45b7d1',
        privacy_settings: {
          off_record_mode: false,
          data_retention_days: 90,
          share_mood_insights: true,
          allow_friend_matching: true
        },
        created_at: new Date().toISOString()
      }
    ];

    // Create demo places
    this.places = [
      {
        id: uuidv4(),
        name: 'Golden Gate Park',
        type: 'park',
        address: '501 Stanyan St, San Francisco, CA 94117',
        city: 'San Francisco',
        mood_tags: ['calm', 'happy', 'peaceful'],
        mood_match_reasons: {
          calm: "Wide open spaces and peaceful gardens provide a tranquil environment",
          happy: "Beautiful scenery and recreational activities lift spirits",
          sad: "Quiet benches and natural beauty offer comfort and solitude"
        },
        rating: 4.6,
        price_level: 1,
        description: 'A large urban park with gardens, trails, and peaceful spots perfect for reflection.',
        created_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: 'Blue Bottle Coffee',
        type: 'cafe',
        address: '66 Mint St, San Francisco, CA 94103',
        city: 'San Francisco',
        mood_tags: ['cozy', 'social', 'comfortable'],
        mood_match_reasons: {
          neutral: "Comfortable spot for regular daily routines",
          calm: "Quiet atmosphere perfect for reflection",
          sad: "Warm environment provides gentle comfort"
        },
        rating: 4.3,
        price_level: 2,
        description: 'Artisanal coffee shop with carefully crafted beverages and cozy atmosphere.',
        created_at: new Date().toISOString()
      }
    ];

    // Create demo entries
    this.entries = [
      {
        id: uuidv4(),
        user_id: '33333333-3333-3333-3333-333333333333',
        emotion: 'happy',
        intensity: 0.75,
        confidence: 0.88,
        transcript: 'Today was really great! I had a wonderful conversation with a friend and felt so connected. The weather was perfect for a walk.',
        question_prompt: 'How are you feeling right now, and what\'s been on your mind today?',
        supportive_response: {
          message: "It sounds like you had a beautiful day filled with connection and joy. Those moments of feeling truly connected to others are so precious. I'm glad you could enjoy the perfect weather too!",
          suggestions: ["Share this positive energy with more friends", "Take another walk to enjoy the good weather"],
          tone: "celebratory"
        },
        analysis_data: {
          keywords_found: ["great", "wonderful", "connected", "perfect"],
          sentiment_score: 0.89,
          energy_level: "high",
          themes: ["social_connection", "nature", "joy"]
        },
        created_at: new Date().toISOString()
      }
    ];

    // Create daily questions
    this.dailyQuestions = [
      {
        id: uuidv4(),
        question_text: 'Tell me in about thirty seconds: what was one moment from today that sticks with you?',
        category: 'reflection',
        difficulty_level: 2,
        mood_focus: 'neutral',
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        question_text: 'How are you feeling right now, and what\'s been on your mind today?',
        category: 'emotions',
        difficulty_level: 1,
        mood_focus: 'neutral',
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        question_text: 'What\'s something from today that you\'d like to talk through with me?',
        category: 'processing',
        difficulty_level: 3,
        mood_focus: 'neutral',
        is_active: true,
        created_at: new Date().toISOString()
      }
    ];

    // Create friend connections
    this.friendConnections = [
      {
        id: uuidv4(),
        user1_id: '11111111-1111-1111-1111-111111111111',
        user2_id: '22222222-2222-2222-2222-222222222222',
        status: 'accepted',
        initiated_by: '11111111-1111-1111-1111-111111111111',
        match_score: 0.78,
        match_reasoning: 'High compatibility: both in San Francisco, shared wellness interests',
        created_at: new Date().toISOString()
      }
    ];

    // Save demo data
    await this.saveAllData();
    console.log('✅ Demo data created with users, places, and sample entries');
  }

  async saveAllData() {
    await Promise.all([
      this.writeFile('users.json', this.users),
      this.writeFile('entries.json', this.entries),
      this.writeFile('places.json', this.places),
      this.writeFile('connections.json', this.friendConnections),
      this.writeFile('questions.json', this.dailyQuestions)
    ]);
  }

  // User methods
  async findUserByEmail(email) {
    return this.users.find(user => user.email === email);
  }

  async findUserById(id) {
    return this.users.find(user => user.id === id);
  }

  async createUser(userData) {
    const user = {
      id: uuidv4(),
      ...userData,
      created_at: new Date().toISOString()
    };
    this.users.push(user);
    await this.writeFile('users.json', this.users);
    return user;
  }

  // Entry methods
  async createEntry(entryData) {
    const entry = {
      id: uuidv4(),
      ...entryData,
      created_at: new Date().toISOString()
    };
    this.entries.push(entry);
    console.log(`💾 Saving entry ${entry.id} to entries.json. Total entries: ${this.entries.length}`);
    await this.writeFile('entries.json', this.entries);
    console.log(`✅ Entry ${entry.id} saved successfully`);
    return entry;
  }

  async getUserEntries(userId, limit = 10) {
    return this.entries
      .filter(entry => entry.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
  }

  async getEntry(entryId, userId) {
    return this.entries.find(entry => entry.id === entryId && entry.user_id === userId);
  }

  // Places methods
  async getPlacesByMood(mood) {
    return this.places.filter(place => 
      place.mood_tags && place.mood_tags.includes(mood)
    );
  }

  async getAllPlaces() {
    return this.places;
  }

  // Daily questions
  async getRandomDailyQuestion() {
    const activeQuestions = this.dailyQuestions.filter(q => q.is_active);
    if (activeQuestions.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * activeQuestions.length);
    return activeQuestions[randomIndex];
  }

  // Friend matching
  async getFriendRecommendations(userId, limit = 5) {
    const user = await this.findUserById(userId);
    if (!user) return [];

    const recommendations = [];
    
    for (const otherUser of this.users) {
      if (otherUser.id === userId) continue;
      
      // Check if already connected
      const existingConnection = this.friendConnections.find(conn => 
        (conn.user1_id === userId && conn.user2_id === otherUser.id) ||
        (conn.user2_id === userId && conn.user1_id === otherUser.id)
      );
      
      if (existingConnection) continue;

      const matchScore = this.calculateMatchScore(user, otherUser);
      
      recommendations.push({
        user_id: otherUser.id,
        display_name: otherUser.display_name,
        city: otherUser.city,
        age: otherUser.age,
        interests: otherUser.interests,
        match_score: matchScore,
        avatar_color: otherUser.avatar_color
      });
    }

    return recommendations
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, limit);
  }

  calculateMatchScore(user1, user2) {
    let locationScore = 0;
    let ageScore = 0;
    let interestScore = 0;

    // Location matching (40% weight)
    if (user1.city && user2.city && user1.city.toLowerCase() === user2.city.toLowerCase()) {
      locationScore = 1.0;
    } else {
      locationScore = 0.1;
    }

    // Age compatibility (10% weight)
    if (user1.age && user2.age) {
      const ageDiff = Math.abs(user1.age - user2.age);
      if (ageDiff <= 3) {
        ageScore = 1.0;
      } else if (ageDiff <= 7) {
        ageScore = 0.8;
      } else if (ageDiff <= 12) {
        ageScore = 0.6;
      } else {
        ageScore = 0.4;
      }
    }

    // Interest overlap (15% weight) - Jaccard similarity
    if (user1.interests && user2.interests && user1.interests.length > 0 && user2.interests.length > 0) {
      const interests1 = new Set(user1.interests.map(i => i.toLowerCase()));
      const interests2 = new Set(user2.interests.map(i => i.toLowerCase()));
      
      const intersection = new Set([...interests1].filter(x => interests2.has(x)));
      const union = new Set([...interests1, ...interests2]);
      
      interestScore = intersection.size / union.size;
    }

    // Mood similarity (35% weight) - simplified to 0.5 for demo
    const moodScore = 0.5;

    // Weighted final score
    const finalScore = (locationScore * 0.4) + (moodScore * 0.35) + (interestScore * 0.15) + (ageScore * 0.1);
    
    return Math.round(finalScore * 1000) / 1000; // Round to 3 decimal places
  }
}

module.exports = LocalDatabase;