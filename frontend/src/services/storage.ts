/**
 * Local Storage Service
 * Provides offline storage when backend is unavailable
 */

export interface Entry {
  id: string
  userId: string
  timestamp: string
  transcript: string
  emotionalState?: {
    dominant_emotion: string
    emotions: Record<string, number>
    sentiment_score: number
    confidence: number
  }
  insights?: {
    themes: string[]
    concerns: string[]
    positive_aspects: string[]
    recommendations: string[]
  }
}

export interface Conversation {
  id: string
  userId: string
  startTime: string
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }>
}

const STORAGE_KEYS = {
  ENTRIES: 'mindmate_entries',
  CONVERSATIONS: 'mindmate_conversations',
  USER: 'mindmate_user',
}

export class LocalStorageService {
  // Entries
  static saveEntry(entry: Entry): void {
    const entries = this.getEntries()
    entries.push(entry)
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries))
  }

  static getEntries(): Entry[] {
    const data = localStorage.getItem(STORAGE_KEYS.ENTRIES)
    return data ? JSON.parse(data) : []
  }

  static getEntry(id: string): Entry | null {
    const entries = this.getEntries()
    return entries.find(e => e.id === id) || null
  }

  static deleteEntry(id: string): void {
    const entries = this.getEntries().filter(e => e.id !== id)
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries))
  }

  // Conversations
  static saveConversation(conversation: Conversation): void {
    const conversations = this.getConversations()
    const index = conversations.findIndex(c => c.id === conversation.id)
    if (index >= 0) {
      conversations[index] = conversation
    } else {
      conversations.push(conversation)
    }
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations))
  }

  static getConversations(): Conversation[] {
    const data = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS)
    return data ? JSON.parse(data) : []
  }

  static getConversation(id: string): Conversation | null {
    const conversations = this.getConversations()
    return conversations.find(c => c.id === id) || null
  }

  // User
  static saveUser(user: any): void {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
  }

  static getUser(): any {
    const data = localStorage.getItem(STORAGE_KEYS.USER)
    return data ? JSON.parse(data) : null
  }

  static clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key))
  }

  // Generate mock analysis for demo mode
  static generateMockAnalysis(transcript: string) {
    const emotions = ['joy', 'sadness', 'anxiety', 'calm', 'stress', 'contentment']
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)]
    
    return {
      dominant_emotion: randomEmotion,
      emotions: {
        [randomEmotion]: Math.random() * 0.5 + 0.5,
        [emotions[Math.floor(Math.random() * emotions.length)]]: Math.random() * 0.3,
      },
      sentiment_score: Math.random() * 2 - 1, // -1 to 1
      confidence: Math.random() * 0.3 + 0.7, // 0.7 to 1
      insights: {
        themes: ['Self-reflection', 'Daily activities'],
        concerns: [],
        positive_aspects: ['Openness to sharing', 'Self-awareness'],
        recommendations: [
          'Continue regular check-ins',
          'Practice mindfulness',
          'Maintain a gratitude journal',
        ],
      },
    }
  }

  // Generate mock conversation response
  static generateMockResponse(userMessage: string, questionNumber: number): string {
    const responses = [
      "Thank you for sharing that. It sounds like you're processing some important thoughts. Can you tell me more about how that made you feel?",
      "I appreciate you opening up about this. What do you think contributed to those feelings?",
      "That's a valuable insight. How has this been affecting your daily life?",
      "It's great that you're reflecting on this. What would help you feel better about this situation?",
      "Thank you for being so honest. Is there anything specific you'd like to work on based on this?",
    ]
    
    return responses[questionNumber % responses.length] || responses[0]
  }
}
