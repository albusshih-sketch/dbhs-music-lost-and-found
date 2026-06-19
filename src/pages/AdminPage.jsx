// The admin panel - only accessible to users with role = 'admin'.
// Lets the IT admin see all items across all teachers, and manage teacher accounts.
// Admins can promote teachers to admin, and demote other admins back to teacher.
// An admin cannot demote themselves.

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

  // Promote a teacher to admin
  async function handlePromote(id, email) {
    if (!window.confirm(`Promote ${email} to admin? They will have full access to the admin panel.`)) return

    const { error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', id)

    if (error) {
      alert('Could not promote user. Please try again.')
    } else {
      fetchAllTeachers()
    }
  }

  // Demote an admin back to teacher
  // An admin cannot demote themselves
  async function handleDemote(id, email) {
    if (id === user.id) {
      alert("You cannot demote yourself. Ask another admin to do this.")
      return
    }

    if (!window.confirm(`Demote ${email} back to teacher? They will lose admin access.`)) return

    const { error } = await supabase
      .from('profiles')
      .update({ role: 'teacher' })
      .eq('id', id)

    if (error) {
      alert('Could not demote user. Please try again.')
    } else {
      fetchAllTeachers()
    }
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
                placeholder="email@example.com"
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
                  
                  {/* Avatar circle with first letter of email */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: t.role === 'admin' ? '#e6f1fb' : '#f0f0ee',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 500,
                    color: t.role === 'admin' ? '#185fa5' : '#444',
                    flexShrink: 0
                  }}>
                    {t.email[0].toUpperCase()}
                  </div>

                  {/* Email and role */}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 500 }}>{t.email}</p>
                    <p style={{ fontSize: '0.8rem', color: '#999' }}>
                      Role: {t.role}
                      {t.id === user.id && ' (you)'}
                    </p>
                  </div>

                  {/* Role badge */}
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '3px 10px',
                    borderRadius: 99,
                    background: t.role === 'admin' ? '#e6f1fb' : '#f0f0ee',
                    color: t.role === 'admin' ? '#185fa5' : '#666'
                  }}>
                    {t.role === 'admin' ? 'Admin' : 'Teacher'}
                  </span>

                  {/* Promote button — only shown for teachers */}
                  {t.role === 'teacher' && (
                    <button
                      onClick={() => handlePromote(t.id, t.email)}
                      style={{ padding: '6px 12px', borderRadius: 8, cursor: 'pointer', color: '#185fa5', border: '1px solid #b5d4f4', background: '#e6f1fb', whiteSpace: 'nowrap' }}
                    >
                      Promote to admin
                    </button>
                  )}

                  {/* Demote button — only shown for other admins, not yourself */}
                  {t.role === 'admin' && t.id !== user.id && (
                    <button
                      onClick={() => handleDemote(t.id, t.email)}
                      style={{ padding: '6px 12px', borderRadius: 8, cursor: 'pointer', color: '#a32d2d', border: '1px solid #f0c0c0', background: '#fcebeb', whiteSpace: 'nowrap' }}
                    >
                      Demote to teacher
                    </button>
                  )}

                  {/* Remove button — only shown for teachers, not admins */}
                  {t.role === 'teacher' && (
                    <button
                      onClick={() => handleDeleteTeacher(t.id, t.email)}
                      style={{ padding: '6px 12px', borderRadius: 8, cursor: 'pointer', color: '#a32d2d', border: '1px solid #f0c0c0', background: '#fcebeb' }}
                    >
                      Remove
                    </button>
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
