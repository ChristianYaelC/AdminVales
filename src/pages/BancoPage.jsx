import { useState } from 'react'
import { Search, Plus, Trash2 } from 'lucide-react'
import { useClients } from '../context/ClientsContext'
import BancoClientForm from '../components/BancoClientForm'
import BancoLoanForm from '../components/BancoLoanForm'
import BancoInsuranceForm from '../components/BancoInsuranceForm'
import BancoInsuranceTable from '../components/BancoInsuranceTable'
import ConfirmModal from '../components/ConfirmModal'

function BancoPage() {
  const { valesClients, bancoClients, setBancoClients } = useClients()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClientId, setSelectedClientId] = useState(null)
  const [selectedProductId, setSelectedProductId] = useState(null)
  const [selectedProductType, setSelectedProductType] = useState(null) // 'insurance' o 'loan'
  const [showAddForm, setShowAddForm] = useState(false)
  const [showInsuranceForm, setShowInsuranceForm] = useState(false)
  const [showLoanForm, setShowLoanForm] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)

  const selectedClient = bancoClients.find(client => client.id === selectedClientId)
  const filteredClients = bancoClients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddClient = (clientData) => {
    const newClient = {
      id: Math.max(...bancoClients.map(c => c.id), 0) + 1,
      ...clientData,
      insurance: [],
      loans: []
    }
    setBancoClients([...bancoClients, newClient])
    setShowAddForm(false)
    setSelectedClientId(newClient.id)
  }

  const handleAddInsurance = (insuranceData) => {
    if (!selectedClientId) return

    const newInsurance = {
      id: Math.max(
        ...bancoClients.flatMap(c => c.insurance || []).map(l => l.id),
        0
      ) + 1,
      ...insuranceData,
      payments: [],
      status: 'active',
      createdAt: new Date().toLocaleDateString('es-MX')
    }

    const updatedClients = bancoClients.map(client => {
      if (client.id === selectedClientId) {
        return {
          ...client,
          insurance: [...(client.insurance || []), newInsurance]
        }
      }
      return client
    })

    setBancoClients(updatedClients)
    setShowInsuranceForm(false)
  }

  const handleAddLoan = (loanData) => {
    if (!selectedClientId) return

    const newLoan = {
      id: Math.max(
        ...bancoClients.flatMap(c => c.loans || []).map(l => l.id),
        0
      ) + 1,
      ...loanData,
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

  const handleRegisterInsurancePayment = (insuranceId, paymentData) => {
    if (!selectedClientId) return

    const updatedClients = bancoClients.map(client => {
      if (client.id !== selectedClientId) return client

      const updatedInsurance = (client.insurance || []).map(insurance => {
        if (insurance.id === insuranceId) {
          const payments = [...(insurance.payments || []), paymentData]
          const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
          const status = totalPaid >= insurance.amount ? 'completed' : 'active'

          return {
            ...insurance,
            payments,
            status
          }
        }
        return insurance
      })

      return {
        ...client,
        insurance: updatedInsurance
      }
    })

    setBancoClients(updatedClients)
  }

  const handleRegisterLoanPayment = (loanId, paymentData) => {
    if (!selectedClientId) return

    const updatedClients = bancoClients.map(client => {
      if (client.id !== selectedClientId) return client

      const updatedLoans = (client.loans || []).map(loan => {
        if (loan.id === loanId && loan.status !== 'completed') {
          const payments = [...(loan.payments || []), paymentData]
          const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
          const status = totalPaid >= loan.amount || payments.length >= loan.term ? 'completed' : 'active'

          return {
            ...loan,
            payments,
            status
          }
        }
        return loan
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

  const handleDeleteInsurance = (insuranceId) => {
    if (!selectedClientId) return

    setPendingAction({
      type: 'deleteInsurance',
      insuranceId,
      title: 'Eliminar Seguro',
      message: '¿Deseas eliminar este seguro? No se puede deshacer.'
    })
    setIsConfirmModalOpen(true)
  }

  const handleDeleteLoan = (loanId) => {
    if (!selectedClientId) return

    setPendingAction({
      type: 'deleteLoan',
      loanId,
      title: 'Eliminar Préstamo',
      message: '¿Deseas eliminar este préstamo? No se puede deshacer.'
    })
    setIsConfirmModalOpen(true)
  }

  const handleConfirmAction = () => {
    if (pendingAction?.type === 'deleteClient') {
      setBancoClients(bancoClients.filter(c => c.id !== pendingAction.clientId))
      if (selectedClientId === pendingAction.clientId) {
        setSelectedClientId(null)
        setSelectedProductId(null)
      }
    } else if (pendingAction?.type === 'deleteInsurance' && selectedClientId) {
      const updatedClients = bancoClients.map(client => {
        if (client.id !== selectedClientId) return client
        return {
          ...client,
          insurance: (client.insurance || []).filter(i => i.id !== pendingAction.insuranceId)
        }
      })
      setBancoClients(updatedClients)
      if (selectedProductId === pendingAction.insuranceId) {
        setSelectedProductId(null)
        setSelectedProductType(null)
      }
    } else if (pendingAction?.type === 'deleteLoan' && selectedClientId) {
      const updatedClients = bancoClients.map(client => {
        if (client.id !== selectedClientId) return client
        return {
          ...client,
          loans: (client.loans || []).filter(l => l.id !== pendingAction.loanId)
        }
      })
      setBancoClients(updatedClients)
      if (selectedProductId === pendingAction.loanId) {
        setSelectedProductId(null)
        setSelectedProductType(null)
      }
    }

    setIsConfirmModalOpen(false)
    setPendingAction(null)
  }

  const renderProductDetail = () => {
    if (!selectedClient) {
      return (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">Selecciona un cliente para ver sus productos</p>
        </div>
      )
    }

    if (!selectedProductId) {
      return (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
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

          <div className="p-6 space-y-6">
            {/* Seguros */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Seguros</h3>
                <button
                  onClick={() => setShowInsuranceForm(true)}
                  className="flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Plus size={16} />
                  Nuevo Seguro
                </button>
              </div>

              {(selectedClient.insurance || []).length === 0 ? (
                <p className="text-gray-500 text-sm">No hay seguros registrados</p>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {(selectedClient.insurance || []).map(insurance => (
                    <button
                      key={insurance.id}
                      onClick={() => {
                        setSelectedProductId(insurance.id)
                        setSelectedProductType('insurance')
                      }}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-blue-700">{insurance.name}</p>
                          <p className="text-sm text-gray-600">Plazo: {insurance.termMonths} meses | Pago mensual: ${insurance.monthlyPayment.toFixed(2)}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${insurance.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {insurance.status === 'completed' ? 'Completo' : 'Activo'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Préstamos */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Préstamos</h3>
                <button
                  onClick={() => setShowLoanForm(true)}
                  className="flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Plus size={16} />
                  Nuevo Préstamo
                </button>
              </div>

              {(selectedClient.loans || []).length === 0 ? (
                <p className="text-gray-500 text-sm">No hay préstamos registrados</p>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {(selectedClient.loans || []).map(loan => {
                    const totalPaid = (loan.payments || []).reduce((sum, p) => sum + p.amount, 0)
                    const remaining = Math.max(0, loan.amount - totalPaid)

                    return (
                      <button
                        key={loan.id}
                        onClick={() => {
                          setSelectedProductId(loan.id)
                          setSelectedProductType('loan')
                        }}
                        className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-blue-700">Fuente: {loan.source}</p>
                            <p className="text-sm text-gray-600">Monto: ${loan.amount.toFixed(2)} | Plazo: {loan.term} quincenas</p>
                            <p className="text-sm text-gray-600">Pagado: ${totalPaid.toFixed(2)} | Restante: ${remaining.toFixed(2)}</p>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${loan.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {loan.status === 'completed' ? 'Completo' : 'Activo'}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    // Mostrar detalle de seguro
    if (selectedProductType === 'insurance') {
      const insurance = (selectedClient.insurance || []).find(i => i.id === selectedProductId)

      if (!insurance) return null

      return (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <button
              onClick={() => {
                setSelectedProductId(null)
                setSelectedProductType(null)
              }}
              className="mb-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              ← Volver a productos
            </button>
            <h2 className="text-2xl font-bold text-gray-900">{insurance.name}</h2>
            <p className="text-sm text-gray-600 mt-2">Creado: {insurance.createdAt}</p>
          </div>

          <div className="p-6">
            <BancoInsuranceTable
              insurance={insurance}
              onRegisterPayment={(id, paymentData) => handleRegisterInsurancePayment(id, paymentData)}
              onDeleteInsurance={handleDeleteInsurance}
            />
          </div>
        </div>
      )
    }

    // Mostrar detalle de préstamo
    if (selectedProductType === 'loan') {
      const loan = (selectedClient.loans || []).find(l => l.id === selectedProductId)

      if (!loan) return null

      const totalPaid = (loan.payments || []).reduce((sum, p) => sum + p.amount, 0)
      const remaining = Math.max(0, loan.amount - totalPaid)

      return (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <button
              onClick={() => {
                setSelectedProductId(null)
                setSelectedProductType(null)
              }}
              className="mb-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              ← Volver a productos
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Préstamo - {loan.source}</h2>
            <p className="text-sm text-gray-600 mt-2">Creado: {loan.createdAt}</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-600 font-medium">Monto Total</p>
                <p className="text-2xl font-bold text-blue-900">${loan.amount.toFixed(2)}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-green-600 font-medium">Pagado</p>
                <p className="text-2xl font-bold text-green-900">${totalPaid.toFixed(2)}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <p className="text-sm text-red-600 font-medium">Restante</p>
                <p className="text-2xl font-bold text-red-900">${remaining.toFixed(2)}</p>
              </div>
            </div>

            <button
              onClick={() => handleDeleteLoan(selectedProductId)}
              className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium flex items-center justify-center gap-2 mt-4"
            >
              <Trash2 size={18} />
              Eliminar Préstamo
            </button>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión Bancaria</h1>
          <p className="text-gray-600">Seguros y Préstamos con registro de pagos</p>
        </div>

        {/* Búsqueda y Botón */}
        <div className="mb-8 flex gap-4 flex-col sm:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar cliente..."
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

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Lista de clientes */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-bold text-gray-900">Clientes ({filteredClients.length})</h2>
              </div>
              <div className="max-h-[30rem] overflow-y-auto">
                {filteredClients.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No hay clientes</div>
                ) : (
                  filteredClients.map(client => (
                    <div
                      key={client.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${selectedClientId === client.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}
                    >
                      <button
                        onClick={() => {
                          setSelectedClientId(client.id)
                          setSelectedProductId(null)
                          setSelectedProductType(null)
                        }}
                        className="w-full text-left px-4 py-3"
                      >
                        <p className="font-medium text-gray-900 text-sm">{client.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {((client.insurance || []).length + (client.loans || []).length)} producto(s)
                        </p>
                      </button>
                      {selectedClientId === client.id && (
                        <button
                          onClick={() => handleDeleteClient(client.id)}
                          className="w-full px-4 py-2 text-red-600 hover:bg-red-50 flex items-center justify-center gap-2 text-sm border-t border-gray-100"
                        >
                          <Trash2 size={16} />
                          Eliminar
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Detalle de productos */}
          <div className="lg:col-span-3">
            {renderProductDetail()}
          </div>
        </div>
      </div>

      {/* Modales */}
      {showAddForm && (
        <BancoClientForm
          valesClients={valesClients}
          onSubmit={handleAddClient}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {showInsuranceForm && (
        <BancoInsuranceForm
          onClose={() => setShowInsuranceForm(false)}
          onSubmit={handleAddInsurance}
        />
      )}

      {showLoanForm && (
        <BancoLoanForm
          onClose={() => setShowLoanForm(false)}
          onSubmit={handleAddLoan}
        />
      )}

      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title={pendingAction?.title}
        message={pendingAction?.message}
        onConfirm={handleConfirmAction}
        onCancel={() => {
          setIsConfirmModalOpen(false)
          setPendingAction(null)
        }}
      />
    </div>
  )
}

export default BancoPage
