// The admin panel - only accessible to users with role = 'admin'.
// Lets the IT admin see all items across all teachers, and manage teacher accounts.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'

export default function AdminPage() {
  const { user, role, loading } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('items')

  // Items state
  const [items, setItems] = useState([])
  const [itemsLoading, setItemsLoading] = useState(true)

  // Teachers state
  const [teachers, setTeachers] = useState([])
  const [teachersLoading, setTeachersLoading] = useState(true)
  const [newTeacher, setNewTeacher] = useState({ email: '', password: '' })
  const [teacherError, setTeacherError] = useState('')
  const [teacherSuccess, setTeacherSuccess] = useState('')

  // Redirect non-admins away from this page
  useEffect(() => {
    if (!loading && (!user || role !== 'admin')) {
      navigate('/')
    }
  }, [user, role, loading])

  useEffect(() => {
    if (user && role === 'admin') {
      fetchAllItems()
      fetchAllTeachers()
    }
  }, [user, role])

  async function fetchAllItems() {
    setItemsLoading(true)
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setItems(data)
    setItemsLoading(false)
  }

  async function fetchAllTeachers() {
    setTeachersLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('email', { ascending: true })

    if (!error) setTeachers(data)
    setTeachersLoading(false)
  }

  async function handleDeleteItem(id) {
    if (!window.confirm('Remove this item from the board?')) return
    await supabase.from('items').delete().eq('id', id)
    fetchAllItems()
  }

  async function handleAddTeacher(e) {
    e.preventDefault()
    setTeacherError('')
    setTeacherSuccess('')

    if (!newTeacher.email || !newTeacher.password) {
      setTeacherError('Email and password are required.')
      return
    }

    if (!newTeacher.email.endsWith('@dbhs.edu')) {
      setTeacherError('Email must be a @dbhs.edu address.')
      return
    }

    // Create the user in Supabase Auth
    // Note: in production you'd use the Supabase Admin API for this.
    // For now we use signUp which sends a confirmation email.
    const { error } = await supabase.auth.signUp({
      email: newTeacher.email,
      password: newTeacher.password
    })

    if (error) {
      setTeacherError(error.message)
    } else {
      setTeacherSuccess(`Account created for ${newTeacher.email}. They can now log in.`)
      setNewTeacher({ email: '', password: '' })
      fetchAllTeachers()
    }
  }

  async function handleDeleteTeacher(id, email) {
    if (!window.confirm(`Remove teacher account for ${email}?`)) return
    await supabase.from('profiles').delete().eq('id', id)
    fetchAllTeachers()
  }

  if (loading) return <p style={{ padding: '2rem' }}>Loading...</p>
  if (!user || role !== 'admin') return null

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 500 }}>Admin panel</h1>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>Manage all items and teacher accounts.</p>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem', background: '#f0f0ee', borderRadius: 8, padding: 4 }}>
        {['items', 'teachers'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              border: 'none',
              background: tab === t ? '#fff' : 'transparent',
              fontWeight: tab === t ? 500 : 400,
              borderRadius: 6,
              padding: '8px 0',
              cursor: 'pointer'
            }}
          >
            {t === 'items' ? `All items (${items.length})` : `Teachers (${teachers.length})`}
          </button>
        ))}
      </div>

      {/* Items tab */}
      {tab === 'items' && (
        itemsLoading ? <p>Loading items...</p> :
        items.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '3rem 0' }}>No items on the board.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center', border: '1px solid #e0e0e0', borderRadius: 12, padding: '1rem', background: '#fff' }}>
                {item.image_url && (
                  <img src={item.image_url} alt={item.title} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                )}
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 500 }}>{item.title}</p>
                  <p style={{ fontSize: '0.8rem', color: '#999' }}>
                    Posted by {item.posted_by} · {item.location} · {new Date(item.date_found).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  style={{ padding: '6px 12px', borderRadius: 8, cursor: 'pointer', color: '#a32d2d', border: '1px solid #f0c0c0', background: '#fcebeb' }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* Teachers tab */}
      {tab === 'teachers' && (
        <div>
          {/* Add teacher form */}
          <div style={{ border: '1px solid #e0e0e0', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem', background: '#fff' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '1rem' }}>Add teacher account</h2>
            <form onSubmit={handleAddTeacher} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="email"
                placeholder="teacher@dbhs.edu"
                value={newTeacher.email}
                onChange={e => setNewTeacher(t => ({ ...t, email: e.target.value }))}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc' }}
              />
              <input
                type="password"
                placeholder="Temporary password"
                value={newTeacher.password}
                onChange={e => setNewTeacher(t => ({ ...t, password: e.target.value }))}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc' }}
              />
              {teacherError && <p style={{ color: 'red', fontSize: '0.85rem' }}>{teacherError}</p>}
              {teacherSuccess && <p style={{ color: 'green', fontSize: '0.85rem' }}>{teacherSuccess}</p>}
              <button
                type="submit"
                style={{ padding: '10px', borderRadius: 8, background: '#1a1a1a', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                Add teacher
              </button>
            </form>
          </div>

          {/* Teachers list */}
          {teachersLoading ? <p>Loading teachers...</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {teachers.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #e0e0e0', borderRadius: 12, padding: '1rem', background: '#fff' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e6f1fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, color: '#185fa5', flexShrink: 0 }}>
                    {t.email[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 500 }}>{t.email}</p>
                    <p style={{ fontSize: '0.8rem', color: '#999' }}>Role: {t.role}</p>
                  </div>
                  {t.role !== 'admin' && (
                    <button
                      onClick={() => handleDeleteTeacher(t.id, t.email)}
                      style={{ padding: '6px 12px', borderRadius: 8, cursor: 'pointer', color: '#a32d2d', border: '1px solid #f0c0c0', background: '#fcebeb' }}
                    >
                      Remove
                    </button>
                  )}
                  {t.role === 'admin' && (
                    <span style={{ fontSize: '0.8rem', color: '#185fa5', padding: '4px 10px', background: '#e6f1fb', borderRadius: 99 }}>Admin</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  )
}
