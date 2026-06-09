import { supabase, ensureSupabaseSession } from '../../lib/supabaseClient'

export async function createBancoLoan({ clientId, name, amount, termMonths, monthlyPayment, productType }) {
  await ensureSupabaseSession()
  const { data, error } = await supabase
    .from('loans')
    .insert({
      client_id: clientId,
      area: 'banco',
      product_type: productType,
      loan_name: name || null,
      principal_amount: amount,
      term_months: termMonths,
      total_payments: termMonths,
      monthly_payment_amount: monthlyPayment,
      payment_periodicity: 'mensual',
      insurance_amount: 0,
      insurance_mode: 'none',
      current_payment_index: 0,
      status: 'active',
      loan_created_at: new Date().toISOString()
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function registerBancoPayment({ loanId, paymentNumber, amountPaid, previousBalance }) {
  await ensureSupabaseSession()
  const newBalance = Number((previousBalance - amountPaid).toFixed(2))

  const { error: payError } = await supabase
    .from('loan_payments')
    .insert({
      loan_id: loanId,
      payment_number: paymentNumber,
      payment_date: new Date().toISOString(),
      amount_paid: amountPaid,
      previous_balance: previousBalance,
      new_balance: newBalance
    })
  if (payError) throw payError

  const { data: loanData } = await supabase
    .from('loans')
    .select('total_payments')
    .eq('id', loanId)
    .single()

  if (loanData) {
    const nextStatus = paymentNumber >= loanData.total_payments ? 'completed' : 'active'
    await supabase
      .from('loans')
      .update({ current_payment_index: paymentNumber, status: nextStatus })
      .eq('id', loanId)
  }
}

export async function deleteBancoLoan(loanId) {
  await ensureSupabaseSession()
  const { error } = await supabase.from('loans').delete().eq('id', loanId)
  if (error) throw error
}
