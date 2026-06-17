// This is the page teachers see after logging in.
// They can post new items (with photo upload) and delete their own past posts.

import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'

export default function DashboardPage() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    date_found: new Date().toISOString().slice(0, 10),
    imageFile: null
  })

  useEffect(() => {
    if (user) fetchMyItems()
  }, [user])

  async function fetchMyItems() {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('posted_by', user.email)
      .order('created_at', { ascending: false })

    console.log('fetchMyItems result:', data, error)
    console.log('logged in as:', user.email)

    if (!error) setItems(data)
  }

  async function handlePost(e) {
    e.preventDefault()
    setError('')

    if (!form.title || !form.description || !form.location || !form.date_found) {
      setError('Please fill in all required fields.')
      return
    }

    setUploading(true)
    let imageUrl = null

    // Step 1: if a photo was selected, upload it to Supabase Storage first
    if (form.imageFile) {
      const fileExt = form.imageFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(fileName, form.imageFile)

      if (uploadError) {
        setError('Image upload failed. Please try again.')
        setUploading(false)
        return
      }

      // Get the public URL so we can save it alongside the item
      const { data: urlData } = supabase.storage
        .from('item-images')
        .getPublicUrl(fileName)

      imageUrl = urlData.publicUrl
    }

    // Step 2: insert the item record into the database
    const { error: insertError } = await supabase.from('items').insert({
      title: form.title,
      description: form.description,
      location: form.location,
      date_found: form.date_found,
      image_url: imageUrl,
      posted_by: user.email
    })

    setUploading(false)

    if (insertError) {
      setError('Could not post item. Please try again.')
      return
    }

    // Reset form and refresh the list
    setForm({ title: '', description: '', location: '', date_found: new Date().toISOString().slice(0, 10), imageFile: null })
    setShowForm(false)
    fetchMyItems()
  }

  async function handleDelete(item) {
    if (!window.confirm('Remove this item from the board?')) return

    await supabase.from('items').delete().eq('id', item.id)
    fetchMyItems()
  }

  if (!user) return <p style={{ padding: '2rem' }}>Please log in to view this page.</p>

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 500 }}>Your posted items</h1>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>Logged in as {user.email}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>
          {showForm ? 'Cancel' : '+ Post an item'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handlePost} style={{ border: '1px solid #e0e0e0', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem', background: '#fff' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              placeholder="Item name"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc' }}
            />
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc' }}
            />
            <input
              placeholder="Where to pick it up (e.g. Room 204)"
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc' }}
            />
            <input
              type="date"
              value={form.date_found}
              onChange={e => setForm(f => ({ ...f, date_found: e.target.value }))}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc' }}
            />
            <input
              type="file"
              accept="image/*"
              onChange={e => setForm(f => ({ ...f, imageFile: e.target.files[0] }))}
            />

            {error && <p style={{ color: 'red', fontSize: '0.85rem' }}>{error}</p>}

            <button type="submit" disabled={uploading} style={{ padding: '10px', borderRadius: 8, background: '#1a1a1a', color: '#fff', border: 'none', cursor: 'pointer' }}>
              {uploading ? 'Posting...' : 'Post item'}
            </button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <p style={{ color: '#666', textAlign: 'center', padding: '3rem 0' }}>No items posted yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(item => (
            <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center', border: '1px solid #e0e0e0', borderRadius: 12, padding: '1rem', background: '#fff' }}>
              {item.image_url && (
                <img src={item.image_url} alt={item.title} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} />
              )}
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 500 }}>{item.title}</p>
                <p style={{ fontSize: '0.85rem', color: '#666' }}>{item.location} · {new Date(item.date_found).toLocaleDateString()}</p>
              </div>
              <button onClick={() => handleDelete(item)} style={{ padding: '6px 12px', borderRadius: 8, cursor: 'pointer', color: '#a32d2d' }}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
