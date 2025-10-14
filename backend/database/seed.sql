-- MindMate Seed Data
-- Sample data for development and testing

-- Insert sample users (hashed passwords are for 'password123')
INSERT INTO users (id, email, password_hash, display_name, city, age, interests, avatar_color) VALUES
('11111111-1111-1111-1111-111111111111', 'alex@example.com', '$2b$10$GRLdNijSMhkdCjGl1w3qEu7rZuQU4/C9kZGCZWaE1QpN6x8jSXcWm', 'Alex Chen', 'San Francisco', 28, 
 ARRAY['meditation', 'hiking', 'photography', 'reading'], '#ff6b6b'),

('22222222-2222-2222-2222-222222222222', 'sarah@example.com', '$2b$10$GRLdNijSMhkdCjGl1w3qEu7rZuQU4/C9kZGCZWaE1QpN6x8jSXcWm', 'Sarah Johnson', 'San Francisco', 32, 
 ARRAY['yoga', 'cooking', 'gardening', 'art'], '#4ecdc4'),

('33333333-3333-3333-3333-333333333333', 'mike@example.com', '$2b$10$GRLdNijSMhkdCjGl1w3qEu7rZuQU4/C9kZGCZWaE1QpN6x8jSXcWm', 'Mike Rodriguez', 'San Francisco', 26, 
 ARRAY['music', 'cycling', 'technology', 'coffee'], '#45b7d1'),

('44444444-4444-4444-4444-444444444444', 'emma@example.com', '$2b$10$GRLdNijSMhkdCjGl1w3qEu7rZuQU4/C9kZGCZWaE1QpN6x8jSXcWm', 'Emma Wilson', 'San Francisco', 29, 
 ARRAY['writing', 'meditation', 'hiking', 'mindfulness'], '#f7b731'),

('55555555-5555-5555-5555-555555555555', 'david@example.com', '$2b$10$GRLdNijSMhkdCjGl1w3qEu7rZuQU4/C9kZGCZWaE1QpN6x8jSXcWm', 'David Kim', 'Oakland', 31, 
 ARRAY['fitness', 'cooking', 'travel', 'podcasts'], '#5f27cd'),

('66666666-6666-6666-6666-666666666666', 'lisa@example.com', '$2b$10$GRLdNijSMhkdCjGl1w3qEu7rZuQU4/C9kZGCZWaE1QpN6x8jSXcWm', 'Lisa Park', 'San Francisco', 27, 
 ARRAY['dance', 'photography', 'nature', 'wellness'], '#ff9ff3'),

('77777777-7777-7777-7777-777777777777', 'james@example.com', '$2b$10$GRLdNijSMhkdCjGl1w3qEu7rZuQU4/C9kZGCZWaE1QpN6x8jSXcWm', 'James Thompson', 'San Francisco', 34, 
 ARRAY['reading', 'philosophy', 'tea', 'meditation'], '#54a0ff'),

('88888888-8888-8888-8888-888888888888', 'maria@example.com', '$2b$10$GRLdNijSMhkdCjGl1w3qEu7rZuQU4/C9kZGCZWaE1QpN6x8jSXcWm', 'Maria Santos', 'Berkeley', 25, 
 ARRAY['art', 'music', 'volunteering', 'sustainable_living'], '#26de81');

-- Insert sample voice entries
INSERT INTO entries (id, user_id, emotion, intensity, confidence, transcript, question_prompt, supportive_response, analysis_data, created_at) VALUES
('e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'calm', 0.75, 0.88, 
 'Today was really peaceful. I spent the morning in the park reading and just feeling grateful for the quiet moments. The weather was perfect and I felt so present.',
 'How are you feeling right now, and what''s been on your mind today?',
 '{"message": "It sounds like you found some beautiful moments of peace today. That sense of presence and gratitude is so valuable. How wonderful that you could connect with nature and find that stillness.", "suggestions": ["Try visiting Golden Gate Park for more peaceful moments", "Consider exploring mindfulness practices"], "tone": "gentle"}',
 '{"keywords_found": ["peaceful", "grateful", "quiet", "present"], "sentiment_score": 0.82, "energy_level": "calm", "themes": ["gratitude", "nature", "mindfulness"]}',
 NOW() - INTERVAL '2 hours'),

