import { createContext, useState, useContext } from 'react'

const ClientsContext = createContext()

export function ClientsProvider({ children }) {
  const [clients, setClients] = useState([
    {
      id: 1,
      name: 'Juan García López',
      sources: {
        captavale: true,
        salevale: false,
        dportenis: true,
        valefectivo: false
      },
      loans: []
    },
    {
      id: 2,
      name: 'María Rodríguez',
      sources: {
        captavale: false,
        salevale: true,
        dportenis: false,
        valefectivo: true
      },
      loans: []
    }
  ])

  return (
    <ClientsContext.Provider value={{ clients, setClients }}>
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
