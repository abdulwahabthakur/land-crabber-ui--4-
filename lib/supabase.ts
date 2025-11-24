import { createClient } from '@supabase/supabase-js'

// Lazy initialization to avoid errors at module load time
let supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
  }

  return { supabaseUrl, supabaseAnonKey }
}

// Client-side Supabase client (lazy initialization)
function getSupabaseClient() {
  if (!supabaseClient) {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig()
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseClient
}

// Export as a getter object for backward compatibility
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    const client = getSupabaseClient()
    const value = client[prop as keyof typeof client]
    // If it's a function, bind it to the client
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  }
})

// Server-side Supabase client (for API routes)
export function createServerClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig()
  return createClient(supabaseUrl, supabaseAnonKey)
}

