-- MindMate Database Schema
-- PostgreSQL/Supabase Schema for voice-first mental wellness app

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users table
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    age INTEGER CHECK (age >= 13 AND age <= 120),
    interests TEXT[] DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{
        "off_record_mode": false,
        "data_retention_days": 90,
        "share_mood_insights": true,
        "allow_friend_matching": true
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    email_verified BOOLEAN DEFAULT false,
    avatar_color VARCHAR(7) DEFAULT '#ff6b6b'
);

-- Voice entries table
CREATE TABLE entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emotion VARCHAR(20) NOT NULL CHECK (emotion IN ('happy', 'sad', 'angry', 'anxious', 'calm', 'neutral')),
    intensity DECIMAL(3,2) CHECK (intensity >= 0 AND intensity <= 1),
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    transcript TEXT,
    audio_path TEXT,
    audio_duration INTEGER, -- seconds
    question_prompt TEXT,
    supportive_response JSONB,
    analysis_data JSONB,
    privacy_mode BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Friend connections table
CREATE TABLE friend_connections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
    initiated_by UUID NOT NULL REFERENCES users(id),
    message TEXT,
    match_score DECIMAL(4,3) CHECK (match_score >= 0 AND match_score <= 1),
    match_reasoning TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user1_id, user2_id),
    CHECK (user1_id != user2_id)
);

