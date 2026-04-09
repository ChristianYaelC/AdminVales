import { describe, expect, it } from 'vitest'
import { calculateNextPaymentDate, parseLocalDate } from './paymentDates'

describe('paymentDates', () => {
  it('parsea fecha local ISO sin zona horaria', () => {
    const date = parseLocalDate('2026-04-08')
    expect(date).not.toBeNull()
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(3)
    expect(date.getDate()).toBe(8)
  })

  it('calcula siguiente pago mensual desde ultimo pago', () => {
    const service = {
      dueDay: 15,
      frequency: 'monthly',
      lastPaymentDate: '2026-03-10'
    }

    const nextDate = calculateNextPaymentDate(service)
    expect(nextDate.getFullYear()).toBe(2026)
    expect(nextDate.getMonth()).toBe(3)
    expect(nextDate.getDate()).toBe(15)
  })

  it('calcula siguiente pago custom por dias', () => {
    const service = {
      dueDay: 1,
      frequency: 'custom',
      frequencyDays: 20,
      lastPaymentDate: '2026-04-01'
    }

    const nextDate = calculateNextPaymentDate(service)
    expect(nextDate.getFullYear()).toBe(2026)
    expect(nextDate.getMonth()).toBe(3)
    expect(nextDate.getDate()).toBe(21)
  })
})