('e2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'anxious', 0.65, 0.76,
 'I''ve been feeling really overwhelmed with work lately. There''s so much on my plate and I keep worrying about whether I''m doing enough. My mind just won''t quiet down.',
 'What''s been challenging you lately, and how are you dealing with it?',
 '{"message": "It sounds like you''re carrying a lot right now. That feeling of overwhelm is so real, and it makes sense that your mind is racing. Remember that you''re doing your best, and it''s okay to take things one step at a time.", "suggestions": ["Try some deep breathing exercises", "Consider breaking tasks into smaller steps"], "tone": "supportive"}',
 '{"keywords_found": ["overwhelmed", "worrying", "mind won''t quiet"], "sentiment_score": -0.45, "energy_level": "high", "themes": ["work_stress", "anxiety", "overwhelm"]}',
 NOW() - INTERVAL '4 hours'),

('e3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'happy', 0.82, 0.91,
 'Had an amazing day! Got to jam with some friends, discovered this incredible new coffee shop, and just felt so connected to everyone around me. Life feels really good right now.',
 'Tell me about something that made you smile or laugh today.',
 '{"message": "What a beautiful day you''ve had! I can feel the joy and connection in your voice. Those moments of feeling truly connected to others and discovering new places are so special. It''s wonderful when life feels this good.", "suggestions": ["Share this positive energy with friends", "Visit more local coffee shops"], "tone": "celebratory"}',
 '{"keywords_found": ["amazing", "incredible", "connected", "good"], "sentiment_score": 0.89, "energy_level": "high", "themes": ["social_connection", "discovery", "joy"]}',
 NOW() - INTERVAL '1 hour'),

('e4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'sad', 0.58, 0.73,
 'I''ve been thinking a lot about my grandmother who passed away last month. Some days are harder than others. Today I just miss her voice and her stories so much.',
 'What''s been in your heart and mind today?',
 '{"message": "I can hear how much your grandmother meant to you, and how deeply you''re feeling her absence. Grief moves in waves, and it''s completely natural to have these harder days. Your love for her and those precious memories of her voice and stories are something beautiful to hold onto.", "suggestions": ["Consider writing down her stories", "Visit a peaceful place for reflection"], "tone": "compassionate"}',
 '{"keywords_found": ["miss", "passed away", "harder", "stories"], "sentiment_score": -0.62, "energy_level": "low", "themes": ["grief", "loss", "family", "memories"]}',
 NOW() - INTERVAL '6 hours'),

('e5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'neutral', 0.45, 0.82,
 'Just a regular Tuesday. Work was fine, had lunch, went for a walk. Nothing particularly exciting but also nothing bad. Just feeling steady, I guess.',
 'How would you describe your day and how you''re feeling?',
 '{"message": "There''s something really valuable about those steady, calm days. Sometimes we don''t need excitement - just that sense of things being okay and moving along peacefully. That steadiness you''re feeling is its own kind of good.", "suggestions": ["Enjoy the peace of routine", "Take note of small positive moments"], "tone": "affirming"}',
 '{"keywords_found": ["regular", "fine", "steady"], "sentiment_score": 0.12, "energy_level": "medium", "themes": ["routine", "stability", "contentment"]}',
 NOW() - INTERVAL '3 hours');

-- Insert sample friend connections
INSERT INTO friend_connections (user1_id, user2_id, status, initiated_by, match_score, match_reasoning, created_at) VALUES
('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'accepted', '11111111-1111-1111-1111-111111111111', 0.78,
 'High compatibility: both in San Francisco, share interests in meditation and hiking, similar age range', NOW() - INTERVAL '5 days'),

('22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'accepted', '22222222-2222-2222-2222-222222222222', 0.71,
 'Good match: same city, shared interests in photography and wellness, close age range', NOW() - INTERVAL '3 days'),

