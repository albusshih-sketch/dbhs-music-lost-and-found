import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Sidebar from '../components/Sidebar'

function isWithinDays(dateStr, days) {
  const date = new Date(dateStr)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return date >= cutoff
}

export default function BrowsePage() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [claimingId, setClaimingId] = useState(null)
  const [claimName, setClaimName] = useState('')
  const [claimLoading, setClaimLoading] = useState(false)
  const [claimError, setClaimError] = useState('')

  useEffect(() => {
    fetchItems()

    const channel = supabase
      .channel('items-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => {
        fetchItems()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchItems() {
    setLoading(true)
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError('Could not load items. Please try again later.')
      console.error(error)
    } else {
      setItems(data)
    }
    setLoading(false)
  }

  async function handleClaim(item) {
    if (!claimName.trim()) {
      setClaimError('Please enter your name.')
      return
    }
    setClaimLoading(true)
    const { error } = await supabase
      .from('items')
      .update({ claimed_by: claimName.trim(), claimed_at: new Date().toISOString() })
      .eq('id', item.id)
    setClaimLoading(false)
    if (error) {
      setClaimError('Could not submit claim. Please try again.')
    } else {
      setClaimingId(null)
      setClaimName('')
      setClaimError('')
    }
  }

  const filtered = items.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.description.toLowerCase().includes(search.toLowerCase()) ||
    item.location.toLowerCase().includes(search.toLowerCase())
  )

  const newThisWeek = items.filter(i => isWithinDays(i.created_at, 7)).length

  const stats = [
    { icon: '📦', label: 'Total Items', value: items.length },
    { icon: '📅', label: 'New This Week', value: newThisWeek },
  ]

  return (
    <div className="page-wrapper">
      <div className="content-layout">
        <Sidebar stats={stats} />

        <main>
          <div className="welcome-card">
            <div className="welcome-card__content">
              <h2>Welcome to DBHS Music Lost and Found</h2>
              <p>Browse and recover lost items from the Instrumental Music Program.</p>
            </div>
            <div className="welcome-card__deco" aria-hidden="true">♩ ♪ ♫</div>
          </div>

          <div className="section-row">
            <h2 className="section-title">Recently Posted Items</h2>
          </div>

          <div className="search-bar">
            <span className="search-bar__icon">🔍</span>
            <input
              type="text"
              placeholder="Search by name, description, or location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {loading && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading items...</p>}
          {error && <p className="msg-error">{error}</p>}

          {!loading && !error && filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-state__icon">📭</div>
              <p>{search ? 'No items match your search.' : 'No items have been posted yet.'}</p>
            </div>
          )}

          <div className="items-grid">
            {filtered.map(item => (
              <article key={item.id} className={`item-card${item.claimed_by ? ' item-card--claimed' : ''}`}>
                <div className="item-card__img-wrap">
                  {item.image_url
                    ? <img src={item.image_url} alt={item.title} />
                    : <div className="item-card__placeholder">📦</div>
                  }
                  <span className="item-card__date">
                    {new Date(item.date_found).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  {item.claimed_by && (
                    <span className="item-card__claimed-badge">Claimed</span>
                  )}
                </div>
                <div className="item-card__body">
                  <p className="item-card__title">{item.title}</p>
                  <p className="item-card__location">📍 {item.location}</p>
                  <p className="item-card__desc">{item.description}</p>
                  {item.claimed_by && (
                    <p className="item-card__claimed-by">Claimed by {item.claimed_by}</p>
                  )}
                </div>

                {!item.claimed_by && item.claimable && claimingId !== item.id && (
                  <button
                    className="item-card__claim-btn"
                    onClick={() => { setClaimingId(item.id); setClaimName(''); setClaimError('') }}
                  >
                    Claim This Item
                  </button>
                )}
                {!item.claimed_by && !item.claimable && (
                  <div className="item-card__no-claim">Contact staff to claim</div>
                )}
                {claimingId === item.id && (
                  <div className="item-card__claim-form">
                    <input
                      type="text"
                      placeholder="Your name *"
                      value={claimName}
                      onChange={e => setClaimName(e.target.value)}
                      autoFocus
                    />
                    {claimError && (
                      <p style={{ fontSize: '0.74rem', color: 'var(--danger)', margin: 0 }}>{claimError}</p>
                    )}
                    <div className="item-card__claim-actions">
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => handleClaim(item)}
                        disabled={claimLoading}
                      >
                        {claimLoading ? 'Submitting...' : 'Confirm Claim'}
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => { setClaimingId(null); setClaimError('') }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>

          <div className="info-banner">
            <span className="info-banner__icon">ℹ️</span>
            <div className="info-banner__text">
              <h3>Have you lost something?</h3>
              <p>Check the list of found items or contact a staff member in the Instrumental Music Program.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
