// Auth types and constants
// API calls are now handled through the API routes

export type User = {
  id: string
  name: string
  email: string
  color: string
  avatar: string
  raceHistory: RaceResult[]
}

export type RaceResult = {
  date: string
  position: number
  distance: number
  time: number
  speed: number
}

export const AVAILABLE_COLORS = [
  { name: "Red Hot", value: "#EF4444", emoji: "🔥" },
  { name: "Ocean Blue", value: "#3B82F6", emoji: "🌊" },
  { name: "Lime Green", value: "#84CC16", emoji: "⚡" },
  { name: "Purple Haze", value: "#A855F7", emoji: "🌟" },
  { name: "Sunset Orange", value: "#F97316", emoji: "🌅" },
  { name: "Pink Power", value: "#EC4899", emoji: "💖" },
  { name: "Midnight", value: "#1E293B", emoji: "🌚" },
  { name: "Cyan", value: "#06B6D4", emoji: "💎" },
]

export const AVAILABLE_AVATARS = ["🦀", "🦖", "👻", "👽", "🤖", "🦄", "🐱", "🐶", "🦁", "🐯", "🐸", "🐙"]

// API-based auth functions
export async function signup(
  name: string,
  email: string,
  password: string,
  color: string,
  avatar: string,
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password, color, avatar }),
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Signup error:', error)
    return { success: false, error: 'Network error. Please try again.' }
  }
}

export async function login(
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'Network error. Please try again.' }
  }
}

export async function getSession(): Promise<{ success: boolean; user?: User | null }> {
  try {
    // Add AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout

    const response = await fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const data = await response.json()
    return data
  } catch (error) {
    // If it's an abort error (timeout) or network error, just return no user
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Session check timed out')
    } else {
      console.error('Session check error:', error)
    }
    return { success: false, user: null }
  }
}

export async function logout(): Promise<{ success: boolean }> {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Logout error:', error)
    return { success: false }
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const response = await fetch('/api/users', {
      method: 'GET',
      credentials: 'include',
    })

    const data = await response.json()
    if (data.success && data.users) {
      return data.users
    }
    return []
  } catch (error) {
    console.error('Get users error:', error)
    return []
  }
}

export async function getTakenColors(): Promise<Set<string>> {
  try {
    const users = await getAllUsers()
    return new Set(users.map((u) => u.color))
  } catch (error) {
    console.error('Get taken colors error:', error)
    return new Set()
  }
}

export async function updateUserRaceHistory(
  userId: string,
  result: RaceResult,
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/users/race-history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ userId, result }),
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Update race history error:', error)
    return { success: false, error: 'Failed to update race history' }
  }
}
