import { supabase } from './supabaseClient'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '')

export async function requestCreativeBriefApi(path, { method = 'GET', body } = {}) {
  if (!apiBaseUrl) {
    throw new Error('The brief API is not configured. Set VITE_API_BASE_URL and restart the app.')
  }
  if (!supabase) {
    throw new Error('Sign-in is not configured. Set up Supabase Auth before using the brief API.')
  }

  const { data, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw new Error(`Could not verify your sign-in: ${sessionError.message}`)
  const accessToken = data.session?.access_token
  if (!accessToken) throw new Error('Sign in with a brand account before submitting or viewing briefs.')

  let response
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  } catch {
    throw new Error('Could not reach the brief API. Check your connection and try again.')
  }

  let result
  try {
    result = await response.json()
  } catch {
    throw new Error(`The brief API returned an invalid response (HTTP ${response.status}).`)
  }
  if (!response.ok) {
    throw new Error(result.error || `The brief API request failed (HTTP ${response.status}).`)
  }
  if (!result || !('data' in result)) {
    throw new Error('The brief API response did not include saved data.')
  }
  return result.data
}
