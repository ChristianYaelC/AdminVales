import { useState, useEffect, useMemo } from 'react'
import { Check, Trash2, Edit2, AlertCircle, X, Minus, Plus } from 'lucide-react'
import {
  isLoanCompleted,
  getRemainingPayments,
  getRemainingAmount,
  buildStatementRows
} from '../domain/vales/loanCalculations'

function LoansTable({ loan, onPaymentRegister, onUpdateClient, onUpdateLoanTerm, onRemoveLastPayments, onDeleteLoan }) {
  const [editingPaymentId, setEditingPaymentId] = useState(null)
  const [editingDate, setEditingDate] = useState('')
  const [isEditingCreatedAt, setIsEditingCreatedAt] = useState(false)
  const [createdAtInput, setCreatedAtInput] = useState('')
  const [completionMessage, setCompletionMessage] = useState('')
  const [quinceCount, setQuinceCount] = useState(1)
  const [removeCount, setRemoveCount] = useState(1)

  useEffect(() => {
    setQuinceCount(1)
    setRemoveCount(1)
  }, [loan.id])

  const isCompleted = isLoanCompleted(loan)
  const paymentHistory = loan.payments || []
  const remainingPayments = getRemainingPayments(loan)
  const displayQuincena = loan.currentPayment + 1
  const paymentHistoryCount = paymentHistory.length
  const maxRemovablePayments = useMemo(() => paymentHistoryCount, [paymentHistoryCount])

  // Calcular total restante a pagar
  const totalRemaining = getRemainingAmount(loan)
  const statementRows = buildStatementRows(loan, paymentHistory)

  const formatDateForInput = (dateValue) => {
    if (!dateValue) return ''
    if (dateValue.includes('/')) {
      const [day, month, year] = dateValue.split('/')
      if (!day || !month || !year) return ''
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }

    const parsedDate = new Date(dateValue)
    if (Number.isNaN(parsedDate.getTime())) return ''

    const year = parsedDate.getUTCFullYear()
    const month = String(parsedDate.getUTCMonth() + 1).padStart(2, '0')
    const day = String(parsedDate.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatDateForDisplay = (dateValue) => {
    if (!dateValue) return ''
    if (dateValue.includes('/')) return dateValue

    if (dateValue.includes('-') && !dateValue.includes('T')) {
      const [year, month, day] = dateValue.split('-')
      if (!day || !month || !year) return dateValue
      return `${Number(day)}/${Number(month)}/${year}`
    }

    const parsedDate = new Date(dateValue)
    if (Number.isNaN(parsedDate.getTime())) return dateValue

    const day = String(parsedDate.getUTCDate()).padStart(2, '0')
    const month = String(parsedDate.getUTCMonth() + 1).padStart(2, '0')
    const year = parsedDate.getUTCFullYear()
    return `${day}/${month}/${year}`
  }

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
    onUpdateClient({
      ...loan,
      payments: updatedPayments
    })
    setEditingPaymentId(null)
    setEditingDate('')
  }

  const handlePaymentSubmit = () => {
    if (loan.currentPayment >= loan.totalPayments) {
      setCompletionMessage('Este préstamo ya está completado')
      setTimeout(() => setCompletionMessage(''), 4000)
      return
    }

    onPaymentRegister(quinceCount)
  }

  const handleStartEditCreatedAt = () => {
    setCreatedAtInput(formatDateForInput(loan.createdAt || ''))
    setIsEditingCreatedAt(true)
  }

  const handleSaveCreatedAt = () => {
    if (!createdAtInput) return
    onUpdateClient({
      ...loan,
      createdAt: formatDateForDisplay(createdAtInput)
    })
    setIsEditingCreatedAt(false)
  }

  const handleRemovePayments = () => {
    const nextCount = Math.max(1, Math.min(Number(removeCount) || 0, maxRemovablePayments))
    if (!onRemoveLastPayments || nextCount <= 0) return
    onRemoveLastPayments(nextCount)
  }

  return (
    <div className="mb-8">
      {/* Notificación de préstamo completado */}
      {completionMessage && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-yellow-600" size={20} />
            <p className="text-yellow-800 font-medium">{completionMessage}</p>
          </div>
          <button
            onClick={() => setCompletionMessage('')}
            className="p-1 hover:bg-yellow-100 rounded transition-colors"
          >
            <X size={18} className="text-yellow-600" />
          </button>
        </div>
      )}
      {/* Información del Préstamo con Folio */}
      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="bg-white px-4 py-2 rounded-lg border-2 border-blue-600 shrink-0">
              <p className="text-xs text-gray-600 font-semibold">FOLIO</p>
              <p className="text-lg font-bold text-blue-600">{loan.folio}</p>
            </div>
            {loan.createdAt && (
              <div>
                <p className="text-xs text-gray-600 font-medium">Fecha de Creación</p>
                {isEditingCreatedAt ? (
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="date"
                      value={createdAtInput}
                      onChange={(e) => setCreatedAtInput(e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleSaveCreatedAt}
                      className="text-green-600 hover:text-green-700"
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-lg font-bold text-gray-900">{loan.createdAt}</p>
                    <button
                      type="button"
                      onClick={handleStartEditCreatedAt}
                      className="text-blue-600 hover:text-blue-700 p-1"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {onDeleteLoan && (
            <button
              type="button"
              onClick={() => onDeleteLoan()}
              className="inline-flex items-center gap-2 self-start rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              <Trash2 size={16} />
              Eliminar Préstamo
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg bg-white p-3 border border-blue-100">
            <p className="text-xs text-gray-600 font-medium">Monto Original</p>
            <p className="text-lg font-bold text-gray-900 mt-1">
              ${loan.amount.toLocaleString('es-MX')}
            </p>
          </div>
          <div className="rounded-lg bg-white p-3 border border-blue-100">
            <p className="text-xs text-gray-600 font-medium">Plazo</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{loan.term} quincenas</p>
          </div>
          <div className="rounded-lg bg-white p-3 border border-blue-100">
            <p className="text-xs text-gray-600 font-medium">Pago por Quincena</p>
            <p className="text-lg font-bold text-blue-600 mt-1">
              ${loan.finalPayment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>
          {loan.insurance > 0 && (
            <div className="rounded-lg bg-white p-3 border border-blue-100">
              <p className="text-xs text-gray-600 font-medium">Seguro</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                ${loan.insurance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}
        </div>

        <div className="mt-4">
          <div className="rounded-lg border border-red-200 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Eliminar últimas quincenas</p>
                <p className="text-xs text-gray-500">Quita registros recientes y ajusta el avance del préstamo.</p>
              </div>
              <button
                type="button"
                onClick={handleRemovePayments}
                disabled={maxRemovablePayments === 0}
                className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={14} />
                Eliminar
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setRemoveCount((count) => Math.max(1, count - 1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
              >
                <Minus size={14} />
              </button>
              <span className="w-10 text-center text-sm font-semibold text-gray-900">{removeCount}</span>
              <button
                type="button"
                onClick={() => setRemoveCount((count) => Math.min(maxRemovablePayments, count + 1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
              >
                <Plus size={14} />
              </button>
              <span className="text-xs text-gray-500">de {maxRemovablePayments} registradas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mensaje de Préstamo Completado */}
      {isCompleted && (
        <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Check size={32} className="text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">¡PRÉSTAMO COMPLETADO!</p>
                <p className="text-green-700 font-medium">Todas las quincenas han sido pagadas</p>
              </div>
            </div>
            {onDeleteLoan && (
              <button
                onClick={() => onDeleteLoan()}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium whitespace-nowrap"
              >
                <Trash2 size={18} />
                Eliminar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tabla de Estado de Cuenta */}
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="px-4 py-3 text-center font-bold text-gray-800">FECHA DE PAGO</th>
              <th className="px-4 py-3 text-center font-bold text-gray-800">NUM. DE PAGO</th>
              <th className="px-4 py-3 text-right font-bold text-gray-800">SALDO ANTERIOR</th>
              <th className="px-4 py-3 text-right font-bold text-gray-800">IMPORTE DE PAGO</th>
              <th className="px-4 py-3 text-right font-bold text-gray-800">NUEVO SALDO</th>
            </tr>
          </thead>
          <tbody>
            {paymentHistory.length > 0 ? (
              statementRows.map((payment, idx) => {
                return (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-4 py-3 text-center text-gray-900">
                      {editingPaymentId === idx ? (
                        <div className="flex gap-2 items-center justify-center">
                          <input
                            type="date"
                            value={editingDate}
                            onChange={(e) => setEditingDate(e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                          <button
                            onClick={() => handleSaveDate(idx)}
                            className="text-green-600 hover:text-green-700"
                          >
                            ✓
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 items-center justify-center">
                          <span>{formatDateForDisplay(payment.date) || '—'}</span>
                          <button
                            onClick={() => handleEditDate(payment, idx)}
                            className="text-blue-600 hover:text-blue-700 p-1"
                          >
                            <Edit2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-gray-900">
                      {payment.num}
                    </td>
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
                )
              })
            ) : (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                  Sin pagos registrados aún
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Formulario para registrar nuevo pago */}
      {!isCompleted && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-bold text-gray-900 mb-1">Registrar Pago</h4>
          <p className="text-sm text-gray-600 mb-4">
            Monto por quincena: ${loan.finalPayment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-sm font-medium text-gray-700">Quincenas a registrar:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuinceCount(c => Math.max(1, c - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-100 transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center font-bold text-gray-900">{quinceCount}</span>
              <button
                onClick={() => setQuinceCount(c => Math.min(remainingPayments, c + 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-100 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
            <span className="text-xs text-gray-500">de {remainingPayments} restantes</span>
          </div>

          {quinceCount > 1 && (
            <p className="text-sm font-semibold text-blue-700 mb-4">
              Total: ${(quinceCount * loan.finalPayment).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              {' '}(quincenas {displayQuincena} a {Math.min(displayQuincena + quinceCount - 1, loan.totalPayments)})
            </p>
          )}

          <button
            onClick={handlePaymentSubmit}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
          >
            <Check size={18} />
            {quinceCount === 1
              ? `Registrar Quincena ${displayQuincena}`
              : `Registrar ${quinceCount} Quincenas`}
          </button>
        </div>
      )}

      {/* Resumen */}
      <div className="mt-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-xs text-gray-600 font-medium">Total Pagado</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            ${(paymentHistory.reduce((sum, p) => sum + p.amount, 0)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-600 mt-2">{paymentHistory.length} quincena(s)</p>
        </div>
      </div>
    </div>
  )
}

export default LoansTable
