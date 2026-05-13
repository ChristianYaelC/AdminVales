import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useClients } from '../context/ClientsContext'
import PersonalServiceForm from '../components/PersonalServiceForm'
import PersonalServiceTable from '../components/PersonalServiceTable'

function PersonalPage() {
  const { personalServices, setPersonalServices } = useClients()
  const [showAddForm, setShowAddForm] = useState(false)

  const generateLocalId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  const handleAddService = async (serviceData) => {
    let newId = generateLocalId()

    try {
      const { createPersonalService } = await import('../services/personalSupabaseService')
      const persisted = await createPersonalService(serviceData)
      if (persisted) newId = persisted.id
    } catch (error) {
      console.warn('No se pudo persistir servicio en Supabase:', error?.message || error)
    }

    const newService = {
      id: newId,
      ...serviceData,
      lastPaymentDate: null,
      createdAt: new Date().toISOString()
    }
    setPersonalServices([...personalServices, newService])
    setShowAddForm(false)
  }

  const handleUpdateServiceAmount = async (serviceId, newAmount) => {
    const updatedServices = personalServices.map(service =>
      service.id === serviceId ? { ...service, amount: newAmount } : service
    )
    setPersonalServices(updatedServices)

    if (!String(serviceId).startsWith('local-')) {
      try {
        const { updatePersonalServiceAmount } = await import('../services/personalSupabaseService')
        await updatePersonalServiceAmount(serviceId, newAmount)
      } catch (error) {
        console.warn('No se pudo actualizar monto en Supabase:', error?.message || error)
      }
    }
  }

  const handleRegisterPayment = async (serviceId, paymentData) => {
    const updatedServices = personalServices.map(service =>
      service.id === serviceId ? { ...service, lastPaymentDate: paymentData.date } : service
    )
    setPersonalServices(updatedServices)

    if (!String(serviceId).startsWith('local-')) {
      try {
        const { updatePersonalServicePayment } = await import('../services/personalSupabaseService')
        await updatePersonalServicePayment(serviceId, paymentData.date)
      } catch (error) {
        console.warn('No se pudo registrar pago de servicio en Supabase:', error?.message || error)
      }
    }
  }

  const handleDeleteService = async (serviceId) => {
    if (!String(serviceId).startsWith('local-')) {
      try {
        const { deletePersonalService } = await import('../services/personalSupabaseService')
        await deletePersonalService(serviceId)
      } catch (error) {
        console.warn('No se pudo eliminar servicio en Supabase:', error?.message || error)
      }
    }
    setPersonalServices(personalServices.filter(s => s.id !== serviceId))
  }

  const calculateMonthlyTotal = () => {
    return personalServices.reduce((sum, service) => sum + service.amount, 0)
  }

  const calculateYearlyTotal = () => {
    return personalServices.reduce((sum, service) => {
      const monthlyAmount = service.amount
      let yearlyFactor = 12
      
      if (service.frequency === 'bimonthly') {
        yearlyFactor = 6
      } else if (service.frequency === 'quarterly') {
        yearlyFactor = 4
      } else if (service.frequency === 'custom') {
        yearlyFactor = Math.round(365 / service.frequencyDays)
      }
      
      return sum + (monthlyAmount * yearlyFactor)
    }, 0)
  }

  return (
    <div className="p-5 bg-gray-50 min-h-full page-enter">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="panel-title mb-1">Servicios recurrentes</p>
            <div className="flex flex-wrap items-end gap-3">
              <h1 className="text-3xl font-bold text-gray-900 leading-none">Gestión Personal</h1>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm">
                {personalServices.length} servicios
              </span>
            </div>
          </div>
        </div>

        {/* Botón Agregar */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Servicios</h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary"
          >
            <Plus size={20} />
            Nuevo Servicio
          </button>
        </div>

        {/* Tabla de servicios */}
        <PersonalServiceTable
          services={personalServices}
          onUpdateServiceAmount={handleUpdateServiceAmount}
          onRegisterPayment={handleRegisterPayment}
          onDeleteService={handleDeleteService}
        />
      </div>

      {/* Modal para agregar servicio */}
      {showAddForm && (
        <PersonalServiceForm
          onClose={() => setShowAddForm(false)}
          onSubmit={handleAddService}
        />
      )}
    </div>
  )
}

export default PersonalPage
