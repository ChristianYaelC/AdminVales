import { useState } from 'react'
import { X, Plus } from 'lucide-react'

function ClientForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  })

  const [errors, setErrors] = useState({})

  const handleNameChange = (e) => {
    setFormData({
      ...formData,
      name: e.target.value
    })
    if (errors.name) setErrors({ ...errors, name: '' })
  }

  const handlePhoneChange = (e) => {
    setFormData({
      ...formData,
      phone: e.target.value
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

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido'
    }
    if (!formData.address.trim()) {
      newErrors.address = 'El domicilio es requerido'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
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
              Nombre del Cliente
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="Ej: Juan García López"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Campo Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Teléfono
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="Ej: 555-1234567"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
          </div>

          {/* Campo Domicilio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Domicilio
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={handleAddressChange}
              placeholder="Ej: Calle Principal 123, Apt 4B"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.address ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
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