('33333333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777', 'pending', '33333333-3333-3333-3333-333333333333', 0.65,
 'Moderate match: both in San Francisco, different interests but complementary personalities', NOW() - INTERVAL '1 day'),

('44444444-4444-4444-4444-444444444444', '77777777-7777-7777-7777-777777777777', 'accepted', '44444444-4444-4444-4444-444444444444', 0.83,
 'Excellent match: same city, shared meditation and reading interests, similar contemplative nature', NOW() - INTERVAL '7 days');

-- Insert sample place visits
INSERT INTO place_visits (user_id, place_id, mood_at_visit, mood_match_rating, notes, visited_at) VALUES
-- Alex visiting Golden Gate Park
((SELECT id FROM users WHERE email = 'alex@example.com'), 
 (SELECT id FROM places WHERE name = 'Golden Gate Park'), 
 'calm', 5.0, 'Perfect place for morning reflection. The Japanese Tea Garden was especially peaceful.', 
 NOW() - INTERVAL '2 days'),

-- Sarah visiting Dolores Park
((SELECT id FROM users WHERE email = 'sarah@example.com'), 
 (SELECT id FROM places WHERE name = 'Dolores Park'), 
 'happy', 4.5, 'Great energy here! Perfect for yoga practice and people watching.', 
 NOW() - INTERVAL '1 week'),

-- Mike visiting Blue Bottle Coffee
((SELECT id FROM users WHERE email = 'mike@example.com'), 
 (SELECT id FROM places WHERE name = 'Blue Bottle Coffee'), 
 'neutral', 4.0, 'Good coffee and quiet atmosphere. Perfect for working.', 
 NOW() - INTERVAL '3 days'),

-- Emma visiting SFMOMA
((SELECT id FROM users WHERE email = 'emma@example.com'), 
 (SELECT id FROM places WHERE name = 'SF Museum of Modern Art'), 
 'contemplative', 4.8, 'The contemporary art exhibition really helped me process some difficult emotions.', 
 NOW() - INTERVAL '5 days');

-- Insert more sample places for variety
INSERT INTO places (name, type, address, city, mood_tags, mood_match_reasons, rating, price_level, description) VALUES
('Sutro Baths Ruins', 'historic_site', 'Point Lobos Ave, San Francisco, CA 94121', 'San Francisco',
 ARRAY['contemplative', 'melancholic', 'peaceful'],
 '{"sad": "Historic ruins by the ocean provide space for contemplation and healing", "calm": "Ocean sounds and dramatic scenery create meditative atmosphere", "contemplative": "Rich history and ocean views inspire deep reflection"}',
 4.3, 1, 'Historic ruins overlooking the Pacific Ocean, perfect for contemplation and reflection.'),

('Ferry Building Marketplace', 'market', '1 Ferry Building, San Francisco, CA 94111', 'San Francisco',
 ARRAY['energizing', 'social', 'inspiring'],
 '{"happy": "Vibrant marketplace with local artisans and delicious food", "neutral": "Bustling atmosphere provides gentle stimulation", "calm": "Beautiful bay views from the outdoor seating"}',
 4.5, 2, 'Historic ferry building with artisanal food vendors and beautiful bay views.'),

('Lands End Lookout', 'scenic_viewpoint', '680 Point Lobos Ave, San Francisco, CA 94121', 'San Francisco',
 ARRAY['awe-inspiring', 'peaceful', 'restorative'],
 '{"anxious": "Expansive ocean views help put worries in perspective", "sad": "Natural beauty provides comfort and hope", "calm": "Dramatic coastline creates sense of peace and wonder"}',
 4.7, 1, 'Dramatic coastal viewpoint with trails and stunning Pacific Ocean vistas.'),

('The Fillmore', 'music_venue', '1805 Geary Blvd, San Francisco, CA 94115', 'San Francisco',
 ARRAY['energetic', 'creative', 'expressive'],
 '{"happy": "Live music and creative energy amplify positive emotions", "neutral": "Artistic atmosphere provides gentle stimulation", "sad": "Music can be deeply healing and cathartic"}',
 4.4, 3, 'Historic music venue known for legendary performances and intimate atmosphere.'),

