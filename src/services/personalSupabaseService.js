import { supabase, ensureSupabaseSession, getSupabaseUserId } from '../lib/supabaseClient'

export async function createPersonalService({ name, amount, dueDay, frequency, frequencyDays }) {
  await ensureSupabaseSession()
  const ownerId = await getSupabaseUserId()
  const { data, error } = await supabase
    .from('personal_services')
    .insert({ owner_id: ownerId, name: name.trim(), amount, due_day: dueDay, frequency, frequency_days: frequencyDays || null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updatePersonalServiceAmount(id, amount) {
  await ensureSupabaseSession()
  const { error } = await supabase
    .from('personal_services')
    .update({ amount })
    .eq('id', id)
  if (error) throw error
}

export async function updatePersonalServicePayment(id, date) {
  await ensureSupabaseSession()
  const { error } = await supabase
    .from('personal_services')
    .update({ last_payment_date: date || null })
    .eq('id', id)
  if (error) throw error
}

export async function deletePersonalService(id) {
  await ensureSupabaseSession()
  const { error } = await supabase.from('personal_services').delete().eq('id', id)
  if (error) throw error
}
