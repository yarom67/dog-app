import { supabase, isConfigured } from './supabase'

// ─────────────────────────────────────────────
// Local Storage fallback helpers
// ─────────────────────────────────────────────
const LS_PREFIX = 'dogapp_'
const ls = {
  get: (key) => {
    try { return JSON.parse(localStorage.getItem(LS_PREFIX + key) || '[]') } catch { return [] }
  },
  getOne: (key) => {
    try { return JSON.parse(localStorage.getItem(LS_PREFIX + key) || 'null') } catch { return null }
  },
  set: (key, val) => localStorage.setItem(LS_PREFIX + key, JSON.stringify(val)),
  uid: () => crypto.randomUUID(),
  now: () => new Date().toISOString(),
}

const lsTable = (table) => ({
  getAll: (dogId) => ls.get(table).filter(r => !dogId || r.dog_id === dogId),
  getById: (id) => ls.get(table).find(r => r.id === id) || null,
  insert: (record) => {
    const rows = ls.get(table)
    const newRow = { ...record, id: ls.uid(), created_at: ls.now() }
    ls.set(table, [...rows, newRow])
    return newRow
  },
  update: (id, updates) => {
    const rows = ls.get(table).map(r => r.id === id ? { ...r, ...updates } : r)
    ls.set(table, rows)
    return rows.find(r => r.id === id)
  },
  remove: (id) => {
    const rows = ls.get(table).filter(r => r.id !== id)
    ls.set(table, rows)
    return true
  },
})

// ─────────────────────────────────────────────
// DOGS
// ─────────────────────────────────────────────
export async function getDogs() {
  if (isConfigured()) {
    const { data, error } = await supabase.from('dogs').select('*').order('created_at')
    if (error) throw error
    return data
  }
  return ls.get('dogs')
}

export async function getDog(id) {
  if (isConfigured()) {
    const { data, error } = await supabase.from('dogs').select('*').eq('id', id).single()
    if (error) throw error
    return data
  }
  return ls.get('dogs').find(d => d.id === id) || null
}

export async function saveDog(dog) {
  if (isConfigured()) {
    if (dog.id) {
      const { id, created_at, ...updates } = dog
      const { data, error } = await supabase.from('dogs').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    } else {
      const { data, error } = await supabase.from('dogs').insert(dog).select().single()
      if (error) throw error
      return data
    }
  }
  if (dog.id) {
    return lsTable('dogs').update(dog.id, dog)
  }
  return lsTable('dogs').insert(dog)
}

export async function deleteDog(id) {
  if (isConfigured()) {
    const { error } = await supabase.from('dogs').delete().eq('id', id)
    if (error) throw error
    return true
  }
  lsTable('dogs').remove(id)
  // cascade delete
  ;['medications','vaccinations','weight_logs','vet_visits','food_logs','health_logs'].forEach(t => {
    const rows = ls.get(t).filter(r => r.dog_id !== id)
    ls.set(t, rows)
  })
  return true
}

function compressImage(file, maxPx = 800, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxPx || height > maxPx) {
        if (width > height) { height = Math.round(height * maxPx / width); width = maxPx }
        else { width = Math.round(width * maxPx / height); height = maxPx }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      canvas.toBlob(resolve, 'image/jpeg', quality)
    }
    img.src = url
  })
}

export async function uploadDogImage(file) {
  const compressed = await compressImage(file)
  if (isConfigured()) {
    const path = `dogs/${Date.now()}.jpg`
    const { error } = await supabase.storage.from('dog-images').upload(path, compressed)
    if (error) throw error
    const { data } = supabase.storage.from('dog-images').getPublicUrl(path)
    return data.publicUrl
  }
  // Fallback: base64
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.readAsDataURL(compressed)
  })
}

// ─────────────────────────────────────────────
// MEDICATIONS
// ─────────────────────────────────────────────
export async function getMedications(dogId) {
  if (isConfigured()) {
    const { data, error } = await supabase.from('medications').select('*').eq('dog_id', dogId).order('created_at', { ascending: false })
    if (error) throw error
    return data
  }
  return lsTable('medications').getAll(dogId)
}

