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
let _sessionPromise = null

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

export async function ensureSupabaseSession() {
  if (!isSupabaseConfigured) {
    throw notConfiguredError
  }

  const { data } = await supabase.auth.getSession()
  if (data?.session?.user) {
    return data.session
  }

  if (!_sessionPromise) {
    _sessionPromise = supabase.auth.signInAnonymously().then(({ data: signInData, error }) => {
      _sessionPromise = null
      if (error) throw error
      if (!signInData?.session?.user) {
        throw new Error('No se pudo iniciar sesion en Supabase')
      }
      return signInData.session
    }).catch((error) => {
      _sessionPromise = null
      throw error
    })
  }

  return _sessionPromise
}
