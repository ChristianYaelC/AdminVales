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
    switch (currentPage) {
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
      <div className="flex h-screen overflow-hidden bg-white text-slate-900">
        <Sidebar
          currentPage={currentPage}
          onPageChange={(page) => {
            setCurrentPage(page)
            setSidebarOpen(false)
          }}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className="flex flex-1 flex-col overflow-hidden bg-white">
          <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8 md:hidden">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
              aria-label={sidebarOpen ? 'Cerrar menu lateral' : 'Abrir menu lateral'}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              <span>Menú</span>
            </button>
          </header>

          <main className="relative flex-1 overflow-y-auto overflow-x-hidden stable-scroll-y bg-white" style={{ scrollbarGutter: 'stable' }}>
            <div className="w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                {renderPage()}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ClientsProvider>
  )
}

export default App