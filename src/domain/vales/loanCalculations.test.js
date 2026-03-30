import { describe, expect, it } from 'vitest'
import {
  getNextQuincena,
  isLoanCompleted,
  getRemainingPayments,
  getRemainingAmount,
  getSourcePaymentTotal,
  getSourceCurrentQuincena,
  getSourceTotalRemaining,
  getAllSourcesCurrentTotal,
  getAllSourcesRemainingTotal,
  buildStatementRows,
  registerNextPayment,
  registerPaymentForLoanId,
  registerPaymentForSourceQuincena,
  registerPaymentsForAllActiveLoans
} from './loanCalculations'

const createLoan = (overrides = {}) => ({
  id: 1,
  source: 'captavale',
  status: 'active',
  currentPayment: 0,
  totalPayments: 4,
  finalPayment: 100,
  payments: [],
  ...overrides
})

describe('loanCalculations', () => {
  it('calcula siguiente quincena y completado correctamente', () => {
    expect(getNextQuincena(0)).toBe(1)
    expect(isLoanCompleted(createLoan({ currentPayment: 3, totalPayments: 4 }))).toBe(false)
    expect(isLoanCompleted(createLoan({ currentPayment: 4, totalPayments: 4 }))).toBe(true)
  })

  it('calcula pagos restantes y monto restante', () => {
    const loan = createLoan({ currentPayment: 1, totalPayments: 4, finalPayment: 250 })
    expect(getRemainingPayments(loan)).toBe(3)
    expect(getRemainingAmount(loan)).toBe(750)
  })

  it('calcula totales por fuente y quincena actual', () => {
    const loans = [
      createLoan({ id: 1, source: 'captavale', currentPayment: 1, finalPayment: 200 }),
      createLoan({ id: 2, source: 'captavale', currentPayment: 1, finalPayment: 300 }),
      createLoan({ id: 3, source: 'salevale', currentPayment: 0, finalPayment: 500 }),
      createLoan({ id: 4, source: 'captavale', currentPayment: 1, finalPayment: 999, status: 'completed' })
    ]

    expect(getSourceCurrentQuincena(loans, 'captavale')).toBe(2)
    expect(getSourcePaymentTotal(loans, 'captavale', 2)).toBe(500)
    expect(getSourceTotalRemaining(loans, 'captavale')).toBe(1500)
  })

  it('calcula totales globales de fuentes', () => {
    const loans = [
      createLoan({ id: 1, source: 'captavale', currentPayment: 0, totalPayments: 4, finalPayment: 100 }),
      createLoan({ id: 2, source: 'salevale', currentPayment: 1, totalPayments: 5, finalPayment: 200 }),
      createLoan({ id: 3, source: 'dportenis', currentPayment: 2, totalPayments: 6, finalPayment: 300 })
    ]

    expect(getAllSourcesCurrentTotal(loans, ['captavale', 'salevale', 'dportenis'])).toBe(600)
    expect(getAllSourcesRemainingTotal(loans)).toBe(2400)
  })

  it('genera filas de estado de cuenta con saldos correctos', () => {
    const loan = createLoan({ totalPayments: 4, finalPayment: 250 })
    const rows = buildStatementRows(loan, [
      { num: 1, amount: 250 },
      { num: 2, amount: 250 }
    ])

    expect(rows[0].previousBalance).toBe(1000)
    expect(rows[0].newBalance).toBe(750)
    expect(rows[1].previousBalance).toBe(750)
    expect(rows[1].newBalance).toBe(500)
  })

  it('registra pago secuencial y completa prestamo al final', () => {
    const loan = createLoan({ currentPayment: 3, totalPayments: 4, finalPayment: 400 })
    const updated = registerNextPayment(loan, '01/01/2026')

    expect(updated.currentPayment).toBe(4)
    expect(updated.status).toBe('completed')
    expect(updated.payments.at(-1)).toEqual({ num: 4, amount: 400, date: '01/01/2026' })
  })

  it('registra pago por loan id, por fuente/quincena y masivo', () => {
    const loans = [
      createLoan({ id: 1, source: 'captavale', currentPayment: 0 }),
      createLoan({ id: 2, source: 'captavale', currentPayment: 1 }),
      createLoan({ id: 3, source: 'salevale', currentPayment: 1 }),
      createLoan({ id: 4, source: 'captavale', currentPayment: 4, totalPayments: 4, status: 'completed' })
    ]

    const byId = registerPaymentForLoanId(loans, 1, '02/01/2026')
    expect(byId.find((l) => l.id === 1).currentPayment).toBe(1)
    expect(byId.find((l) => l.id === 1).payments).toHaveLength(1)

    const bySource = registerPaymentForSourceQuincena(loans, 'captavale', 2, '03/01/2026')
    expect(bySource.find((l) => l.id === 2).currentPayment).toBe(2)
    expect(bySource.find((l) => l.id === 1).currentPayment).toBe(0)

    const mass = registerPaymentsForAllActiveLoans(loans, '04/01/2026')
    expect(mass.find((l) => l.id === 1).currentPayment).toBe(1)
    expect(mass.find((l) => l.id === 2).currentPayment).toBe(2)
    expect(mass.find((l) => l.id === 3).currentPayment).toBe(2)
    expect(mass.find((l) => l.id === 4).currentPayment).toBe(4)
  })
})
