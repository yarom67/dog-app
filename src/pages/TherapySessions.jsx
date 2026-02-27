import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus, Trash2 } from 'lucide-react'
import { getDogs, saveTherapySession, getTherapySessions, deleteTherapySession } from '../lib/db'
import { format, isAfter } from 'date-fns'
import Modal from '../components/Modal'

const TYPES = ['Physiotherapy', 'Hydrotherapy', 'Acupuncture', 'Massage', 'Laser Therapy', 'Other']
const emptyForm = { session_type: 'Physiotherapy', date: format(new Date(),'yyyy-MM-dd'), duration_minutes: 45, therapist_name: '', clinic_name: '', exercises: '', notes: '', next_session_date: '', cost: '' }

const TYPE_ICONS = { Physiotherapy: '🦴', Hydrotherapy: '💧', Acupuncture: '📍', Massage: '🤲', 'Laser Therapy': '💡', Other: '🐾' }

// Gamified badge class per type
const TYPE_BADGE = {
  Physiotherapy: 'badge-adventure',
  Hydrotherapy: 'badge-blue',
  Acupuncture: 'badge-xp',
  Massage: 'badge-primary',
  'Laser Therapy': 'badge-orange',
  Other: 'badge-gray',
}

const TYPE_BG = {
  Physiotherapy: 'rgba(79,70,229,0.10)',
  Hydrotherapy: 'rgba(59,130,246,0.10)',
  Acupuncture: 'rgba(168,85,247,0.10)',
  Massage: 'rgba(255,184,0,0.12)',
  'Laser Therapy': 'rgba(249,115,22,0.12)',
  Other: 'rgba(34,197,94,0.10)',
}

