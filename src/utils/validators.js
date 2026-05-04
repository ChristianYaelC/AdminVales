// Funciones de validación y formateo

export const formatPhoneInput = (value) => {
  // Solo permite números
  let cleaned = value.replace(/\D/g, '')
  
  // Limita a 10 dígitos
  cleaned = cleaned.slice(0, 10)
  
  // Formatea como (XXX) XXX-XXXX
  if (cleaned.length === 0) return ''
  if (cleaned.length <= 3) return cleaned
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
}

export const parsePhoneInput = (formatted) => {
  // Extrae solo números del teléfono formateado
  return formatted.replace(/\D/g, '')
}

export const formatCurrencyInput = (value) => {
  // Solo permite números y punto
  const cleaned = value.replace(/[^\d.]/g, '')
  
  // Evita múltiples puntos
  const parts = cleaned.split('.')
  if (parts.length > 2) {
    return parts[0] + '.' + parts[1]
  }
  
  return cleaned
}

export const validateName = (name) => {
  if (!name || !name.trim()) {
    return { valid: false, error: 'El nombre es requerido' }
  }
  if (/\d/.test(name)) {
    return { valid: false, error: 'El nombre no puede contener números' }
  }
  if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ.,'\-\s]+$/.test(name.trim())) {
    return { valid: false, error: 'El nombre solo puede contener letras y signos básicos' }
  }
  if (name.trim().length < 2) {
    return { valid: false, error: 'El nombre debe tener al menos 2 caracteres' }
  }
  if (name.trim().length > 120) {
    return { valid: false, error: 'El nombre no puede exceder 120 caracteres' }
  }
  return { valid: true, error: '' }
}

export const validatePhone = (phone) => {
  const cleaned = parsePhoneInput(phone)
  if (!cleaned) {
    return { valid: false, error: 'El teléfono es requerido' }
  }
  if (cleaned.length < 10) {
    return { valid: false, error: 'El teléfono debe tener 10 dígitos' }
  }
  return { valid: true, error: '' }
}

export const validateAddress = (address) => {
  if (!address || !address.trim()) {
    return { valid: false, error: 'El domicilio es requerido' }
  }
  if (address.trim().length < 5) {
    return { valid: false, error: 'El domicilio debe tener al menos 5 caracteres' }
  }
  if (address.trim().length > 200) {
    return { valid: false, error: 'El domicilio no puede exceder 200 caracteres' }
  }
  return { valid: true, error: '' }
}

export const normalizeFolio = (folio) => {
  if (folio === undefined || folio === null) return ''
  return String(folio)
    .toUpperCase()
    .replace(/\s+/g, '-')
    .replace(/[^A-Z0-9-_/]/g, '')
    .replace(/-+/g, '-')
    .slice(0, 40)
}

export const validateFolio = (folio) => {
  const normalized = normalizeFolio(folio)

  if (!normalized) {
    return { valid: false, error: 'El folio es requerido' }
  }

  if (normalized.length < 3) {
    return { valid: false, error: 'El folio debe tener al menos 3 caracteres' }
  }

  if (!/^[A-Z0-9][A-Z0-9-_/]*$/.test(normalized)) {
    return { valid: false, error: 'El folio contiene caracteres no válidos' }
  }

  return { valid: true, error: '' }
}

export const validateAmount = (amount, label = 'monto') => {
  if (!amount && amount !== 0) {
    return { valid: false, error: `El ${label} es requerido` }
  }
  const numAmount = parseFloat(amount)
  if (isNaN(numAmount)) {
    return { valid: false, error: `El ${label} debe ser un número válido` }
  }
  if (numAmount <= 0) {
    return { valid: false, error: `El ${label} debe ser mayor a 0` }
  }
  return { valid: true, error: '' }
}

export const validateTerm = (term, label = 'plazo') => {
  if (!term && term !== 0) {
    return { valid: false, error: `El ${label} es requerido` }
  }
  const numTerm = parseInt(term, 10)
  if (isNaN(numTerm)) {
    return { valid: false, error: `El ${label} debe ser un número válido` }
  }
  if (numTerm <= 0) {
    return { valid: false, error: `El ${label} debe ser mayor a 0` }
  }
  return { valid: true, error: '' }
}

export const validateDueDay = (day) => {
  if (!day && day !== 0) {
    return { valid: false, error: 'El día de pago es requerido' }
  }
  const numDay = parseInt(day, 10)
  if (isNaN(numDay)) {
    return { valid: false, error: 'El día debe ser un número válido' }
  }
  if (numDay < 1 || numDay > 31) {
    return { valid: false, error: 'El día debe estar entre 1 y 31' }
  }
  return { valid: true, error: '' }
}

export const validateFrequencyDays = (days) => {
  if (!days && days !== 0) {
    return { valid: false, error: 'Los días son requeridos' }
  }
  const numDays = parseInt(days, 10)
  if (isNaN(numDays)) {
    return { valid: false, error: 'Los días deben ser un número válido' }
  }
  if (numDays < 1) {
    return { valid: false, error: 'Los días debe ser mayor a 0' }
  }
  return { valid: true, error: '' }
}
