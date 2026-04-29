import { Settings, DollarSign, X, CreditCard, Landmark, PanelLeft, CircleUserRound } from 'lucide-react'

function Sidebar({ currentPage, onPageChange, isOpen, onToggle }) {
  const menuItems = [
    { id: 'vales', label: 'Vales', icon: DollarSign },
    { id: 'banco', label: 'Banco', icon: Landmark },
    { id: 'personal', label: 'Personal', icon: CreditCard },
    { id: 'configuracion', label: 'Config.', icon: Settings },
  ]

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/10 md:hidden z-40"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={`${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed top-0 left-0 md:relative md:translate-x-0 w-72 h-screen transition-transform duration-300 z-50 md:z-auto flex flex-col border-r border-slate-200 bg-white text-slate-900 shadow-sm`}>
        
        {/* Header del Sidebar */}
        <div className="border-b border-slate-200 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Sistema interno</p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight">Vales y Préstamos</h1>
              <p className="mt-1 text-sm text-slate-600">Operación rápida, ordenada y clara.</p>
            </div>
            {/* Icono removido: era decorativo y no funcionaba */}
          </div>
          <button 
            onClick={onToggle}
            className="absolute right-4 top-4 md:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-label="Cerrar menu lateral"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menú */}
        <nav className="flex-1 px-3 py-4">
          {menuItems.map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`group mb-1 w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                  currentPage === item.id
                    ? 'bg-blue-50 text-slate-900 ring-1 ring-blue-100 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${currentPage === item.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-700'}`}>
                  <Icon size={18} />
                </span>
                <span className="flex-1 text-left">{item.label}</span>
                {currentPage === item.id && <span className="h-2 w-2 rounded-full bg-blue-600" />}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
            <CircleUserRound size={18} className="text-slate-500" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Panel operativo</p>
              <p className="truncate text-sm text-slate-700">v1.0.0</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
