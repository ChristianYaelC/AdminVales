export const getNextQuincena = (currentPayment) => currentPayment + 1

export const isLoanCompleted = (loan) => loan.currentPayment >= loan.totalPayments

export const getRemainingPayments = (loan) => Math.max(0, loan.totalPayments - loan.currentPayment)

export const getRemainingAmount = (loan) => getRemainingPayments(loan) * loan.finalPayment

export const getSourcePaymentTotal = (loans, source, quincena) => {
  return loans
    .filter((loan) => loan.source === source && loan.status === 'active' && getNextQuincena(loan.currentPayment) === quincena)
    .reduce((sum, loan) => sum + loan.finalPayment, 0)
}

export const getSourceCurrentQuincena = (loans, source) => {
  const loansInSource = loans.filter((loan) => loan.source === source && loan.status === 'active')
  if (loansInSource.length === 0) return null
  return Math.min(...loansInSource.map((loan) => getNextQuincena(loan.currentPayment)))
}

export const getSourceTotalRemaining = (loans, source) => {
  return loans
    .filter((loan) => loan.source === source && loan.status === 'active')
    .reduce((sum, loan) => sum + getRemainingAmount(loan), 0)
}

export const getAllSourcesCurrentTotal = (loans, sourceKeys) => {
  return sourceKeys.reduce((sum, source) => {
    const currentQuincena = getSourceCurrentQuincena(loans, source)
    if (currentQuincena === null) return sum
    return sum + getSourcePaymentTotal(loans, source, currentQuincena)
  }, 0)
}

export const getAllSourcesRemainingTotal = (loans) => {
  return loans
    .filter((loan) => loan.status === 'active')
    .reduce((sum, loan) => sum + getRemainingAmount(loan), 0)
}

export const buildStatementRows = (loan, paymentHistory) => {
  const totalToPay = loan.totalPayments * loan.finalPayment

  return paymentHistory.map((payment, idx) => {
    const paidBefore = paymentHistory.slice(0, idx).reduce((sum, row) => sum + row.amount, 0)
    const previousBalance = totalToPay - paidBefore
    const newBalance = previousBalance - payment.amount

    return {
      ...payment,
      previousBalance,
      newBalance
    }
  })
}

export const registerNextPayment = (loan, date = new Date().toLocaleDateString('es-MX')) => {
  if (!loan || loan.status !== 'active' || isLoanCompleted(loan)) return loan

  const nextPaymentNumber = getNextQuincena(loan.currentPayment)
  const payments = [...(loan.payments || [])]

  payments.push({
    num: nextPaymentNumber,
    amount: loan.finalPayment,
    date
  })

  const currentPayment = loan.currentPayment + 1
  const status = currentPayment >= loan.totalPayments ? 'completed' : 'active'

  return {
    ...loan,
    currentPayment,
    payments,
    status
  }
}

export const registerPaymentForLoanId = (loans, loanId, date = new Date().toLocaleDateString('es-MX')) => {
  return loans.map((loan) => (loan.id === loanId ? registerNextPayment(loan, date) : loan))
}

export const registerPaymentForSourceQuincena = (
  loans,
  source,
  quincena,
  date = new Date().toLocaleDateString('es-MX')
) => {
  return loans.map((loan) => {
    const isTargetLoan =
      loan.status === 'active' &&
      loan.source === source &&
      getNextQuincena(loan.currentPayment) === quincena

    return isTargetLoan ? registerNextPayment(loan, date) : loan
  })
}

export const registerPaymentsForAllActiveLoans = (loans, date = new Date().toLocaleDateString('es-MX')) => {
  return loans.map((loan) => (loan.status === 'active' ? registerNextPayment(loan, date) : loan))
}
