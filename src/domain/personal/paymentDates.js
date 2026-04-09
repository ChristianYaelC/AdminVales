export function parseLocalDate(dateString) {
  if (!dateString) return null
  const parts = dateString.split('-')
  if (parts.length !== 3) return null

  const year = Number(parts[0])
  const month = Number(parts[1]) - 1
  const day = Number(parts[2])

  if (!year || month < 0 || day < 1) return null
  return new Date(year, month, day)
}

export function calculateNextPaymentDate(service) {
  const today = new Date()
  const dueDay = Number(service.dueDay)
  const intervalMonths = {
    monthly: 1,
    bimonthly: 2,
    quarterly: 3
  }

  if (service.lastPaymentDate) {
    const lastPayment = parseLocalDate(service.lastPaymentDate)

    if (lastPayment && !Number.isNaN(lastPayment.getTime())) {
      if (service.frequency === 'custom') {
        const nextDate = new Date(lastPayment)
        nextDate.setDate(nextDate.getDate() + Number(service.frequencyDays || 0))
        return nextDate
      }

      const monthsToAdd = intervalMonths[service.frequency] || 1
      const targetYear = lastPayment.getFullYear()
      const targetMonth = lastPayment.getMonth() + monthsToAdd
      const maxDayInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate()
      const targetDay = Math.min(dueDay, maxDayInTargetMonth)

      return new Date(targetYear, targetMonth, targetDay)
    }
  }

  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  let nextDate = new Date(currentYear, currentMonth, dueDay)

  if (nextDate <= today) {
    if (service.frequency === 'custom') {
      nextDate = new Date(today)
      nextDate.setDate(nextDate.getDate() + Number(service.frequencyDays || 0))
    } else {
      const monthsToAdd = intervalMonths[service.frequency] || 1
      const targetYear = currentYear
      const targetMonth = currentMonth + monthsToAdd
      const maxDayInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate()
      const targetDay = Math.min(dueDay, maxDayInTargetMonth)
      nextDate = new Date(targetYear, targetMonth, targetDay)
    }
  }

  return nextDate
}
