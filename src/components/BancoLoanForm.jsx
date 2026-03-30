import { useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { formatCurrencyInput, validateAmount, validateTerm } from '../utils/validators'

function BancoLoanForm({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    amount: '',
    termMonths: ''
  })

  const [errors, setErrors] = useState({})

  const handleAmountChange = (e) => {
    const value = formatCurrencyInput(e.target.value)
    setFormData(prev => ({
      ...prev,
      amount: value
    }))
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: '' }))
    }
  }

  const handleTermChange = (e) => {
    const value = e.target.value.replace(/\D/g, '')
    setFormData(prev => ({
      ...prev,
      termMonths: value
    }))
    if (errors.termMonths) {
      setErrors(prev => ({ ...prev, termMonths: '' }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = {}

    const amountValidation = validateAmount(formData.amount, 'monto del préstamo')
    if (!amountValidation.valid) {
      newErrors.amount = amountValidation.error
    }

    const termValidation = validateTerm(formData.termMonths, 'plazo (meses)')
    if (!termValidation.valid) {
      newErrors.termMonths = termValidation.error
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const amount = parseFloat(formData.amount)
    const termMonths = parseInt(formData.termMonths, 10)
    const monthlyPayment = amount / termMonths

    onSubmit({
      amount,
      termMonths,
      monthlyPayment: parseFloat(monthlyPayment.toFixed(2))
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Nuevo Préstamo</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto del préstamo ($) *
            </label>
            <input
              type="text"
              placeholder="1000.00"
              value={formData.amount}
              onChange={handleAmountChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errors.amount ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.amount && (
              <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                {errors.amount}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plazo (meses) *
            </label>
            <input
              type="text"
              placeholder="6"
              value={formData.termMonths}
              onChange={handleTermChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errors.termMonths ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.termMonths && (
              <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                {errors.termMonths}
              </div>
            )}
          </div>

          {formData.amount && formData.termMonths && !errors.amount && !errors.termMonths && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-sm text-gray-700">
                Pago mensual: <span className="font-bold text-blue-700">${(parseFloat(formData.amount) / parseInt(formData.termMonths, 10)).toFixed(2)}</span>
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Crear Préstamo
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BancoLoanForm
