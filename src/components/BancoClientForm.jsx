import { useState } from 'react'
import { X } from 'lucide-react'

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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Limpiar error cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (clientMode === 'existing' && !selectedExistingClientId) {
      newErrors.existingClient = 'Selecciona un cliente existente o cambia a cliente nuevo'
    }
    
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
      onSubmit({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
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
      phone: client.phone || '',
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
              name="name"
              value={formData.name}
              onChange={handleChange}
              readOnly={clientMode === 'existing'}
              placeholder="Juan García López"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono *
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              readOnly={clientMode === 'existing'}
              placeholder="4421234567"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.phone && (
              <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Domicilio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Domicilio *
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              readOnly={clientMode === 'existing'}
              placeholder="Calle, número, colonia, ciudad"
              rows={3}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                errors.address ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.address && (
              <p className="text-red-600 text-sm mt-1">{errors.address}</p>
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
