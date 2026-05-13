import { createContext, useState, useContext, useEffect } from 'react'
import { supabase, ensureAnonAuth, isSupabaseConfigured } from '../lib/supabaseClient'

const ClientsContext = createContext()

function loadFromStorage(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function mapValesClient(client) {
  return {
    id: client.id,
    name: client.name,
    phone: client.phone || '',
    address: client.address || '',
    workAddress: client.work_address || '',
    loans: (client.loans || []).map(loan => ({
      id: loan.id,
      folio: loan.folio,
      source: loan.source_code,
      amount: Number(loan.principal_amount),
      term: loan.term_quincenas,
      insurance: Number(loan.insurance_amount || 0),
      basePayment: Number(loan.base_payment_amount || 0),
      finalPayment: Number(loan.final_payment_amount || 0),
      currentPayment: loan.current_payment_index,
      totalPayments: loan.total_payments,
      payments: (loan.loan_payments || [])
        .sort((a, b) => a.payment_number - b.payment_number)
        .map(p => ({ num: p.payment_number, amount: Number(p.amount_paid), date: p.payment_date, id: p.id })),
      status: loan.status,
      createdAt: loan.loan_created_at
        ? new Date(loan.loan_created_at).toLocaleDateString('es-MX')
        : new Date().toLocaleDateString('es-MX')
    }))
  }
}

function mapBancoClient(client) {
  const allLoans = client.loans || []
  return {
    id: client.id,
    name: client.name,
    phone: client.phone || '',
    address: client.address || '',
    workAddress: client.work_address || '',
    insurance: allLoans
      .filter(l => l.product_type === 'insurance')
      .map(l => ({
        id: l.id,
        name: l.loan_name || '',
        amount: Number(l.principal_amount),
        termMonths: l.term_months,
        monthlyPayment: Number(l.monthly_payment_amount || 0),
        payments: (l.loan_payments || [])
          .sort((a, b) => a.payment_number - b.payment_number)
          .map(p => ({ id: p.id, amount: Number(p.amount_paid), date: p.payment_date })),
        status: l.status,
        createdAt: new Date(l.loan_created_at || l.created_at).toLocaleDateString('es-MX')
      })),
    loans: allLoans
      .filter(l => l.product_type === 'loan')
      .map(l => ({
        id: l.id,
        amount: Number(l.principal_amount),
        termMonths: l.term_months,
        monthlyPayment: Number(l.monthly_payment_amount || 0),
        payments: (l.loan_payments || [])
          .sort((a, b) => a.payment_number - b.payment_number)
          .map(p => ({ id: p.id, amount: Number(p.amount_paid), date: p.payment_date })),
        status: l.status,
        createdAt: new Date(l.loan_created_at || l.created_at).toLocaleDateString('es-MX')
      }))
  }
}

function mapPersonalService(s) {
  return {
    id: s.id,
    name: s.name,
    amount: Number(s.amount),
    dueDay: s.due_day,
    frequency: s.frequency,
    frequencyDays: s.frequency_days || null,
    lastPaymentDate: s.last_payment_date || null,
    createdAt: s.created_at
  }
}

export function ClientsProvider({ children }) {
  const [valesClients, setValesClients] = useState(() => loadFromStorage('vales_clients'))
  const [bancoClients, setBancoClients] = useState(() => loadFromStorage('banco_clients'))
  const [personalServices, setPersonalServices] = useState(() => loadFromStorage('personal_services'))

  // Persist to localStorage as cache on every state change
  useEffect(() => {
    localStorage.setItem('vales_clients', JSON.stringify(valesClients))
  }, [valesClients])

  useEffect(() => {
    localStorage.setItem('banco_clients', JSON.stringify(bancoClients))
  }, [bancoClients])

  useEffect(() => {
    localStorage.setItem('personal_services', JSON.stringify(personalServices))
  }, [personalServices])

  // Load from Supabase on mount
  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false

    const loadAll = async () => {
      await ensureAnonAuth()
      if (cancelled) return

      const [valesRes, bancoRes, servicesRes] = await Promise.all([
        supabase
          .from('clients')
          .select('*, loans(*, loan_payments(*))')
          .eq('area', 'vales')
          .order('created_at'),
        supabase
          .from('clients')
          .select('*, loans(*, loan_payments(*))')
          .eq('area', 'banco')
          .order('created_at'),
        supabase
          .from('personal_services')
          .select('*')
          .order('created_at')
      ])

      if (!cancelled) {
        if (valesRes.data) setValesClients(valesRes.data.map(mapValesClient))
        if (bancoRes.data) setBancoClients(bancoRes.data.map(mapBancoClient))
        if (servicesRes.data) setPersonalServices(servicesRes.data.map(mapPersonalService))
      }
    }

    loadAll().catch(err => console.warn('Error cargando datos de Supabase:', err))
    return () => { cancelled = true }
  }, [])

  const isFolioUnique = (folio) => {
    if (!folio) return true
    return !valesClients.some(client =>
      client.loans && client.loans.some(loan => loan.folio === folio)
    )
  }

  const getFoliosByClient = (clientId) => {
    const client = valesClients.find(c => c.id === clientId)
    return client && client.loans ? client.loans.map(l => l.folio).filter(Boolean) : []
  }

  const findLoanByFolio = (folio) => {
    for (const client of valesClients) {
      const loan = client.loans?.find(l => l.folio === folio)
      if (loan) return { client, loan }
    }
    return null
  }

  return (
    <ClientsContext.Provider value={{
      valesClients,
      setValesClients,
      bancoClients,
      setBancoClients,
      personalServices,
      setPersonalServices,
      clients: valesClients,
      setClients: setValesClients,
      isFolioUnique,
      getFoliosByClient,
      findLoanByFolio
    }}>
      {children}
    </ClientsContext.Provider>
  )
}

export function useClients() {
  const context = useContext(ClientsContext)
  if (!context) {
    throw new Error('useClients debe usarse dentro de ClientsProvider')
  }
  return context
}
