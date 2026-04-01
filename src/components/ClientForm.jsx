import { useState } from 'react'
import { X, Plus, AlertCircle } from 'lucide-react'
import { formatPhoneInput, parsePhoneInput, validateName, validatePhone, validateAddress } from '../utils/validators'

function ClientForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    workAddress: ''
  })

  const [errors, setErrors] = useState({})

  const handleNameChange = (e) => {
    const { value } = e.target
    const filtered = value.replace(/[0-9]/g, '')
    setFormData({
      ...formData,
      name: filtered
    })
    if (errors.name) setErrors({ ...errors, name: '' })
  }

  const handlePhoneChange = (e) => {
    const { value } = e.target
    const formatted = formatPhoneInput(value)
    setFormData({
      ...formData,
      phone: formatted
    })
    if (errors.phone) setErrors({ ...errors, phone: '' })
  }

  const handleAddressChange = (e) => {
    setFormData({
      ...formData,
      address: e.target.value
    })
    if (errors.address) setErrors({ ...errors, address: '' })
  }

  const handleWorkAddressChange = (e) => {
    setFormData({
      ...formData,
      workAddress: e.target.value
    })
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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit({
        name: formData.name.trim(),
        phone: parsePhoneInput(formData.phone),
        address: formData.address.trim(),
        workAddress: formData.workAddress.trim()
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Agregar Cliente</h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Campo Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Cliente *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="Ej: Juan García López"
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

          {/* Campo Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Teléfono *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="(555) 123-4567"
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

          {/* Campo Domicilio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Domicilio de Casa *
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={handleAddressChange}
              placeholder="Ej: Calle Principal 123, Apt 4B"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
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

          {/* Campo Domicilio de Trabajo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Domicilio de Trabajo (Opcional)
            </label>
            <input
              type="text"
              value={formData.workAddress}
              onChange={handleWorkAddressChange}
              placeholder="Ej: Av. Industrial 200, Parque Industrial"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors border-gray-300 focus:ring-blue-500"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus size={18} />
              Crear Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ClientForm
