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
    <div className="login-wrapper">
      <div className="card" style={{ width: '100%', maxWidth: 420 }}>
        {/* Card header */}
        <div style={{
          background: 'var(--banner-bg)',
          borderRadius: '12px 12px 0 0',
          padding: '1.75rem 2rem',
          borderBottom: '3px solid var(--gold)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '2rem',
            marginBottom: '0.5rem',
            fontFamily: "'Times New Roman', Georgia, serif",
            color: 'var(--gold)',
            lineHeight: 1
          }}>
            ♩
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            color: 'var(--white)',
            fontSize: '1.2rem',
            fontWeight: 700,
            margin: '0 0 4px'
          }}>
            Staff Sign In
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem' }}>
            DBHS Band — Teachers &amp; Admins Only
          </p>
        </div>

        {/* Form */}
        <div style={{ padding: '1.75rem 2rem' }}>
          <form onSubmit={handleLogin} className="form-stack">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            {error && <p className="msg-error">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-full"
              style={{ marginTop: '4px' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
