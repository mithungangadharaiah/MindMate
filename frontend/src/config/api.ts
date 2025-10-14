/**
 * API Configuration
 * Handles API URL based on environment with localStorage fallback
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const API_ENDPOINTS = {
  entries: `${API_URL}/api/entries`,
  conversations: `${API_URL}/api/conversations`,
  auth: `${API_URL}/api/auth`,
}

let backendAvailableCache: boolean | null = null

/**
 * Check if backend is available
 */
export const isBackendAvailable = async (): Promise<boolean> => {
  // Return cached result if available
  if (backendAvailableCache !== null) {
    return backendAvailableCache
  }

  // For production GitHub Pages, always use localStorage (no backend)
  if (window.location.hostname.includes('github.io')) {
    backendAvailableCache = false
    console.info('🔒 Running in offline mode - using localStorage')
    return false
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000) // 2 second timeout

    const response = await fetch(`${API_URL}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    backendAvailableCache = response.ok
    
    if (response.ok) {
      console.info('✅ Backend connected')
    }
    
    return response.ok
  } catch (error) {
    console.info('🔒 Backend unavailable - using localStorage')
    backendAvailableCache = false
    return false
  }
}

/**
 * Reset backend availability check
 */
export const resetBackendCheck = () => {
  backendAvailableCache = null
}
