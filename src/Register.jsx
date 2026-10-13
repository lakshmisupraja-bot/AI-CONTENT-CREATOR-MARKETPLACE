import { useState } from 'react'
import { isSupabaseConfigured, supabase } from './supabaseClient'

function Register({ role, onBack, onAuthenticated }) {
  const [mode, setMode] = useState('register')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    skills: '',
    industry: '',
    description: '',
    website: ''
  })

  const updateForm = (field, value) => {
    setForm(previous => ({
      ...previous,
      [field]: value
    }))
  }

  const saveProfile = async (user) => {
    const { data: existing, error: checkError } = await supabase
      .from('profiles')
      .select('id, role, display_name, email')
      .eq('id', user.id)
      .maybeSingle()

    if (checkError) throw checkError

    if (existing) return existing

    const metadata = user.user_metadata || {}
    const profile = {
      id: user.id,
      role: metadata.role || role.toLowerCase(),
      display_name: metadata.display_name || form.name.trim() || user.email,
      email: user.email,
    }
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile, { onConflict: 'id' })
      .select('id, role, display_name, email')
      .single()

    if (error) throw error
    return data
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    if (!isSupabaseConfigured || !supabase) {
      setErrorMessage('Account registration is unavailable until Supabase is configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to the project environment.')
      return
    }
    setLoading(true)

    try {
      if (mode === 'login') {
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email: form.email,
            password: form.password
          })

        if (error) throw error

        const profile = await saveProfile(data.user)
        onAuthenticated(profile)
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            role: role.toLowerCase(),
            display_name: form.name.trim(),
            company_name: role === 'Brand' ? form.name.trim() : null,
            skills: role === 'Creator' ? form.skills.split(',').map((skill) => skill.trim()).filter(Boolean) : [],
            industry: form.industry || null,
            description: form.description || null,
            website: form.website || null,
          },
        },
      })

      if (error) throw error

      if (!data.user) {
        alert('Registration failed. Please try again.')
        return
      }

      if (!data.session) {
        setErrorMessage('Registration submitted. Confirm your email, then log in to finish setting up your profile.')
        setMode('login')
        return
      }

      const profile = await saveProfile(data.user)
      onAuthenticated(profile)

    } catch (error) {
      setErrorMessage(error.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-page">
      <div className="register-box">
        <button className="register-back" type="button" onClick={onBack}>
          <span aria-hidden="true">←</span> Back to marketplace
        </button>

        <div className="register-heading">
          <span className="register-kicker">{role === 'Brand' ? 'FOR BRANDS & AGENCIES' : 'FOR CREATORS'}</span>
          <h1>{mode === 'login' ? `Welcome back` : role === 'Brand' ? 'Create your brand account' : 'Create your creator account'}</h1>
          <p>{mode === 'login' ? 'Log in to continue where you left off.' : 'A few details to help us get to know you.'}</p>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          {mode === 'register' && role === 'Brand' && (
            <>
              <div className="register-section-heading">
                <span className="register-step">01</span>
                <div><strong>Company details</strong><small>Tell creators who you are.</small></div>
              </div>
              <div className="register-field-grid">
                <label className="register-field">
                  <span>Company name</span>
                  <input
                    type="text"
                    autoComplete="organization"
                    placeholder="e.g. Northstar Studio"
                    required
                    value={form.name}
                    onChange={(e) => updateForm('name', e.target.value)}
                  />
                </label>
                <label className="register-field">
                  <span>Industry</span>
                  <input
                    type="text"
                    placeholder="e.g. Fashion, technology"
                    required
                    value={form.industry}
                    onChange={(e) => updateForm('industry', e.target.value)}
                  />
                </label>
                <label className="register-field register-field-full">
                  <span>Company description</span>
                  <textarea
                    rows="3"
                    placeholder="What does your company do, and what kind of creative work are you looking for?"
                    required
                    value={form.description}
                    onChange={(e) => updateForm('description', e.target.value)}
                  />
                </label>
                <label className="register-field register-field-full">
                  <span>Website <em>Optional</em></span>
                  <input
                    type="url"
                    autoComplete="url"
                    placeholder="https://yourcompany.com"
                    value={form.website}
                    onChange={(e) => updateForm('website', e.target.value)}
                  />
                </label>
              </div>
              <div className="register-section-heading account-section-heading">
                <span className="register-step">02</span>
                <div><strong>Account access</strong><small>Your login details for CreatorBridge.</small></div>
              </div>
            </>
          )}

          {mode === 'register' && role === 'Creator' && (
            <>
              <div className="register-field-grid">
                <label className="register-field register-field-full">
                  <span>Full name</span>
                  <input
                    type="text"
                    autoComplete="name"
                    placeholder="Your name"
                    required
                    value={form.name}
                    onChange={(e) => updateForm('name', e.target.value)}
                  />
                </label>
                <label className="register-field register-field-full">
                  <span>Your skills</span>
                  <input
                    type="text"
                    placeholder="e.g. AI filmmaking, motion design"
                    required
                    value={form.skills}
                    onChange={(e) => updateForm('skills', e.target.value)}
                  />
                </label>
              </div>
              <div className="register-section-heading account-section-heading">
                <span className="register-step">02</span>
                <div><strong>Account access</strong><small>Your login details for CreatorBridge.</small></div>
              </div>
            </>
          )}

          <div className={mode === 'register' ? 'register-field-grid account-fields' : 'register-field-grid'}>
            <label className="register-field register-field-full">
              <span>Email address</span>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                required
                value={form.email}
                onChange={(e) => updateForm('email', e.target.value)}
              />
            </label>
            <label className="register-field register-field-full">
              <span>Password <em>{mode === 'register' ? 'At least 8 characters' : ''}</em></span>
              <input
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="Enter your password"
                minLength={8}
                required
                value={form.password}
                onChange={(e) => updateForm('password', e.target.value)}
              />
            </label>
          </div>

          <button className="register-submit" type="submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Log in to your account' : 'Create account'}
            {!loading && <span aria-hidden="true">→</span>}
          </button>
          {errorMessage && <p className="register-error" role="alert">{errorMessage}</p>}
        </form>

        <p className="register-switch">
          {mode === 'login' ? 'New to CreatorBridge?' : 'Already have an account?'}
          <button
            type="button"
            onClick={() => { setErrorMessage(''); setMode(mode === 'login' ? 'register' : 'login') }}
          >
            {mode === 'login' ? 'Create an account' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  )
}

export default Register