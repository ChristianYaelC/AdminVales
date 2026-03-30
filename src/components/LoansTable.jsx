import { useState } from 'react'
import { Check, Trash2, Edit2 } from 'lucide-react'
import {
  isLoanCompleted,
  getRemainingPayments,
  getRemainingAmount,
  buildStatementRows
} from '../domain/vales/loanCalculations'

function LoansTable({ loan, onPaymentRegister, onUpdateClient, onDeleteLoan }) {
  const [editingPaymentId, setEditingPaymentId] = useState(null)
  const [editingDate, setEditingDate] = useState('')
  const [isEditingCreatedAt, setIsEditingCreatedAt] = useState(false)
  const [createdAtInput, setCreatedAtInput] = useState('')

  const isCompleted = isLoanCompleted(loan)
  const paymentHistory = loan.payments || []
  const remainingPayments = getRemainingPayments(loan)
  const displayQuincena = loan.currentPayment + 1

  // Calcular total restante a pagar
  const totalRemaining = getRemainingAmount(loan)
  const statementRows = buildStatementRows(loan, paymentHistory)

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
      alert('Este prestamo ya esta completado')
      return
    }

    onPaymentRegister()
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

  return (
    <div className="mb-8">
      {/* Información del Préstamo con Folio */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="bg-white px-4 py-2 rounded-lg border-2 border-blue-600">
            <p className="text-xs text-gray-600 font-semibold">FOLIO</p>
            <p className="text-lg font-bold text-blue-600">{loan.folio}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div>
            <p className="text-xs text-gray-600 font-medium">Monto Original</p>
            <p className="text-lg font-bold text-gray-900 mt-1">
              ${loan.amount.toLocaleString('es-MX')}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Plazo</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{loan.term} quincenas</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Pago por Quincena</p>
            <p className="text-lg font-bold text-blue-600 mt-1">
              ${loan.finalPayment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>
          {loan.insurance > 0 && (
            <div>
              <p className="text-xs text-gray-600 font-medium">Seguro</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                ${loan.insurance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}
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
            <tr className="bg-yellow-100 border-b-2 border-yellow-300">
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
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-yellow-50' : 'bg-white'}>
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
          <h4 className="font-bold text-gray-900 mb-2">Registrar Pago - Quincena {displayQuincena}</h4>
          <p className="text-sm text-gray-600 mb-4">
            Monto fijo por quincena: ${loan.finalPayment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <button
            onClick={handlePaymentSubmit}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
          >
            <Check size={18} />
            Registrar
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
