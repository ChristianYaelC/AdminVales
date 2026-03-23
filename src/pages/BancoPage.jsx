import { useState } from 'react'
import { Search, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { useClients } from '../context/ClientsContext'
import BancoClientForm from '../components/BancoClientForm'
import ConfirmModal from '../components/ConfirmModal'

function BancoPage() {
  const { bancoClients, setBancoClients } = useClients()
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedClientId, setExpandedClientId] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [pendingPayment, setPendingPayment] = useState(null)
  const [paymentAmountModal, setPaymentAmountModal] = useState({
    clientId: null,
    amount: '',
    isOpen: false
  })

  // Filtrar clientes por búsqueda
  const filteredClients = bancoClients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleExpand = (clientId) => {
    setExpandedClientId(expandedClientId === clientId ? null : clientId)
  }

  // Agregar nuevo cliente
  const handleAddClient = (clientData) => {
    const newClient = {
      id: Math.max(...bancoClients.map(c => c.id), 0) + 1,
      ...clientData,
      paymentsByQuincena: {}
    }
    setBancoClients([...bancoClients, newClient])
    setShowAddForm(false)
  }

  // Registrar pago
  const handleAddPayment = (clientId, quincena, amount) => {
    const updatedClients = bancoClients.map(client => {
      if (client.id === clientId) {
        return {
          ...client,
          paymentsByQuincena: {
            ...client.paymentsByQuincena,
            [quincena]: (client.paymentsByQuincena[quincena] || 0) + amount
          }
        }
      }
      return client
    })
    setBancoClients(updatedClients)
  }

  // Eliminar cliente
  const handleDeleteClient = (clientId) => {
    setPendingPayment({
      type: 'deleteClient',
      clientId,
      title: 'Eliminar Cliente',
      message: '¿Estás seguro que deseas eliminar este cliente? No se puede deshacer.'
    })
    setIsConfirmModalOpen(true)
  }

  const handleConfirmPayment = () => {
    if (!pendingPayment) return

    if (pendingPayment.type === 'deleteClient') {
      setBancoClients(bancoClients.filter(c => c.id !== pendingPayment.clientId))
      if (expandedClientId === pendingPayment.clientId) {
        setExpandedClientId(null)
      }
    }

    setIsConfirmModalOpen(false)
    setPendingPayment(null)
  }

  const calculateProgress = (client) => {
    const totalPaid = Object.values(client.paymentsByQuincena).reduce((sum, amount) => sum + amount, 0)
    const remaining = Math.max(0, client.totalLoanAmount - totalPaid)
    const percentage = (totalPaid / client.totalLoanAmount) * 100
    return { totalPaid, remaining, percentage }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión Bancaria</h1>
          <p className="text-gray-600">Registro de préstamos y pagos por quincena</p>
        </div>

        {/* Búsqueda y Botón Agregar */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar cliente por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus size={20} />
            Nuevo Cliente
          </button>
        </div>

        {/* Lista de Clientes */}
        <div className="space-y-4">
          {filteredClients.length > 0 ? (
            filteredClients.map(client => {
              const { totalPaid, remaining, percentage } = calculateProgress(client)
              const isExpanded = expandedClientId === client.id

              return (
                <div
                  key={client.id}
                  className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
                >
                  {/* Header del cliente */}
                  <button
                    onClick={() => toggleExpand(client.id)}
                    className="w-full px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <div className="text-left">
                      <h2 className="text-xl font-bold text-gray-900">{client.name}</h2>
                      <p className="text-sm text-gray-600 mt-1">
                        ID Cliente: #{client.id}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-gray-600 mb-1">Monto Prestado</p>
                        <p className="text-2xl font-bold text-blue-600">
                          ${client.totalLoanAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600 mb-1">Por Pagar</p>
                        <p className="text-2xl font-bold text-orange-600">
                          ${remaining.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp size={24} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={24} className="text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Detalles expandibles */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 px-6 py-6 bg-gray-50 space-y-6">
                      {/* Barra de progreso */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-gray-900">Progreso del Pago</p>
                          <p className="text-sm text-gray-600">
                            {percentage.toFixed(1)}% • ${totalPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}/${client.totalLoanAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div
                            className={`h-4 rounded-full transition-all ${
                              percentage === 100 ? 'bg-green-600' : 'bg-blue-600'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Resumen de totales */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-xs text-gray-600 font-medium mb-1">Monto Prestado</p>
                          <p className="text-2xl font-bold text-blue-600">
                            ${client.totalLoanAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <p className="text-xs text-gray-600 font-medium mb-1">Total Pagado</p>
                          <p className="text-2xl font-bold text-green-600">
                            ${totalPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <p className="text-xs text-gray-600 font-medium mb-1">Por Pagar</p>
                          <p className="text-2xl font-bold text-orange-600">
                            ${remaining.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      {/* Tabla de pagos por quincena */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-gray-900">Pagos por Quincena</h3>
                          <button
                            onClick={() => setPaymentAmountModal({ clientId: client.id, amount: '', isOpen: true })}
                            className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            <Plus size={16} />
                            Agregar Pago
                          </button>
                        </div>

                        {Object.keys(client.paymentsByQuincena).length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-200 border-b-2 border-gray-300">
                                  <th className="px-4 py-3 text-center font-bold text-gray-700">Quincena</th>
                                  <th className="px-4 py-3 text-right font-bold text-gray-700">Monto Pagado</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(client.paymentsByQuincena)
                                  .sort(([numA], [numB]) => parseInt(numA) - parseInt(numB))
                                  .map(([quincena, amount], idx) => (
                                    <tr key={quincena} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                      <td className="px-4 py-3 text-center font-medium text-gray-900">
                                        {quincena}ª
                                      </td>
                                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                                        ${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-center text-gray-500 py-8">Sin pagos registrados aún</p>
                        )}
                      </div>

                      {/* Botón Eliminar */}
                      <div className="flex justify-end pt-4 border-t border-gray-200">
                        <button
                          onClick={() => handleDeleteClient(client.id)}
                          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                        >
                          <Trash2 size={18} />
                          Eliminar Cliente
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 text-lg">No se encontraron clientes</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Agregar Pago */}
      {paymentAmountModal.isOpen && (
        <PaymentModal
          clientId={paymentAmountModal.clientId}
          onSubmit={(quincena, amount) => {
            handleAddPayment(paymentAmountModal.clientId, quincena, amount)
            setPaymentAmountModal({ clientId: null, amount: '', isOpen: false })
          }}
          onCancel={() => setPaymentAmountModal({ clientId: null, amount: '', isOpen: false })}
        />
      )}

      {/* Form Agregar Cliente */}
      {showAddForm && (
        <BancoClientForm
          onSubmit={handleAddClient}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Modal de Confirmación */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title={pendingPayment?.title || ''}
        message={pendingPayment?.message || ''}
        type={pendingPayment?.type}
        onConfirm={handleConfirmPayment}
        onCancel={() => setIsConfirmModalOpen(false)}
      />
    </div>
  )
}

// Modal para agregar pago
function PaymentModal({ clientId, onSubmit, onCancel }) {
  const [quincena, setQuincena] = useState('')
  const [amount, setAmount] = useState('')
  const [errors, setErrors] = useState({})

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!quincena || quincena <= 0) {
      newErrors.quincena = 'Ingresa un número de quincena válido'
    }

    const paymentAmount = parseFloat(amount)
    if (!amount || isNaN(paymentAmount) || paymentAmount <= 0) {
      newErrors.amount = 'Ingresa un monto válido mayor a 0'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit(parseInt(quincena), paymentAmount)
    setQuincena('')
    setAmount('')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Registrar Pago</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Quincena *
            </label>
            <input
              type="number"
              value={quincena}
              onChange={(e) => {
                setQuincena(e.target.value)
                if (errors.quincena) setErrors(prev => ({ ...prev, quincena: '' }))
              }}
              placeholder="1"
              min="1"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.quincena ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.quincena && <p className="text-red-600 text-sm mt-1">{errors.quincena}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto del Pago ($) *
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                if (errors.amount) setErrors(prev => ({ ...prev, amount: '' }))
              }}
              placeholder="500.00"
              step="0.01"
              min="0"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.amount ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.amount && <p className="text-red-600 text-sm mt-1">{errors.amount}</p>}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Guardar Pago
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BancoPage
