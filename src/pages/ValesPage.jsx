import { useState } from 'react'
import { Search, Plus, X, Trash2, Edit2 } from 'lucide-react'
import { useClients } from '../context/ClientsContext'
import ClientForm from '../components/ClientForm'
import ClientEditModal from '../components/ClientEditModal'
import LoanForm from '../components/LoanForm'
import LoansTable from '../components/LoansTable'
import ConfirmModal from '../components/ConfirmModal'
import {
  getSourcePaymentTotal as calculateSourcePaymentTotal,
  getSourceCurrentQuincena,
  getSourceTotalRemaining,
  getAllSourcesCurrentTotal,
  getAllSourcesRemainingTotal,
  registerPaymentForLoanId,
  registerPaymentForSourceQuincena,
  registerPaymentsForAllActiveLoans
} from '../domain/vales/loanCalculations'

function ValesPage() {
  const { valesClients, setValesClients } = useClients()
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditClientForm, setShowEditClientForm] = useState(false)
  const [showLoanForm, setShowLoanForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchFolioTerm, setSearchFolioTerm] = useState('')
  const [selectedClientId, setSelectedClientId] = useState(null)
  const [selectedSource, setSelectedSource] = useState(null)
  const [selectedLoanId, setSelectedLoanId] = useState(null)
  const [showSourceSummary, setShowSourceSummary] = useState(false)
  const [viewMode, setViewMode] = useState('current') // 'current' o 'total'
  const [loanStatusFilter, setLoanStatusFilter] = useState('all')
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [pendingPayment, setPendingPayment] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const showFeedback = (message, kind = 'success') => {
    setFeedback({ message, kind })
    setTimeout(() => setFeedback(null), 2500)
  }

  const generateLocalId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  const sourcesList = {
    captavale: 'CaptaVale',
    salevale: 'SaleVale',
    dportenis: 'dportenis',
    valefectivo: 'valefectivo'
  }

  // Filtrar clientes por nombre
  const filteredClients = valesClients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Obtener cliente seleccionado
  const selectedClient = valesClients.find(c => c.id === selectedClientId)

  const activeLoansGlobal = valesClients.reduce(
    (sum, client) => sum + (client.loans || []).filter((loan) => loan.status === 'active').length,
    0
  )
  const totalRemainingGlobal = valesClients.reduce(
    (sum, client) => sum + getAllSourcesRemainingTotal(client.loans || []),
    0
  )

  // Agregar nuevo cliente
  const handleAddClient = async (clientData) => {
    let newClient = {
      id: generateLocalId(),
      ...clientData,
      loans: []
    }

    try {
      const { createValesClient } = await import('../services/valesSupabaseService')
      const persistedClient = await createValesClient(clientData)
      if (persistedClient) {
        newClient = {
          id: persistedClient.id,
          name: persistedClient.name,
          phone: persistedClient.phone || '',
          address: persistedClient.address || '',
          workAddress: persistedClient.work_address || '',
          loans: []
        }
      }
    } catch (error) {
      console.warn('No se pudo persistir cliente de Vales en Supabase:', error?.message || error)
    }

    setValesClients([...valesClients, newClient])
    setShowAddForm(false)
    setSelectedClientId(newClient.id)
    showFeedback('Cliente guardado correctamente')
  }

  // Agregar nuevo préstamo (usando tabuladores)
  const handleAddLoan = (loanData) => {
    if (!selectedClientId) return

    const newLoan = {
      id: Math.max(...valesClients.flatMap(c => c.loans).map(l => l.id), 0) + 1,
      folio: loanData.folio,
      source: loanData.source,
      amount: loanData.amount,
      term: loanData.term,
      insurance: loanData.insurance || 0,
      basePayment: loanData.basePayment,
      finalPayment: loanData.finalPayment,
      currentPayment: 0,
      totalPayments: loanData.term,
      payments: [],
      status: 'active', // 'active', 'completed'
      createdAt: new Date().toLocaleDateString('es-MX')
    }

    const updatedClients = valesClients.map(client => {
      if (client.id === selectedClientId) {
        return {
          ...client,
          loans: [...client.loans, newLoan]
        }
      }
      return client
    })

    setValesClients(updatedClients)
    setShowLoanForm(false)
    showFeedback('Préstamo creado correctamente')
  }

  // Actualizar cliente
  const handleUpdateClient = (id, updatedClient) => {
    setValesClients(valesClients.map(c => c.id === id ? { ...c, ...updatedClient } : c))
  }

  const handleUpdateSelectedClient = async (clientData) => {
    if (!selectedClientId) return

    handleUpdateClient(selectedClientId, clientData)

    try {
      const isLocalId = String(selectedClientId).startsWith('local-')
      if (!isLocalId) {
        const { updateClientProfile } = await import('../services/valesSupabaseService')
        const persistedClient = await updateClientProfile({
          clientId: selectedClientId,
          ...clientData
        })

        if (persistedClient) {
          handleUpdateClient(selectedClientId, {
            name: persistedClient.name,
            phone: persistedClient.phone || '',
            address: persistedClient.address || '',
            workAddress: persistedClient.work_address || ''
          })
        }
      }
    } catch (error) {
      console.warn('No se pudo persistir el cliente en Supabase:', error?.message || error)
    }

    setShowEditClientForm(false)
    showFeedback('Cliente actualizado correctamente')
  }

  // Eliminar cliente
  const handleDeleteClient = (id) => {
    setPendingPayment({
      type: 'deleteClient',
      clientId: id,
      title: 'Eliminar Cliente',
      message: '¿Está seguro de que deseas eliminar este cliente? No se puede deshacer.',
    })
    setIsConfirmModalOpen(true)
  }

  // Registrar pago
  const handleRegisterPayment = (loanId) => {
    if (!selectedClient) return

    const updatedClients = valesClients.map(client => {
      if (client.id === selectedClientId) {
        const updatedLoans = registerPaymentForLoanId(client.loans, loanId)
        return { ...client, loans: updatedLoans }
      }
      return client
    })

    setValesClients(updatedClients)
  }

  const handleRequestRegisterPayment = (loanId) => {
    if (!selectedClient) return

    const loan = selectedClient.loans.find(l => l.id === loanId)
    if (!loan || loan.currentPayment >= loan.totalPayments) return

    const displayQuincena = loan.currentPayment + 1

    setPendingPayment({
      type: 'registerLoanPayment',
      loanId,
      title: 'Registrar Pago',
      message: `¿Deseas registrar la quincena ${displayQuincena} del folio "${loan.folio}"?`,
      amount: loan.finalPayment
    })
    setIsConfirmModalOpen(true)
  }

  // Eliminar préstamo
  const handleDeleteLoan = (loanId) => {
    if (!selectedClientId || !selectedLoanId) return

    const loan = selectedClient?.loans.find(l => l.id === loanId)
    if (!loan) return

    setPendingPayment({
      type: 'deleteLoan',
      loanId: loanId,
      title: 'Eliminar Préstamo',
      message: `¿Estás seguro que deseas eliminar el préstamo con folio "${loan.folio}"? No se puede deshacer.`
    })
    setIsConfirmModalOpen(true)
  }

  const performDeleteLoan = (loanId) => {
    if (!selectedClientId) return

    const updatedClients = valesClients.map(client => {
      if (client.id === selectedClientId) {
        return {
          ...client,
          loans: client.loans.filter(l => l.id !== loanId)
        }
      }
      return client
    })

    setValesClients(updatedClients)
    setSelectedLoanId(null)
  }

  // Funciones de cálculo para consolidación de pagos
  const getSourcePaymentTotal = (source, quincena, clientLoans) => {
    return calculateSourcePaymentTotal(clientLoans, source, quincena)
  }

  const getCurrentQuincenaForSource = (source, clientLoans) => {
    return getSourceCurrentQuincena(clientLoans, source)
  }

  const getSourceTotalAllQuincenas = (source, clientLoans) => {
    return getSourceTotalRemaining(clientLoans, source)
  }

  const handlePaySourceQuincena = (source, quincena) => {
    if (!selectedClient) return

    const updatedClients = valesClients.map(client => {
      if (client.id === selectedClientId) {
        const updatedLoans = registerPaymentForSourceQuincena(client.loans, source, quincena)
        return { ...client, loans: updatedLoans }
      }
      return client
    })

    setValesClients(updatedClients)
  }

  // Pagar todas las fuentes en sus respectivas quincenas
  const handlePayAllSources = () => {
    if (!selectedClient) return

    const updatedClients = valesClients.map(client => {
      if (client.id === selectedClientId) {
        const updatedLoans = registerPaymentsForAllActiveLoans(client.loans)
        return { ...client, loans: updatedLoans }
      }
      return client
    })

    setValesClients(updatedClients)
  }

  const getTotalActivePayments = (clientLoans) => {
    return getAllSourcesCurrentTotal(clientLoans, Object.keys(sourcesList))
  }

  const getTotalAllPayments = (clientLoans) => {
    return getAllSourcesRemainingTotal(clientLoans)
  }

  // Manejar confirmación del modal
  const handleConfirmPayment = async () => {
    if (!pendingPayment) return

    if (pendingPayment.type === 'deleteClient') {
      const clientIdToDelete = pendingPayment.clientId

      try {
        const isLocalId = String(clientIdToDelete).startsWith('local-')
        if (!isLocalId) {
          const { deleteClientById } = await import('../services/valesSupabaseService')
          await deleteClientById(clientIdToDelete)
        }
      } catch (error) {
        console.warn('No se pudo eliminar cliente en Supabase:', error?.message || error)
      }

      setValesClients(valesClients.filter(c => c.id !== clientIdToDelete))
      if (selectedClientId === pendingPayment.clientId) {
        setSelectedClientId(null)
        setSelectedLoanId(null)
      }
      showFeedback('Cliente eliminado correctamente')
    } else if (pendingPayment.type === 'deleteLoan') {
      performDeleteLoan(pendingPayment.loanId)
      showFeedback('Préstamo eliminado correctamente')
    } else if (pendingPayment.type === 'registerLoanPayment') {
      handleRegisterPayment(pendingPayment.loanId)
      showFeedback('Pago registrado correctamente')
    } else if (pendingPayment.type === 'paySourceQuincena') {
      handlePaySourceQuincena(pendingPayment.source, pendingPayment.quincena)
      showFeedback('Quincena pagada correctamente')
    } else if (pendingPayment.type === 'payAllSources') {
      handlePayAllSources()
      showFeedback('Se registraron los pagos de todas las fuentes')
    }

    setIsConfirmModalOpen(false)
    setPendingPayment(null)
  }

  const handleCancelPayment = () => {
    setIsConfirmModalOpen(false)
    setPendingPayment(null)
  }

  return (
    <div className="p-6 bg-gray-50 min-h-full page-enter">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="panel-title mb-2">Operacion de prestamos</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Vales</h1>
          <p className="text-gray-600">Busca un cliente para ver sus préstamos con falta por pagar</p>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="app-surface p-5 kpi-card">
            <p className="panel-title">Clientes activos</p>
            <p className="mt-2 text-3xl font-bold text-primary">{valesClients.length}</p>
            <p className="mt-1 text-sm text-gray-500">Base total registrada</p>
          </div>
          <div className="app-surface p-5 kpi-card">
            <p className="panel-title">Prestamos con falta por pagar</p>
            <p className="mt-2 text-3xl font-bold text-secondary">{activeLoansGlobal}</p>
            <p className="mt-1 text-sm text-gray-500">Quincenas pendientes por procesar</p>
          </div>
          <div className="app-surface p-5 kpi-card">
            <p className="panel-title">Total pendiente global</p>
            <p className="mt-2 text-3xl font-bold text-primary">
              ${totalRemainingGlobal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
            <p className="mt-1 text-sm text-gray-500">Suma de todos los saldos</p>
          </div>
        </div>

        {/* Buscador y botón agregar */}
        <div className="mb-8 flex gap-4 flex-col sm:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar cliente por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary whitespace-nowrap"
          >
            <Plus size={20} />
            Agregar Cliente
          </button>
        </div>

        {/* Modal de agregar cliente */}
        {showAddForm && (
          <ClientForm
            onSubmit={handleAddClient}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {/* Modal de agregar préstamo */}
        {showLoanForm && (
          <LoanForm
            onSubmit={handleAddLoan}
            onCancel={() => setShowLoanForm(false)}
          />
        )}

        {showEditClientForm && selectedClient && (
          <ClientEditModal
            client={selectedClient}
            title="Editar Cliente - Vales"
            onSubmit={handleUpdateSelectedClient}
            onCancel={() => setShowEditClientForm(false)}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Lista de clientes */}
          <div className="lg:col-span-1">
            <div className="app-surface">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-bold text-gray-900">Clientes ({filteredClients.length})</h2>
              </div>
              <div className="max-h-96 stable-scroll-y">
                {filteredClients.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No hay clientes
                  </div>
                ) : (
                  filteredClients.map(client => (
                    <div
                      key={client.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        selectedClientId === client.id ? 'bg-blue-50 border-l-4 border-l-secondary' : ''
                      }`}
                    >
                      <button
                        onClick={() => {
                          setSelectedClientId(client.id)
                          setSelectedSource('captavale')
                          setSelectedLoanId(null)
                          setSearchFolioTerm('')
                        }}
                        className="w-full text-left px-4 py-3"
                      >
                        <p className="font-medium text-gray-900 text-sm">{client.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{client.loans.length} préstamo(s)</p>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Detalles del cliente y préstamos */}
          <div className="lg:col-span-3">
            {selectedClient ? (
              <div className="app-surface overflow-hidden">
                {/* Header del cliente */}
                <div className="p-6 border-b border-gray-200">
                  <div className="space-y-3 mb-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-bold text-gray-900">{selectedClient.name}</h2>
                          <button
                            onClick={() => setShowEditClientForm(true)}
                            title="Editar cliente"
                            aria-label="Editar cliente"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-secondary text-white hover:bg-blue-700 transition-colors"
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
                        <div className="mt-2 space-y-1">
                          {selectedClient.phone && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Teléfono:</span> {selectedClient.phone}
                            </p>
                          )}
                          {selectedClient.address && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Domicilio Casa:</span> {selectedClient.address}
                            </p>
                          )}
                          {selectedClient.workAddress && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Domicilio Trabajo:</span> {selectedClient.workAddress}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        <button
                          onClick={() => {
                            setShowLoanForm(true)
                            setSelectedSource(null)
                            setSelectedLoanId(null)
                          }}
                          className="btn-primary text-sm whitespace-nowrap"
                        >
                          <Plus size={16} />
                          Crear Préstamo
                        </button>
                      </div>
                    </div>

                    <div className="pt-1 flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                        Total prestamos: {selectedClient.loans.length}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                        Falta por pagar: {selectedClient.loans.filter((loan) => loan.status === 'active').length}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                        Completados: {selectedClient.loans.filter((loan) => loan.status === 'completed').length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pestañas de Fuentes de Cobro */}
                <div className="border-b border-gray-200 px-6 bg-gray-50">
                  <div className="flex gap-1 stable-scroll-x">
                    {/* Pestaña Fuentes General */}
                    <button
                      onClick={() => {
                        setShowSourceSummary(true)
                        setSelectedSource(null)
                        setSelectedLoanId(null)
                        setSearchFolioTerm('')
                      }}
                      className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                        showSourceSummary
                          ? 'border-secondary text-secondary'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Fuentes General
                    </button>

                    {Object.entries(sourcesList).map(([key, label]) => {
                      const loansInSource = selectedClient.loans.filter(l => l.source === key)

                      return (
                        <button
                          key={key}
                          onClick={() => {
                            setShowSourceSummary(false)
                            setSelectedSource(key)
                            setSelectedLoanId(null)
                            setSearchFolioTerm('')
                            setLoanStatusFilter('all')
                          }}
                          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                            !showSourceSummary && selectedSource === key
                              ? 'border-secondary text-secondary'
                              : 'border-transparent text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {label} ({loansInSource.length})
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Contenido: Resumen de Fuentes o Lista de préstamos o tabla */}
                <div className="p-6 min-h-[26rem]">
                  {showSourceSummary ? (
                    // Resumen de Fuentes General
                    <div className="space-y-6">
                      {/* Selector de vista */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => setViewMode('current')}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                            viewMode === 'current'
                              ? 'bg-secondary text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Pagos Pendientes por Quincena
                        </button>
                        <button
                          onClick={() => setViewMode('total')}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                            viewMode === 'total'
                              ? 'bg-secondary text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Total General
                        </button>
                      </div>

                      {/* Tarjetas de Fuentes */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(sourcesList).map(([sourceKey, sourceName]) => {
                          const loansInSource = selectedClient.loans.filter(l => l.source === sourceKey && l.status === 'active')
                          const currentQuincena = getCurrentQuincenaForSource(sourceKey, selectedClient.loans)
                          
                          if (loansInSource.length === 0) return null

                          const total = viewMode === 'current' 
                            ? getSourcePaymentTotal(sourceKey, currentQuincena, selectedClient.loans)
                            : getSourceTotalAllQuincenas(sourceKey, selectedClient.loans)

                          return (
                            <div key={sourceKey} className="bg-white border-2 border-gray-200 rounded-lg p-4">
                              <h3 className="text-lg font-bold text-gray-900 mb-2">{sourceName}</h3>
                              <p className="text-sm text-gray-600 mb-3">{loansInSource.length} préstamo(s)</p>
                              
                              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                                <p className="text-xs text-gray-600 mb-1">
                                  {viewMode === 'current' ? 'A pagar ahora' : 'Total restante'}
                                </p>
                                <p className="text-2xl font-bold text-secondary">
                                  ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </p>
                              </div>

                              {viewMode === 'current' && currentQuincena !== null && total > 0 && (
                                <button
                                  onClick={() => {
                                    const amount = getSourcePaymentTotal(sourceKey, currentQuincena, selectedClient.loans)
                                    setPendingPayment({
                                      type: 'paySourceQuincena',
                                      source: sourceKey,
                                      quincena: currentQuincena,
                                      title: `Pagar ${sourceName}`,
                                      message: `¿Deseas pagar esta quincena de ${sourceName}?`,
                                      amount: amount
                                    })
                                    setIsConfirmModalOpen(true)
                                  }}
                                  className="w-full bg-secondary text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                                >
                                  Pagar Quincena
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {/* Total General */}
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                        <p className="text-sm text-gray-600 mb-4">
                          {viewMode === 'current' ? 'TOTAL A PAGAR ESTA QUINCENA' : 'TOTAL GENERAL'}
                        </p>
                        <p className="text-4xl font-bold text-secondary mb-6">
                          ${(viewMode === 'current' 
                            ? getTotalActivePayments(selectedClient.loans)
                            : getTotalAllPayments(selectedClient.loans)
                          ).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                        
                        {viewMode === 'current' && getTotalActivePayments(selectedClient.loans) > 0 && (
                          <button
                            onClick={() => {
                              const totalAmount = getTotalActivePayments(selectedClient.loans)
                              setPendingPayment({
                                type: 'payAllSources',
                                title: 'Pagar Todas las Fuentes',
                                message: '¿Deseas pagar todas las fuentes de esta quincena?',
                                amount: totalAmount
                              })
                              setIsConfirmModalOpen(true)
                            }}
                            className="w-full bg-secondary text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                          >
                            Pagar Todas las Fuentes
                          </button>
                        )}
                      </div>
                    </div>
                  ) : selectedSource !== null ? (
                    // Vista de fuente individual
                    (() => {
                      const loansInSource = selectedClient.loans.filter(l => l.source === selectedSource)
                      const currentQuincena = getCurrentQuincenaForSource(selectedSource, selectedClient.loans)
                      const sourceTotal = currentQuincena 
                        ? getSourcePaymentTotal(selectedSource, currentQuincena, selectedClient.loans)
                        : 0

                          return selectedLoanId ? (
                            // Mostrar tabla del préstamo seleccionado
                            <>
                              <button
                                onClick={() => setSelectedLoanId(null)}
                                className="mb-4 text-secondary hover:text-blue-700 text-sm font-medium"
                              >
                                ← Volver a préstamos
                              </button>
                              <LoansTable
                                loan={selectedClient.loans.find(l => l.id === selectedLoanId)}
                                onPaymentRegister={() => handleRequestRegisterPayment(selectedLoanId)}
                                onUpdateClient={(updatedLoan) => {
                                  const updatedLoans = selectedClient.loans.map(l =>
                                    l.id === selectedLoanId ? updatedLoan : l
                                  )
                                  handleUpdateClient(selectedClientId, { loans: updatedLoans })
                                }}
                                onDeleteLoan={() => handleDeleteLoan(selectedLoanId)}
                              />
                            </>
                          ) : (
                            // Mostrar lista de préstamos de la fuente con subtotal
                            <div className="space-y-4">
                              {/* Subtotal por Quincena */}
                              {currentQuincena !== null && sourceTotal > 0 && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm text-gray-600 font-medium">Total Quincena {currentQuincena}</p>
                                      <p className="text-2xl font-bold text-secondary">
                                      ${sourceTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setPendingPayment({
                                        type: 'paySourceQuincena',
                                        source: selectedSource,
                                        quincena: currentQuincena,
                                        title: `Pagar Quincena ${currentQuincena}`,
                                        message: '¿Deseas pagar toda esta quincena?',
                                        amount: sourceTotal
                                      })
                                      setIsConfirmModalOpen(true)
                                    }}
                                    className="w-full bg-secondary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                  >
                                    Pagar Quincena Completa
                                  </button>
                                </div>
                              )}

                              <p className="text-sm font-medium text-gray-700 mb-3">
                                Préstamos de {sourcesList[selectedSource]}:
                              </p>
                              
                              {/* Búsqueda por folio */}
                              <div className="mb-4 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                  type="text"
                                  placeholder="Buscar por folio..."
                                  value={searchFolioTerm}
                                  onChange={(e) => setSearchFolioTerm(e.target.value)}
                                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
                                />
                              </div>

                              {/* Filtros de estado */}
                              <div className="mb-4 flex flex-wrap gap-2">
                                {[
                                  { key: 'all', label: 'Todos' },
                                  { key: 'active', label: 'Falta por pagar' },
                                  { key: 'completed', label: 'Completados' }
                                ].map((filter) => {
                                  const count = filter.key === 'all'
                                    ? loansInSource.length
                                    : loansInSource.filter((loan) => loan.status === filter.key).length

                                  const isActive = loanStatusFilter === filter.key

                                  return (
                                    <button
                                      key={filter.key}
                                      onClick={() => setLoanStatusFilter(filter.key)}
                                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                                        isActive
                                          ? 'bg-secondary text-white border-secondary'
                                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                      }`}
                                    >
                                      {filter.label} ({count})
                                    </button>
                                  )
                                })}
                              </div>

                              <div className="grid grid-cols-1 gap-3">
                                {loansInSource
                                  .filter((loan) => loan.folio?.toLowerCase().includes(searchFolioTerm.toLowerCase()))
                                  .filter((loan) => loanStatusFilter === 'all' || loan.status === loanStatusFilter)
                                  .map((loan) => (
                                  <button
                                    key={loan.id}
                                    onClick={() => setSelectedLoanId(loan.id)}
                                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-secondary hover:bg-blue-50 transition-colors text-left"
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <p className="font-bold text-secondary text-sm">Folio: {loan.folio}</p>
                                      {loan.createdAt && (
                                        <p className="text-xs text-gray-500 text-right">{loan.createdAt}</p>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                      Monto: ${loan.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Plazo: {loan.term} quincenas | Pago: ${loan.finalPayment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-sm text-secondary mt-2 font-medium">
                                      Progreso: {Math.min((loan.payments || []).length, loan.totalPayments)}/{loan.totalPayments}
                                    </p>
                                    <p className={`text-xs mt-1 font-medium ${loan.status === 'completed' ? 'text-green-600' : 'text-secondary'}`}>
                                      Estado: {loan.status === 'completed' ? 'Completado' : 'Falta por pagar'}
                                    </p>
                                    {loan.insurance > 0 && (
                                      <p className="text-xs text-orange-600 mt-1">
                                        Seguro: ${loan.insurance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                      </p>
                                    )}
                                  </button>
                                ))}
                              </div>

                              {loansInSource
                                .filter((loan) => loan.folio?.toLowerCase().includes(searchFolioTerm.toLowerCase()))
                                .filter((loan) => loanStatusFilter === 'all' || loan.status === loanStatusFilter)
                                .length === 0 && (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                                  <p className="text-sm text-gray-700 font-medium">No hay prestamos que coincidan con los filtros</p>
                                  <button
                                    onClick={() => {
                                      setSearchFolioTerm('')
                                      setLoanStatusFilter('all')
                                    }}
                                    className="mt-3 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium"
                                  >
                                    Limpiar filtros
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        })()
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <p className="text-lg">Selecciona una fuente de cobro para ver sus préstamos</p>
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

      {/* Modal de Confirmación */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title={pendingPayment?.title || ''}
        message={pendingPayment?.message || ''}
        amount={pendingPayment?.amount}
        type={pendingPayment?.type}
        onConfirm={handleConfirmPayment}
        onCancel={handleCancelPayment}
      />
    </div>
  )
}

export default ValesPage
