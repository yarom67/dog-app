// Supabase Edge Function: send-reminders
// Deploy: supabase functions deploy send-reminders
// Schedule: Set a daily cron in Supabase > Database > Extensions > pg_cron
// e.g. SELECT cron.schedule('daily-reminders', '0 7 * * *', 'SELECT net.http_post(...)')

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Dog Tracker <reminders@yourdomain.com>', to, subject, html })
  })
  return res.json()
}

Deno.serve(async () => {
  const today = new Date()
  const in3Days = new Date(today); in3Days.setDate(today.getDate() + 3)
  const todayStr = today.toISOString().split('T')[0]
  const in3DaysStr = in3Days.toISOString().split('T')[0]

  // Get all dogs
  const { data: dogs } = await supabase.from('dogs').select('*')
  if (!dogs?.length) return new Response('No dogs', { status: 200 })

  for (const dog of dogs) {
    // Get reminder settings from health_logs table (simplified — in production store per dog)
    const reminders: string[] = []

    // Vaccinations due within 3 days
    const { data: vaxs } = await supabase.from('vaccinations')
      .select('*').eq('dog_id', dog.id)
      .gte('next_due_date', todayStr).lte('next_due_date', in3DaysStr)
    vaxs?.forEach(v => reminders.push(`💉 <strong>${v.name}</strong> vaccination due on ${v.next_due_date}`))

    // Overdue vaccinations
    const { data: overdueVaxs } = await supabase.from('vaccinations')
      .select('*').eq('dog_id', dog.id).lt('next_due_date', todayStr)
    overdueVaxs?.forEach(v => reminders.push(`🚨 <strong>${v.name}</strong> vaccination is OVERDUE (was due ${v.next_due_date})`))

    // Active medications (daily reminder)
    const { data: meds } = await supabase.from('medications')
      .select('*').eq('dog_id', dog.id).eq('is_active', true)
    if (meds?.length) {
      reminders.push(`💊 Today's medications for ${dog.name}: ${meds.map(m => `<strong>${m.name}</strong> ${m.dosage || ''}`).join(', ')}`)
    }

    // Therapy sessions tomorrow
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    const { data: therapy } = await supabase.from('therapy_sessions')
      .select('*').eq('dog_id', dog.id).eq('next_session_date', tomorrowStr)
    therapy?.forEach(s => reminders.push(`🏊 <strong>${s.session_type}</strong> session tomorrow${s.therapist_name ? ` with ${s.therapist_name}` : ''}`))

    // Vet appointments
    const { data: visits } = await supabase.from('vet_visits')
      .select('*').eq('dog_id', dog.id).gte('next_appointment', todayStr).lte('next_appointment', in3DaysStr)
    visits?.forEach(v => reminders.push(`🏥 Vet appointment on ${v.next_appointment}${v.vet_name ? ` with ${v.vet_name}` : ''}`))

    if (!reminders.length) continue

    // NOTE: In production, store email per dog in a settings table and use that
    // For now, log to console (configure your email in the Settings page)
    console.log(`Reminders for ${dog.name}:`, reminders)

    // To send: get the user's email from your settings table
    // await sendEmail(userEmail, `🐾 ${dog.name} Reminders`, `<ul>${reminders.map(r=>`<li>${r}</li>`).join('')}</ul>`)
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
})