('Baker Beach', 'beach', 'Gibson Rd, San Francisco, CA 94129', 'San Francisco',
 ARRAY['peaceful', 'romantic', 'reflective'],
 '{"calm": "Sandy beach with Golden Gate Bridge views creates tranquil setting", "sad": "Ocean waves and natural beauty provide comfort", "happy": "Beautiful sunsets and beach activities boost mood"}',
 4.6, 1, 'Sandy beach with stunning Golden Gate Bridge views, perfect for sunset watching.');

-- Insert more Oakland places for users in different cities
INSERT INTO places (name, type, address, city, mood_tags, mood_match_reasons, rating, price_level, description) VALUES
('Redwood Regional Park', 'park', '7867 Redwood Rd, Oakland, CA 94619', 'Oakland',
 ARRAY['grounding', 'peaceful', 'restorative'],
 '{"anxious": "Ancient redwoods provide grounding and perspective", "sad": "Forest environment offers healing and renewal", "calm": "Quiet trails among towering trees create deep peace"}',
 4.8, 1, 'Beautiful park with towering redwood groves and peaceful hiking trails.'),

('Lake Merritt', 'lake_park', '1520 Lakeside Dr, Oakland, CA 94612', 'Oakland',
 ARRAY['active', 'social', 'refreshing'],
 '{"happy": "Vibrant community space with activities and beautiful lake views", "neutral": "Perfect for walks and gentle exercise", "calm": "Peaceful water views and bird watching opportunities"}',
 4.4, 1, 'Urban lake with walking paths, gardens, and vibrant community activities.'),

('Oakland Museum of California', 'museum', '1000 Oak St, Oakland, CA 94607', 'Oakland',
 ARRAY['inspiring', 'educational', 'cultural'],
 '{"contemplative": "Art and history exhibitions inspire deep thinking", "neutral": "Engaging exhibits provide gentle mental stimulation", "sad": "Cultural connection and learning can provide comfort"}',
 4.2, 2, 'Museum showcasing California art, history, and natural sciences.');

-- Insert sample entry feedback
INSERT INTO entry_feedback (entry_id, user_id, correct_emotion, feedback_type, comments) VALUES
('e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'calm', 'correct', 
 'Yes, that captured my mood perfectly. I was feeling very peaceful and grateful.'),

('e2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'anxious', 'correct',
 'Definitely anxious. The analysis picked up on my work stress really well.'),

('e3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'happy', 'correct',
 'Absolutely! I was feeling amazing that day. Great job detecting the joy.'),

('e4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'sad', 'partially_correct',
 'Mostly correct, though there was also some gratitude mixed in with the sadness.'),

('e5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'neutral', 'correct',
 'Yes, neutral captures it well. Just a regular, steady day.');

-- Update some user last_login times
UPDATE users SET last_login = NOW() - INTERVAL '30 minutes' WHERE email = 'alex@example.com';
UPDATE users SET last_login = NOW() - INTERVAL '2 hours' WHERE email = 'sarah@example.com';
UPDATE users SET last_login = NOW() - INTERVAL '1 day' WHERE email = 'mike@example.com';
UPDATE users SET last_login = NOW() - INTERVAL '3 hours' WHERE email = 'emma@example.com';
UPDATE users SET last_login = NOW() - INTERVAL '45 minutes' WHERE email = 'david@example.com';

-- Test the friend matching function with some sample queries
-- (These are informational - you can run them to test the matching)
/*
-- Test friend recommendations for Alex
SELECT * FROM get_friend_recommendations('11111111-1111-1111-1111-111111111111', 5);

-- Test friend recommendations for Sarah
SELECT * FROM get_friend_recommendations('22222222-2222-2222-2222-222222222222', 5);

-- Test manual match score calculation
SELECT calculate_friend_match_score('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444');
*/