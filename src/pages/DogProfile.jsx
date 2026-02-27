import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Camera, Trash2, Save } from 'lucide-react'
import { getDogs, saveDog, deleteDog, uploadDogImage } from '../lib/db'

export default function DogProfile() {
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [dog, setDog] = useState(null)
  const [form, setForm] = useState({ name: '', breed: '', date_of_birth: '', gender: 'Male', color: '', microchip_number: '', avatar_url: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getDogs().then(dogs => {
      if (dogs?.length) {
        const d = dogs[0]; setDog(d)
        setForm({ name: d.name || '', breed: d.breed || '', date_of_birth: d.date_of_birth || '', gender: d.gender || 'Male', color: d.color || '', microchip_number: d.microchip_number || '', avatar_url: d.avatar_url || '' })
      }
      setLoading(false)
    })
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try { const url = await uploadDogImage(file); set('avatar_url', url) }
    catch (err) { alert('Upload failed: ' + err.message) }
    finally { setUploading(false) }
  }

  const handleSave = async () => {
    if (!form.name.trim()) return alert('Hero name is required')
    setSaving(true)
    try {
      const result = await saveDog({ ...form, ...(dog?.id ? { id: dog.id } : {}) })
      setDog(result); setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch (err) { alert('Save failed: ' + err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!dog?.id) return
    if (!confirm(`Delete ${dog.name}? All data will be lost and cannot be undone.`)) return
    try { await deleteDog(dog.id); navigate('/') }
    catch (err) { alert('Delete failed: ' + err.message) }
  }

  if (loading) return <div className="app-shell"><div className="page-content"><div className="spinner" /></div></div>

  return (
    <div className="app-shell">
      {/* Simple page header — no gradient per spec for DogProfile */}
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}><ChevronLeft size={24} /></button>
        <h1 style={{ fontFamily: 'Fredoka, sans-serif' }}>Hero Profile</h1>
        <button className="header-action" onClick={handleSave} disabled={saving}>
          {saved ? '✓ Saved' : saving ? 'Saving…' : <><Save size={15} /> Save</>}
        </button>
      </div>

      <div className="page-content">
        {/* Photo upload — level ring effect */}
        <div className="photo-upload-area">
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* Level ring */}
            <div style={{
              position: 'absolute', inset: -5, borderRadius: '50%',
              background: 'conic-gradient(var(--xp) 75%, var(--border) 0)',
              zIndex: 0,
            }} />
            <div style={{
              position: 'absolute', inset: -2, borderRadius: '50%',
              background: 'var(--bg)', zIndex: 1,
            }} />
            {/* Avatar circle */}
            <div
              className="photo-circle"
              style={{ position: 'relative', zIndex: 2, cursor: 'pointer', border: '3px solid white' }}
              onClick={() => fileRef.current?.click()}
            >
              {form.avatar_url
                ? <img src={form.avatar_url} alt="Hero" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : <span style={{ fontSize: 44 }}>🐕</span>
              }
            </div>
            {/* Camera button */}
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                position: 'absolute', bottom: 2, right: 2, zIndex: 3,
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--xp)', border: '2px solid white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
              aria-label="Upload photo"
            >
              <Camera size={15} color="white" />
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 14 }}>
            {uploading ? 'Uploading hero portrait…' : 'Tap to change hero portrait'}
          </p>
          {form.name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>{form.name}</span>
              <span className="badge badge-xp" style={{ fontSize: 12 }}>Lv. 1 Hero</span>
            </div>
          )}
        </div>

        {/* Form fields with gamified labels */}
        <div style={{ padding: '0 16px 40px' }}>
          <div className="card" style={{ padding: '16px 18px', marginBottom: 16 }}>

            <div className="form-group">
              <label className="form-label">Hero Name *</label>
              <input type="text" className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Max" />
            </div>

            <div className="form-group">
              <label className="form-label">Species / Breed</label>
              <input type="text" className="form-input" value={form.breed} onChange={e => set('breed', e.target.value)} placeholder="e.g. Labrador" />
            </div>

            <div className="form-group">
              <label className="form-label">Birth Date</label>
              <input type="date" className="form-input" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Color / Markings</label>
              <input type="text" className="form-input" value={form.color} onChange={e => set('color', e.target.value)} placeholder="e.g. Golden with white chest" />
            </div>

            <div className="form-group">
              <label className="form-label">Microchip ID</label>
              <input type="text" className="form-input" value={form.microchip_number} onChange={e => set('microchip_number', e.target.value)} placeholder="e.g. 900123456789" />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Gender</label>
              <select className="form-input form-select" value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option>Male</option>
                <option>Female</option>
              </select>
            </div>
          </div>

          <button
            className="btn btn-primary btn-full"
            onClick={handleSave}
            disabled={saving}
            style={{ marginBottom: 12, fontFamily: 'Fredoka, sans-serif', fontSize: 16, letterSpacing: 0.3 }}
          >
            {saved ? '✓ Hero Updated!' : saving ? 'Saving…' : '⚔️ Update Hero'}
          </button>

          {dog?.id && (
            <button className="btn btn-danger btn-full" onClick={handleDelete}>
              <Trash2 size={16} /> Delete {dog.name}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
