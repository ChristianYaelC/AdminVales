import { useState } from 'react'
import { Check, DollarSign, Trash2, Edit2 } from 'lucide-react'

function LoansTable({ loan, onPaymentRegister, onUpdateClient, onDeleteLoan }) {
  const [paymentAmount, setPaymentAmount] = useState('')
  const [editingPaymentId, setEditingPaymentId] = useState(null)
  const [editingDate, setEditingDate] = useState('')

  const isCompleted = loan.currentPayment > loan.totalPayments
  const paymentHistory = loan.payments || []
  const remainingPayments = Math.max(0, loan.totalPayments - loan.currentPayment + 1)

  // Calcular total restante a pagar
  const totalRemaining = remainingPayments * loan.finalPayment

  const handleEditDate = (payment, idx) => {
    setEditingPaymentId(idx)
    setEditingDate(payment.date || '')
  }

  const handleSaveDate = (idx) => {
    // Esta funcionalidad se maneja en el componente padre si es necesario
    setEditingPaymentId(null)
  }

  const handlePaymentSubmit = () => {
    const amount = parseFloat(paymentAmount)
    if (!amount || amount <= 0) {
      alert('Por favor ingresa un monto válido')
      return
    }

    onPaymentRegister(amount)
    setPaymentAmount('')
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
              <p className="text-lg font-bold text-gray-900 mt-1">{loan.createdAt}</p>
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
              paymentHistory.map((payment, idx) => {
                // Calcular saldos basados en el total a pagar (quincenas × pago por quincena)
                const totalAPagar = loan.totalPayments * loan.finalPayment
                const pagosAnteriores = paymentHistory.slice(0, idx).reduce((sum, p) => sum + p.amount, 0)
                const saldoAnterior = totalAPagar - pagosAnteriores
                const nuevoSaldo = saldoAnterior - payment.amount

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
                      ${saldoAnterior.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      ${payment.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-600">
                      ${nuevoSaldo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
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
          <h4 className="font-bold text-gray-900 mb-2">Registrar Pago - Quincena {loan.currentPayment}</h4>
          <p className="text-sm text-gray-600 mb-4">
            Cantidad pendiente a pagar: ${loan.finalPayment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex gap-3">
            <input
              type="number"
              step="0.01"
              min="0"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder={`Ej: ${loan.finalPayment.toFixed(2)}`}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handlePaymentSubmit}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
            >
              <Check size={18} />
              Registrar
            </button>
          </div>
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
