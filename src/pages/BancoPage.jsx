import { useState } from 'react'
import { Search, Plus, Trash2, Edit2 } from 'lucide-react'
import { useClients } from '../context/ClientsContext'
import BancoClientForm from '../components/BancoClientForm'
import ClientEditModal from '../components/ClientEditModal'
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
  const [showEditClientForm, setShowEditClientForm] = useState(false)
  const [showInsuranceForm, setShowInsuranceForm] = useState(false)
  const [showLoanForm, setShowLoanForm] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const showFeedback = (message, kind = 'success') => {
    setFeedback({ message, kind })
    setTimeout(() => setFeedback(null), 2500)
  }

  const selectedClient = bancoClients.find(client => client.id === selectedClientId)
  const filteredClients = bancoClients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const generateLocalId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  const handleAddClient = async (clientData) => {
    let newClient = {
      id: generateLocalId(),
      ...clientData,
      insurance: [],
      loans: []
    }

    try {
      const { bancoService } = await import('../services/banco')
      const persistedClient = await bancoService.createBancoClient(clientData)
      if (persistedClient) {
        newClient = {
          id: persistedClient.id,
          name: persistedClient.name,
          phone: persistedClient.phone || '',
          address: persistedClient.address || '',
          workAddress: persistedClient.work_address || '',
          insurance: [],
          loans: []
        }
      }
    } catch (error) {
      console.warn('No se pudo persistir cliente de Banco en Supabase:', error?.message || error)
    }

    setBancoClients([...bancoClients, newClient])
    setShowAddForm(false)
    setSelectedClientId(newClient.id)
    showFeedback('Cliente guardado correctamente')
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
    showFeedback('Seguro creado correctamente')
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
    showFeedback('Préstamo creado correctamente')
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
    showFeedback('Pago de seguro registrado correctamente')
  }

  const handleRegisterLoanPayment = (loanId, paymentData) => {
    if (!selectedClientId) return

    const updatedClients = bancoClients.map(client => {
      if (client.id !== selectedClientId) return client

      const updatedLoans = (client.loans || []).map(loan => {
        if (loan.id === loanId && loan.status !== 'completed') {
          const payments = [...(loan.payments || []), paymentData]
          const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
          const totalMonths = loan.termMonths || loan.term || 1
          const status = totalPaid >= loan.amount || payments.length >= totalMonths ? 'completed' : 'active'

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
    showFeedback('Pago de préstamo registrado correctamente')
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

  const handleUpdateClientData = async (clientData) => {
    if (!selectedClientId) return

    const updatedClients = bancoClients.map(client =>
      client.id === selectedClientId ? { ...client, ...clientData } : client
    )
    setBancoClients(updatedClients)

    try {
      const isLocalId = String(selectedClientId).startsWith('local-')
      if (!isLocalId) {
        const { updateClientProfile } = await import('../services/valesSupabaseService')
        const persistedClient = await updateClientProfile({
          clientId: selectedClientId,
          ...clientData
        })

        if (persistedClient) {
          const refreshedClients = updatedClients.map(client =>
            client.id === selectedClientId
              ? {
                  ...client,
                  name: persistedClient.name,
                  phone: persistedClient.phone || '',
                  address: persistedClient.address || '',
                  workAddress: persistedClient.work_address || ''
                }
              : client
          )
          setBancoClients(refreshedClients)
        }
      }
    } catch (error) {
      console.warn('No se pudo persistir el cliente en Supabase:', error?.message || error)
    }

    setShowEditClientForm(false)
    showFeedback('Cliente actualizado correctamente')
  }

  const handleConfirmAction = async () => {
    if (pendingAction?.type === 'deleteClient') {
      const clientIdToDelete = pendingAction.clientId

      try {
        const isLocalId = String(clientIdToDelete).startsWith('local-')
        if (!isLocalId) {
          const { bancoService } = await import('../services/banco')
          await bancoService.deleteClientById(clientIdToDelete)
        }
      } catch (error) {
        console.warn('No se pudo eliminar cliente en Supabase:', error?.message || error)
      }

      setBancoClients(bancoClients.filter(c => c.id !== clientIdToDelete))
      if (selectedClientId === pendingAction.clientId) {
        setSelectedClientId(null)
        setSelectedProductId(null)
      }
      showFeedback('Cliente eliminado correctamente')
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
      showFeedback('Seguro eliminado correctamente')
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
      showFeedback('Préstamo eliminado correctamente')
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
      const totalInsurance = (selectedClient.insurance || []).length
      const totalLoans = (selectedClient.loans || []).length
      const totalProducts = totalInsurance + totalLoans
      const pendingInsurance = (selectedClient.insurance || []).filter(i => i.status !== 'completed').length
      const pendingLoans = (selectedClient.loans || []).filter(l => l.status !== 'completed').length
      const totalPendingProducts = pendingInsurance + pendingLoans
      const totalCompletedProducts = totalProducts - totalPendingProducts

      const totalInsuranceRemaining = (selectedClient.insurance || []).reduce((sum, insurance) => {
        const paid = (insurance.payments || []).reduce((acc, p) => acc + Number(p.amount || 0), 0)
        return sum + Math.max(0, Number(insurance.amount || 0) - paid)
      }, 0)

      const totalLoanRemaining = (selectedClient.loans || []).reduce((sum, loan) => {
        const paid = (loan.payments || []).reduce((acc, p) => acc + Number(p.amount || 0), 0)
        return sum + Math.max(0, Number(loan.amount || 0) - paid)
      }, 0)

      const remainingBalance = totalInsuranceRemaining + totalLoanRemaining

      return (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedClient.name}</h2>
                  <button
                    onClick={() => setShowEditClientForm(true)}
                    title="Editar cliente"
                    aria-label="Editar cliente"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteClient(selectedClient.id)}
                    title="Eliminar cliente"
                    aria-label="Eliminar cliente"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowInsuranceForm(true)}
                    className="inline-flex items-center justify-center gap-2 w-40 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <Plus size={16} />
                    Nuevo Seguro
                  </button>
                  <button
                    onClick={() => setShowLoanForm(true)}
                    className="inline-flex items-center justify-center gap-2 w-40 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <Plus size={16} />
                    Nuevo Préstamo
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Teléfono:</span> {selectedClient.phone || '—'}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Domicilio Casa:</span> {selectedClient.address || '—'}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Domicilio Trabajo:</span> {selectedClient.workAddress || '—'}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-600">Total productos</p>
                <p className="text-lg font-bold text-gray-900">{totalProducts}</p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                <p className="text-xs text-blue-700">Falta por pagar</p>
                <p className="text-lg font-bold text-blue-700">{totalPendingProducts}</p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                <p className="text-xs text-green-700">Completados</p>
                <p className="text-lg font-bold text-green-700">{totalCompletedProducts}</p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="text-xs text-amber-700">Saldo restante</p>
                <p className="text-lg font-bold text-amber-700">${remainingBalance.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Seguros */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Seguros</h3>

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
                          {insurance.status === 'completed' ? 'Completo' : 'Falta por pagar'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Préstamos */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Préstamos</h3>

              {(selectedClient.loans || []).length === 0 ? (
                <p className="text-gray-500 text-sm">No hay préstamos registrados</p>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {(selectedClient.loans || []).map(loan => {
                    const totalPaid = (loan.payments || []).reduce((sum, p) => sum + p.amount, 0)
                    const remaining = Math.max(0, loan.amount - totalPaid)
                    const totalMonths = loan.termMonths || loan.term || 1
                    const monthlyPayment = loan.monthlyPayment || (loan.amount / totalMonths)

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
                            <p className="font-bold text-blue-700">Préstamo Mensual</p>
                            <p className="text-sm text-gray-600">Monto: ${loan.amount.toFixed(2)} | Plazo: {totalMonths} meses</p>
                            <p className="text-sm text-gray-600">Pago mensual: ${monthlyPayment.toFixed(2)}</p>
                            <p className="text-sm text-gray-600">Pagado: ${totalPaid.toFixed(2)} | Restante: ${remaining.toFixed(2)}</p>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${loan.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {loan.status === 'completed' ? 'Completo' : 'Falta por pagar'}
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
      const totalMonths = loan.termMonths || loan.term || 1
      const normalizedLoan = {
        ...loan,
        termMonths: totalMonths,
        monthlyPayment: loan.monthlyPayment || parseFloat((loan.amount / totalMonths).toFixed(2))
      }

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
            <h2 className="text-2xl font-bold text-gray-900">Préstamo</h2>
            <p className="text-sm text-gray-600 mt-2">Creado: {loan.createdAt}</p>
          </div>

          <div className="p-6">
            <BancoInsuranceTable
              insurance={normalizedLoan}
              onRegisterPayment={(id, paymentData) => handleRegisterLoanPayment(id, paymentData)}
              onDeleteInsurance={handleDeleteLoan}
              deleteLabel="Eliminar Préstamo"
              deleteTitle="Eliminar Préstamo"
            />
          </div>
        </div>
      )
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-full page-enter">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="panel-title mb-2">Monitoreo bancario</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión Bancaria</h1>
          <p className="text-gray-600">Seguros y Préstamos con registro de pagos</p>
        </div>

        {feedback && (
          <div className={`mb-4 rounded-lg border px-4 py-3 text-sm font-medium ${
            feedback.kind === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-green-50 border-green-200 text-green-700'
          }`}>
            {feedback.message}
          </div>
        )}

        {/* Búsqueda y Botón */}
        <div className="mb-8 flex gap-4 flex-col sm:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary"
          >
            <Plus size={20} />
            Nuevo Cliente
          </button>
        </div>

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Lista de clientes */}
          <div className="lg:col-span-1">
            <div className="app-surface">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-bold text-gray-900">Clientes ({filteredClients.length})</h2>
              </div>
              <div className="max-h-[30rem] stable-scroll-y">
                {filteredClients.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No hay clientes</div>
                ) : (
                  filteredClients.map(client => (
                    <div
                      key={client.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${selectedClientId === client.id ? 'bg-blue-50 border-l-4 border-l-secondary' : ''}`}
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

      {showEditClientForm && selectedClient && (
        <ClientEditModal
          client={selectedClient}
          title="Editar Cliente - Banco"
          onSubmit={handleUpdateClientData}
          onCancel={() => setShowEditClientForm(false)}
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
        type={pendingAction?.type}
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
