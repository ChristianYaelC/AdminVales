import { useState } from 'react'
import { X, Save, AlertCircle } from 'lucide-react'
import { formatPhoneInput, parsePhoneInput, validateName, validatePhone, validateAddress } from '../utils/validators'

function ClientEditModal({ client, title = 'Editar Cliente', onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: client?.name || '',
    phone: formatPhoneInput(client?.phone || ''),
    address: client?.address || '',
    workAddress: client?.workAddress || ''
  })
  const [errors, setErrors] = useState({})

  const handleNameChange = (e) => {
    const { value } = e.target
    const filtered = value.replace(/[0-9]/g, '')
    setFormData(prev => ({ ...prev, name: filtered }))
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: '' }))
    }
  }

  const handlePhoneChange = (e) => {
    const { value } = e.target
    setFormData(prev => ({ ...prev, phone: formatPhoneInput(value) }))
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: '' }))
    }
  }

  const handleAddressChange = (e) => {
    const { value } = e.target
    setFormData(prev => ({ ...prev, address: value }))
    if (errors.address) {
      setErrors(prev => ({ ...prev, address: '' }))
    }
  }

  const handleWorkAddressChange = (e) => {
    const { value } = e.target
    setFormData(prev => ({ ...prev, workAddress: value }))
  }

  const validateForm = () => {
    const newErrors = {}

    const nameValidation = validateName(formData.name)
    if (!nameValidation.valid) {
      newErrors.name = nameValidation.error
    }

    const phoneValidation = validatePhone(formData.phone)
    if (!phoneValidation.valid) {
      newErrors.phone = phoneValidation.error
    }

    const addressValidation = validateAddress(formData.address)
    if (!addressValidation.valid) {
      newErrors.address = addressValidation.error
    }

    if (formData.workAddress.trim() && formData.workAddress.trim().length < 5) {
      newErrors.workAddress = 'El domicilio de trabajo debe tener al menos 5 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validateForm()) return

    onSubmit({
      name: formData.name.trim(),
      phone: parsePhoneInput(formData.phone),
      address: formData.address.trim(),
      workAddress: formData.workAddress.trim()
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Cliente *</label>
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Número de Teléfono *</label>
            <input
              type="text"
              value={formData.phone}
              onChange={handlePhoneChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.phone && (
              <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                {errors.phone}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Domicilio de Casa *</label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={handleAddressChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors resize-none ${
                errors.address ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.address && (
              <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                {errors.address}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Domicilio de Trabajo (Opcional)</label>
            <textarea
              rows={2}
              value={formData.workAddress}
              onChange={handleWorkAddressChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors resize-none ${
                errors.workAddress ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.workAddress && (
              <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                {errors.workAddress}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Save size={18} />
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ClientEditModal
