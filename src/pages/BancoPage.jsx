import { useState } from 'react'
import { Search, Plus, Trash2, Edit2 } from 'lucide-react'
import { useClients } from '../context/ClientsContext'
import BancoClientForm from '../components/BancoClientForm'
import ConfirmModal from '../components/ConfirmModal'

function BancoPage() {
  const { valesClients, bancoClients, setBancoClients } = useClients()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchLoanTerm, setSearchLoanTerm] = useState('')
  const [selectedClientId, setSelectedClientId] = useState(null)
  const [selectedLoanId, setSelectedLoanId] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showLoanForm, setShowLoanForm] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)

  const selectedClient = bancoClients.find((client) => client.id === selectedClientId)

  const filteredClients = bancoClients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddClient = (clientData) => {
    const newClient = {
      id: Math.max(...bancoClients.map(c => c.id), 0) + 1,
      ...clientData,
      loans: []
    }
    setBancoClients([...bancoClients, newClient])
    setShowAddForm(false)
    setSelectedClientId(newClient.id)
  }

  const handleAddLoan = (loanData) => {
    if (!selectedClientId) return

    const newLoan = {
      id: Math.max(...bancoClients.flatMap(c => c.loans || []).map(l => l.id), 0) + 1,
      name: loanData.name,
      amount: loanData.amount,
      termMonths: loanData.termMonths,
      totalPayments: loanData.termMonths,
      currentPayment: 0,
      payments: [],
      status: 'active',
      createdAt: new Date().toLocaleDateString('es-MX')
    }

    const updatedClients = bancoClients.map(client => {
      if (client.id === selectedClientId) {
        return {
          ...client,
          loans: [...(client.loans || []), newLoan]
        }
      }
      return client
    })

    setBancoClients(updatedClients)
    setShowLoanForm(false)
  }

  const handleUpdateLoan = (loanId, updatedLoan) => {
    if (!selectedClientId) return

    const updatedClients = bancoClients.map((client) => {
      if (client.id !== selectedClientId) return client

      return {
        ...client,
        loans: (client.loans || []).map((loan) =>
          loan.id === loanId ? { ...updatedLoan } : loan
        )
      }
    })

    setBancoClients(updatedClients)
  }

  const handleRegisterPayment = (loanId, paymentData) => {
    if (!selectedClientId) return

    const updatedClients = bancoClients.map((client) => {
      if (client.id !== selectedClientId) return client

      const updatedLoans = (client.loans || []).map((loan) => {
        if (loan.id !== loanId || loan.status === 'completed') return loan

        const nextPaymentNumber = loan.currentPayment + 1
        const payments = [...(loan.payments || [])]
        payments.push({
          num: nextPaymentNumber,
          amount: paymentData.amount,
          date: paymentData.date
        })

        const currentPayment = loan.currentPayment + 1
        const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0)
        const completedByAmount = totalPaid >= loan.amount
        const completedByTerm = currentPayment >= loan.termMonths
        const status = completedByAmount || completedByTerm ? 'completed' : 'active'

        return {
          ...loan,
          currentPayment,
          payments,
          status
        }
      })

      return {
        ...client,
        loans: updatedLoans
      }
    })

    setBancoClients(updatedClients)
  }

  const handleDeleteClient = (clientId) => {
    setPendingAction({
      type: 'deleteClient',
      clientId,
      title: 'Eliminar Cliente',
      message: '¿Estás seguro que deseas eliminar este cliente? No se puede deshacer.'
    })
    setIsConfirmModalOpen(true)
  }

  const handleRequestDeleteLoan = (loanId) => {
    if (!selectedClient) return
    const loan = (selectedClient.loans || []).find((item) => item.id === loanId)
    if (!loan) return

    setPendingAction({
      type: 'deleteLoan',
      loanId,
      title: 'Eliminar Préstamo',
      message: `¿Deseas eliminar el préstamo "${loan.name}"? No se puede deshacer.`
    })
    setIsConfirmModalOpen(true)
  }

  const handleConfirmPayment = () => {
    if (!pendingAction) return

    if (pendingAction.type === 'deleteClient') {
      setBancoClients(bancoClients.filter(c => c.id !== pendingAction.clientId))
      if (selectedClientId === pendingAction.clientId) {
        setSelectedClientId(null)
        setSelectedLoanId(null)
      }
    } else if (pendingAction.type === 'deleteLoan' && selectedClientId) {
      const updatedClients = bancoClients.map((client) => {
        if (client.id !== selectedClientId) return client

        return {
          ...client,
          loans: (client.loans || []).filter((loan) => loan.id !== pendingAction.loanId)
        }
      })

      setBancoClients(updatedClients)
      if (selectedLoanId === pendingAction.loanId) {
        setSelectedLoanId(null)
      }
    }

    setIsConfirmModalOpen(false)
    setPendingAction(null)
  }

  const calculateLoanSummary = (loan) => {
    const payments = loan.payments || []
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0)
    const remaining = Math.max(0, loan.amount - totalPaid)
    const percentage = loan.amount > 0 ? Math.min(100, (totalPaid / loan.amount) * 100) : 0

    return {
      totalPaid,
      remaining,
      percentage,
      paidMonths: payments.length
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión Bancaria</h1>
          <p className="text-gray-600">Registro de préstamos mensuales con pagos manuales por préstamo</p>
        </div>

        {/* Búsqueda y Botón Agregar */}
        <div className="mb-8 flex gap-4 flex-col sm:flex-row">
          <div className="flex-1 relative">
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-bold text-gray-900">Clientes ({filteredClients.length})</h2>
              </div>
              <div className="max-h-[30rem] overflow-y-auto">
                {filteredClients.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No hay clientes</div>
                ) : (
                  filteredClients.map((client) => (
                    <div
                      key={client.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        selectedClientId === client.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                      }`}
                    >
                      <button
                        onClick={() => {
                          setSelectedClientId(client.id)
                          setSelectedLoanId(null)
                          setSearchLoanTerm('')
                        }}
                        className="w-full text-left px-4 py-3"
                      >
                        <p className="font-medium text-gray-900 text-sm">{client.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{(client.loans || []).length} préstamo(s)</p>
                      </button>
                      {selectedClientId === client.id && (
                        <button
                          onClick={() => handleDeleteClient(client.id)}
                          className="w-full px-4 py-2 text-red-600 hover:bg-red-50 flex items-center justify-center gap-2 text-sm border-t border-gray-100"
                        >
                          <Trash2 size={16} />
                          Eliminar Cliente
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {selectedClient ? (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedClient.name}</h2>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Teléfono:</span> {selectedClient.phone || '—'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Domicilio:</span> {selectedClient.address || '—'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowLoanForm(true)
                        setSelectedLoanId(null)
                      }}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
                    >
                      <Plus size={16} />
                      Crear Préstamo
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {selectedLoanId ? (
                    <>
                      <button
                        onClick={() => setSelectedLoanId(null)}
                        className="mb-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        ← Volver a préstamos
                      </button>
                      <BancoLoanTable
                        loan={(selectedClient.loans || []).find((loan) => loan.id === selectedLoanId)}
                        onUpdateLoan={(updatedLoan) => handleUpdateLoan(selectedLoanId, updatedLoan)}
                        onRegisterPayment={(paymentData) => handleRegisterPayment(selectedLoanId, paymentData)}
                        onDeleteLoan={() => handleRequestDeleteLoan(selectedLoanId)}
                      />
                    </>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm font-medium text-gray-700">Préstamos registrados</p>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          placeholder="Buscar por nombre del préstamo..."
                          value={searchLoanTerm}
                          onChange={(event) => setSearchLoanTerm(event.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {(selectedClient.loans || [])
                          .filter((loan) => loan.name.toLowerCase().includes(searchLoanTerm.toLowerCase()))
                          .map((loan) => {
                            const summary = calculateLoanSummary(loan)

                            return (
                              <button
                                key={loan.id}
                                onClick={() => setSelectedLoanId(loan.id)}
                                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                              >
                                <div className="flex items-start justify-between mb-2 gap-4">
                                  <div>
                                    <p className="font-bold text-blue-700 text-sm">{loan.name}</p>
                                    <p className="text-xs text-gray-500 mt-1">Creado: {loan.createdAt || '—'}</p>
                                  </div>
                                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${loan.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {loan.status === 'completed' ? 'Completado' : 'Activo'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">Monto: ${loan.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                                <p className="text-sm text-gray-600">Plazo: {loan.termMonths} mes(es)</p>
                                <p className="text-sm text-gray-600">Pagado: ${summary.totalPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                                <p className="text-sm text-blue-600 mt-1 font-medium">Pendiente: ${summary.remaining.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                              </button>
                            )
                          })}
                      </div>

                      {(selectedClient.loans || []).filter((loan) => loan.name.toLowerCase().includes(searchLoanTerm.toLowerCase())).length === 0 && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                          No hay préstamos que coincidan con la búsqueda
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 text-lg">Selecciona un cliente para ver sus préstamos</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Agregar Cliente */}
      {showAddForm && (
        <BancoClientForm
          valesClients={valesClients}
          onSubmit={handleAddClient}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {showLoanForm && (
        <BancoLoanForm
          onSubmit={handleAddLoan}
          onCancel={() => setShowLoanForm(false)}
        />
      )}

      {/* Modal de Confirmación */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title={pendingAction?.title || ''}
        message={pendingAction?.message || ''}
        type={pendingAction?.type}
        onConfirm={handleConfirmPayment}
        onCancel={() => setIsConfirmModalOpen(false)}
      />
    </div>
  )
}

function BancoLoanForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    termMonths: ''
  })
  const [errors, setErrors] = useState({})

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del préstamo es requerido'
    }

    const amount = parseFloat(formData.amount)
    if (!formData.amount || Number.isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Ingresa un monto válido mayor a 0'
    }

    const termMonths = parseInt(formData.termMonths, 10)
    if (!formData.termMonths || Number.isNaN(termMonths) || termMonths <= 0) {
      newErrors.termMonths = 'Ingresa un plazo mensual válido'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit({
      name: formData.name.trim(),
      amount,
      termMonths
    })

    setFormData({ name: '', amount: '', termMonths: '' })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Nuevo Préstamo - Banco</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del préstamo *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Préstamo Auto, Préstamo Personal, etc."
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Monto del préstamo ($) *</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="10000.00"
              step="0.01"
              min="0"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.amount ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.amount && <p className="text-red-600 text-sm mt-1">{errors.amount}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Plazo (meses) *</label>
            <input
              type="number"
              name="termMonths"
              value={formData.termMonths}
              onChange={handleChange}
              placeholder="12"
              min="1"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.termMonths ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.termMonths && <p className="text-red-600 text-sm mt-1">{errors.termMonths}</p>}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-gray-600">
              El pago mensual se registra manualmente en cada periodo para adaptarse al acuerdo real del préstamo.
            </p>
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Crear Préstamo
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BancoLoanTable({ loan, onRegisterPayment, onUpdateLoan, onDeleteLoan }) {
  const [editingPaymentId, setEditingPaymentId] = useState(null)
  const [editingDate, setEditingDate] = useState('')
  const [isEditingCreatedAt, setIsEditingCreatedAt] = useState(false)
  const [createdAtInput, setCreatedAtInput] = useState('')
  const [newPaymentAmount, setNewPaymentAmount] = useState('')
  const [newPaymentDate, setNewPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [paymentErrors, setPaymentErrors] = useState({})

  if (!loan) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-500">
        No se encontró el préstamo seleccionado
      </div>
    )
  }

  const paymentHistory = loan.payments || []
  const totalPaid = paymentHistory.reduce((sum, payment) => sum + payment.amount, 0)
  const totalRemaining = Math.max(0, loan.amount - totalPaid)
  const isCompleted = loan.status === 'completed' || totalRemaining <= 0 || loan.currentPayment >= loan.termMonths
  const displayMonth = Math.min(loan.currentPayment + 1, loan.termMonths)

  const formatDateForInput = (dateValue) => {
    if (!dateValue) return ''
    if (dateValue.includes('-')) return dateValue
    const [day, month, year] = dateValue.split('/')
    if (!day || !month || !year) return ''
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  const formatDateForDisplay = (dateValue) => {
    if (!dateValue) return ''
    if (dateValue.includes('/')) return dateValue
    const [year, month, day] = dateValue.split('-')
    if (!day || !month || !year) return dateValue
    return `${Number(day)}/${Number(month)}/${year}`
  }

  const statementRows = paymentHistory.map((payment, idx) => {
    const paidBefore = paymentHistory.slice(0, idx).reduce((sum, row) => sum + row.amount, 0)
    const previousBalance = Math.max(0, loan.amount - paidBefore)
    const newBalance = Math.max(0, previousBalance - payment.amount)

    return {
      ...payment,
      previousBalance,
      newBalance
    }
  })

  const handleEditDate = (payment, idx) => {
    setEditingPaymentId(idx)
    setEditingDate(formatDateForInput(payment.date || ''))
  }

  const handleSaveDate = (idx) => {
    if (!editingDate) return
    const updatedPayments = [...paymentHistory]
    updatedPayments[idx] = {
      ...updatedPayments[idx],
      date: formatDateForDisplay(editingDate)
    }

    onUpdateLoan({
      ...loan,
      payments: updatedPayments
    })

    setEditingPaymentId(null)
    setEditingDate('')
  }

  const handleStartEditCreatedAt = () => {
    setCreatedAtInput(formatDateForInput(loan.createdAt || ''))
    setIsEditingCreatedAt(true)
  }

  const handleSaveCreatedAt = () => {
    if (!createdAtInput) return

    onUpdateLoan({
      ...loan,
      createdAt: formatDateForDisplay(createdAtInput)
    })
    setIsEditingCreatedAt(false)
  }

  const handleRegisterPayment = () => {
    const nextErrors = {}
    const amount = parseFloat(newPaymentAmount)

    if (!newPaymentAmount || Number.isNaN(amount) || amount <= 0) {
      nextErrors.amount = 'Ingresa un monto válido mayor a 0'
    }

    if (!newPaymentDate) {
      nextErrors.date = 'Selecciona una fecha de pago'
    }

    if (Object.keys(nextErrors).length > 0) {
      setPaymentErrors(nextErrors)
      return
    }

    onRegisterPayment({
      amount,
      date: formatDateForDisplay(newPaymentDate)
    })

    setNewPaymentAmount('')
    setPaymentErrors({})
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-4 gap-4">
          <div>
            <p className="text-xs text-gray-600 font-semibold">PRÉSTAMO</p>
            <p className="text-lg font-bold text-blue-700">{loan.name}</p>
          </div>
          <button
            onClick={onDeleteLoan}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium whitespace-nowrap"
          >
            <Trash2 size={16} />
            Eliminar
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <p className="text-xs text-gray-600 font-medium">Monto Total</p>
            <p className="text-lg font-bold text-gray-900 mt-1">
              ${loan.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Plazo</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{loan.termMonths} meses</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Meses Pagados</p>
            <p className="text-lg font-bold text-blue-600 mt-1">{Math.min(loan.currentPayment, loan.termMonths)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Fecha de Creación</p>
            {isEditingCreatedAt ? (
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="date"
                  value={createdAtInput}
                  onChange={(event) => setCreatedAtInput(event.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <button onClick={handleSaveCreatedAt} className="text-green-600 hover:text-green-700">✓</button>
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-2">
                <p className="text-lg font-bold text-gray-900">{loan.createdAt || '—'}</p>
                <button onClick={handleStartEditCreatedAt} className="text-blue-600 hover:text-blue-700 p-1">
                  <Edit2 size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-yellow-100 border-b-2 border-yellow-300">
              <th className="px-4 py-3 text-center font-bold text-gray-800">FECHA DE PAGO</th>
              <th className="px-4 py-3 text-center font-bold text-gray-800">NUM. DE PAGO</th>
              <th className="px-4 py-3 text-right font-bold text-gray-800">SALDO ANTERIOR</th>
              <th className="px-4 py-3 text-right font-bold text-gray-800">IMPORTE DE PAGO</th>
              <th className="px-4 py-3 text-right font-bold text-gray-800">NUEVO SALDO</th>
            </tr>
          </thead>
          <tbody>
            {statementRows.length > 0 ? (
              statementRows.map((payment, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-yellow-50' : 'bg-white'}>
                  <td className="px-4 py-3 text-center text-gray-900">
                    {editingPaymentId === idx ? (
                      <div className="flex gap-2 items-center justify-center">
                        <input
                          type="date"
                          value={editingDate}
                          onChange={(event) => setEditingDate(event.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                        <button onClick={() => handleSaveDate(idx)} className="text-green-600 hover:text-green-700">✓</button>
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center justify-center">
                        <span>{payment.date || '—'}</span>
                        <button
                          onClick={() => handleEditDate(payment, idx)}
                          className="text-blue-600 hover:text-blue-700 p-1"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-gray-900">{payment.num}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    ${payment.previousBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    ${payment.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-blue-600">
                    ${payment.newBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">Sin pagos registrados aún</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!isCompleted && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-bold text-gray-900 mb-2">Registrar Pago Mensual - Mes {displayMonth}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de pago *</label>
              <input
                type="date"
                value={newPaymentDate}
                onChange={(event) => {
                  setNewPaymentDate(event.target.value)
                  if (paymentErrors.date) {
                    setPaymentErrors((prev) => ({ ...prev, date: '' }))
                  }
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${paymentErrors.date ? 'border-red-500' : 'border-gray-300'}`}
              />
              {paymentErrors.date && <p className="text-red-600 text-sm mt-1">{paymentErrors.date}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Monto de pago *</label>
              <input
                type="number"
                value={newPaymentAmount}
                onChange={(event) => {
                  setNewPaymentAmount(event.target.value)
                  if (paymentErrors.amount) {
                    setPaymentErrors((prev) => ({ ...prev, amount: '' }))
                  }
                }}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${paymentErrors.amount ? 'border-red-500' : 'border-gray-300'}`}
              />
              {paymentErrors.amount && <p className="text-red-600 text-sm mt-1">{paymentErrors.amount}</p>}
            </div>
          </div>
          <button
            onClick={handleRegisterPayment}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
          >
            Registrar Pago
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-xs text-gray-600 font-medium">Total Pagado</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            ${totalPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-600 mt-2">{paymentHistory.length} pago(s) mensual(es)</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-xs text-gray-600 font-medium">Pendiente</p>
          <p className="text-2xl font-bold text-orange-600 mt-2">
            ${totalRemaining.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-600 mt-2">Plazo: {loan.termMonths} meses</p>
        </div>
      </div>
    </div>
  )
}

export default BancoPage
