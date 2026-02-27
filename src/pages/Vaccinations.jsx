import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus, Trash2, Shield } from 'lucide-react'
import { getDogs, getVaccinations, saveVaccination, deleteVaccination } from '../lib/db'
import { format, parseISO, isBefore, addDays, formatDistanceToNow } from 'date-fns'
import Modal from '../components/Modal'

const COMMON = ['Rabies', 'DHPP', 'Bordetella', 'Leptospirosis', 'Lyme', 'Canine Influenza', 'Other']
const emptyForm = { name: '', date_given: format(new Date(), 'yyyy-MM-dd'), next_due_date: '', vet_name: '', batch_number: '', notes: '' }

function vaxStatus(vax) {
  if (!vax.next_due_date) return 'none'
  const due = parseISO(vax.next_due_date)
  const now = new Date()
  if (isBefore(due, now)) return 'overdue'
  if (isBefore(due, addDays(now, 30))) return 'due-soon'
  return 'active'
}

export default function Vaccinations() {
  const navigate = useNavigate()
  const [dog, setDog] = useState(null)
  const [vaxs, setVaxs] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const dogs = await getDogs()
    if (!dogs?.length) { setLoading(false); return }
    const d = dogs[0]; setDog(d)
    const v = await getVaccinations(d.id)
    setVaxs(v || []); setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModal(true) }
  const openEdit = (v) => { setEditing(v); setForm({ name: v.name, date_given: v.date_given, next_due_date: v.next_due_date || '', vet_name: v.vet_name || '', batch_number: v.batch_number || '', notes: v.notes || '' }); setModal(true) }

  const save = async () => {
    if (!form.name.trim() || !form.date_given) return
    setSaving(true)
    try {
      await saveVaccination(dog.id, editing ? { ...form, id: editing.id } : form)
      await load(); setModal(false)
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this shield?')) return
    await deleteVaccination(id); load()
  }

  const overdueCount = vaxs.filter(v => vaxStatus(v) === 'overdue').length
  const activeCount = vaxs.filter(v => vaxStatus(v) === 'active').length

  if (loading) return <div className="app-shell"><div className="page-content"><div className="spinner" /></div></div>

  return (
    <div className="app-shell">
      <div className="page-content">

        {/* Header */}
        <div className="gradient-header gh-xp">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <button className="back-btn" onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.2)', borderColor: 'transparent', color: 'white' }} aria-label="Go back">
              <ChevronLeft size={20} />
            </button>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, opacity: 0.8 }}>Protection</p>
              <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Fredoka, sans-serif' }}>Immunity Armor</h1>
            </div>
            <button className="btn btn-sm" style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }} onClick={openAdd}>
              <Plus size={16} /> Add
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '8px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{activeCount}</div>
              <div style={{ fontSize: 10, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1 }}>Active</div>
            </div>
            {overdueCount > 0 && (
              <div style={{ background: 'rgba(255,107,107,0.3)', borderRadius: 12, padding: '8px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{overdueCount}</div>
                <div style={{ fontSize: 10, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1 }}>Expired</div>
              </div>
            )}
          </div>
          <div className="gh-icon">🛡️</div>
        </div>

        {/* Vax List */}
        {vaxs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🛡️</div>
            <div className="empty-title">No armor equipped</div>
            <div className="empty-sub">Add vaccinations to build your dog's immunity shield.</div>
            <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Shield</button>
          </div>
        ) : (
          <div className="section" style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {vaxs.map(vax => {
                const status = vaxStatus(vax)
                const isOverdue = status === 'overdue'
                const isDueSoon = status === 'due-soon'
                const isActive = status === 'active'
                return (
                  <div key={vax.id} className={`card card-pad ${isOverdue ? 'card-coral' : ''}`} onClick={() => openEdit(vax)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, background: isOverdue ? 'var(--coral-light)' : isActive ? 'var(--mission-light)' : 'var(--primary-light)', flexShrink: 0 }}>
                      🛡️
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{vax.name}</span>
                        {isOverdue && <span className="badge badge-coral">⚠️ Critical</span>}
                        {isDueSoon && <span className="badge badge-primary">⚡ Recharge</span>}
                        {isActive && <span className="badge badge-mission">✓ Active</span>}
                        {status === 'none' && <span className="badge badge-gray">No due date</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>
                        Given: {format(parseISO(vax.date_given), 'MMM d, yyyy')}
                        {vax.vet_name && ` · ${vax.vet_name}`}
                      </div>
                      {vax.next_due_date && (
                        <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4, color: isOverdue ? 'var(--coral)' : isDueSoon ? 'var(--orange)' : 'var(--mission)' }}>
                          {isOverdue ? '⚠️ Overdue ' : '🔄 Next: '}
                          {formatDistanceToNow(parseISO(vax.next_due_date), { addSuffix: true })}
                        </div>
                      )}
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); handleDelete(vax.id) }} aria-label={`Delete ${vax.name}`}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? '✏️ Edit Shield' : '🛡️ New Shield'}
        footer={
          <>
            <button className="btn btn-ghost btn-full" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary btn-full" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Shield'}</button>
          </>
        }>
        <div className="form-group">
          <label className="form-label">Vaccine Name *</label>
          <select className="form-input form-select" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}>
            <option value="">Select vaccine…</option>
            {COMMON.map(v => <option key={v}>{v}</option>)}
          </select>
          {form.name === 'Other' && (
            <input className="form-input" style={{ marginTop: 8 }} value={form.customName || ''} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Enter vaccine name" />
          )}
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Date Given *</label>
            <input className="form-input" type="date" value={form.date_given} onChange={e => setForm(f => ({...f, date_given: e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Next Due Date</label>
            <input className="form-input" type="date" value={form.next_due_date} onChange={e => setForm(f => ({...f, next_due_date: e.target.value}))} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Vet Name</label>
            <input className="form-input" value={form.vet_name} onChange={e => setForm(f => ({...f, vet_name: e.target.value}))} placeholder="Dr. Smith" />
          </div>
          <div className="form-group">
            <label className="form-label">Batch #</label>
            <input className="form-input" value={form.batch_number} onChange={e => setForm(f => ({...f, batch_number: e.target.value}))} placeholder="Optional" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-input form-textarea" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Reactions, observations…" />
        </div>
      </Modal>
    </div>
  )
}
