// The navigation bar shown at the top of every page.
// It changes what buttons it shows depending on whether someone is logged in.

import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'

export default function Header() {
  const { user, role } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 1.5rem',
      borderBottom: '1px solid #e0e0e0',
      background: '#fff'
    }}>
      <Link to="/" style={{ fontWeight: 600, fontSize: '1.1rem', textDecoration: 'none', color: '#1a1a1a' }}>
        DBHS Music Lost & Found
      </Link>

      <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Link to="/">Browse</Link>

        {!user && <Link to="/login">Staff login</Link>}

        {user && (
          <>
            {role === 'admin' && <Link to="/admin">Admin panel</Link>}
            <Link to="/dashboard">Dashboard</Link>
            <button onClick={handleSignOut} style={{ cursor: 'pointer' }}>
              Sign out
            </button>
          </>
        )}
      </nav>
    </header>
  )
}
