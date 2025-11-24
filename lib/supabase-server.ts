import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
  }

  return { supabaseUrl, supabaseAnonKey }
}

// Server-side Supabase client with cookie-based session management
export async function createServerSupabaseClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig()
  const cookieStore = await cookies()
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: {
        getItem: (key: string) => {
          return cookieStore.get(key)?.value ?? null
        },
        setItem: (key: string, value: string) => {
          cookieStore.set(key, value, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
          })
        },
        removeItem: (key: string) => {
          cookieStore.delete(key)
        },
      },
    },
  })
}