export async function saveMedication(med) {
  if (isConfigured()) {
    if (med.id) {
      const { id, created_at, ...updates } = med
      const { data, error } = await supabase.from('medications').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    }
    const { data, error } = await supabase.from('medications').insert(med).select().single()
    if (error) throw error
    return data
  }
  if (med.id) return lsTable('medications').update(med.id, med)
  return lsTable('medications').insert(med)
}

export async function deleteMedication(id) {
  if (isConfigured()) {
    const { error } = await supabase.from('medications').delete().eq('id', id)
    if (error) throw error
    return true
  }
  return lsTable('medications').remove(id)
}

export async function logMedicationGiven(dogId, medicationId, notes = '') {
  const record = { dog_id: dogId, medication_id: medicationId, given_at: new Date().toISOString(), notes }
  if (isConfigured()) {
    const { data, error } = await supabase.from('medication_logs').insert(record).select().single()
    if (error) throw error
    return data
  }
  return lsTable('medication_logs').insert(record)
}

export async function getMedicationLogs(dogId, medicationId) {
  if (isConfigured()) {
    let query = supabase.from('medication_logs').select('*').eq('dog_id', dogId)
    if (medicationId) query = query.eq('medication_id', medicationId)
    const { data, error } = await query.order('given_at', { ascending: false }).limit(30)
    if (error) throw error
    return data
  }
  return lsTable('medication_logs').getAll(dogId).filter(r => !medicationId || r.medication_id === medicationId)
}

// ─────────────────────────────────────────────
// VACCINATIONS
// ─────────────────────────────────────────────
export async function getVaccinations(dogId) {
  if (isConfigured()) {
    const { data, error } = await supabase.from('vaccinations').select('*').eq('dog_id', dogId).order('date_given', { ascending: false })
    if (error) throw error
    return data
  }
  return lsTable('vaccinations').getAll(dogId)
}

export async function saveVaccination(vax) {
  if (isConfigured()) {
    if (vax.id) {
      const { id, created_at, ...updates } = vax
      const { data, error } = await supabase.from('vaccinations').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    }
    const { data, error } = await supabase.from('vaccinations').insert(vax).select().single()
    if (error) throw error
    return data
  }
  if (vax.id) return lsTable('vaccinations').update(vax.id, vax)
  return lsTable('vaccinations').insert(vax)
}

export async function deleteVaccination(id) {
  if (isConfigured()) {
    const { error } = await supabase.from('vaccinations').delete().eq('id', id)
    if (error) throw error
    return true
  }
  return lsTable('vaccinations').remove(id)
}

// ─────────────────────────────────────────────
// WEIGHT LOGS
// ─────────────────────────────────────────────
export async function getWeightLogs(dogId) {
  if (isConfigured()) {
    const { data, error } = await supabase.from('weight_logs').select('*').eq('dog_id', dogId).order('date', { ascending: false })
    if (error) throw error
    return data
  }
  return lsTable('weight_logs').getAll(dogId).sort((a, b) => new Date(b.date) - new Date(a.date))
}

export async function saveWeightLog(log) {
  if (isConfigured()) {
    if (log.id) {
      const { id, created_at, ...updates } = log
      const { data, error } = await supabase.from('weight_logs').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    }
    const { data, error } = await supabase.from('weight_logs').insert(log).select().single()
    if (error) throw error
    return data
  }
  if (log.id) return lsTable('weight_logs').update(log.id, log)
  return lsTable('weight_logs').insert(log)
}

export async function deleteWeightLog(id) {
  if (isConfigured()) {
    const { error } = await supabase.from('weight_logs').delete().eq('id', id)
    if (error) throw error
    return true
  }
  return lsTable('weight_logs').remove(id)
}

// ─────────────────────────────────────────────
// VET VISITS
// ─────────────────────────────────────────────
export async function getVetVisits(dogId) {
  if (isConfigured()) {
    const { data, error } = await supabase.from('vet_visits').select('*').eq('dog_id', dogId).order('date', { ascending: false })
    if (error) throw error
    return data
  }
  return lsTable('vet_visits').getAll(dogId).sort((a, b) => new Date(b.date) - new Date(a.date))
}

