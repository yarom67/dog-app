import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { getDogs, getWeightLogs, saveWeightLog, deleteWeightLog } from '../lib/db'
import { format } from 'date-fns'
import Modal from '../components/Modal'

const emptyForm = { weight: '', unit: 'kg', date: format(new Date(),'yyyy-MM-dd'), notes: '' }

export default function WeightLog() {
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
    const l = await getWeightLogs(d.id); setLogs(l || []); setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!form.weight) return alert('Weight required')
    setSaving(true)
    try { await saveWeightLog({ ...form, weight: parseFloat(form.weight), dog_id: dog.id }); setModal(false); setForm(emptyForm); load() }
    finally { setSaving(false) }
  }
  const handleDelete = async (id) => { if (!confirm('Delete this entry?')) return; await deleteWeightLog(id); load() }

  // Chart data: last 10 entries, reversed to chronological
  const chartData = [...logs].reverse().slice(-10)
  const minW = chartData.length ? Math.min(...chartData.map(l => l.weight)) : 0
  const maxW = chartData.length ? Math.max(...chartData.map(l => l.weight)) : 1
  const range = maxW - minW || 1

  const trend = logs.length >= 2 ? (logs[0].weight - logs[1].weight) : 0
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendColor = trend > 0 ? 'var(--coral)' : trend < 0 ? 'var(--adventure)' : 'var(--text-3)'

  if (loading) return <div className="app-shell"><div className="page-content"><div className="spinner" /></div></div>

  return (
    <div className="app-shell">
      <div className="gradient-header gh-blue">
        <div className="gh-icon">⚖️</div>
        <button className="back-btn" onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.2)', borderColor: 'transparent', color: 'white' }}>
          <ChevronLeft size={24} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'Fredoka, sans-serif', margin: 0, fontSize: 24, fontWeight: 700 }}>Body Stats</h1>
          <div style={{ fontSize: 13, opacity: 0.85 }}>Power level tracking</div>
        </div>
        <button className="btn btn-sm" onClick={() => { setForm(emptyForm); setModal(true) }}
          style={{ background: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.4)', color: 'white', fontFamily: 'Fredoka, sans-serif' }}>
          <Plus size={15} /> Log Stat
        </button>
      </div>

      <div className="page-content">
        {logs.length > 0 && (
          <div style={{ padding: '16px 16px 0' }}>
            <div className="card card-pad">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 700 }}>Current Power Level</div>
                  <div style={{ fontSize: 34, fontWeight: 800, color: 'var(--adventure)', fontFamily: 'Fredoka, sans-serif' }}>
                    {logs[0].weight} <span style={{ fontSize: 18 }}>{logs[0].unit || 'kg'}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{format(new Date(logs[0].date), 'MMMM d, yyyy')}</div>
                  <span className="badge badge-blue" style={{ marginTop: 6 }}>Latest Reading</span>
                </div>
                {logs.length >= 2 && (
                  <div style={{ textAlign: 'center' }}>
                    <TrendIcon size={28} color={trendColor} />
                    <div style={{ fontSize: 15, fontWeight: 700, color: trendColor, fontFamily: 'Fredoka, sans-serif' }}>
                      {trend > 0 ? '+' : ''}{trend.toFixed(1)} {logs[0].unit || 'kg'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>vs last stat</div>
                  </div>
                )}
              </div>

              {chartData.length >= 2 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-3)', marginBottom: 8, fontFamily: 'Fredoka, sans-serif' }}>
                    Power Level History
                  </div>
                  <div className="weight-chart-wrap">
                    <div className="weight-chart">
                      {chartData.map((l, i) => {
                        const h = Math.max(20, ((l.weight - minW) / range) * 90)
                        return (
                          <div key={l.id || i} className="weight-bar-wrap">
                            <div className="weight-val">{l.weight}</div>
                            <div className={`weight-bar ${i === chartData.length - 1 ? 'latest' : ''}`} style={{ height: h }} />
                            <div className="weight-bar-label">{format(new Date(l.date), 'd/M')}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="section">
          {logs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⚖️</div>
              <div className="empty-title" style={{ fontFamily: 'Fredoka, sans-serif' }}>No Stats Recorded</div>
              <div className="empty-sub">Start logging body stats to track your dog's power level over time.</div>
              <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setModal(true) }}>
                <Plus size={16} /> Log First Stat
              </button>
            </div>
          ) : (
            <>
              <div className="section-title" style={{ fontFamily: 'Fredoka, sans-serif' }}>Stat Log</div>
              <div className="card">
                {logs.map((l, i) => (
                  <div key={l.id} className="list-item" style={{ borderBottom: i < logs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div className="list-item-icon" style={{ background: 'rgba(79,70,229,0.12)', fontSize: 22 }}>⚖️</div>
                    <div style={{ flex: 1 }}>
                      <div className="list-item-title" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                        {l.weight} {l.unit || 'kg'}
                        {i === 0 && <span className="badge badge-blue" style={{ marginLeft: 8 }}>Current</span>}
                      </div>
                      <div className="list-item-sub">{format(new Date(l.date), 'MMMM d, yyyy')}{l.notes ? ` · ${l.notes}` : ''}</div>
                    </div>
                    {i > 0 && logs[i - 1] && (
                      <div style={{ fontSize: 13, fontWeight: 700, color: l.weight > logs[i - 1].weight ? 'var(--coral)' : l.weight < logs[i - 1].weight ? 'var(--adventure)' : 'var(--text-3)', fontFamily: 'Fredoka, sans-serif' }}>
                        {l.weight > logs[i - 1].weight ? '+' : ''}{(l.weight - logs[i - 1].weight).toFixed(1)}
                      </div>
                    )}
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 6 }} onClick={() => handleDelete(l.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Log Body Stat"
        footer={<><button className="btn btn-ghost flex-1" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary flex-1" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Stat'}</button></>}
      >
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Weight *</label>
            <input type="number" step="0.1" min="0" className="form-input" value={form.weight} onChange={e => setForm(x => ({ ...x, weight: e.target.value }))} placeholder="0.0" />
          </div>
          <div className="form-group">
            <label className="form-label">Unit</label>
            <select className="form-input form-select" value={form.unit} onChange={e => setForm(x => ({ ...x, unit: e.target.value }))}>
              <option value="kg">kg</option><option value="lbs">lbs</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Date</label>
          <input type="date" className="form-input" value={form.date} onChange={e => setForm(x => ({ ...x, date: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <input type="text" className="form-input" value={form.notes} onChange={e => setForm(x => ({ ...x, notes: e.target.value }))} placeholder="e.g. Before meal, after grooming…" />
        </div>
      </Modal>
    </div>
  )
}
