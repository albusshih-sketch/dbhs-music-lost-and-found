// This page lets teachers and the admin log in using real Supabase authentication.
// Unlike our earlier prototype, this checks against REAL accounts you create in Supabase.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (error) {
      setError('Invalid email or password.')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <main style={{ maxWidth: 400, margin: '4rem auto', padding: '0 1.5rem' }}>
      <div style={{ border: '1px solid #e0e0e0', borderRadius: 12, padding: '2rem', background: '#fff' }}>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 500 }}>Staff sign in</h1>
        <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1.5rem' }}>
          Teachers and admins only.
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc' }}
            />
          </div>

          {error && <p style={{ color: 'red', fontSize: '0.85rem' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ padding: '10px', borderRadius: 8, background: '#1a1a1a', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  )
}
