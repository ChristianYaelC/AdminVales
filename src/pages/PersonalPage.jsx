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
    <div className="p-6 bg-gray-50 min-h-full page-enter">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="panel-title mb-2">Servicios recurrentes</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión Personal</h1>
          <p className="text-gray-600">Registra tus servicios personales y mantén un control de pagos</p>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="app-surface p-6 kpi-card">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Servicios con falta por pagar</h3>
            <p className="text-3xl font-bold text-gray-900">{personalServices.length}</p>
          </div>
          <div className="app-surface p-6 kpi-card">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Gasto Mensual Promedio</h3>
            <p className="text-3xl font-bold text-secondary">${calculateMonthlyTotal().toFixed(2)}</p>
          </div>
          <div className="app-surface p-6 kpi-card">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Gasto Anual Estimado</h3>
            <p className="text-3xl font-bold text-green-600">${calculateYearlyTotal().toFixed(2)}</p>
          </div>
        </div>

        {/* Botón Agregar */}
        <div className="mb-8 flex justify-between items-center">
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
