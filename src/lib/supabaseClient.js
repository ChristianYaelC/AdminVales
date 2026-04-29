import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const notConfiguredError = new Error('Supabase no configurado: faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY')

const _noopReject = async () => ({ error: notConfiguredError })

const _shim = {
  from: () => ({
    select: _noopReject,
    insert: _noopReject,
    update: _noopReject,
    delete: _noopReject,
    upsert: _noopReject,
  }),
  rpc: async () => ({ error: notConfiguredError }),
  auth: {
    signIn: _noopReject,
    signOut: _noopReject,
  },
}

let _supabase = _shim
let isSupabaseConfigured = false

if (supabaseUrl && supabaseAnonKey) {
  try {
    _supabase = createClient(supabaseUrl, supabaseAnonKey)
    isSupabaseConfigured = true
  } catch (e) {
    console.warn('Error creando cliente Supabase, usando shim:', e)
    _supabase = _shim
    isSupabaseConfigured = false
  }
} else {
  console.info('VITE_SUPABASE_URL/ANON_KEY no encontradas — usando shim de Supabase (sin conexión).')
}

export const supabase = _supabase
export { isSupabaseConfigured }
