import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'
import Sidebar from '../components/Sidebar'

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

      const { data: urlData } = supabase.storage
        .from('item-images')
        .getPublicUrl(fileName)

      imageUrl = urlData.publicUrl
    }

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

  const stats = [
    { icon: '📋', label: 'Your Items', value: items.length },
  ]

  return (
    <div className="page-wrapper">
      <div className="content-layout">
        <Sidebar stats={stats} />

        <main>
          <div className="page-header">
            <div className="page-header__text">
              <h1>Your Posted Items</h1>
              <p>Logged in as {user.email}</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'}`}
            >
              {showForm ? 'Cancel' : '+ Post Item'}
            </button>
          </div>

          {showForm && (
            <div className="card card-padded" style={{ marginBottom: '1.25rem' }}>
              <p className="section-label">New Item</p>
              <form onSubmit={handlePost} className="form-stack">
                <input
                  className="form-input"
                  placeholder="Item name *"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
                <textarea
                  className="form-textarea"
                  placeholder="Description *"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
                <input
                  className="form-input"
                  placeholder="Where to pick it up (e.g. Room 204) *"
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                />
                <input
                  className="form-input"
                  type="date"
                  value={form.date_found}
                  onChange={e => setForm(f => ({ ...f, date_found: e.target.value }))}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setForm(f => ({ ...f, imageFile: e.target.files[0] }))}
                />
                {error && <p className="msg-error">{error}</p>}
                <button type="submit" disabled={uploading} className="btn btn-primary">
                  {uploading ? 'Posting...' : 'Post Item'}
                </button>
              </form>
            </div>
          )}

          {items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">📋</div>
              <p>No items posted yet. Use the button above to add one.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map(item => (
                <div key={item.id} className="item-row">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.title} className="item-row__thumb" />
                  )}
                  <div className="item-row__info">
                    <p className="item-row__title">{item.title}</p>
                    <p className="item-row__meta">
                      {item.location} · {new Date(item.date_found).toLocaleDateString()}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(item)} className="btn btn-sm btn-danger">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
