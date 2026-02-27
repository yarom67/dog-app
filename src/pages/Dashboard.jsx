import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Plus, Star, Zap, Check } from 'lucide-react'
import { getDogs, getMedications, getVaccinations, getVetVisits, getWeightLogs, logMedicationGiven } from '../lib/db'
import { formatDistanceToNow, addDays, isAfter, isBefore, differenceInYears, differenceInMonths } from 'date-fns'

function calcAge(dob) {
  if (!dob) return null
  const birth = new Date(dob)
  const y = differenceInYears(new Date(), birth)
  const m = differenceInMonths(new Date(), birth)
  if (y >= 1) return `${y} yr${y !== 1 ? 's' : ''}`
  return `${m} mo${m !== 1 ? 's' : ''}`
}

// Deterministic XP from dog data
function calcXP(dog, meds, vaxs, visits) {
  let xp = 100
  if (dog?.date_of_birth) xp += 50
  if (dog?.breed) xp += 30
  if (dog?.avatar_url) xp += 80
  xp += meds.length * 20
  xp += vaxs.length * 40
  xp += visits.length * 60
  return xp
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [dog, setDog] = useState(null)
  const [meds, setMeds] = useState([])
  const [vaxs, setVaxs] = useState([])
  const [visits, setVisits] = useState([])
  const [weights, setWeights] = useState([])
  const [loading, setLoading] = useState(true)
  const [givingMed, setGivingMed] = useState(null)
  const [givenMeds, setGivenMeds] = useState(new Set())
  const [xpWidth, setXpWidth] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const dogs = await getDogs()
      if (!dogs?.length) { setDog(null); setLoading(false); return }
      const d = dogs[0]; setDog(d)
      const [m, v, vt, w] = await Promise.all([
        getMedications(d.id), getVaccinations(d.id), getVetVisits(d.id), getWeightLogs(d.id)
      ])
      setMeds(m || []); setVaxs(v || []); setVisits(vt || []); setWeights(w || [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // Animate XP bar after mount
  useEffect(() => {
    if (!dog) return
    const xp = calcXP(dog, meds, vaxs, visits)
    const pct = Math.min((xp % 500) / 500 * 100, 100)
    const t = setTimeout(() => setXpWidth(pct), 300)
    return () => clearTimeout(t)
  }, [dog, meds, vaxs, visits])

  const handleGive = async (medId) => {
    setGivingMed(medId)
    try {
      await logMedicationGiven(dog.id, medId)
      setGivenMeds(prev => new Set([...prev, medId]))
    } finally { setGivingMed(null) }
  }

  const activeMeds = meds.filter(m => m.is_active !== false)
  const upcomingVaxs = vaxs.filter(v => {
    if (!v.next_due_date) return false
    const d = new Date(v.next_due_date)
    return isAfter(d, new Date()) && isBefore(d, addDays(new Date(), 30))
  })
  const overdueVaxs = vaxs.filter(v => v.next_due_date && isBefore(new Date(v.next_due_date), new Date()))
  const nextVisit = visits.find(v => v.next_appointment && isAfter(new Date(v.next_appointment), new Date()))
  const lastWeight = weights[0]

  const alerts = [
    ...overdueVaxs.map(v => ({ type: 'urgent', icon: '🛡️', title: `${v.name} shield expired!`, sub: `Was due ${formatDistanceToNow(new Date(v.next_due_date), { addSuffix: true })}` })),
    ...upcomingVaxs.map(v => ({ type: 'warning', icon: '⚡', title: `${v.name} recharge needed`, sub: `Due ${formatDistanceToNow(new Date(v.next_due_date), { addSuffix: true })}` })),
  ]

  const xp = dog ? calcXP(dog, meds, vaxs, visits) : 0
  const level = Math.floor(xp / 500) + 1
  const nextLevelXp = level * 500
  const currentLevelXp = (level - 1) * 500
  const xpInLevel = xp - currentLevelXp
  const xpNeeded = nextLevelXp - currentLevelXp

  if (loading) return (
    <div className="app-shell"><div className="page-content"><div className="spinner" /></div></div>
  )

  if (!dog) return (
    <div className="onboarding-wrap">
      <div className="onboarding-paw">🐾</div>
      <h2 className="onboarding-title">Begin Your Quest!</h2>
      <p className="onboarding-sub">Register your dog to start tracking their health adventure.</p>
      <div className="onboarding-card">
        <button className="btn btn-primary btn-full" onClick={() => navigate('/dog-profile')}>
          <Plus size={18} /> Add Your Hero Dog
        </button>
      </div>
    </div>
  )

  return (
    <div className="app-shell">
      <div className="page-content">

        {/* ── Header ──────────────────────────────── */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 12px', position: 'sticky', top: 0, zIndex: 100, background: 'rgba(248,250,252,0.95)', backdropFilter: 'blur(12px)' }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--text-3)' }}>Mission HQ</p>
            <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Fredoka, sans-serif' }}>{dog.name}'s Dashboard</h2>
          </div>
          <div className="xp-counter">
            <Star size={16} className="xp-star" fill="var(--primary)" stroke="var(--primary)" />
            <span className="xp-count">{xp.toLocaleString()}</span>
          </div>
        </header>

        {/* ── Dog Hero Card ────────────────────────── */}
        <div className="dog-hero" onClick={() => navigate('/dog-profile')} style={{ cursor: 'pointer' }}>
          <div className="dog-hero-row">
            <div className="dog-avatar">
              {dog.avatar_url ? <img src={dog.avatar_url} alt={dog.name} /> : '🐕'}
            </div>
            <div style={{ flex: 1 }}>
              <div className="level-badge-hero">⚔️ LVL {level}</div>
              <div className="dog-hero-name">{dog.name}</div>
              <div className="dog-hero-sub">{[dog.breed, calcAge(dog.date_of_birth), dog.gender].filter(Boolean).join(' · ')}</div>
              <div className="hero-xp-bar"><div className="hero-xp-fill" style={{ width: `${xpWidth}%` }} /></div>
              <div className="hero-xp-label">{xpInLevel} / {xpNeeded} XP to Level {level + 1}</div>
            </div>
            <ChevronRight size={18} style={{ color: 'rgba(255,255,255,0.6)', flexShrink: 0 }} />
          </div>
        </div>

        {/* ── Quick Actions ────────────────────────── */}
        <div style={{ padding: '16px 16px 0' }}>
          <div className="quick-actions" style={{ padding: 0 }}>
            {[
              { label: 'Weight', icon: '⚖️', bg: 'var(--blue-light)', path: '/weight' },
              { label: 'Food', icon: '🍗', bg: 'var(--orange-light)', path: '/food' },
              { label: 'Health', icon: '🩺', bg: 'var(--coral-light)', path: '/health' },
              { label: 'Training', icon: '💧', bg: 'var(--xp-light)', path: '/therapy' },
            ].map(a => (
              <button key={a.path} className="quick-action" onClick={() => navigate(a.path)}>
                <div className="quick-action-icon" style={{ background: a.bg }}>{a.icon}</div>
                <span className="quick-action-label">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Danger Alerts ────────────────────────── */}
        {alerts.length > 0 && (
          <div className="section">
            <div className="section-title">⚠️ Danger Alerts</div>
            {alerts.map((a, i) => (
              <div key={i} className={`alert-card ${a.type}`}>
                <div className="alert-icon">{a.icon}</div>
                <div className="alert-text">
                  <div className="alert-title">{a.title}</div>
                  <div className="alert-sub">{a.sub}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Today's Missions ─────────────────────── */}
        <div className="section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0 12px' }}>
            <span className="section-title" style={{ padding: 0 }}>⚔️ Today's Missions</span>
            {activeMeds.length > 0 && (
              <span style={{ fontSize: 11, fontWeight: 800, background: 'var(--mission-light)', color: '#15803D', padding: '3px 10px', borderRadius: 999 }}>
                {givenMeds.size}/{activeMeds.length} DONE
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeMeds.length === 0 && !nextVisit ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-3)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>All clear! No missions today.</div>
              </div>
            ) : (
              <>
                {activeMeds.map(med => {
                  const done = givenMeds.has(med.id)
                  return (
                    <div key={med.id} className={`mission-card ${done ? 'done' : ''}`}>
                      <button
                        className={`mission-check ${done ? 'done' : ''}`}
                        onClick={() => !done && handleGive(med.id)}
                        disabled={givingMed === med.id || done}
                        aria-label={`Mark ${med.name} as given`}
                      >
                        {done ? <Check size={16} /> : <Zap size={14} />}
                      </button>
                      <div style={{ flex: 1 }}>
                        <div className="list-item-title" style={{ color: done ? 'var(--text-3)' : 'var(--text)', textDecoration: done ? 'line-through' : 'none' }}>{med.name}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2, color: done ? 'var(--mission)' : 'var(--text-3)' }}>
                          {done ? '✓ Mission Success' : (med.dosage || 'Daily Potion')}
                        </div>
                      </div>
                      <span className={`mission-xp ${done ? 'done' : ''}`}>+{20} XP</span>
                    </div>
                  )
                })}
                {nextVisit && (
                  <div className="boss-card" onClick={() => navigate('/vet-visits')} style={{ cursor: 'pointer' }}>
                    <div className="boss-icon">🏥</div>
                    <div style={{ flex: 1 }}>
                      <div className="boss-label">Boss Battle</div>
                      <div className="boss-title">Vet Visit</div>
                      <div className="boss-sub">{formatDistanceToNow(new Date(nextVisit.next_appointment), { addSuffix: true })}</div>
                    </div>
                    <ChevronRight size={18} style={{ color: 'var(--coral)' }} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Vitals ───────────────────────────────── */}
        <div className="section">
          <div className="section-title">📊 Vitals</div>
          <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <VitalBar label="Weight" icon="⚖️" value={lastWeight ? `${lastWeight.weight} ${lastWeight.unit || 'kg'}` : '—'} pct={lastWeight ? 70 : 0} color="var(--adventure)" iconEmoji="⚖️" progressClass="progress-fill" progressColor="var(--adventure)" />
            <VitalBar label="Vaccinations" icon="🛡️" value={`${vaxs.length} on record`} pct={Math.min(vaxs.length * 20, 100)} color="var(--xp)" progressClass="progress-fill" progressColor="var(--xp)" />
          </div>
        </div>

        {/* ── Stats ────────────────────────────────── */}
        <div className="section">
          <div className="section-title">🏆 Stats</div>
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-value">{lastWeight ? lastWeight.weight : '—'}</div>
              <div className="stat-label">{lastWeight ? lastWeight.unit || 'kg' : 'No weight'}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{activeMeds.length}</div>
              <div className="stat-label">Active meds</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{vaxs.length}</div>
              <div className="stat-label">Vaccines</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

function VitalBar({ label, icon, value, pct, progressColor }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 400)
    return () => clearTimeout(t)
  }, [pct])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
          {icon} {label}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{value}</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${width}%`, background: progressColor }} />
        {width > 0 && (
          <div className="progress-icon" style={{ left: `${width}%`, color: progressColor }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
