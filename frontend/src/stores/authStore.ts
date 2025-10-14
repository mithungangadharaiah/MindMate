import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import toast from 'react-hot-toast'

export interface User {
  id: string
  email: string
  display_name: string
  city?: string
  age?: number
  interests: string[]
  privacy_settings?: {
    off_record_mode: boolean
    data_retention_days: number
  }
  created_at: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthActions {
  setUser: (user: User) => void
  setToken: (token: string) => void
  login: (email: string, password: string) => Promise<boolean>
  register: (userData: Partial<User> & { password: string }) => Promise<boolean>
  logout: () => void
  checkAuth: () => void
  updateProfile: (updates: Partial<User>) => Promise<boolean>
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      // Actions
      setUser: (user) => {
        set({ user, isAuthenticated: !!user })
      },

      setToken: (token) => {
        set({ token })
        if (token) {
          localStorage.setItem('auth_token', token)
        } else {
          localStorage.removeItem('auth_token')
        }
      },

      login: async (email, password) => {
        set({ isLoading: true })
        
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          })

          const data = await response.json()

          if (response.ok) {
            const { user, token } = data
            get().setUser(user)
            get().setToken(token)
            toast.success(`Welcome back, ${user.display_name}!`)
            return true
          } else {
            toast.error(data.error || 'Login failed')
            return false
          }
        } catch (error) {
          console.error('Login error:', error)
          toast.error('Network error. Please try again.')
          return false
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (userData) => {
        set({ isLoading: true })
        
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          })

          const data = await response.json()

          if (response.ok) {
            const { user, token } = data
            get().setUser(user)
            get().setToken(token)
            toast.success(`Welcome to MindMate, ${user.display_name}!`)
            return true
          } else {
            toast.error(data.error || 'Registration failed')
            return false
          }
        } catch (error) {
          console.error('Registration error:', error)
          toast.error('Network error. Please try again.')
          return false
        } finally {
          set({ isLoading: false })
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
        localStorage.removeItem('auth_token')
        toast.success('Goodbye! Take care of yourself.')
      },

      checkAuth: () => {
        const token = localStorage.getItem('auth_token')
        if (token) {
          set({ token, isAuthenticated: true })
          // TODO: Validate token with backend
          // For now, assume valid if exists
        }
      },

      updateProfile: async (updates) => {
        const { user, token } = get()
        if (!user || !token) return false

        set({ isLoading: true })

        try {
          const response = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(updates),
          })

          const data = await response.json()

          if (response.ok) {
            const updatedUser = { ...user, ...updates }
            get().setUser(updatedUser)
            toast.success('Profile updated successfully!')
            return true
          } else {
            toast.error(data.error || 'Failed to update profile')
            return false
          }
        } catch (error) {
          console.error('Profile update error:', error)
          toast.error('Network error. Please try again.')
          return false
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'mindmate-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)