import { useState } from 'react'
import { Search, TrendingDown, DollarSign, Check, Trash2 } from 'lucide-react'
import { useClients } from '../context/ClientsContext'
import ConfirmModal from '../components/ConfirmModal'

function BancoPage() {
  const { clients, setClients } = useClients()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClientId, setSelectedClientId] = useState(null)
  const [selectedSource, setSelectedSource] = useState(null)
  const [selectedLoanId, setSelectedLoanId] = useState(null)
  const [showSourceSummary, setShowSourceSummary] = useState(false)
  const [viewMode, setViewMode] = useState('current')
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [pendingPayment, setPendingPayment] = useState(null)

  const sourcesList = {
    captavale: 'CaptaVale',
    salevale: 'SaleVale',
    dportenis: 'dportenis',
    valefectivo: 'valefectivo'
  }

  // Filtrar clientes por búsqueda
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Obtener cliente seleccionado
  const selectedClient = clients.find(c => c.id === selectedClientId)

  // Calcular totales para un cliente
  const calculateClientTotals = (client) => {
    let totalLent = 0
    let totalPaid = 0
    let paymentsByQuincena = {}

    client.loans.forEach(loan => {
      const initialAmount = loan.amount || (loan.previousBalance * loan.totalPayments / (loan.totalPayments - loan.currentPayment + 1))
      totalLent += initialAmount

      const paymentPerQuincena = initialAmount / loan.totalPayments
      const paymentHistory = loan.payments || []
      totalPaid += paymentHistory.reduce((sum, p) => sum + p.amount, 0)

      // Agrupar pagos por quincena
      paymentHistory.forEach((payment, idx) => {
        paymentsByQuincena[payment.num] = (paymentsByQuincena[payment.num] || 0) + payment.amount
      })
    })

    return { totalLent, totalPaid, paymentsByQuincena }
  }

  // Funciones de cálculo para consolidación de pagos
  const getSourcePaymentTotal = (source, quincena, clientLoans) => {
    return clientLoans
      .filter(l => l.source === source && l.currentPayment === quincena && l.status === 'active')
      .reduce((sum, l) => sum + l.finalPayment, 0)
  }

  const getCurrentQuincenaForSource = (source, clientLoans) => {
    const loansInSource = clientLoans.filter(l => l.source === source && l.status === 'active')
    if (loansInSource.length === 0) return null
    return Math.min(...loansInSource.map(l => l.currentPayment))
  }

  const getSourceTotalAllQuincenas = (source, clientLoans) => {
    return clientLoans
      .filter(l => l.source === source && l.status === 'active')
      .reduce((sum, l) => {
        const remainingQuincenas = Math.max(0, l.totalPayments - l.currentPayment + 1)
        return sum + (remainingQuincenas * l.finalPayment)
      }, 0)
  }

  const handlePaySourceQuincena = (source, quincena) => {
    if (!selectedClient) return

    const updatedClients = clients.map(client => {
      if (client.id === selectedClientId) {
        const updatedLoans = client.loans.map(loan => {
          if (loan.source === source && loan.currentPayment === quincena && loan.status === 'active') {
            const payments = [...(loan.payments || [])]
            payments.push({
              num: loan.currentPayment,
              amount: loan.finalPayment,
              date: new Date().toLocaleDateString('es-MX')
            })

            const newPayment = loan.currentPayment + 1
            const status = newPayment > loan.totalPayments ? 'completed' : 'active'

            return {
              ...loan,
              currentPayment: newPayment,
              payments: payments,
              status: status
            }
          }
          return loan
        })
        return { ...client, loans: updatedLoans }
      }
      return client
    })

    setClients(updatedClients)
  }

  // Pagar todas las fuentes en sus respectivas quincenas
  const handlePayAllSources = () => {
    if (!selectedClient) return

    const updatedClients = clients.map(client => {
      if (client.id === selectedClientId) {
        const updatedLoans = client.loans.map(loan => {
          if (loan.status === 'active') {
            const payments = [...(loan.payments || [])]
            payments.push({
              num: loan.currentPayment,
              amount: loan.finalPayment,
              date: new Date().toLocaleDateString('es-MX')
            })

            const newPayment = loan.currentPayment + 1
            const status = newPayment > loan.totalPayments ? 'completed' : 'active'

            return {
              ...loan,
              currentPayment: newPayment,
              payments: payments,
              status: status
            }
          }
          return loan
        })
        return { ...client, loans: updatedLoans }
      }
      return client
    })

    setClients(updatedClients)
  }

  // Eliminar préstamo
  const handleDeleteLoan = (loanId) => {
    if (!selectedClientId) return

    const updatedClients = clients.map(client => {
      if (client.id === selectedClientId) {
        return {
          ...client,
          loans: client.loans.filter(l => l.id !== loanId)
        }
      }
      return client
    })

    setClients(updatedClients)
    setSelectedLoanId(null)
  }

  const getTotalActivePayments = (clientLoans) => {
    const sourceKeys = Object.keys(sourcesList)
    let total = 0
    
    sourceKeys.forEach(source => {
      const currentQuincena = getCurrentQuincenaForSource(source, clientLoans)
      if (currentQuincena !== null) {
        total += getSourcePaymentTotal(source, currentQuincena, clientLoans)
      }
    })
    
    return total
  }

  const getTotalAllPayments = (clientLoans) => {
    return clientLoans
      .filter(l => l.status === 'active')
      .reduce((sum, l) => {
        const remainingQuincenas = Math.max(0, l.totalPayments - l.currentPayment + 1)
        return sum + (remainingQuincenas * l.finalPayment)
      }, 0)
  }

  // Manejar confirmación del modal
  const handleConfirmPayment = () => {
    if (!pendingPayment) return

    if (pendingPayment.type === 'paySourceQuincena') {
      handlePaySourceQuincena(pendingPayment.source, pendingPayment.quincena)
    } else if (pendingPayment.type === 'payAllSources') {
      handlePayAllSources()
    }

    setIsConfirmModalOpen(false)
    setPendingPayment(null)
  }

  const handleCancelPayment = () => {
    setIsConfirmModalOpen(false)
    setPendingPayment(null)
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión Bancaria</h1>
          <p className="text-gray-600">Visualiza pagos y préstamos por cliente</p>
        </div>

        {/* Buscador */}
        <div className="mb-8 flex-1 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar cliente por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Lista de clientes */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-bold text-gray-900">Clientes ({filteredClients.length})</h2>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {filteredClients.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No hay clientes
                  </div>
                ) : (
                  filteredClients.map(client => (
                    <button
                      key={client.id}
                      onClick={() => {
                        setSelectedClientId(client.id)
                        setSelectedSource('captavale')
                        setSelectedLoanId(null)
                      }}
                      className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        selectedClientId === client.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                      }`}
                    >
                      <p className="font-medium text-gray-900 text-sm">{client.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{client.loans.length} préstamo(s)</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Detalles del cliente */}
          <div className="lg:col-span-3">
            {selectedClient ? (
              <>
                {/* KPIs del cliente */}
                {selectedClient.loans.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {(() => {
                      const { totalLent, totalPaid } = calculateClientTotals(selectedClient)
                      const totalRemaining = totalLent - totalPaid

                      return (
                        <>
                          <div className="bg-white rounded-lg shadow p-4">
                            <p className="text-gray-600 text-xs font-medium">Total Prestado</p>
                            <p className="text-2xl font-bold text-gray-900 mt-2">
                              ${totalLent.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg shadow p-4">
                            <p className="text-gray-600 text-xs font-medium">Total Pagado</p>
                            <p className="text-2xl font-bold text-green-600 mt-2">
                              ${totalPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg shadow p-4">
                            <p className="text-gray-600 text-xs font-medium">Por Cobrar</p>
                            <p className="text-2xl font-bold text-orange-600 mt-2">
                              ${totalRemaining.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                )}

                {/* Contenido principal */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">{selectedClient.name}</h2>
                  </div>

                  <div className="p-6">
                    {/* Tabs de Fuentes - siempre las 4 fuentes disponibles */}
                    <div className="border-b border-gray-200 mb-6 bg-gray-50 -m-6 px-6 pt-0">
                      <div className="flex gap-1 overflow-x-auto pt-6">
                        {/* Pestaña Fuentes General */}
                        <button
                          onClick={() => {
                            setShowSourceSummary(true)
                            setSelectedSource(null)
                            setSelectedLoanId(null)
                          }}
                          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                            showSourceSummary
                              ? 'border-blue-600 text-blue-600'
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
                              }}
                              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                                !showSourceSummary && selectedSource === key
                                  ? 'border-blue-600 text-blue-600'
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
                      {showSourceSummary ? (
                        // Resumen de Fuentes General
                        <div className="space-y-6">
                          {/* Selector de vista */}
                          <div className="flex gap-3">
                            <button
                              onClick={() => setViewMode('current')}
                              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                                viewMode === 'current'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Pagos Pendientes por Quincena
                            </button>
                            <button
                              onClick={() => setViewMode('total')}
                              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                                viewMode === 'total'
                                  ? 'bg-blue-600 text-white'
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
                                    <p className="text-2xl font-bold text-blue-600">
                                      ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </p>
                                  </div>

                                  {viewMode === 'current' && currentQuincena && total > 0 && (
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
                                      className="w-full bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                                    >
                                      Pagar Quincena
                                    </button>
                                  )}
                                </div>
                              )
                            })}
                          </div>

                          {/* Total General */}
                          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6">
                            <p className="text-sm text-gray-600 mb-4">
                              {viewMode === 'current' ? 'TOTAL A PAGAR ESTA QUINCENA' : 'TOTAL GENERAL'}
                            </p>
                            <p className="text-4xl font-bold text-purple-600 mb-6">
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
                                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                              >
                                Pagar Todas las Fuentes
                              </button>
                            )}
                          </div>
                        </div>
                      ) : selectedSource ? (
                        (() => {
                          const loansInSource = selectedClient.loans.filter(l => l.source === selectedSource)
                          const currentQuincena = getCurrentQuincenaForSource(selectedSource, selectedClient.loans)
                          const sourceTotal = currentQuincena 
                            ? getSourcePaymentTotal(selectedSource, currentQuincena, selectedClient.loans)
                            : 0

                          return selectedLoanId ? (
                            // Mostrar tabla del préstamo seleccionado
                            (() => {
                              const loan = selectedClient.loans.find(l => l.id === selectedLoanId)
                              const initialAmount = loan.amount || 0
                              const paymentHistory = loan.payments || []
                              const paymentPerQuincena = initialAmount / loan.term

                              return (
                                <div>
                                  <button
                                    onClick={() => setSelectedLoanId(null)}
                                    className="mb-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                                  >
                                    ← Volver a préstamos
                                  </button>

                                  {/* Info del préstamo */}
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
                                    <div>
                                      <p className="text-gray-600 text-xs font-medium">Nombre</p>
                                      <p className="text-lg font-bold text-gray-900 mt-1">{loan.name}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600 text-xs font-medium">Monto Original</p>
                                      <p className="text-lg font-bold text-gray-900 mt-1">
                                        ${initialAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600 text-xs font-medium">Plazo</p>
                                      <p className="text-lg font-bold text-gray-900 mt-1">{loan.term} quincenas</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600 text-xs font-medium">Pago/Quincena</p>
                                      <p className="text-lg font-bold text-gray-900 mt-1">
                                        ${paymentPerQuincena.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Progreso */}
                                  {paymentHistory.length <= loan.term ? (
                                    <div className="mb-6">
                                      <div className="flex items-center justify-between mb-2">
                                        <p className="font-medium text-gray-900">Progreso del Pago</p>
                                        <p className="text-sm text-gray-600">
                                          {paymentHistory.length}/{loan.term} quincenas
                                        </p>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div
                                          className="bg-green-600 h-3 rounded-full transition-all"
                                          style={{ width: `${(paymentHistory.length / loan.term) * 100}%` }}
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-lg p-6 text-center mb-6">
                                      <div className="flex items-center justify-center gap-3 mb-2">
                                        <Check size={32} className="text-green-600" />
                                        <p className="text-3xl font-bold text-green-600">¡PRÉSTAMO COMPLETADO!</p>
                                      </div>
                                      <p className="text-green-700 font-medium">Todas las quincenas han sido pagadas</p>
                                    </div>
                                  )}

                                  {/* Tabla de pagos */}
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="bg-gray-100 border-b-2 border-gray-300">
                                          <th className="px-4 py-3 text-center font-bold text-gray-700">Quincena</th>
                                          <th className="px-4 py-3 text-right font-bold text-gray-700">Monto Pagado</th>
                                          <th className="px-4 py-3 text-right font-bold text-gray-700">Saldo</th>
                                          <th className="px-4 py-3 text-center font-bold text-gray-700">Fecha</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {paymentHistory.length > 0 ? (
                                          paymentHistory.map((payment, idx) => (
                                            <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                              <td className="px-4 py-3 text-center font-medium text-gray-900">
                                                {payment.num}ª
                                              </td>
                                              <td className="px-4 py-3 text-right text-gray-900 font-semibold">
                                                ${payment.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                              </td>
                                              <td className="px-4 py-3 text-right font-semibold">
                                                <span className={payment.balance < 0 ? 'text-red-600' : 'text-gray-900'}>
                                                  ${Math.max(payment.balance, 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                </span>
                                              </td>
                                              <td className="px-4 py-3 text-center text-gray-600 text-xs">
                                                {payment.date || '—'}
                                              </td>
                                            </tr>
                                          ))
                                        ) : (
                                          <tr>
                                            <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                                              Sin pagos registrados aún
                                            </td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>

                                  {/* Botón de Eliminar */}
                                  <button
                                    onClick={() => {
                                      if (confirm(`¿Estás seguro que deseas eliminar el préstamo "${loan.name}"?`)) {
                                        handleDeleteLoan(loan.id)
                                      }
                                    }}
                                    className="mt-6 flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                                  >
                                    <Trash2 size={18} />
                                    Eliminar Préstamo
                                  </button>
                                </div>
                              )
                            })()
                          ) : (
                            // Mostrar lista de préstamos de la fuente con subtotal
                            <div className="space-y-4">
                              {/* Subtotal por Quincena */}
                              {currentQuincena && sourceTotal > 0 && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm text-gray-600 font-medium">Total Quincena {currentQuincena}</p>
                                    <p className="text-2xl font-bold text-blue-600">
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
                                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                                  >
                                    Pagar Quincena Completa
                                  </button>
                                </div>
                              )}

                              <p className="text-sm font-medium text-gray-700">
                                Préstamos de {sourcesList[selectedSource]}:
                              </p>
                              <div className="grid grid-cols-1 gap-3">
                                {loansInSource.map(loan => (
                                  <button
                                    key={loan.id}
                                    onClick={() => setSelectedLoanId(loan.id)}
                                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                                  >
                                    <p className="font-bold text-gray-900">{loan.name}</p>
                                    <p className="text-sm text-gray-600 mt-1">
                                      Monto: ${loan.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Plazo: {loan.term} quincenas | Pago: ${loan.finalPayment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-sm text-blue-600 mt-2 font-medium">
                                      Progreso: {loan.currentPayment}/{loan.totalPayments}
                                    </p>
                                    {loan.insurance > 0 && (
                                      <p className="text-xs text-orange-600 mt-1">
                                        Seguro: ${loan.insurance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                      </p>
                                    )}
                                  </button>
                                ))}
                              </div>
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
              </>
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
        onConfirm={handleConfirmPayment}
        onCancel={handleCancelPayment}
      />
    </div>
  )
}

export default BancoPage
