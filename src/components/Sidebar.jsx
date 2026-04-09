import { Settings, DollarSign, X, CreditCard, Landmark } from 'lucide-react'

function Sidebar({ currentPage, onPageChange, isOpen, onToggle }) {
  const menuItems = [
    { id: 'vales', label: 'Vales', icon: DollarSign },
    { id: 'banco', label: 'Banco', icon: Landmark },
    { id: 'personal', label: 'Gestión Personal', icon: CreditCard },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
  ]

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-40"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={`${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed md:relative md:translate-x-0 w-64 bg-gray-900 text-white h-screen transition-transform duration-300 z-50 md:z-auto flex flex-col`}>
        
        {/* Header del Sidebar */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h1 className="text-xl font-bold">Vales & Préstamos</h1>
          <button 
            onClick={onToggle}
            className="md:hidden p-1 hover:bg-gray-800 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menú */}
        <nav className="flex-1 px-4 py-6">
          {menuItems.map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  currentPage === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <p className="text-xs text-gray-400">v1.0.0</p>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
