import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'
import logo from '../assets/logo.png'
import InstallButton from './InstallButton'

export default function Header() {
  const { user, role } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <header>
      {/* ── Banner ── */}
      <div className="site-banner">
        <div className="site-banner__inner">
          <div className="site-banner__logo">
            <img src={logo} alt="DBHS Logo" style={{ height: '82px', width: 'auto' }} />
          </div>
          <div>
            <h1 className="site-banner__title">DBHS Music Lost and Found</h1>
            <span className="site-banner__subtitle">
              Diamond Bar High School Instrumental Music Program
            </span>
          </div>
        </div>
      </div>

      {/* ── Nav bar ── */}
      <nav className="site-nav">
        <div className="site-nav__inner">
          <div className="site-nav__links">
            <Link
              to="/"
              className={`site-nav__item${pathname === '/' ? ' active' : ''}`}
            >
              🏠 Browse
            </Link>

            {user && (
              <Link
                to="/dashboard"
                className={`site-nav__item${pathname === '/dashboard' ? ' active' : ''}`}
              >
                📋 Dashboard
              </Link>
            )}

            {role === 'admin' && (
              <Link
                to="/admin"
                className={`site-nav__item${pathname === '/admin' ? ' active' : ''}`}
              >
                🛡️ Admin Panel
              </Link>
            )}

            {!user && (
              <Link
                to="/login"
                className={`site-nav__item${pathname === '/login' ? ' active' : ''}`}
              >
                🔑 Staff Login
              </Link>
            )}
          </div>

          <div className="site-nav__right">
            <InstallButton />
            {user && (
              <button className="site-nav__signout" onClick={handleSignOut}>
                ↪ Sign Out
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}
