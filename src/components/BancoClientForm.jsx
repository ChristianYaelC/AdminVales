import { useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { formatPhoneInput, parsePhoneInput, validateName, validatePhone, validateAddress } from '../utils/validators'

export default function BancoClientForm({ valesClients = [], onSubmit, onCancel }) {
  const [clientMode, setClientMode] = useState('new')
  const [existingClientSearch, setExistingClientSearch] = useState('')
  const [selectedExistingClientId, setSelectedExistingClientId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  })

  const [errors, setErrors] = useState({})

  const handleNameChange = (e) => {
    const { value } = e.target
    // Solo permite letras, espacios y algunos caracteres especiales
    const filtered = value.replace(/[0-9]/g, '')
    setFormData(prev => ({
      ...prev,
      name: filtered
    }))
    if (errors.name) {
      setErrors(prev => ({
        ...prev,
        name: ''
      }))
    }
  }

  const handlePhoneChange = (e) => {
    const { value } = e.target
    const formatted = formatPhoneInput(value)
    setFormData(prev => ({
      ...prev,
      phone: formatted
    }))
    if (errors.phone) {
      setErrors(prev => ({
        ...prev,
        phone: ''
      }))
    }
  }

  const handleAddressChange = (e) => {
    const { value } = e.target
    setFormData(prev => ({
      ...prev,
      address: value
    }))
    if (errors.address) {
      setErrors(prev => ({
        ...prev,
        address: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (clientMode === 'existing' && !selectedExistingClientId) {
      newErrors.existingClient = 'Selecciona un cliente existente o cambia a cliente nuevo'
    } else if (clientMode === 'new') {
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
        valesClientId: selectedExistingClientId,
        loans: []
      })
      setFormData({ name: '', phone: '', address: '' })
      setExistingClientSearch('')
      setSelectedExistingClientId(null)
    }
  }

  const filteredExistingClients = valesClients.filter((client) => {
    const term = existingClientSearch.toLowerCase().trim()
    if (!term) return true

    const inName = client.name?.toLowerCase().includes(term)
    const inPhone = client.phone?.toLowerCase().includes(term)
    return inName || inPhone
  })

  const handleSelectExistingClient = (client) => {
    setSelectedExistingClientId(client.id)
    setExistingClientSearch(client.name)
    setFormData({
      name: client.name || '',
      phone: formatPhoneInput(client.phone || ''),
      address: client.address || ''
    })

    if (errors.existingClient) {
      setErrors((prev) => ({ ...prev, existingClient: '' }))
    }
  }

  const switchToMode = (mode) => {
    setClientMode(mode)
    if (mode === 'new') {
      setSelectedExistingClientId(null)
      setExistingClientSearch('')
      setFormData({ name: '', phone: '', address: '' })
    }
    if (errors.existingClient) {
      setErrors((prev) => ({ ...prev, existingClient: '' }))
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Nuevo Cliente - Banco</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => switchToMode('new')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                clientMode === 'new'
                  ? 'bg-blue-600 text-white'
                  : 'bg-transparent text-gray-700 hover:bg-gray-200'
              }`}
            >
              Crear Cliente Nuevo
            </button>
            <button
              type="button"
              onClick={() => switchToMode('existing')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                clientMode === 'existing'
                  ? 'bg-blue-600 text-white'
                  : 'bg-transparent text-gray-700 hover:bg-gray-200'
              }`}
            >
              Usar Cliente Existente
            </button>
          </div>

          {clientMode === 'existing' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar cliente de Vales
                </label>
                <input
                  type="text"
                  value={existingClientSearch}
                  onChange={(e) => {
                    setExistingClientSearch(e.target.value)
                    setSelectedExistingClientId(null)
                  }}
                  placeholder="Escribe nombre o teléfono..."
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.existingClient ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.existingClient && (
                  <p className="text-red-600 text-sm mt-1">{errors.existingClient}</p>
                )}
              </div>

              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                {filteredExistingClients.length > 0 ? (
                  filteredExistingClients.slice(0, 8).map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => handleSelectExistingClient(client)}
                      className={`w-full text-left px-3 py-2 border-b border-gray-100 last:border-b-0 hover:bg-blue-50 ${
                        selectedExistingClientId === client.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900">{client.name}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Tel: {client.phone || '—'}
                      </p>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-3 text-sm text-gray-500">No hay coincidencias en clientes de Vales</p>
                )}
              </div>
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Cliente *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              readOnly={clientMode === 'existing'}
              placeholder="Juan García López"
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

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono *
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={handlePhoneChange}
              readOnly={clientMode === 'existing'}
              placeholder="(442) 123-4567"
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

          {/* Domicilio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Domicilio *
            </label>
            <textarea
              value={formData.address}
              onChange={handleAddressChange}
              readOnly={clientMode === 'existing'}
              placeholder="Calle, número, colonia, ciudad"
              rows={3}
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

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-gray-600">
              {clientMode === 'existing'
                ? 'Selecciona un cliente de Vales para autocompletar sus datos y trabajar también en Banco.'
                : 'Crea un cliente nuevo en Banco con datos manuales para registrar sus préstamos mensuales.'}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Agregar Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
