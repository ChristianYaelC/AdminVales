import { useState } from 'react'
import { Trash2, Edit2, AlertCircle, Check } from 'lucide-react'
import { formatCurrencyInput, validateAmount } from '../utils/validators'
import ConfirmModal from './ConfirmModal'

function PersonalServiceTable({ services, onUpdateServiceAmount, onRegisterPayment, onDeleteService }) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [selectedServiceEdit, setSelectedServiceEdit] = useState(null)
  const [selectedServicePayment, setSelectedServicePayment] = useState(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [newAmount, setNewAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [editErrors, setEditErrors] = useState({})

  const calculateNextPaymentDate = (service) => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    const dueDay = service.dueDay

    // Próxima fecha de pago en el mes actual
    let nextDate = new Date(currentYear, currentMonth, dueDay)

    // Si ya pasó el día en este mes, ir al próximo ciclo
    if (nextDate <= today) {
      if (service.frequency === 'monthly') {
        nextDate = new Date(currentYear, currentMonth + 1, dueDay)
      } else if (service.frequency === 'bimonthly') {
        nextDate = new Date(currentYear, currentMonth + 2, dueDay)
      } else if (service.frequency === 'quarterly') {
        nextDate = new Date(currentYear, currentMonth + 3, dueDay)
      } else if (service.frequency === 'custom') {
        const futureDate = new Date(today)
        futureDate.setDate(futureDate.getDate() + service.frequencyDays)
        nextDate = new Date(futureDate.getFullYear(), futureDate.getMonth(), dueDay)
      }
    }

    return nextDate
  }

  const isPaymentDue = (service) => {
    const nextDate = calculateNextPaymentDate(service)
    const today = new Date()
    return today.getDate() === nextDate.getDate() || today >= nextDate
  }

  const handleRequestDelete = (service) => {
    setPendingAction({
      type: 'deleteService',
      serviceId: service.id,
      title: 'Eliminar Servicio',
      message: `¿Deseas eliminar "${service.name}"? No se puede deshacer.`
    })
    setIsConfirmModalOpen(true)
  }

  const handleEditClick = (service) => {
    setSelectedServiceEdit(service)
    setNewAmount(service.amount.toString())
    setEditErrors({})
    setShowEditForm(true)
  }

  const handleAmountChange = (e) => {
    const value = formatCurrencyInput(e.target.value)
    setNewAmount(value)
    if (editErrors.amount) {
      setEditErrors(prev => ({ ...prev, amount: '' }))
    }
  }

  const handleUpdateAmount = () => {
    if (!selectedServiceEdit) return

    const validation = validateAmount(newAmount, 'monto del servicio')
    if (!validation.valid) {
      setEditErrors({ amount: validation.error })
      return
    }

    const amount = parseFloat(newAmount)
    onUpdateServiceAmount(selectedServiceEdit.id, amount)
    
    setSelectedServiceEdit(null)
    setNewAmount('')
    setEditErrors({})
    setShowEditForm(false)
  }

    const handleRegisterPaymentClick = (service) => {
      setSelectedServicePayment(service)
      setPaymentDate(new Date().toISOString().split('T')[0])
      setShowPaymentForm(true)
    }

    const handleSubmitPayment = () => {
      if (!selectedServicePayment || !paymentDate) return
    
      onRegisterPayment(selectedServicePayment.id, {
        date: paymentDate
      })
    
      setSelectedServicePayment(null)
      setPaymentDate(new Date().toISOString().split('T')[0])
      setShowPaymentForm(false)
    }

  const handleConfirmDelete = () => {
    if (pendingAction?.type === 'deleteService') {
      onDeleteService(pendingAction.serviceId)
    }
    setIsConfirmModalOpen(false)
    setPendingAction(null)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Servicio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Periodicidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Día de Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Último Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Próxima Fecha
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {services.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No hay servicios registrados
                  </td>
                </tr>
              ) : (
                services.map((service) => {
                  const nextPaymentDate = calculateNextPaymentDate(service)
                  const isDue = isPaymentDue(service)

                  return (
                    <tr key={service.id} className={`hover:bg-gray-50 transition-colors ${isDue ? 'bg-yellow-50' : ''}`}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {service.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        ${service.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {service.frequency === 'monthly' && 'Mensual'}
                        {service.frequency === 'bimonthly' && 'Bimestral'}
                        {service.frequency === 'quarterly' && 'Trimestral'}
                        {service.frequency === 'custom' && `${service.frequencyDays} días`}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        Día {service.dueDay}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatDate(service.lastPaymentDate)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`font-medium ${isDue ? 'text-red-600' : 'text-gray-700'}`}>
                          {nextPaymentDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                          {isDue && ' ⚠️'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditClick(service)}
                            className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                            title="Editar monto"
                          >
                            <Edit2 size={18} />
                          </button>
                           <button
                             onClick={() => handleRegisterPaymentClick(service)}
                             className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                             title="Registrar pago"
                           >
                             <Check size={18} />
                           </button>
                          <button
                            onClick={() => handleRequestDelete(service)}
                            className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            title="Eliminar servicio"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para registrar pago */}
      {showEditForm && selectedServiceEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Editar Monto - {selectedServiceEdit.name}
            </h2>
            <p className="text-gray-600 mb-4 text-sm">
              Monto anterior: ${selectedServiceEdit.amount.toFixed(2)}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nuevo monto ($)
                </label>
                <input
                  type="text"
                  placeholder="0.00"
                  value={newAmount}
                  onChange={handleAmountChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    editErrors.amount ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {editErrors.amount && (
                  <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle size={16} />
                    {editErrors.amount}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setSelectedServiceEdit(null)
                    setNewAmount('')
                    setEditErrors({})
                    setShowEditForm(false)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateAmount}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Actualizar Monto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Modal para registrar pago */}
        {showPaymentForm && selectedServicePayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Registrar Pago - {selectedServicePayment.name}
              </h2>
              <p className="text-gray-600 mb-4 text-sm">
                Monto pagado: ${selectedServicePayment.amount.toFixed(2)}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de pago
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setSelectedServicePayment(null)
                      setShowPaymentForm(false)
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmitPayment}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Registrar Pago
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title={pendingAction?.title}
        message={pendingAction?.message}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsConfirmModalOpen(false)
          setPendingAction(null)
        }}
      />
    </>
  )
}

export default PersonalServiceTable
