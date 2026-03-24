import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { LOAN_TABLES, getAvailableAmounts, getAvailableTerms, getPaymentFromTable, calculateFinalPayment } from '../constants/tablesData'
import { useClients } from '../context/ClientsContext'

function LoanForm({ onSubmit, onCancel }) {
  const { isFolioUnique } = useClients()
  const [formData, setFormData] = useState({
    name: '',
    folio: '',
    amount: '',
    term: '',
    source: '',
    insurance: ''
  })

  const [errors, setErrors] = useState({})

  const sourcesList = {
    captavale: 'CaptaVale',
    salevale: 'SaleVale',
    dportenis: 'dportenis',
    valefectivo: 'valefectivo'
  }

  const handleNameChange = (e) => {
    setFormData({ ...formData, name: e.target.value })
    if (errors.name) setErrors({ ...errors, name: '' })
  }

  const handleFolioChange = (e) => {
    setFormData({ ...formData, folio: e.target.value })
    if (errors.folio) setErrors({ ...errors, folio: '' })
  }

  const handleSourceChange = (e) => {
    const newSource = e.target.value
    setFormData({
      ...formData,
      source: newSource,
      amount: '',
      term: '',
      insurance: ''
    })
    if (errors.source) setErrors({ ...errors, source: '' })
  }

  const handleAmountChange = (e) => {
    const newAmount = e.target.value
    setFormData({
      ...formData,
      amount: newAmount,
      term: ''
    })
    if (errors.amount) setErrors({ ...errors, amount: '' })
  }

  const handleTermChange = (e) => {
    setFormData({
      ...formData,
      term: e.target.value
    })
    if (errors.term) setErrors({ ...errors, term: '' })
  }

  const handleInsuranceChange = (e) => {
    setFormData({
      ...formData,
      insurance: e.target.value
    })
  }

  const getAvailableAmountsForSource = () => {
    if (!formData.source) return []
    return getAvailableAmounts(formData.source)
  }

  const getAvailableTermsForAmount = () => {
    if (!formData.source || !formData.amount) return []
    return getAvailableTerms(formData.source, parseInt(formData.amount))
  }

  const getSourceData = () => {
    return LOAN_TABLES[formData.source] || null
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del préstamo es requerido'
    }

    if (!formData.folio.trim()) {
      newErrors.folio = 'El folio del préstamo es requerido'
    } else if (!isFolioUnique(formData.folio)) {
      newErrors.folio = 'Este folio ya existe. Por favor ingresa un folio único'
    }

    if (!formData.source) {
      newErrors.source = 'Selecciona una fuente de cobro'
    }

    const amount = parseInt(formData.amount)
    if (!formData.amount || isNaN(amount)) {
      newErrors.amount = 'Selecciona un monto válido'
    }

    if (!formData.term) {
      newErrors.term = 'Selecciona un plazo válido'
    }

    const sourceData = getSourceData()
    if (sourceData && sourceData.hasInsurance && formData.insurance === '') {
      newErrors.insurance = `El ${sourceData.insuranceType === 'global' ? 'seguro global' : 'fondo protege'} es requerido`
    }

    if (sourceData && sourceData.hasInsurance && formData.insurance !== '') {
      const insurance = parseFloat(formData.insurance)
      if (isNaN(insurance) || insurance < 0) {
        newErrors.insurance = 'Ingresa un monto de seguro válido'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      const amount = parseInt(formData.amount)
      const term = parseInt(formData.term)
      const insurance = formData.insurance ? parseFloat(formData.insurance) : 0
      const sourceData = getSourceData()

      const basePayment = getPaymentFromTable(formData.source, amount, term)
      const finalPayment = calculateFinalPayment(basePayment, insurance, term, sourceData.insuranceType)

      onSubmit({
        name: formData.name,
        folio: formData.folio,
        amount: amount,
        term: term,
        source: formData.source,
        insurance: insurance,
        basePayment: basePayment,
        finalPayment: Math.round(finalPayment * 100) / 100
      })
    }
  }

  const sourceData = getSourceData()
  const availableAmounts = getAvailableAmountsForSource()
  const availableTerms = getAvailableTermsForAmount()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-xl w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Crear Préstamo</h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre del Préstamo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Préstamo
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="Ej: Emergencia"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Folio del Préstamo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Folio
            </label>
            <input
              type="text"
              value={formData.folio}
              onChange={handleFolioChange}
              placeholder="Ej: FOLIO-001"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                errors.folio ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.folio && <p className="text-red-500 text-xs mt-1">{errors.folio}</p>}
          </div>

          {/* Fuente de Cobro */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fuente de Cobro
            </label>
            <select
              value={formData.source}
              onChange={handleSourceChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                errors.source ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">-- Selecciona una fuente --</option>
              {Object.entries(sourcesList).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            {errors.source && <p className="text-red-500 text-xs mt-1">{errors.source}</p>}
          </div>

          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto
            </label>
            <select
              value={formData.amount}
              onChange={handleAmountChange}
              disabled={!formData.source}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                errors.amount ? 'border-red-500' : 'border-gray-300'
              } ${!formData.source ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value="">-- Selecciona un monto --</option>
              {availableAmounts.map(amount => (
                <option key={amount} value={amount}>${amount.toLocaleString()}</option>
              ))}
            </select>
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
          </div>

          {/* Plazo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plazo (Quincenas)
            </label>
            <select
              value={formData.term}
              onChange={handleTermChange}
              disabled={!formData.amount}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                errors.term ? 'border-red-500' : 'border-gray-300'
              } ${!formData.amount ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value="">-- Selecciona un plazo --</option>
              {availableTerms.map(term => (
                <option key={term} value={term}>{term} quincenas</option>
              ))}
            </select>
            {errors.term && <p className="text-red-500 text-xs mt-1">{errors.term}</p>}
          </div>

          {/* Seguro (si aplica) */}
          {sourceData && sourceData.hasInsurance && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {sourceData.insuranceType === 'global' ? 'Seguro Global' : 'Fondo Protege'}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.insurance}
                onChange={handleInsuranceChange}
                placeholder="Ej: 50"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                  errors.insurance ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.insurance && <p className="text-red-500 text-xs mt-1">{errors.insurance}</p>}
              {sourceData.insuranceType === 'global' && (
                <p className="text-xs text-gray-500 mt-1">Se divide entre las {formData.term || 'X'} quincenas</p>
              )}
            </div>
          )}

          {/* Resumen */}
          {formData.source && formData.amount && formData.term && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-xs text-gray-600 mb-1">Pago por quincena:</p>
              <p className="text-lg font-bold text-blue-600">
                ${calculateFinalPayment(
                  getPaymentFromTable(formData.source, parseInt(formData.amount), parseInt(formData.term)),
                  formData.insurance ? parseFloat(formData.insurance) : 0,
                  parseInt(formData.term),
                  sourceData.insuranceType
                ).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
            >
              <Plus size={16} />
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoanForm
