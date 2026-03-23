import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { ClientsProvider } from './context/ClientsContext'
import Sidebar from './components/Sidebar'
import ValesPage from './pages/ValesPage'
import BancoPage from './pages/BancoPage'
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
          <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">Vales y Préstamos</h1>
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Contenido principal */}
          <main className="flex-1 overflow-auto">
            {renderPage()}
          </main>
        </div>
      </div>
    </ClientsProvider>
  )
}

export default App
