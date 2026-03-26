import { supabase } from '../lib/supabaseClient'

const parseMxDateToIso = (mxDate) => {
  if (!mxDate) return null
  if (mxDate.includes('-')) return mxDate

  const [day, month, year] = mxDate.split('/')
  if (!day || !month || !year) return null

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00Z`
}

export async function createValesClient({ name, phone, address }) {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      area: 'vales',
      name: name.trim(),
      phone: phone?.trim() || null,
      address: address?.trim() || null
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function createValesLoan({
  clientId,
  folio,
  source,
  amount,
  term,
  basePayment,
  insurance,
  insuranceMode,
  finalPayment,
  createdAtMx
}) {
  const { data, error } = await supabase
    .from('loans')
    .insert({
      client_id: clientId,
      area: 'vales',
      folio,
      source_code: source,
      principal_amount: amount,
      term_quincenas: term,
      total_payments: term,
      base_payment_amount: basePayment,
      insurance_amount: insurance || 0,
      insurance_mode: insuranceMode || 'none',
      final_payment_amount: finalPayment,
      current_payment_index: 0,
      status: 'active',
      loan_created_at: parseMxDateToIso(createdAtMx) || new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function registerNextQuincenaPayment(loanId) {
  const { data: loan, error: loanError } = await supabase
    .from('loans')
    .select('id, total_payments, current_payment_index, final_payment_amount, status')
    .eq('id', loanId)
    .single()

  if (loanError) throw loanError

  if (loan.current_payment_index >= loan.total_payments || loan.status === 'completed') {
    throw new Error('El prestamo ya esta completado')
  }

  const { data: paidRows, error: aggError } = await supabase
    .from('loan_payments')
    .select('amount_paid')
    .eq('loan_id', loanId)

  if (aggError) throw aggError

  const alreadyPaid = (paidRows || []).reduce((sum, row) => sum + Number(row.amount_paid || 0), 0)
  const totalToPay = Number(loan.total_payments) * Number(loan.final_payment_amount)
  const previousBalance = Number((totalToPay - alreadyPaid).toFixed(2))
  const amountPaid = Number(loan.final_payment_amount)
  const newBalance = Number((previousBalance - amountPaid).toFixed(2))
  const paymentNumber = Number(loan.current_payment_index) + 1

  const { error: paymentError } = await supabase
    .from('loan_payments')
    .insert({
      loan_id: loanId,
      payment_number: paymentNumber,
      payment_date: new Date().toISOString(),
      amount_paid: amountPaid,
      previous_balance: previousBalance,
      new_balance: newBalance
    })

  if (paymentError) throw paymentError

  const nextPaymentIndex = paymentNumber
  const nextStatus = nextPaymentIndex >= loan.total_payments ? 'completed' : 'active'

  const { data: updatedLoan, error: updateError } = await supabase
    .from('loans')
    .update({
      current_payment_index: nextPaymentIndex,
      status: nextStatus
    })
    .eq('id', loanId)
    .select()
    .single()

  if (updateError) throw updateError

  return updatedLoan
}

export async function updateLoanCreatedAt(loanId, isoDate) {
  const { data, error } = await supabase
    .from('loans')
    .update({ loan_created_at: isoDate })
    .eq('id', loanId)
    .select('id, loan_created_at')
    .single()

  if (error) throw error
  return data
}

export async function updatePaymentDate(paymentId, isoDate) {
  const { data, error } = await supabase
    .from('loan_payments')
    .update({ payment_date: isoDate })
    .eq('id', paymentId)
    .select('id, payment_date')
    .single()

  if (error) throw error
  return data
}
