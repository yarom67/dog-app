import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus, Trash2 } from 'lucide-react'
import { getDogs, getFoodLogs, saveFoodLog, deleteFoodLog } from '../lib/db'
import { format, isToday, isYesterday } from 'date-fns'
import Modal from '../components/Modal'

const FOOD_TYPES = ['Dry (Kibble)', 'Wet / Canned', 'Raw', 'Home-cooked', 'Mixed', 'Treats']
const MEAL_TIMES = ['Morning', 'Noon', 'Evening', 'Snack']
const emptyForm = { food_type: 'Dry (Kibble)', brand: '', amount_grams: '', date: format(new Date(),'yyyy-MM-dd'), meal_time: 'Morning', notes: '' }

function dayLabel(dateStr) {
  const d = new Date(dateStr)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'EEEE, MMM d')
}

function mealTimeLabel(mealTime) {
  switch (mealTime) {
    case 'Morning': return { label: 'Early Fuel', badge: 'badge-primary' }
    case 'Noon':    return { label: 'Mid Power',  badge: 'badge-mission' }
    case 'Evening': return { label: 'Evening Boost', badge: 'badge-adventure' }
    case 'Snack':   return { label: 'Bonus Pack',  badge: 'badge-xp' }
    default:        return { label: mealTime || 'Fuel Pack', badge: 'badge-gray' }
  }
}

function mealTimeEmoji(mealTime) {
  switch (mealTime) {
    case 'Morning': return '🌅'
    case 'Noon':    return '☀️'
    case 'Evening': return '🌙'
    case 'Snack':   return '⚡'
    default:        return '🍗'
  }
}

export default function FoodLog() {
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
    const l = await getFoodLogs(d.id); setLogs(l || []); setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!form.food_type) return alert('Food type required')
    setSaving(true)
    try { await saveFoodLog({ ...form, dog_id: dog.id, amount_grams: form.amount_grams ? parseFloat(form.amount_grams) : null }); setModal(false); setForm(emptyForm); load() }
    finally { setSaving(false) }
  }
  const handleDelete = async (id) => { if (!confirm('Delete this entry?')) return; await deleteFoodLog(id); load() }

  // Group by date
  const grouped = logs.reduce((acc, l) => {
    const k = l.date; if (!acc[k]) acc[k] = []; acc[k].push(l); return acc
  }, {})
  const days = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a))

  if (loading) return <div className="app-shell"><div className="page-content"><div className="spinner" /></div></div>

  return (
    <div className="app-shell">
      <div className="gradient-header gh-orange">
        <div className="gh-icon">⚡</div>
        <button className="back-btn" onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.2)', borderColor: 'transparent', color: 'white' }}>
          <ChevronLeft size={24} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'Fredoka, sans-serif', margin: 0, fontSize: 24, fontWeight: 700 }}>Energy Sources</h1>
          <div style={{ fontSize: 13, opacity: 0.85 }}>Daily fuel log</div>
        </div>
        <button className="btn btn-sm" onClick={() => { setForm({ ...emptyForm, date: format(new Date(), 'yyyy-MM-dd') }); setModal(true) }}
          style={{ background: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.4)', color: 'white', fontFamily: 'Fredoka, sans-serif' }}>
          <Plus size={15} /> Add Pack
        </button>
      </div>

      <div className="page-content">
        {days.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⚡</div>
            <div className="empty-title" style={{ fontFamily: 'Fredoka, sans-serif' }}>No Energy Packs Logged</div>
            <div className="empty-sub">Start tracking meals, brands, and portions to monitor daily fuel intake.</div>
            <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setModal(true) }}>
              <Plus size={16} /> Log First Pack
            </button>
          </div>
        ) : (
          days.map(day => {
            const dayEntries = grouped[day]
            const totalGrams = dayEntries.reduce((sum, l) => sum + (l.amount_grams || 0), 0)
            return (
              <div key={day} className="section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' }}>
                  <div className="section-title" style={{ fontFamily: 'Fredoka, sans-serif', marginBottom: 0 }}>{dayLabel(day)}</div>
                  {totalGrams > 0 && (
                    <span className="badge badge-primary" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                      {totalGrams}g total
                    </span>
                  )}
                </div>
                <div className="card">
                  {dayEntries.map((l, i) => {
                    const mt = mealTimeLabel(l.meal_time)
                    return (
                      <div key={l.id} className="list-item" style={{ borderBottom: i < dayEntries.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <div className="list-item-icon" style={{ background: 'rgba(255,184,0,0.15)', fontSize: 22 }}>
                          {mealTimeEmoji(l.meal_time)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="list-item-title" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                            {l.food_type}{l.brand ? ` · ${l.brand}` : ''}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                            <span className={`badge ${mt.badge}`}>{mt.label}</span>
                            {l.amount_grams && (
                              <span className="badge badge-gray">{l.amount_grams}g</span>
                            )}
                            {l.notes && (
                              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{l.notes}</span>
                            )}
                          </div>
                        </div>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 6 }} onClick={() => handleDelete(l.id)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Log Energy Pack"
        footer={<><button className="btn btn-ghost flex-1" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary flex-1" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Pack'}</button></>}
      >
        <div className="form-group">
          <label className="form-label">Food Type</label>
          <select className="form-input form-select" value={form.food_type} onChange={e => setForm(x => ({ ...x, food_type: e.target.value }))}>
            {FOOD_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Brand / Name</label>
          <input type="text" className="form-input" value={form.brand} onChange={e => setForm(x => ({ ...x, brand: e.target.value }))} placeholder="e.g. Royal Canin, homemade chicken" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Amount (grams)</label>
            <input type="number" min="0" className="form-input" value={form.amount_grams} onChange={e => setForm(x => ({ ...x, amount_grams: e.target.value }))} placeholder="e.g. 200" />
          </div>
          <div className="form-group">
            <label className="form-label">Meal Time</label>
            <select className="form-input form-select" value={form.meal_time} onChange={e => setForm(x => ({ ...x, meal_time: e.target.value }))}>
              {MEAL_TIMES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Date</label>
          <input type="date" className="form-input" value={form.date} onChange={e => setForm(x => ({ ...x, date: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <input type="text" className="form-input" value={form.notes} onChange={e => setForm(x => ({ ...x, notes: e.target.value }))} placeholder="Appetite, reactions, leftovers…" />
        </div>
      </Modal>
    </div>
  )
}
