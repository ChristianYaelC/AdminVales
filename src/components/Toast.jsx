import { CheckCircle, XCircle, X } from 'lucide-react'

function Toast({ toasts, onDismiss }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg max-w-sm animate-toast-in ${
            toast.kind === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-white border-green-200 text-slate-800'
          }`}
        >
          {toast.kind === 'error' ? (
            <XCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
          ) : (
            <CheckCircle size={18} className="mt-0.5 shrink-0 text-green-500" />
          )}
          <span className="flex-1 text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            className="shrink-0 rounded p-0.5 hover:bg-black/5 transition-colors"
            aria-label="Cerrar"
          >
            <X size={14} className="text-slate-400" />
          </button>
        </div>
      ))}
    </div>
  )
}

export default Toast