-- Places table
CREATE TABLE places (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    address TEXT,
    city VARCHAR(100) NOT NULL,
    coordinates POINT,
    description TEXT,
    mood_tags TEXT[] DEFAULT '{}',
    mood_match_reasons JSONB,
    rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
    price_level INTEGER CHECK (price_level >= 1 AND price_level <= 4),
    opening_hours JSONB,
    contact JSONB,
    amenities TEXT[] DEFAULT '{}',
    google_place_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Place visits table
CREATE TABLE place_visits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    mood_at_visit VARCHAR(20),
    mood_match_rating DECIMAL(2,1) CHECK (mood_match_rating >= 0 AND mood_match_rating <= 5),
    notes TEXT,
    visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User feedback table (for improving emotion analysis)
CREATE TABLE entry_feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    correct_emotion VARCHAR(20) CHECK (correct_emotion IN ('happy', 'sad', 'angry', 'anxious', 'calm', 'neutral')),
    feedback_type VARCHAR(20) CHECK (feedback_type IN ('correct', 'incorrect', 'partially_correct')),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily questions table
CREATE TABLE daily_questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    question_text TEXT NOT NULL,
    category VARCHAR(50),
    difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    mood_focus VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions table (for analytics)
CREATE TABLE user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    device_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_city ON users(city);
CREATE INDEX idx_entries_user_id ON entries(user_id);
CREATE INDEX idx_entries_created_at ON entries(created_at);
CREATE INDEX idx_entries_emotion ON entries(emotion);
CREATE INDEX idx_friend_connections_user1 ON friend_connections(user1_id);
CREATE INDEX idx_friend_connections_user2 ON friend_connections(user2_id);
CREATE INDEX idx_friend_connections_status ON friend_connections(status);
CREATE INDEX idx_places_city ON places(city);
CREATE INDEX idx_places_type ON places(type);
CREATE INDEX idx_places_mood_tags ON places USING gin(mood_tags);
CREATE INDEX idx_place_visits_user_id ON place_visits(user_id);
CREATE INDEX idx_place_visits_place_id ON place_visits(place_id);

-- GIN index for full-text search on places
CREATE INDEX idx_places_search ON places USING gin(to_tsvector('english', name || ' ' || description));

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_entries_updated_at BEFORE UPDATE ON entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_friend_connections_updated_at BEFORE UPDATE ON friend_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_places_updated_at BEFORE UPDATE ON places FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate friend match score
CREATE OR REPLACE FUNCTION calculate_friend_match_score(
    user1_id UUID,
    user2_id UUID
) RETURNS DECIMAL AS $$
DECLARE
    location_score DECIMAL := 0;
    mood_score DECIMAL := 0;
    interest_score DECIMAL := 0;
    age_score DECIMAL := 0;
    final_score DECIMAL := 0;
    user1_city VARCHAR;
    user2_city VARCHAR;
    user1_age INTEGER;
    user2_age INTEGER;
    user1_interests TEXT[];
    user2_interests TEXT[];
    age_diff INTEGER;
    common_interests INTEGER;
    total_interests INTEGER;
BEGIN
    -- Get user data
    SELECT city, age, interests INTO user1_city, user1_age, user1_interests 
    FROM users WHERE id = user1_id;
    
    SELECT city, age, interests INTO user2_city, user2_age, user2_interests 
    FROM users WHERE id = user2_id;
    
    -- Calculate location match (40% weight)
    IF user1_city IS NOT NULL AND user2_city IS NOT NULL THEN
        IF LOWER(user1_city) = LOWER(user2_city) THEN
            location_score := 1.0;
        ELSE
            location_score := 0.1;
        END IF;
    END IF;
    
    -- Calculate age compatibility (5% weight)
    IF user1_age IS NOT NULL AND user2_age IS NOT NULL THEN
        age_diff := ABS(user1_age - user2_age);
        IF age_diff <= 3 THEN
            age_score := 1.0;
        ELSIF age_diff <= 7 THEN
            age_score := 0.8;
        ELSIF age_diff <= 12 THEN
            age_score := 0.6;
        ELSE
            age_score := 0.4;
        END IF;
    END IF;
    
    -- Calculate interest overlap (15% weight) - Jaccard similarity
    IF array_length(user1_interests, 1) > 0 AND array_length(user2_interests, 1) > 0 THEN
        SELECT 
            (SELECT count(*) FROM unnest(user1_interests) INTERSECT SELECT unnest(user2_interests)),
            (SELECT count(DISTINCT unnest) FROM (SELECT unnest(user1_interests) UNION SELECT unnest(user2_interests)) AS combined)
        INTO common_interests, total_interests;
        
        IF total_interests > 0 THEN
            interest_score := common_interests::DECIMAL / total_interests::DECIMAL;
        END IF;
    END IF;
    
    -- Calculate mood similarity (35% weight) - simplified for now
    -- This would normally analyze recent entries' emotions
    mood_score := 0.5; -- Default neutral similarity
    
    -- Weighted final score
    final_score := (location_score * 0.4) + (mood_score * 0.35) + (interest_score * 0.15) + (age_score * 0.05);
    
    RETURN ROUND(final_score, 3);
END;
$$ LANGUAGE plpgsql;

-- Function to get friend recommendations
CREATE OR REPLACE FUNCTION get_friend_recommendations(
    target_user_id UUID,
    limit_count INTEGER DEFAULT 10
) RETURNS TABLE (
    user_id UUID,
    display_name VARCHAR,
    city VARCHAR,
    age INTEGER,
    interests TEXT[],
    match_score DECIMAL,
    avatar_color VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.display_name,
        u.city,
        u.age,
        u.interests,
        calculate_friend_match_score(target_user_id, u.id) as match_score,
        u.avatar_color
    FROM users u
    WHERE u.id != target_user_id
    AND u.privacy_settings->>'allow_friend_matching' = 'true'
    AND NOT EXISTS (
        SELECT 1 FROM friend_connections fc 
        WHERE (fc.user1_id = target_user_id AND fc.user2_id = u.id)
        OR (fc.user2_id = target_user_id AND fc.user1_id = u.id)
    )
    ORDER BY match_score DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Insert default daily questions
INSERT INTO daily_questions (question_text, category, difficulty_level, mood_focus) VALUES
('Tell me in about thirty seconds: what was one moment from today that sticks with you?', 'reflection', 2, 'neutral'),
('How are you feeling right now, and what''s been on your mind today?', 'emotions', 1, 'neutral'),
('What''s one thing that happened today that you''d like to share with me?', 'daily_events', 1, 'neutral'),
('Take a moment to reflect - what emotion has been most present for you today?', 'emotions', 3, 'neutral'),
('In your own words, how would you describe your day and how you''re feeling?', 'reflection', 2, 'neutral'),
('What''s something from today that you''d like to talk through with me?', 'processing', 3, 'neutral'),
('Tell me about your day - what''s been the strongest feeling you''ve experienced?', 'emotions', 2, 'neutral'),
('Share with me what''s been in your heart and mind today.', 'reflection', 4, 'neutral'),
('What''s one thing you''re grateful for today, and how does it make you feel?', 'gratitude', 2, 'happy'),
('If you could change one thing about today, what would it be and why?', 'reflection', 4, 'sad'),
('What gave you energy today, and what drained your energy?', 'energy', 3, 'neutral'),
('Describe a moment today when you felt most like yourself.', 'identity', 4, 'calm'),
('What''s been challenging you lately, and how are you dealing with it?', 'challenges', 4, 'anxious'),
('Tell me about something that made you smile or laugh today.', 'joy', 1, 'happy'),
('What''s been weighing on your mind, and how can I help you process it?', 'concerns', 4, 'anxious');

-- Insert sample places for San Francisco
INSERT INTO places (name, type, address, city, mood_tags, mood_match_reasons, rating, price_level, description) VALUES
('Golden Gate Park', 'park', '501 Stanyan St, San Francisco, CA 94117', 'San Francisco', 
 ARRAY['calm', 'happy', 'peaceful'], 
 '{"calm": "Wide open spaces and peaceful gardens provide a tranquil environment", "happy": "Beautiful scenery and recreational activities lift spirits", "sad": "Quiet benches and natural beauty offer comfort and solitude"}',
 4.6, 1, 'A large urban park with gardens, trails, and peaceful spots perfect for reflection.'),

('Dolores Park', 'park', '19th St & Dolores St, San Francisco, CA 94114', 'San Francisco',
 ARRAY['happy', 'social', 'energetic'],
 '{"happy": "Vibrant community atmosphere and beautiful city views", "calm": "Grassy areas perfect for peaceful contemplation", "anxious": "Open space and fresh air help ease worried minds"}',
 4.4, 1, 'Popular park with stunning city views, perfect for picnics and people-watching.'),

('Crissy Field', 'beach_park', '1199 E Beach, San Francisco, CA 94129', 'San Francisco',
 ARRAY['calm', 'refreshing', 'spacious'],
 '{"calm": "Ocean sounds and wide open spaces create a meditative environment", "sad": "Healing power of nature and water", "happy": "Beautiful Golden Gate Bridge views inspire joy"}',
 4.7, 1, 'Waterfront park with Golden Gate Bridge views and peaceful beach access.'),

('SF Museum of Modern Art', 'museum', '151 3rd St, San Francisco, CA 94103', 'San Francisco',
 ARRAY['contemplative', 'inspiring', 'quiet'],
 '{"sad": "Art provides comfort and perspective during difficult times", "calm": "Quiet galleries offer peaceful reflection", "anxious": "Structured environment helps focus scattered thoughts"}',
 4.5, 3, 'World-class modern art museum with thought-provoking exhibitions.'),

('Blue Bottle Coffee', 'cafe', '66 Mint St, San Francisco, CA 94103', 'San Francisco',
 ARRAY['cozy', 'social', 'comfortable'],
 '{"neutral": "Comfortable spot for regular daily routines", "calm": "Quiet atmosphere perfect for reflection", "sad": "Warm environment provides gentle comfort"}',
 4.3, 2, 'Artisanal coffee shop with carefully crafted beverages and cozy atmosphere.');

-- Create RLS (Row Level Security) policies for Supabase
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_feedback ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Users can read/write their own entries
CREATE POLICY "Users can view own entries" ON entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own entries" ON entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own entries" ON entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own entries" ON entries FOR DELETE USING (auth.uid() = user_id);

-- Friend connections policies
CREATE POLICY "Users can view own friend connections" ON friend_connections 
FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create friend connections" ON friend_connections 
FOR INSERT WITH CHECK (auth.uid() = initiated_by);

CREATE POLICY "Users can update friend connections" ON friend_connections 
FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Place visits policies
CREATE POLICY "Users can view own place visits" ON place_visits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own place visits" ON place_visits FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Places are public for reading
CREATE POLICY "Places are publicly readable" ON places FOR SELECT TO authenticated USING (true);

-- Entry feedback policies
CREATE POLICY "Users can create feedback for own entries" ON entry_feedback 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback" ON entry_feedback 
FOR SELECT USING (auth.uid() = user_id);