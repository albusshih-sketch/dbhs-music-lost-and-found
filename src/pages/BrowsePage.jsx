// This is the page every student sees - no login required.
// It pulls all items from the Supabase "items" table and displays them as cards.

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function BrowsePage() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    setLoading(true)
    // .order() shows newest items first, like a feed
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

  const filtered = items.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.description.toLowerCase().includes(search.toLowerCase()) ||
    item.location.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 500 }}>Lost items board</h1>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>
        See something that's yours? Visit the location listed to retrieve it in person.
      </p>

      <input
        type="text"
        placeholder="Search by name, description, or location..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: '10px 14px', marginBottom: '1.5rem', borderRadius: 8, border: '1px solid #ccc' }}
      />

      {loading && <p>Loading items...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <p style={{ color: '#666', textAlign: 'center', padding: '3rem 0' }}>
          No items match your search.
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {filtered.map(item => (
          <article key={item.id} style={{ border: '1px solid #e0e0e0', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
            <div style={{ width: '100%', height: 160, background: '#f0f0f0' }}>
              {item.image_url && (
                <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>
            <div style={{ padding: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 500 }}>{item.title}</h2>
              <p style={{ fontSize: '0.85rem', color: '#666', margin: '6px 0' }}>{item.description}</p>
              <p style={{ fontSize: '0.8rem', color: '#999' }}>📍 {item.location}</p>
              <p style={{ fontSize: '0.8rem', color: '#999' }}>📅 Found {new Date(item.date_found).toLocaleDateString()}</p>
            </div>
          </article>
        ))}
      </div>
    </main>
  )
}
