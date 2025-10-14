# 🧠 MindMate - Voice-First Mental Wellness PWA

A privacy-focused, voice-driven Progressive Web App for daily emotional check-ins with AI-powered friend matching and mood-aware place recommendations.

![MindMate Demo](https://via.placeholder.com/800x400/667eea/ffffff?text=MindMate+Voice-First+Mental+Wellness+PWA)

> **"Your voice matters. Your feelings matter. You matter."** - Hrudhi, your AI wellness companion

## ✨ Core Features

### 🎙️ Voice-First Experience with Hrudhi
- **30-40 Second Check-ins**: Quick daily emotional processing through natural conversation
- **Empathetic AI Companion**: Hrudhi provides warm, supportive responses using advanced NLP
- **Real-time Emotion Detection**: Analyzes voice tone, keywords, and sentiment patterns
- **Natural Language Processing**: Understands context, emotions, and underlying concerns

### 🤝 Intelligent Friend Matching Algorithm
```
Match Score = (Location × 0.4) + (Mood Compatibility × 0.35) + (Interests × 0.15) + (Age/Other × 0.1)
```

- **Mood-Based Matching**: Connect with people experiencing similar emotional journeys
- **Location Awareness**: Find friends in your city using precise geographic matching
- **Interest Overlap**: Jaccard similarity for shared hobbies and lifestyle preferences
- **Privacy-Controlled**: You control all sharing preferences and matching criteria

### 📍 Mood-Aware Place Recommendations
- **Emotion-Matched Venues**: AI suggests cafes, parks, museums based on your current mood
- **Community Insights**: Learn how different places affect others' wellbeing and energy
- **Local Discovery**: Curated recommendations for San Francisco, Oakland, and expanding cities
- **Mood History Integration**: Tracks which places work best for your emotional needs

### 🔒 Privacy-First Architecture
- **Off-the-Record Mode**: Sensitive conversations are processed locally and never stored
- **Data Retention Control**: Choose 30, 60, or 90-day data retention periods
- **Local Voice Processing**: Browser-based speech recognition when possible
- **No Third-Party Tracking**: Your mental health data never leaves your control

## 🚀 One-Click Setup

### Quick Start (Recommended)
```bash
git clone https://github.com/yourusername/MindMate.git
cd MindMate
cp .env.example .env
docker-compose up -d
```

**✨ That's it!** Visit `http://localhost:3000` and start your first voice check-in.

### What's Included
- **Frontend**: React PWA at http://localhost:3000
- **Backend API**: Node.js Express server at http://localhost:5000  
- **Database**: PostgreSQL with pre-loaded demo data
- **Storage**: Minio for audio files at http://localhost:9001
- **Demo Users**: 8 sample users with varied interests and emotions

### Quick Test
1. Navigate to http://localhost:3000
2. Click "Start Voice Check-in with Hrudhi"
3. Allow microphone permissions
4. Talk for 30-40 seconds about your day
5. Experience emotion detection and friend recommendations!

## 🏗️ Architecture & Technology

### Frontend Stack
```typescript
React 18 + TypeScript + Vite
├── Tailwind CSS + Framer Motion (UI/UX)
├── Zustand (State Management)  
├── React Router (Navigation)
├── PWA + Service Worker (Offline)
└── Web Speech API (Voice)
```

### Backend Stack
```javascript
Node.js + Express + PostgreSQL
├── JWT Authentication + bcrypt
├── Emotion Analysis Pipeline
├── Friend Matching Algorithm
├── Rate Limiting + Security
└── Minio S3 Storage
```

### Key Algorithms

#### Emotion Detection Pipeline
```javascript
// Multi-layered emotion analysis
const emotionAnalysis = {
  textAnalysis: analyzeKeywords(transcript),
  sentimentScore: calculateSentiment(text),
  voiceMetrics: analyzeTone(audioBuffer), // Future: voice tone
  confidence: fuseAnalysisResults(analyses)
}
```

#### Friend Matching Algorithm  
```sql
-- PostgreSQL function with weighted scoring
CREATE FUNCTION calculate_friend_match_score(user1_id, user2_id) 
RETURNS DECIMAL AS $$
  -- Location: 40% weight (same city = 1.0, different = 0.1)
  -- Mood: 35% weight (cosine similarity of recent emotions)
  -- Interests: 15% weight (Jaccard similarity)
  -- Age: 10% weight (closer age = higher score)
$$;
```

## 📱 Progressive Web App Features

### 🔧 PWA Capabilities
- **📱 Install Prompt**: Add to home screen like native app
- **⚡ Offline Mode**: Core features work without internet connection
- **🔄 Background Sync**: Voice entries sync automatically when online
- **🔔 Push Notifications**: Optional gentle reminders (respects privacy)
- **📱 Mobile Optimized**: Touch-friendly interface with voice-first design

### 🎯 Service Worker Features
```javascript
// Advanced caching strategies
- Network-first for API calls
- Cache-first for static assets  
- Offline voice entry storage
- Background sync for pending data
- Automatic app updates
```

## 🗄️ Database Schema & Demo Data

### Core Tables
```sql
users              -- User profiles, interests, privacy settings
entries            -- Voice check-ins with emotion analysis
friend_connections -- Relationship management with match scores
places             -- Mood-aware venue recommendations  
daily_questions    -- Rotating conversation prompts
```

### Pre-loaded Demo Data
- **8 Demo Users**: Alex, Sarah, Mike, Emma, David, Lisa, James, Maria
- **Diverse Locations**: San Francisco, Oakland, Berkeley
- **Sample Emotions**: Happy, anxious, calm, sad, neutral moods
- **Friend Connections**: Existing matches demonstrating algorithm
- **SF Bay Area Places**: Golden Gate Park, Dolores Park, Crissy Field, etc.

## 🧪 Testing the Friend Matching

```sql
-- Test friend recommendations for Alex Chen
SELECT * FROM get_friend_recommendations('11111111-1111-1111-1111-111111111111', 5);

-- Expected results:
-- Emma Wilson (0.83 match) - same city, shared meditation/hiking interests
-- Sarah Johnson (0.71 match) - same city, shared wellness interests  
-- Lisa Park (0.65 match) - same city, photography overlap
```

## 🔧 Environment Configuration

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ENABLE_ANALYTICS=false
VITE_ENVIRONMENT=development
```

### Backend (.env) 
```env
# Database
DATABASE_URL=postgresql://mindmate:password@localhost:5432/mindmate

# Authentication  
JWT_SECRET=your_super_secret_jwt_key_256_bit_minimum
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# Storage
MINIO_ENDPOINT=localhost
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=password123

# External APIs
OPENAI_API_KEY=sk-your_openai_key_for_whisper_api
GOOGLE_PLACES_API_KEY=your_google_places_key
```

## 🌐 API Documentation

### Voice & Emotion Endpoints
```bash
POST /api/entries              # Submit voice check-in with emotion analysis
GET  /api/entries              # Retrieve user's emotional history
POST /api/voice/analyze        # Real-time emotion analysis  
POST /api/feedback/:entryId    # Improve emotion detection accuracy
```

### Social & Matching Endpoints
```bash
GET  /api/friends              # Get AI-powered friend recommendations
POST /api/friends/connect      # Send friend connection request
GET  /api/places               # Get mood-based place suggestions
POST /api/places/visit         # Log place visit with mood rating
```

### Authentication & User Management
```bash
POST /api/auth/register        # Create new user account
POST /api/auth/login           # Authenticate user session
GET  /api/users/profile        # Get/update user profile
PUT  /api/users/privacy        # Update privacy settings
```

## 🚀 Deployment Options

### Quick Cloud Deploy (Recommended)
```bash
# Option 1: Vercel + Supabase (Zero config)
cd frontend && npx vercel --prod
# Use Supabase for database + storage

# Option 2: Netlify + Railway  
cd frontend && npx netlify deploy --prod
# Use Railway for backend + database
```

### Production Docker
```bash
# Full production setup with SSL
docker-compose -f docker-compose.prod.yml up -d
```

**Full deployment guide**: See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive production setup instructions.

## 🎯 Development Roadmap

### Phase 1: Core MVP ✅ (Current)
- [x] Voice recording and transcription  
- [x] Multi-layered emotion detection
- [x] Advanced friend matching algorithm with weighted scoring
- [x] PWA with offline support
- [x] Complete database schema with demo data
- [x] Mood-aware place recommendations

### Phase 2: Enhanced AI 🚧 (Q1 2024)
- [ ] Voice tone analysis (pitch, pace, energy)
- [ ] Personalized conversation patterns and memory
- [ ] Longitudinal mood trend analysis  
- [ ] Integration with mental health resource APIs
- [ ] Advanced place recommendation ML model

### Phase 3: Social Platform 🔮 (Q2 2024)
- [ ] In-app messaging with matched friends
- [ ] Group emotional check-ins and challenges
- [ ] Anonymous peer support circles
- [ ] Mental wellness coach marketplace
- [ ] Community-driven place reviews

### Phase 4: Platform Expansion 🌟 (Q3-Q4 2024)
- [ ] iOS/Android native apps with platform-specific features
- [ ] Apple Watch/Fitbit integration for passive mood tracking
- [ ] Mental health provider dashboard and API
- [ ] Enterprise wellness platform for companies

## 🤝 Contributing

We welcome contributions from developers, designers, and mental health advocates!

### Quick Start for Contributors
```bash
# 1. Fork and clone
git clone https://github.com/yourusername/MindMate.git
cd MindMate

# 2. Create feature branch
git checkout -b feature/emotion-analysis-improvement

# 3. Start development environment
docker-compose up -d
cd frontend && npm run dev

# 4. Make changes and test
npm run test
npm run lint

# 5. Submit pull request
git push origin feature/emotion-analysis-improvement
```

### Areas We Need Help
- **🧠 AI/ML**: Improve emotion detection accuracy
- **🎨 Design**: Enhance UI/UX for mental wellness
- **🔊 Voice**: Advanced speech recognition and tone analysis
- **📱 Mobile**: iOS/Android native app development
- **🏥 Clinical**: Mental health expert review and validation

## 📊 Privacy & Ethics

### Privacy Principles
- **Data Minimization**: We only collect what's necessary for functionality
- **User Control**: Complete control over data sharing and retention
- **Local Processing**: Voice analysis happens on-device when possible
- **Transparent AI**: Clear explanations of how emotion detection works

### Ethical Considerations  
- **Non-Clinical**: We provide wellness support, not medical diagnosis
- **Bias Awareness**: Ongoing work to ensure algorithm fairness across demographics
- **Crisis Support**: Clear pathways to professional help when needed
- **Consent-First**: Explicit permission for all data uses

## 🏥 Important Mental Health Notice

**MindMate is a wellness support tool and is not a substitute for professional mental healthcare.**

### When to Seek Professional Help
- Persistent feelings of sadness, hopelessness, or anxiety
- Thoughts of self-harm or suicide
- Substance abuse or addiction concerns
- Significant impact on daily functioning

### Crisis Resources
- **US**: National Suicide Prevention Lifeline: **988**
- **UK**: Samaritans: **116 123**  
- **Canada**: Talk Suicide Canada: **1-833-456-4566**
- **Global**: Emergency services: **911/999/112**

## 📄 License & Acknowledgments

### License
This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

### Acknowledgments
- **OpenAI**: Whisper API for voice recognition technology
- **Mental Health America**: Guidance on ethical wellness technology
- **Open Source Community**: Libraries and tools that make this possible
- **Beta Testers**: Early users providing invaluable feedback

### Built With ❤️
Created with passion for mental wellness, meaningful human connections, and the belief that technology can support our emotional well-being.

---

**"In a world where you can be anything, be kind to yourself."** 🧠💚