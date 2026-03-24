import { useState } from 'react'
import { Check, DollarSign, Trash2 } from 'lucide-react'

function LoansTable({ loan, onPaymentRegister, onUpdateClient, onDeleteLoan }) {
  const [paymentAmount, setPaymentAmount] = useState('')

  const isCompleted = loan.currentPayment > loan.totalPayments
  const paymentHistory = loan.payments || []
  const remainingPayments = Math.max(0, loan.totalPayments - loan.currentPayment + 1)

  // Calcular total restante a pagar
  const totalRemaining = remainingPayments * loan.finalPayment

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
          <div>
            <p className="text-xs text-gray-600 font-medium">Nombre del Préstamo</p>
            <p className="text-lg font-bold text-gray-900">{loan.name}</p>
          </div>
          {loan.folio && (
            <div className="bg-white px-4 py-2 rounded-lg border-2 border-blue-500">
              <p className="text-xs text-gray-600 font-medium">Folio</p>
              <p className="text-lg font-bold text-blue-600">{loan.folio}</p>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
        </div>
      </div>

      {/* Barra de Progreso */}
      <div className="mb-6">
        {!isCompleted ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-gray-900">Progreso de Pago</p>
              <p className="text-sm text-gray-600">
                {loan.currentPayment - 1}/{loan.totalPayments} quincenas
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full transition-all"
                style={{ width: `${((loan.currentPayment - 1) / loan.totalPayments) * 100}%` }}
              />
            </div>
          </>
        ) : (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-lg p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Check size={32} className="text-green-600" />
              <p className="text-3xl font-bold text-green-600">¡PRÉSTAMO COMPLETADO!</p>
            </div>
            <p className="text-green-700 font-medium">Todas las quincenas han sido pagadas</p>
          </div>
        )}
      </div>

      {/* Tabla de Historial de Pagos */}
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="px-4 py-3 text-center font-bold text-gray-700">Quincena</th>
              <th className="px-4 py-3 text-right font-bold text-gray-700">Monto Pagado</th>
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
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    ${payment.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600 text-xs">
                    {payment.date || '—'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
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
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-xs text-gray-600 font-medium">Aún por pagar</p>
          <p className="text-2xl font-bold text-orange-600 mt-2">
            ${totalRemaining.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-600 mt-2">{remainingPayments} quincena(s)</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-xs text-gray-600 font-medium">Total Pagado</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            ${(paymentHistory.reduce((sum, p) => sum + p.amount, 0)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-600 mt-2">{paymentHistory.length} quincena(s)</p>
        </div>
      </div>

      {/* Botón de Eliminar */}
      {onDeleteLoan && (
        <button
          onClick={() => onDeleteLoan()}
          className="mt-6 flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          <Trash2 size={18} />
          Eliminar Préstamo
        </button>
      )}
    </div>
  )
}

export default LoansTable
