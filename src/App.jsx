import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { ClientsProvider } from './context/ClientsContext'
import Sidebar from './components/Sidebar'
import ValesPage from './pages/ValesPage'
import BancoPage from './pages/BancoPage'
import PersonalPage from './pages/PersonalPage'
import ConfiguracionPage from './pages/ConfiguracionPage'

function App() {
  const [currentPage, setCurrentPage] = useState('vales')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const renderPage = () => {
    switch(currentPage) {
      case 'vales':
        return <ValesPage />
      case 'banco':
        return <BancoPage />
      case 'personal':
        return <PersonalPage />
      case 'configuracion':
        return <ConfiguracionPage />
      default:
        return <ValesPage />
    }
  }

  return (
    <ClientsProvider>
      <div className="flex h-screen bg-gray-100">
        <Sidebar 
          currentPage={currentPage} 
          onPageChange={(page) => {
            setCurrentPage(page)
            setSidebarOpen(false)
          }}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header para móvil */}
          <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Panel operativo</p>
              <h1 className="text-lg font-bold text-primary">Vales y Prestamos</h1>
            </div>
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
              aria-label={sidebarOpen ? 'Cerrar menu lateral' : 'Abrir menu lateral'}
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Contenido principal */}
          <main
            className="flex-1 overflow-y-scroll overflow-x-hidden bg-gradient-to-b from-gray-100 via-gray-100 to-blue-50/40"
            style={{ scrollbarGutter: 'stable' }}
          >
            {renderPage()}
          </main>
        </div>
      </div>
    </ClientsProvider>
  )
}

export default App
