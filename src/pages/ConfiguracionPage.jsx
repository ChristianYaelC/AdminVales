import { useEffect, useMemo, useState } from 'react'
import { BellRing } from 'lucide-react'
import { useClients } from '../context/ClientsContext'

const STORAGE_KEY = 'vales_app_settings'

const defaultSettings = {
  upcomingWindowDays: '7',
  graceDays: '0'
}

function parseLocalDate(dateString) {
  if (!dateString) return null
  const parts = dateString.split('-')
  if (parts.length !== 3) return null

  const year = Number(parts[0])
  const month = Number(parts[1]) - 1
  const day = Number(parts[2])

  if (!year || month < 0 || day < 1) return null
  return new Date(year, month, day)
}

function calculateNextPaymentDate(service) {
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

function ConfiguracionPage() {
  const { valesClients, bancoClients, personalServices } = useClients()
  const [settings, setSettings] = useState(defaultSettings)

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return

    try {
      const parsed = JSON.parse(raw)
      setSettings(prev => ({ ...prev, ...parsed }))
    } catch {
      setSettings(defaultSettings)
    }
  }, [])

  const operationalSummary = useMemo(() => {
    const activeValesLoans = valesClients.reduce(
      (sum, client) => sum + (client.loans || []).filter(loan => loan.status === 'active').length,
      0
    )

    const activeBancoLoans = bancoClients.reduce(
      (sum, client) => sum + (client.loans || []).filter(loan => loan.status === 'active').length,
      0
    )

    const activeBancoInsurance = bancoClients.reduce(
      (sum, client) => sum + (client.insurance || []).filter(item => item.status === 'active').length,
      0
    )

    return {
      activeValesLoans,
      activeBancoProducts: activeBancoLoans + activeBancoInsurance,
      personalServicesCount: personalServices.length
    }
  }, [bancoClients, personalServices, valesClients])

  const reminders = useMemo(() => {
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const windowDays = Number(settings.upcomingWindowDays) || 7
    const graceDays = Number(settings.graceDays) || 0

    return personalServices
      .map(service => {
        const nextDate = calculateNextPaymentDate(service)
        const nextStart = new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate())
        const msPerDay = 1000 * 60 * 60 * 24
        const daysDiff = Math.ceil((nextStart - todayStart) / msPerDay)

        let status = 'future'
        let label = 'Programado'
        let badgeClass = 'bg-gray-100 text-gray-700'

        if (daysDiff < -graceDays) {
          status = 'overdue'
          label = 'Vencido'
          badgeClass = 'bg-red-100 text-red-700'
        } else if (daysDiff <= 0) {
          status = 'today'
          label = 'Hoy'
          badgeClass = 'bg-amber-100 text-amber-700'
        } else if (daysDiff <= windowDays) {
          status = 'upcoming'
          label = 'Próximo'
          badgeClass = 'bg-blue-100 text-blue-700'
        }

        return {
          ...service,
          nextDate,
          daysDiff,
          status,
          label,
          badgeClass
        }
      })
      .filter(item => item.status !== 'future')
      .sort((a, b) => a.daysDiff - b.daysDiff)
  }, [personalServices, settings.graceDays, settings.upcomingWindowDays])

  const reminderCounters = useMemo(() => {
    return {
      overdue: reminders.filter(item => item.status === 'overdue').length,
      today: reminders.filter(item => item.status === 'today').length,
      upcoming: reminders.filter(item => item.status === 'upcoming').length
    }
  }, [reminders])

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow border border-gray-100 p-4">
            <p className="text-sm text-gray-600 mb-1">Préstamos activos (Vales)</p>
            <p className="text-2xl font-bold text-blue-600">{operationalSummary.activeValesLoans}</p>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-100 p-4">
            <p className="text-sm text-gray-600 mb-1">Productos activos (Banco)</p>
            <p className="text-2xl font-bold text-indigo-600">{operationalSummary.activeBancoProducts}</p>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-100 p-4">
            <p className="text-sm text-gray-600 mb-1">Servicios personales</p>
            <p className="text-2xl font-bold text-emerald-600">{operationalSummary.personalServicesCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BellRing size={18} className="text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Centro de Recordatorios</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">Vencidos</p>
              <p className="text-2xl font-bold text-red-700">{reminderCounters.overdue}</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm text-amber-700">Para hoy</p>
              <p className="text-2xl font-bold text-amber-700">{reminderCounters.today}</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-sm text-blue-700">Próximos</p>
              <p className="text-2xl font-bold text-blue-700">{reminderCounters.upcoming}</p>
            </div>
          </div>

          {reminders.length === 0 ? (
            <p className="text-sm text-gray-500">No hay servicios en riesgo dentro de la ventana configurada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Servicio</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Monto</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Próxima fecha</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reminders.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-900 font-medium">{item.name}</td>
                      <td className="px-3 py-2 text-gray-700">${Number(item.amount).toFixed(2)}</td>
                      <td className="px-3 py-2 text-gray-700">{item.nextDate.toLocaleDateString('es-MX')}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${item.badgeClass}`}>
                          {item.label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default ConfiguracionPage
