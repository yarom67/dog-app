import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus, Trash2 } from 'lucide-react'
import { getDogs, getVetVisits, saveVetVisit, deleteVetVisit } from '../lib/db'
import { format, isAfter } from 'date-fns'
import Modal from '../components/Modal'

const emptyForm = { date: format(new Date(),'yyyy-MM-dd'), reason: '', vet_name: '', clinic_name: '', diagnosis: '', treatment: '', cost: '', next_appointment: '', notes: '' }

export default function VetVisits() {
  const navigate = useNavigate()
  const [dog, setDog] = useState(null)
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const dogs = await getDogs(); if (!dogs?.length) { setLoading(false); return }
    const d = dogs[0]; setDog(d)
    const v = await getVetVisits(d.id); setVisits(v || []); setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModal(true) }
  const openEdit = (v) => { setEditing(v); setForm({ date: v.date || '', reason: v.reason || '', vet_name: v.vet_name || '', clinic_name: v.clinic_name || '', diagnosis: v.diagnosis || '', treatment: v.treatment || '', cost: v.cost || '', next_appointment: v.next_appointment || '', notes: v.notes || '' }); setModal(true) }
  const handleSave = async () => {
    if (!form.date || !form.reason) return alert('Date and reason required')
    setSaving(true)
    try { await saveVetVisit({ ...form, dog_id: dog.id, cost: form.cost ? parseFloat(form.cost) : null, ...(editing ? { id: editing.id } : {}) }); setModal(false); load() }
    finally { setSaving(false) }
  }
  const handleDelete = async (v) => { if (!confirm('Delete this visit?')) return; await deleteVetVisit(v.id); load() }

  const upcoming = visits.filter(v => v.next_appointment && isAfter(new Date(v.next_appointment), new Date()))
  const past = visits.filter(v => !v.next_appointment || !isAfter(new Date(v.next_appointment), new Date()))

  if (loading) return <div className="app-shell"><div className="page-content"><div className="spinner" /></div></div>

  return (
    <div className="app-shell">
      <div className="gradient-header gh-coral">
        <div className="gh-icon">⚔️</div>
        <button className="back-btn" onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.2)', borderColor: 'transparent', color: 'white' }}>
          <ChevronLeft size={24} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'Fredoka, sans-serif', margin: 0, fontSize: 24, fontWeight: 700 }}>Boss Battles</h1>
          <div style={{ fontSize: 13, opacity: 0.85 }}>Vet encounter log</div>
        </div>
        <button className="btn btn-sm" onClick={openAdd}
          style={{ background: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.4)', color: 'white', fontFamily: 'Fredoka, sans-serif' }}>
          <Plus size={15} /> New Battle
        </button>
      </div>

      <div className="page-content">
        {visits.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⚔️</div>
            <div className="empty-title" style={{ fontFamily: 'Fredoka, sans-serif' }}>No Boss Battles Yet</div>
            <div className="empty-sub">Log vet encounters — diagnoses, treatments, and upcoming battles.</div>
            <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Log First Visit</button>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div className="section">
                <div className="section-title" style={{ fontFamily: 'Fredoka, sans-serif', color: 'var(--coral)' }}>
                  ⚠️ Incoming Boss Battles
                </div>
                {upcoming.map((v) => (
                  <div key={v.id} className="boss-card" onClick={() => openEdit(v)} style={{ cursor: 'pointer', borderLeft: '4px solid var(--coral)', marginBottom: 12 }}>
                    <div className="boss-icon" style={{ background: 'rgba(255,107,107,0.15)', fontSize: 28 }}>🐉</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span className="badge badge-coral">INCOMING BOSS BATTLE</span>
                      </div>
                      <div className="boss-title" style={{ fontFamily: 'Fredoka, sans-serif' }}>{v.reason}</div>
                      <div className="boss-sub">{format(new Date(v.next_appointment), 'MMM d, yyyy')}{v.vet_name ? ` · ${v.vet_name}` : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {past.length > 0 && (
              <div className="section">
                <div className="section-title" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                  Defeated Bosses
                </div>
                {past.map((v) => (
                  <div key={v.id} className="boss-card" onClick={() => openEdit(v)} style={{ cursor: 'pointer', marginBottom: 12 }}>
                    <div className="boss-icon" style={{ background: 'rgba(34,197,94,0.12)', fontSize: 28 }}>💀</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span className="badge badge-mission">DEFEATED</span>
                        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{format(new Date(v.date), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="boss-title" style={{ fontFamily: 'Fredoka, sans-serif' }}>{v.reason}</div>
                      <div className="boss-sub">{v.vet_name ? `${v.vet_name}` : 'Vet encounter'}{v.clinic_name ? ` · ${v.clinic_name}` : ''}</div>
                      {v.diagnosis && (
                        <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6 }}>
                          <span style={{ fontWeight: 600 }}>Diagnosis:</span> {v.diagnosis}
                        </div>
                      )}
                      {v.treatment && (
                        <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>
                          <span style={{ fontWeight: 600 }}>Treatment:</span> {v.treatment}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      {v.cost && (
                        <span className="badge badge-xp" style={{ fontFamily: 'Fredoka, sans-serif' }}>₪{v.cost}</span>
                      )}
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}
                        onClick={e => { e.stopPropagation(); handleDelete(v) }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Boss Battle' : 'Log Boss Battle'}
        footer={<><button className="btn btn-ghost flex-1" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary flex-1" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button></>}
      >
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input type="date" className="form-input" value={form.date} onChange={e => setForm(x => ({ ...x, date: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Cost (₪)</label>
            <input type="number" min="0" className="form-input" value={form.cost} onChange={e => setForm(x => ({ ...x, cost: e.target.value }))} placeholder="0" />
          </div>
        </div>
        {[
          { l: 'Reason / Chief Complaint *', k: 'reason', p: 'e.g. Annual checkup' },
          { l: 'Vet Name', k: 'vet_name', p: 'Dr. Cohen' },
          { l: 'Clinic', k: 'clinic_name', p: 'City Vet Clinic' },
          { l: 'Diagnosis', k: 'diagnosis', p: 'e.g. Ear infection' },
          { l: 'Treatment', k: 'treatment', p: 'e.g. Antibiotics x7 days' }
        ].map(f => (
          <div key={f.k} className="form-group">
            <label className="form-label">{f.l}</label>
            <input type="text" className="form-input" value={form[f.k]} onChange={e => setForm(x => ({ ...x, [f.k]: e.target.value }))} placeholder={f.p} />
          </div>
        ))}
        <div className="form-group">
          <label className="form-label">Next Appointment</label>
          <input type="date" className="form-input" value={form.next_appointment} onChange={e => setForm(x => ({ ...x, next_appointment: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-input form-textarea" value={form.notes} onChange={e => setForm(x => ({ ...x, notes: e.target.value }))} placeholder="Observations, follow-up instructions…" />
        </div>
      </Modal>
    </div>
  )
}
