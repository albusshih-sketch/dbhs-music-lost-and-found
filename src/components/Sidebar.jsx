import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Sidebar({ stats }) {
  const { user, role } = useAuth()
  const { pathname } = useLocation()

  return (
    <aside className="sidebar">
      {/* Navigation card */}
      <div className="sidebar-card">
        <div className="sidebar-card__header">Navigation</div>
        <nav className="sidebar-nav">
          <Link
            to="/"
            className={`sidebar-nav__item${pathname === '/' ? ' active' : ''}`}
          >
            <span className="sidebar-nav__icon">🏠</span>
            Browse
          </Link>

          {user && (
            <Link
              to="/dashboard"
              className={`sidebar-nav__item${pathname === '/dashboard' ? ' active' : ''}`}
            >
              <span className="sidebar-nav__icon">📋</span>
              Dashboard
            </Link>
          )}

          {role === 'admin' && (
            <Link
              to="/admin"
              className={`sidebar-nav__item${pathname === '/admin' ? ' active' : ''}`}
            >
              <span className="sidebar-nav__icon">🛡️</span>
              Admin Panel
            </Link>
          )}

          {!user && (
            <Link
              to="/login"
              className={`sidebar-nav__item${pathname === '/login' ? ' active' : ''}`}
            >
              <span className="sidebar-nav__icon">🔑</span>
              Staff Login
            </Link>
          )}
        </nav>
      </div>

      {/* Stats card */}
      {stats && stats.length > 0 && (
        <div className="sidebar-card">
          <div className="sidebar-card__header">Quick Stats</div>
          <div className="stats-list">
            {stats.map(s => (
              <div key={s.label} className="stat-item">
                <div className="stat-icon-wrap">{s.icon}</div>
                <div>
                  <p className="stat-label">{s.label}</p>
                  <p className="stat-value">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
