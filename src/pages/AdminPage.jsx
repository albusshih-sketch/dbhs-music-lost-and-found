import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'
import Sidebar from '../components/Sidebar'

export default function AdminPage() {
  const { user, role, loading } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('items')

  const [items, setItems] = useState([])
  const [itemsLoading, setItemsLoading] = useState(true)

  const [teachers, setTeachers] = useState([])
  const [teachersLoading, setTeachersLoading] = useState(true)
  const [newTeacher, setNewTeacher] = useState({ email: '', password: '' })
  const [teacherError, setTeacherError] = useState('')
  const [teacherSuccess, setTeacherSuccess] = useState('')

  useEffect(() => {
    if (!loading && (!user || role !== 'admin')) navigate('/')
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

  async function handleToggleClaimable(id, current) {
    await supabase.from('items').update({ claimable: !current }).eq('id', id)
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

  async function handlePromote(id, email) {
    if (!window.confirm(`Promote ${email} to admin?`)) return
    const { error } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', id)
    if (error) alert('Could not promote user. Please try again.')
    else fetchAllTeachers()
  }

  async function handleDemote(id, email) {
    if (id === user.id) {
      alert('You cannot demote yourself. Ask another admin to do this.')
      return
    }
    if (!window.confirm(`Demote ${email} back to teacher?`)) return
    const { error } = await supabase.from('profiles').update({ role: 'teacher' }).eq('id', id)
    if (error) alert('Could not demote user. Please try again.')
    else fetchAllTeachers()
  }

  if (loading) return <p style={{ padding: '2rem' }}>Loading...</p>
  if (!user || role !== 'admin') return null

  const claimedCount = items.filter(i => i.claimed_by).length

  const stats = [
    { icon: '📦', label: 'Total Items', value: items.length },
    { icon: '🔔', label: 'Pending Claims', value: claimedCount },
    { icon: '👤', label: 'Staff Accounts', value: teachers.length },
  ]

  return (
    <div className="page-wrapper">
      <div className="content-layout">
        <Sidebar stats={stats} />

        <main>
          <div className="page-header">
            <div className="page-header__text">
              <h1>Admin Panel</h1>
              <p>Manage all items and teacher accounts.</p>
            </div>
          </div>

          <div className="tabs">
            {['items', 'teachers'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`tab-btn${tab === t ? ' active' : ''}`}
              >
                {t === 'items' ? `All Items (${items.length})` : `Teachers (${teachers.length})`}
              </button>
            ))}
          </div>

          {/* Items tab */}
          {tab === 'items' && (
            itemsLoading
              ? <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading items...</p>
              : items.length === 0
                ? (
                  <div className="empty-state">
                    <div className="empty-state__icon">📭</div>
                    <p>No items on the board.</p>
                  </div>
                )
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {items.map(item => (
                      <div key={item.id} className={`item-row${item.claimed_by ? ' item-row--claimed' : ''}`}>
                        {item.image_url && (
                          <img src={item.image_url} alt={item.title} className="item-row__thumb" />
                        )}
                        <div className="item-row__info">
                          <p className="item-row__title">{item.title}</p>
                          <p className="item-row__meta">
                            {item.posted_by} · {item.location} · {new Date(item.date_found).toLocaleDateString()}
                          </p>
                          {item.claimed_by && (
                            <p className="item-row__claim-info">
                              Claimed by <strong>{item.claimed_by}</strong>
                              {item.claimed_at && ` · ${new Date(item.claimed_at).toLocaleString()}`}
                            </p>
                          )}
                        </div>
                        <div className="item-row__actions">
                          {item.claimed_by && (
                            <button onClick={() => handleDeleteItem(item.id)} className="btn btn-sm btn-gold">
                              Confirm Gone
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleClaimable(item.id, item.claimable)}
                            className={`toggle-btn toggle-btn--${item.claimable ? 'on' : 'off'}`}
                          >
                            {item.claimable ? '🔓 On' : '🔒 Off'}
                          </button>
                          <button onClick={() => handleDeleteItem(item.id)} className="btn btn-sm btn-danger">
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
          )}

          {/* Teachers tab */}
          {tab === 'teachers' && (
            <div>
              <div className="card card-padded" style={{ marginBottom: '1.25rem' }}>
                <p className="section-label">Add Teacher Account</p>
                <form onSubmit={handleAddTeacher} className="form-stack">
                  <input
                    className="form-input"
                    type="email"
                    placeholder="email@example.com"
                    value={newTeacher.email}
                    onChange={e => setNewTeacher(t => ({ ...t, email: e.target.value }))}
                  />
                  <input
                    className="form-input"
                    type="password"
                    placeholder="Temporary password"
                    value={newTeacher.password}
                    onChange={e => setNewTeacher(t => ({ ...t, password: e.target.value }))}
                  />
                  {teacherError && <p className="msg-error">{teacherError}</p>}
                  {teacherSuccess && <p className="msg-success">{teacherSuccess}</p>}
                  <button type="submit" className="btn btn-primary">Add Teacher</button>
                </form>
              </div>

              {teachersLoading
                ? <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading teachers...</p>
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {teachers.map(t => (
                      <div key={t.id} className="item-row">
                        <div className={`avatar avatar-${t.role}`}>
                          {t.email[0].toUpperCase()}
                        </div>
                        <div className="item-row__info">
                          <p className="item-row__title">
                            {t.email}{t.id === user.id && ' (you)'}
                          </p>
                          <p className="item-row__meta">Role: {t.role}</p>
                        </div>
                        <div className="item-row__actions">
                          <span className={`badge badge-${t.role}`}>
                            {t.role === 'admin' ? 'Admin' : 'Teacher'}
                          </span>
                          {t.role === 'teacher' && (
                            <button onClick={() => handlePromote(t.id, t.email)} className="btn btn-sm btn-blue">
                              Promote to Admin
                            </button>
                          )}
                          {t.role === 'admin' && t.id !== user.id && (
                            <button onClick={() => handleDemote(t.id, t.email)} className="btn btn-sm btn-danger">
                              Demote to Teacher
                            </button>
                          )}
                          {t.role === 'teacher' && (
                            <button onClick={() => handleDeleteTeacher(t.id, t.email)} className="btn btn-sm btn-danger">
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