export async function saveVetVisit(visit) {
  if (isConfigured()) {
    if (visit.id) {
      const { id, created_at, ...updates } = visit
      const { data, error } = await supabase.from('vet_visits').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    }
    const { data, error } = await supabase.from('vet_visits').insert(visit).select().single()
    if (error) throw error
    return data
  }
  if (visit.id) return lsTable('vet_visits').update(visit.id, visit)
  return lsTable('vet_visits').insert(visit)
}

export async function deleteVetVisit(id) {
  if (isConfigured()) {
    const { error } = await supabase.from('vet_visits').delete().eq('id', id)
    if (error) throw error
    return true
  }
  return lsTable('vet_visits').remove(id)
}

// ─────────────────────────────────────────────
// FOOD LOGS
// ─────────────────────────────────────────────
export async function getFoodLogs(dogId) {
  if (isConfigured()) {
    const { data, error } = await supabase.from('food_logs').select('*').eq('dog_id', dogId).order('date', { ascending: false }).limit(60)
    if (error) throw error
    return data
  }
  return lsTable('food_logs').getAll(dogId).sort((a, b) => new Date(b.date) - new Date(a.date))
}

export async function saveFoodLog(log) {
  if (isConfigured()) {
    if (log.id) {
      const { id, created_at, ...updates } = log
      const { data, error } = await supabase.from('food_logs').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    }
    const { data, error } = await supabase.from('food_logs').insert(log).select().single()
    if (error) throw error
    return data
  }
  if (log.id) return lsTable('food_logs').update(log.id, log)
  return lsTable('food_logs').insert(log)
}

export async function deleteFoodLog(id) {
  if (isConfigured()) {
    const { error } = await supabase.from('food_logs').delete().eq('id', id)
    if (error) throw error
    return true
  }
  return lsTable('food_logs').remove(id)
}

// ─────────────────────────────────────────────
// HEALTH LOGS
// ─────────────────────────────────────────────
export async function getHealthLogs(dogId) {
  if (isConfigured()) {
    const { data, error } = await supabase.from('health_logs').select('*').eq('dog_id', dogId).order('date', { ascending: false }).limit(60)
    if (error) throw error
    return data
  }
  return lsTable('health_logs').getAll(dogId).sort((a, b) => new Date(b.date) - new Date(a.date))
}

export async function saveHealthLog(log) {
  if (isConfigured()) {
    if (log.id) {
      const { id, created_at, ...updates } = log
      const { data, error } = await supabase.from('health_logs').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    }
    const { data, error } = await supabase.from('health_logs').insert(log).select().single()
    if (error) throw error
    return data
  }
  if (log.id) return lsTable('health_logs').update(log.id, log)
  return lsTable('health_logs').insert(log)
}

export async function deleteHealthLog(id) {
  if (isConfigured()) {
    const { error } = await supabase.from('health_logs').delete().eq('id', id)
    if (error) throw error
    return true
  }
  return lsTable('health_logs').remove(id)
}

// ─────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────
export function getSettings() {
  return ls.getOne('settings') || { email: '', reminderDaysBefore: 3, medicationReminders: true, vaccinationReminders: true, vetReminders: true }
}
export function saveSettings(s) {
  ls.set('settings', s)
}

// ─────────────────────────────────────────────
// THERAPY SESSIONS
// ─────────────────────────────────────────────
export async function getTherapySessions(dogId) {
  if (isConfigured()) {
    const { data, error } = await supabase.from('therapy_sessions').select('*').eq('dog_id', dogId).order('date', { ascending: false })
    if (error) throw error
    return data
  }
  return lsTable('therapy_sessions').getAll(dogId).sort((a, b) => new Date(b.date) - new Date(a.date))
}

export async function saveTherapySession(session) {
  if (isConfigured()) {
    if (session.id) {
      const { id, created_at, ...updates } = session
      const { data, error } = await supabase.from('therapy_sessions').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    }
    const { data, error } = await supabase.from('therapy_sessions').insert(session).select().single()
    if (error) throw error
    return data
  }
  if (session.id) return lsTable('therapy_sessions').update(session.id, session)
  return lsTable('therapy_sessions').insert(session)
}

export async function deleteTherapySession(id) {
  if (isConfigured()) {
    const { error } = await supabase.from('therapy_sessions').delete().eq('id', id)
    if (error) throw error
    return true
  }
  return lsTable('therapy_sessions').remove(id)
}
