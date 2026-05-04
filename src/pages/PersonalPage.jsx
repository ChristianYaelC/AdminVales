import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useClients } from '../context/ClientsContext'
import PersonalServiceForm from '../components/PersonalServiceForm'
import PersonalServiceTable from '../components/PersonalServiceTable'

function PersonalPage() {
  const { personalServices, setPersonalServices } = useClients()
  const [showAddForm, setShowAddForm] = useState(false)

  const handleAddService = (serviceData) => {
    const newService = {
      id: Math.max(...personalServices.map(s => s.id), 0) + 1,
      ...serviceData,
      lastPaymentDate: null,
      createdAt: new Date().toISOString()
    }
    setPersonalServices([...personalServices, newService])
    setShowAddForm(false)
  }

  const handleUpdateServiceAmount = (serviceId, newAmount) => {
    const updatedServices = personalServices.map(service => {
      if (service.id === serviceId) {
        return {
          ...service,
          amount: newAmount
        }
      }
      return service
    })
    setPersonalServices(updatedServices)
  }

  const handleRegisterPayment = (serviceId, paymentData) => {
    const updatedServices = personalServices.map(service => {
      if (service.id === serviceId) {
        return {
          ...service,
          lastPaymentDate: paymentData.date
        }
      }
      return service
    })
    setPersonalServices(updatedServices)
  }

  const handleDeleteService = (serviceId) => {
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
