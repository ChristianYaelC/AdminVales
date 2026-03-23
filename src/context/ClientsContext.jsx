import { createContext, useState, useContext } from 'react'

const ClientsContext = createContext()

export function ClientsProvider({ children }) {
  // Clientes del apartado VALES (con múltiples fuentes)
  const [valesClients, setValesClients] = useState([])

  // Clientes del apartado BANCO (préstamos simples con registro por quincena)
  const [bancoClients, setBancoClients] = useState([])

  return (
    <ClientsContext.Provider value={{ 
      valesClients, 
      setValesClients,
      bancoClients,
      setBancoClients,
      // Para compatibilidad con código existente
      clients: valesClients,
      setClients: setValesClients
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
