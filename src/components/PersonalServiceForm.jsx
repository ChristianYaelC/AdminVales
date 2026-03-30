import { useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { formatCurrencyInput, validateName, validateAmount, validateDueDay, validateFrequencyDays } from '../utils/validators'

function PersonalServiceForm({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    frequency: 'monthly',
    customFrequencyDays: '',
    dueDay: ''
  })

  const [errors, setErrors] = useState({})

  const frequencies = [
    { value: 'monthly', label: 'Mensual' },
    { value: 'bimonthly', label: 'Bimestral (2 meses)' },
    { value: 'quarterly', label: 'Trimestral (3 meses)' },
    { value: 'custom', label: 'Personalizado (días)' }
  ]

  const handleNameChange = (e) => {
    const { value } = e.target
    // Solo permite letras y espacios
    const filtered = value.replace(/[0-9]/g, '')
    setFormData(prev => ({
      ...prev,
      name: filtered
    }))
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: '' }))
    }
  }

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

  const handleDueDayChange = (e) => {
    const value = e.target.value.replace(/\D/g, '')
    setFormData(prev => ({
      ...prev,
      dueDay: value
    }))
    if (errors.dueDay) {
      setErrors(prev => ({ ...prev, dueDay: '' }))
    }
  }

  const handleFrequencyChange = (e) => {
    setFormData(prev => ({
      ...prev,
      frequency: e.target.value,
      customFrequencyDays: ''
    }))
    if (errors.frequency) {
      setErrors(prev => ({ ...prev, frequency: '' }))
    }
  }

  const handleCustomDaysChange = (e) => {
    const value = e.target.value.replace(/\D/g, '')
    setFormData(prev => ({
      ...prev,
      customFrequencyDays: value
    }))
    if (errors.customFrequencyDays) {
      setErrors(prev => ({ ...prev, customFrequencyDays: '' }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = {}

    const nameValidation = validateName(formData.name)
    if (!nameValidation.valid) {
      newErrors.name = nameValidation.error
    }

    const amountValidation = validateAmount(formData.amount, 'monto del servicio')
    if (!amountValidation.valid) {
      newErrors.amount = amountValidation.error
    }

    const dueDayValidation = validateDueDay(formData.dueDay)
    if (!dueDayValidation.valid) {
      newErrors.dueDay = dueDayValidation.error
    }

    if (formData.frequency === 'custom') {
      const daysValidation = validateFrequencyDays(formData.customFrequencyDays)
      if (!daysValidation.valid) {
        newErrors.customFrequencyDays = daysValidation.error
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const amount = parseFloat(formData.amount)
    const dueDay = parseInt(formData.dueDay, 10)
    const frequencyDays = formData.frequency === 'custom' ? parseInt(formData.customFrequencyDays, 10) : null

    const frequencyDaysMap = {
      monthly: 30,
      bimonthly: 60,
      quarterly: 90
    }

    onSubmit({
      name: formData.name.trim(),
      amount,
      frequency: formData.frequency,
      frequencyDays: formData.frequency === 'custom' ? frequencyDays : frequencyDaysMap[formData.frequency],
      dueDay
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Nuevo Servicio</h2>
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
              Nombre del servicio *
            </label>
            <input
              type="text"
              placeholder="Ej: Luz, Internet, Netflix..."
              value={formData.name}
              onChange={handleNameChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.name && (
              <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                {errors.name}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto ($) *
            </label>
            <input
              type="text"
              placeholder="0.00"
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
              Día de pago (1-31) *
            </label>
            <input
              type="text"
              placeholder="15"
              value={formData.dueDay}
              onChange={handleDueDayChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errors.dueDay ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.dueDay && (
              <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                {errors.dueDay}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Periodicidad *
            </label>
            <select
              value={formData.frequency}
              onChange={handleFrequencyChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.frequency ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            >
              {frequencies.map(freq => (
                <option key={freq.value} value={freq.value}>
                  {freq.label}
                </option>
              ))}
            </select>
          </div>

          {formData.frequency === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Días de frecuencia *
              </label>
              <input
                type="text"
                placeholder="45"
                value={formData.customFrequencyDays}
                onChange={handleCustomDaysChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  errors.customFrequencyDays ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.customFrequencyDays && (
                <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle size={16} />
                  {errors.customFrequencyDays}
                </div>
              )}
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
              Crear Servicio
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PersonalServiceForm
