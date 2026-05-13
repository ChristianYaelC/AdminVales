import { createContext, useState, useContext, useEffect } from 'react'

const ClientsContext = createContext()

function loadFromStorage(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function ClientsProvider({ children }) {
  const [valesClients, setValesClients] = useState(() => loadFromStorage('vales_clients'))
  const [bancoClients, setBancoClients] = useState(() => loadFromStorage('banco_clients'))
  const [personalServices, setPersonalServices] = useState(() => loadFromStorage('personal_services'))

  useEffect(() => {
    localStorage.setItem('vales_clients', JSON.stringify(valesClients))
  }, [valesClients])

  useEffect(() => {
    localStorage.setItem('banco_clients', JSON.stringify(bancoClients))
  }, [bancoClients])

  useEffect(() => {
    localStorage.setItem('personal_services', JSON.stringify(personalServices))
  }, [personalServices])

  // Función para validar que un folio sea único globalmente
  const isFolioUnique = (folio) => {
    if (!folio) return true
    return !valesClients.some(client =>
      client.loans && client.loans.some(loan => loan.folio === folio)
    )
  }

  // Función para obtener folios existentes de un cliente
  const getFoliosByClient = (clientId) => {
    const client = valesClients.find(c => c.id === clientId)
    return client && client.loans ? client.loans.map(l => l.folio).filter(Boolean) : []
  }

  // Función para buscar préstamo por folio globalmente
  const findLoanByFolio = (folio) => {
    for (const client of valesClients) {
      const loan = client.loans?.find(l => l.folio === folio)
      if (loan) return { client, loan }
    }
    return null
  }

  return (
    <ClientsContext.Provider value={{ 
      valesClients, 
      setValesClients,
      bancoClients,
      setBancoClients,
      personalServices,
      setPersonalServices,
      // Para compatibilidad con código existente
      clients: valesClients,
      setClients: setValesClients,
      // Nuevas funciones de validación y búsqueda
      isFolioUnique,
      getFoliosByClient,
      findLoanByFolio
    }}>
      {children}
    </ClientsContext.Provider>
  )
}

export function useClients() {
  const context = useContext(ClientsContext)
  if (!context) {
    throw new Error('useClients debe usarse dentro de ClientsProvider')
  }
  return context
}
