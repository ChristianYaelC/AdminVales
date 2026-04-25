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
          className="fixed inset-0 bg-black/40 backdrop-blur-[1px] md:hidden z-40"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={`${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed md:relative md:translate-x-0 w-64 bg-primary text-white h-screen transition-transform duration-300 z-50 md:z-auto flex flex-col`}>
        
        {/* Header del Sidebar */}
        <div className="p-6 border-b border-slate-600/60 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-300">Sistema interno</p>
            <h1 className="text-xl font-bold">Vales y Prestamos</h1>
          </div>
          <button 
            onClick={onToggle}
            className="md:hidden p-1 hover:bg-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-label="Cerrar menu lateral"
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                  currentPage === item.id
                    ? 'bg-secondary text-white shadow-md shadow-blue-900/20'
                    : 'text-slate-300 hover:bg-slate-700/80 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-600/60">
          <p className="text-xs text-slate-300">v1.0.0</p>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
