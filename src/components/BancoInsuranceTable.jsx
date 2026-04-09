import { useState } from 'react'
import { Edit2, Trash2, Check } from 'lucide-react'
import ConfirmModal from './ConfirmModal'

function BancoInsuranceTable({ insurance, onRegisterPayment, onUpdatePayment, onDeleteInsurance, onEditInsurance, deleteLabel = 'Eliminar Seguro', deleteTitle = 'Eliminar Seguro' }) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [editingPaymentId, setEditingPaymentId] = useState(null)

  const handleRegisterPayment = (monthNumber) => {
    onRegisterPayment(insurance.id, {
      num: monthNumber,
      amount: insurance.monthlyPayment,
      date: new Date().toISOString().split('T')[0]
    })
  }

  const handleConfirmDelete = () => {
    if (pendingAction?.type === 'deleteInsurance') {
      onDeleteInsurance(insurance.id)
    } else if (pendingAction?.type === 'deletePayment') {
      // Implementar si es necesario
    }
    setIsConfirmModalOpen(false)
    setPendingAction(null)
  }

  const generatePaymentMonths = () => {
    const months = []
    for (let i = 1; i <= insurance.termMonths; i++) {
      months.push({
        number: i,
        paid: insurance.payments?.some(p => p.num === i) || false,
        payment: insurance.payments?.find(p => p.num === i)
      })
    }
    return months
  }

  const calculateSummary = () => {
    const payments = insurance.payments || []
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
    const remaining = Math.max(0, insurance.amount - totalPaid)
    const paidMonths = payments.length

    return { totalPaid, remaining, paidMonths }
  }

  const paymentMonths = generatePaymentMonths()
  const summary = calculateSummary()

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-blue-600 font-medium">Pagos Realizados</p>
          <p className="text-2xl font-bold text-blue-900">{summary.paidMonths}/{insurance.termMonths}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-green-600 font-medium">Pagado</p>
          <p className="text-2xl font-bold text-green-900">${summary.totalPaid.toFixed(2)}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <p className="text-sm text-red-600 font-medium">Restante</p>
          <p className="text-2xl font-bold text-red-900">${summary.remaining.toFixed(2)}</p>
        </div>
      </div>

      {/* Tabla de pagos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Mes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Fecha de Pago</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Estado</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paymentMonths.map((month) => (
                <tr key={month.number} className={month.paid ? 'bg-green-50' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    Mes {month.number}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    ${insurance.monthlyPayment.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {month.payment?.date
                      ? new Date(`${month.payment.date}T00:00:00`).toLocaleDateString('es-MX')
                      : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {month.paid ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <Check size={14} />
                        Pagado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        Falta por pagar
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    {!month.paid ? (
                      <button
                        onClick={() => handleRegisterPayment(month.number)}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors text-sm font-medium"
                      >
                        Registrar
                      </button>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            setPendingAction({
              type: 'deleteInsurance',
              title: deleteTitle,
              message: `¿Deseas eliminar "${insurance.name}"? No se puede deshacer.`
            })
            setIsConfirmModalOpen(true)
          }}
          className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <Trash2 size={18} />
          {deleteLabel}
        </button>
      </div>

      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title={pendingAction?.title}
        message={pendingAction?.message}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsConfirmModalOpen(false)
          setPendingAction(null)
        }}
      />
    </div>
  )
}

export default BancoInsuranceTable