export default function TherapySessions() {
  const navigate = useNavigate()
  const [dog, setDog] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filterType, setFilterType] = useState('All')

  const load = useCallback(async () => {
    const dogs = await getDogs(); if (!dogs?.length) { setLoading(false); return }
    const d = dogs[0]; setDog(d)
    const s = await getTherapySessions(d.id); setSessions(s || []); setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModal(true) }
  const openEdit = (s) => {
    setEditing(s)
    setForm({ session_type: s.session_type, date: s.date, duration_minutes: s.duration_minutes || 45, therapist_name: s.therapist_name || '', clinic_name: s.clinic_name || '', exercises: s.exercises || '', notes: s.notes || '', next_session_date: s.next_session_date || '', cost: s.cost || '' })
    setModal(true)
  }
  const handleSave = async () => {
    if (!form.date) return alert('Date required')
    setSaving(true)
    try { await saveTherapySession({ ...form, dog_id: dog.id, duration_minutes: parseInt(form.duration_minutes)||45, cost: form.cost ? parseFloat(form.cost) : null, ...(editing ? { id: editing.id } : {}) }); setModal(false); load() }
    finally { setSaving(false) }
  }
  const handleDelete = async (s) => { if (!confirm('Delete this session?')) return; await deleteTherapySession(s.id); load() }

  const types = ['All', ...TYPES]
  const filtered = filterType === 'All' ? sessions : sessions.filter(s => s.session_type === filterType)
  const upcoming = filtered.filter(s => s.next_session_date && isAfter(new Date(s.next_session_date), new Date()))
  const past = filtered.filter(s => !s.next_session_date || !isAfter(new Date(s.next_session_date), new Date()))

  if (loading) return <div className="app-shell"><div className="page-content"><div className="spinner" /></div></div>

  return (
    <div className="app-shell">
      {/* Gradient header — adventure theme */}
      <div className="gradient-header gh-adventure">
        <div className="gh-icon">🏋️</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className="back-btn"
              onClick={() => navigate('/health')}
              style={{ background: 'rgba(255,255,255,0.2)', borderColor: 'transparent', color: 'white' }}
              aria-label="Go back"
            >
              <ChevronLeft size={22} />
            </button>
            <div>
              <h1 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 24, fontWeight: 700, color: 'white', margin: 0, letterSpacing: 0.3 }}>Training Log</h1>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>Recovery missions & sessions</p>
            </div>
          </div>
          <button
            className="btn btn-sm"
            onClick={openAdd}
            style={{ background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.35)', color: 'white', gap: 5, borderRadius: 10 }}
          >
            <Plus size={15} /> Add
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Type filter pills */}
        <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', padding: '12px 16px 0', display: 'flex', gap: 8 }}>
          {types.map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              style={{
                padding: '7px 16px',
                borderRadius: 20,
                border: '1.5px solid',
                borderColor: filterType === t ? 'var(--adventure)' : 'var(--border)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13,
                background: filterType === t ? 'var(--adventure)' : 'var(--card)',
                color: filterType === t ? 'white' : 'var(--text-2)',
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              {t !== 'All' && <span>{TYPE_ICONS[t]}</span>} {t}
            </button>
          ))}
        </div>

        {sessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏋️</div>
            <div className="empty-title">No missions logged yet</div>
            <div className="empty-sub">Start logging physiotherapy, hydrotherapy, and recovery sessions.</div>
            <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Mission</button>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div className="section">
                <div className="section-title">Next Mission</div>
                <div className="card">
                  {upcoming.map((s, i) => (
                    <div
                      key={s.id}
                      className="list-item"
                      style={{ borderBottom: i < upcoming.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}
                      onClick={() => openEdit(s)}
                    >
                      <div className="list-item-icon" style={{ background: TYPE_BG[s.session_type] || 'rgba(79,70,229,0.10)', fontSize: 20 }}>
                        {TYPE_ICONS[s.session_type] || '🐾'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="list-item-title" style={{ fontFamily: 'Fredoka, sans-serif' }}>{s.session_type}</div>
                        <div className="list-item-sub">
                          {format(new Date(s.next_session_date), 'MMM d, yyyy')}{s.therapist_name ? ` · ${s.therapist_name}` : ''}
                        </div>
                      </div>
                      <span className="badge badge-mission">Upcoming</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="section">
              <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                Mission History
                <span className="badge badge-adventure" style={{ fontSize: 11 }}>{past.length}</span>
              </div>
              <div className="card">
                {past.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 14 }}>No sessions for this filter.</div>
                ) : (
                  past.map((s, i) => (
                    <div
                      key={s.id}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderBottom: i < past.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}
                      onClick={() => openEdit(s)}
                    >
                      <div className="list-item-icon" style={{ background: TYPE_BG[s.session_type] || 'rgba(34,197,94,0.10)', fontSize: 20 }}>
                        {TYPE_ICONS[s.session_type] || '🐾'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <div className="list-item-title" style={{ fontFamily: 'Fredoka, sans-serif' }}>{s.session_type}</div>
                          <span className={`badge ${TYPE_BADGE[s.session_type] || 'badge-gray'}`} style={{ fontSize: 11 }}>
                            {s.duration_minutes || 45} min
                          </span>
                        </div>
                        <div className="list-item-sub">
                          {format(new Date(s.date), 'MMM d, yyyy')}{s.therapist_name ? ` · ${s.therapist_name}` : ''}
                        </div>
                        {s.exercises && (
                          <div style={{ marginTop: 6 }}>
                            {s.exercises.split(/[,\n]+/).filter(Boolean).slice(0, 3).map((ex, idx) => (
                              <div key={idx} style={{ fontSize: 12, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--adventure)', display: 'inline-block', flexShrink: 0 }} />
                                {ex.trim()}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        {s.cost && <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>₪{s.cost}</div>}
                        <button
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}
                          onClick={e => { e.stopPropagation(); handleDelete(s) }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Edit Mission' : 'Log Training Mission'}
        footer={
          <>
            <button className="btn btn-ghost flex-1" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary flex-1" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Session Type</label>
          <select className="form-input form-select" value={form.session_type} onChange={e => setForm(x => ({ ...x, session_type: e.target.value }))}>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input type="date" className="form-input" value={form.date} onChange={e => setForm(x => ({ ...x, date: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Duration (min)</label>
            <input type="number" min="5" max="180" className="form-input" value={form.duration_minutes} onChange={e => setForm(x => ({ ...x, duration_minutes: e.target.value }))} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Therapist</label>
            <input type="text" className="form-input" value={form.therapist_name} onChange={e => setForm(x => ({ ...x, therapist_name: e.target.value }))} placeholder="Name" />
          </div>
          <div className="form-group">
            <label className="form-label">Clinic</label>
            <input type="text" className="form-input" value={form.clinic_name} onChange={e => setForm(x => ({ ...x, clinic_name: e.target.value }))} placeholder="Clinic" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Exercises / Techniques</label>
          <textarea className="form-input form-textarea" value={form.exercises} onChange={e => setForm(x => ({ ...x, exercises: e.target.value }))} placeholder="e.g. Passive ROM, treadmill 10 min, balance board…" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Next Session</label>
            <input type="date" className="form-input" value={form.next_session_date} onChange={e => setForm(x => ({ ...x, next_session_date: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Cost (₪)</label>
            <input type="number" min="0" className="form-input" value={form.cost} onChange={e => setForm(x => ({ ...x, cost: e.target.value }))} placeholder="0" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-input form-textarea" value={form.notes} onChange={e => setForm(x => ({ ...x, notes: e.target.value }))} placeholder="Dog's response, pain level, observations…" />
        </div>
      </Modal>
    </div>
  )
}
