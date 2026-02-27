import { useState } from 'react'
import { Mail } from 'lucide-react'
import { getSettings, saveSettings } from '../lib/db'
import { isConfigured } from '../lib/supabase'

export default function Settings() {
  const [settings, setSettings] = useState(getSettings())
  const [saved, setSaved] = useState(false)

  const set = (k, v) => setSettings(s => ({ ...s, [k]: v }))
  const handleSave = () => { saveSettings(settings); setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const Toggle = ({ k }) => (
    <button className={`toggle ${settings[k] ? 'on' : ''}`} onClick={() => set(k, !settings[k])}>
      <div className="toggle-thumb" />
    </button>
  )

  const connected = isConfigured()

  return (
    <div className="app-shell">
      {/* Gradient header — primary theme */}
      <div className="gradient-header gh-primary">
        <div className="gh-icon">⚙️</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 26, fontWeight: 700, color: 'white', margin: 0, letterSpacing: 0.3 }}>HQ Settings</h1>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>Configure your command center</p>
          </div>
          <button
            className="btn btn-sm"
            onClick={handleSave}
            style={{ background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.35)', color: 'white', borderRadius: 10, fontWeight: 700 }}
          >
            {saved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Connection status */}
        <div className="section">
          <div className="section-title">Connection Status</div>
          <div className="card card-pad">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 28 }}>{connected ? '🛰️' : '📵'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontWeight: 700, fontFamily: 'Fredoka, sans-serif', fontSize: 16 }}>
                    {connected ? 'Supabase Connected' : 'Running Locally'}
                  </div>
                  <span className={`badge ${connected ? 'badge-mission' : 'badge-coral'}`}>
                    {connected ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>
                  {connected ? 'Data synced to cloud database' : 'Data stored on this device only'}
                </div>
              </div>
            </div>
            {!connected && (
              <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(255,107,107,0.10)', borderRadius: 10, fontSize: 13, borderLeft: '3px solid var(--coral)' }}>
                <strong>To enable cloud sync + email reminders:</strong> Create a Supabase project and add your URL and key to the <code>.env</code> file. See CLAUDE.md for full instructions.
              </div>
            )}
          </div>
        </div>

        {/* Email reminders */}
        <div className="section">
          <div className="section-title">Mission Alerts</div>
          <div className="card card-pad">
            <div className="form-group">
              <label className="form-label"><Mail size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Alert Email</label>
              <input type="email" className="form-input" value={settings.email} onChange={e => set('email', e.target.value)} placeholder="yarom@example.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Alert lead time</label>
              <select className="form-input form-select" value={settings.reminderDaysBefore} onChange={e => set('reminderDaysBefore', parseInt(e.target.value))}>
                {[1, 2, 3, 5, 7, 14].map(d => <option key={d} value={d}>{d} day{d > 1 ? 's' : ''} before</option>)}
              </select>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              {[
                { k: 'medicationReminders', label: 'Daily medication alerts', sub: "Morning email listing today's medications" },
                { k: 'vaccinationReminders', label: 'Vaccination alerts', sub: 'Notified before vaccines expire' },
                { k: 'vetReminders', label: 'Boss battle alerts', sub: 'Reminder before scheduled vet visits' },
                { k: 'therapyReminders', label: 'Training session alerts', sub: 'Reminder before physio / hydro sessions' },
              ].map(({ k, label, sub }) => (
                <div key={k} className="toggle-wrap">
                  <div>
                    <div className="toggle-label">{label}</div>
                    <div className="toggle-sub">{sub}</div>
                  </div>
                  <Toggle k={k} />
                </div>
              ))}
            </div>
            {!connected && (
              <p style={{ fontSize: 12, color: 'var(--coral)', marginTop: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span>⚠️</span> Email alerts require Supabase to be configured.
              </p>
            )}
          </div>
        </div>

        {/* About / app info */}
        <div className="section">
          <div className="section-title">About HQ</div>
          <div className="card">
            {[
              { label: 'App', value: 'Dog Tracker' },
              { label: 'Version', value: '1.0.0' },
              { label: 'Data', value: connected ? 'Supabase (cloud)' : 'LocalStorage (device)' },
            ].map((r, i, arr) => (
              <div
                key={r.label}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <span style={{ color: 'var(--text-2)' }}>{r.label}</span>
                <span style={{ fontWeight: 700, fontFamily: 'Fredoka, sans-serif' }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
