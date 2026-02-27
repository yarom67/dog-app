import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Plus } from 'lucide-react'
import { getDogs, getHealthLogs, saveHealthLog, deleteHealthLog } from '../lib/db'
import { format, isToday, isYesterday } from 'date-fns'
import Modal from '../components/Modal'

const ENERGY = ['High ⚡', 'Normal', 'Low 😴', 'Very Low 🚨']
const APPETITE = ['Great 🐾', 'Normal', 'Poor', 'Not eating 🚨']
const emptyForm = { date: format(new Date(),'yyyy-MM-dd'), symptoms: '', energy_level: 'Normal', appetite: 'Normal', notes: '' }

function dayLabel(dateStr) {
  const d = new Date(dateStr)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'EEEE, MMM d')
}

const MENU = [
  { icon: '⚔️', label: 'Boss Battles', sub: 'Vet visits & appointments', path: '/vet-visits', bg: 'rgba(255,107,107,0.12)', badge: 'badge-coral' },
  { icon: '🏋️', label: 'Training Log', sub: 'Physio & hydrotherapy', path: '/therapy', bg: 'rgba(79,70,229,0.10)', badge: 'badge-mission' },
  { icon: '📊', label: 'Body Stats', sub: 'Track & chart weight', path: '/weight', bg: 'rgba(168,85,247,0.10)', badge: 'badge-xp' },
  { icon: '⚡', label: 'Energy Sources', sub: 'Meals & nutrition', path: '/food', bg: 'rgba(255,184,0,0.12)', badge: 'badge-primary' },
]

export default function HealthHub() {
  const navigate = useNavigate()
  const [dog, setDog] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const dogs = await getDogs(); if (!dogs?.length) { setLoading(false); return }
    const d = dogs[0]; setDog(d)
    const l = await getHealthLogs(d.id); setLogs(l || []); setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    setSaving(true)
    try { await saveHealthLog({ ...form, dog_id: dog.id }); setModal(false); setForm(emptyForm); load() }
    finally { setSaving(false) }
  }
  const handleDelete = async (id) => { if (!confirm('Delete this log?')) return; await deleteHealthLog(id); load() }

  if (loading) return <div className="app-shell"><div className="page-content"><div className="spinner" /></div></div>

  return (
    <div className="app-shell">
      {/* Gradient header — mission theme */}
      <div className="gradient-header gh-mission">
        <div className="gh-icon">🛡️</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 26, fontWeight: 700, color: 'white', margin: 0, letterSpacing: 0.3 }}>Status Report</h1>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
              {dog?.name ? `${dog.name}'s health command center` : 'Health command center'}
            </p>
          </div>
          <button
            className="btn btn-sm"
            onClick={() => { setForm({ ...emptyForm, date: format(new Date(),'yyyy-MM-dd') }); setModal(true) }}
            style={{ background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.35)', color: 'white', gap: 5, borderRadius: 10 }}
          >
            <Plus size={15} /> Log
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Mission categories */}
        <div className="section" style={{ marginBottom: 0 }}>
          <div className="section-title">Mission Categories</div>
          <div className="card">
            {MENU.map((m, i) => (
              <div
                key={m.path}
                className="list-item"
                style={{ borderBottom: i < MENU.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}
                onClick={() => navigate(m.path)}
              >
                <div className="list-item-icon" style={{ background: m.bg, fontSize: 20 }}>{m.icon}</div>
                <div style={{ flex: 1 }}>
                  <div className="list-item-title" style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600 }}>{m.label}</div>
                  <div className="list-item-sub">{m.sub}</div>
                </div>
                <ChevronRight size={18} color="var(--text-3)" />
              </div>
            ))}
          </div>
        </div>

        {/* Status Effects journal */}
        <div className="section">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Status Effects
            <span className="badge badge-mission" style={{ fontSize: 11 }}>{logs.length}</span>
          </div>
          {logs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🩺</div>
              <div className="empty-title">No status effects logged</div>
              <div className="empty-sub">Tap Log to record symptoms, energy levels, or observations.</div>
              <button className="btn btn-mission" onClick={() => { setForm({ ...emptyForm, date: format(new Date(),'yyyy-MM-dd') }); setModal(true) }}>
                <Plus size={15} /> Log Status
              </button>
            </div>
          ) : (
            <div className="card">
              {logs.slice(0, 20).map((l, i) => (
                <div key={l.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderBottom: i < Math.min(logs.length, 20) - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div className="list-item-icon" style={{ background: 'rgba(34,197,94,0.12)', fontSize: 18 }}>🩺</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>{dayLabel(l.date)}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className={`badge ${l.energy_level?.startsWith('High') ? 'badge-mission' : l.energy_level?.startsWith('Very') ? 'badge-coral' : 'badge-gray'}`} style={{ fontSize: 11 }}>
                          {l.energy_level}
                        </span>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0, lineHeight: 1 }} onClick={() => handleDelete(l.id)}>
                          <span style={{ fontSize: 14 }}>✕</span>
                        </button>
                      </div>
                    </div>
                    {l.symptoms && <div style={{ fontSize: 14, marginTop: 4, fontWeight: 600, color: 'var(--coral)' }}>⚠️ {l.symptoms}</div>}
                    <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 3 }}>Appetite: {l.appetite} · Energy: {l.energy_level}</div>
                    {l.notes && <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 3 }}>{l.notes}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title="Log Status Effect"
        footer={
          <>
            <button className="btn btn-ghost flex-1" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-mission flex-1" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Log'}</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Date</label>
          <input type="date" className="form-input" value={form.date} onChange={e => setForm(x => ({ ...x, date: e.target.value }))} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Energy Level</label>
            <select className="form-input form-select" value={form.energy_level} onChange={e => setForm(x => ({ ...x, energy_level: e.target.value }))}>
              {ENERGY.map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Appetite</label>
            <select className="form-input form-select" value={form.appetite} onChange={e => setForm(x => ({ ...x, appetite: e.target.value }))}>
              {APPETITE.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Symptoms (if any)</label>
          <input type="text" className="form-input" value={form.symptoms} onChange={e => setForm(x => ({ ...x, symptoms: e.target.value }))} placeholder="e.g. Limping, itching, vomiting…" />
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-input form-textarea" value={form.notes} onChange={e => setForm(x => ({ ...x, notes: e.target.value }))} placeholder="Any observations, behavior changes, concerns…" />
        </div>
      </Modal>
    </div>
  )
}
