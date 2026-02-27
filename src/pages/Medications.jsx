import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus, Check, Trash2, Zap } from 'lucide-react'
import { getDogs, getMedications, saveMedication, deleteMedication, logMedicationGiven, getMedicationLogs } from '../lib/db'
import { format, formatDistanceToNow } from 'date-fns'
import Modal from '../components/Modal'

const FREQ = ['Daily', 'Twice daily', 'Every other day', 'Weekly', 'Monthly', 'As needed']
const emptyForm = { name: '', dosage: '', frequency: 'Daily', times_per_day: 1, start_date: format(new Date(), 'yyyy-MM-dd'), end_date: '', notes: '', is_active: true }

export default function Medications() {
  const navigate = useNavigate()
  const [dog, setDog] = useState(null)
  const [meds, setMeds] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('active')

  const load = useCallback(async () => {
    const dogs = await getDogs()
    if (!dogs?.length) { setLoading(false); return }
    const d = dogs[0]; setDog(d)
    const [m, l] = await Promise.all([getMedications(d.id), getMedicationLogs(d.id)])
    setMeds(m || []); setLogs(l || []); setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModal(true) }
  const openEdit = (med) => { setEditing(med); setForm({ name: med.name, dosage: med.dosage || '', frequency: med.frequency || 'Daily', times_per_day: med.times_per_day || 1, start_date: med.start_date || format(new Date(), 'yyyy-MM-dd'), end_date: med.end_date || '', notes: med.notes || '', is_active: med.is_active !== false }); setModal(true) }

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await saveMedication(dog.id, editing ? { ...form, id: editing.id } : form)
      await load(); setModal(false)
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this potion?')) return
    await deleteMedication(id); load()
  }

  const handleGive = async (medId) => {
    await logMedicationGiven(dog.id, medId); load()
  }

  const active = meds.filter(m => m.is_active !== false)
  const inactive = meds.filter(m => m.is_active === false)
  const shown = tab === 'active' ? active : inactive

  const lastGiven = (medId) => {
    const l = logs.filter(l => l.medication_id === medId).sort((a,b) => new Date(b.given_at) - new Date(a.given_at))
    return l[0] ? formatDistanceToNow(new Date(l[0].given_at), { addSuffix: true }) : null
  }

  if (loading) return <div className="app-shell"><div className="page-content"><div className="spinner" /></div></div>

  return (
    <div className="app-shell">
      <div className="page-content">

        {/* Header */}
        <div className="gradient-header gh-coral">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <button className="back-btn" onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.2)', borderColor: 'transparent', color: 'white' }} aria-label="Go back">
              <ChevronLeft size={20} />
            </button>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, opacity: 0.8 }}>Inventory</p>
              <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Fredoka, sans-serif' }}>Potions &amp; Shields</h1>
            </div>
            <button className="btn btn-sm" style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }} onClick={openAdd}>
              <Plus size={16} /> Add
            </button>
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8 }}>
            {['active', 'inactive'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 16px', borderRadius: 999, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, background: tab === t ? 'white' : 'rgba(255,255,255,0.15)', color: tab === t ? 'var(--coral)' : 'rgba(255,255,255,0.9)' }}>
                {t === 'active' ? `⚡ Active (${active.length})` : `📦 Archived (${inactive.length})`}
              </button>
            ))}
          </div>
          <div className="gh-icon">💊</div>
        </div>

        {/* Med List */}
        {shown.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💊</div>
            <div className="empty-title">{tab === 'active' ? 'No active potions' : 'No archived potions'}</div>
            <div className="empty-sub">{tab === 'active' ? 'Add medications to start tracking daily doses.' : 'Deactivated meds appear here.'}</div>
            {tab === 'active' && <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Potion</button>}
          </div>
        ) : (
          <div className="section" style={{ marginTop: 16 }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              {shown.map((med, i) => {
                const given = lastGiven(med.id)
                return (
                  <div key={med.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < shown.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div className="list-item-icon" style={{ background: 'var(--coral-light)', borderRadius: 14 }}>💊</div>
                    <div style={{ flex: 1, minWidth: 0 }} onClick={() => openEdit(med)} style={{ flex: 1, cursor: 'pointer' }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{med.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                        {med.dosage && <span>{med.dosage} · </span>}
                        {med.frequency}
                      </div>
                      {given && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Last given {given}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {tab === 'active' && (
                        <button className="btn btn-mission btn-sm" onClick={() => handleGive(med.id)} aria-label={`Give ${med.name}`}>
                          <Zap size={13} /> Give
                        </button>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(med.id)} aria-label={`Delete ${med.name}`}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>

      {/* Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? '✏️ Edit Potion' : '➕ New Potion'}
        footer={
          <>
            <button className="btn btn-ghost btn-full" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary btn-full" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Potion'}</button>
          </>
        }>
        <div className="form-group">
          <label className="form-label">Medication Name *</label>
          <input className="form-input" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Apoquel, Nexgard" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Dosage</label>
            <input className="form-input" value={form.dosage} onChange={e => setForm(f => ({...f, dosage: e.target.value}))} placeholder="e.g. 16mg" />
          </div>
          <div className="form-group">
            <label className="form-label">Frequency</label>
            <select className="form-input form-select" value={form.frequency} onChange={e => setForm(f => ({...f, frequency: e.target.value}))}>
              {FREQ.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input className="form-input" type="date" value={form.start_date} onChange={e => setForm(f => ({...f, start_date: e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">End Date</label>
            <input className="form-input" type="date" value={form.end_date} onChange={e => setForm(f => ({...f, end_date: e.target.value}))} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-input form-textarea" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Special instructions…" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Active Potion</span>
          <button className={`toggle ${form.is_active ? 'on' : ''}`} onClick={() => setForm(f => ({...f, is_active: !f.is_active}))} aria-label="Toggle active">
            <div className="toggle-thumb" />
          </button>
        </div>
      </Modal>
    </div>
  )
}
