import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
let hasValidSupabaseUrl = false

if (supabaseUrl) {
  try {
    const parsedUrl = new URL(supabaseUrl)
    hasValidSupabaseUrl = parsedUrl.protocol === 'https:'
      || (parsedUrl.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsedUrl.hostname))
  } catch {
    hasValidSupabaseUrl = false
  }
}

export const isSupabaseConfigured = Boolean(
  hasValidSupabaseUrl && supabaseKey
)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null
