import { useEffect, useMemo, useState } from 'react'
import { useClients } from '../context/ClientsContext'

const RECIPES_STORAGE_KEY = 'vales_recetas'

function ConfiguracionPage() {
  const { valesClients, bancoClients, personalServices } = useClients()
  const [recipeSummary, setRecipeSummary] = useState({ totalRecipes: 0, totalCategories: 0 })

  useEffect(() => {
    const raw = localStorage.getItem(RECIPES_STORAGE_KEY)
    if (!raw) return

    try {
      const parsedRecipes = JSON.parse(raw)
      const categories = new Set(
        (Array.isArray(parsedRecipes) ? parsedRecipes : [])
          .map((recipe) => recipe.category)
          .filter(Boolean)
      )
      setRecipeSummary({
        totalRecipes: Array.isArray(parsedRecipes) ? parsedRecipes.length : 0,
        totalCategories: categories.size
      })
    } catch {
      setRecipeSummary({ totalRecipes: 0, totalCategories: 0 })
    }
  }, [])

  const operationalSummary = useMemo(() => {
    const activeValesLoans = valesClients.reduce(
      (sum, client) => sum + (client.loans || []).filter(loan => loan.status === 'active').length,
      0
    )

    const activeBancoLoans = bancoClients.reduce(
      (sum, client) => sum + (client.loans || []).filter(loan => loan.status === 'active').length,
      0
    )

    const activeBancoInsurance = bancoClients.reduce(
      (sum, client) => sum + (client.insurance || []).filter(item => item.status === 'active').length,
      0
    )

    return {
      activeValesLoans,
      activeBancoProducts: activeBancoLoans + activeBancoInsurance,
      personalServicesCount: personalServices.length
    }
  }, [bancoClients, personalServices, valesClients])

  return (
    <div className="p-5 bg-gray-50 min-h-full page-enter">
      <div className="max-w-6xl mx-auto space-y-5">
        <div>
          <p className="panel-title mb-1">Control operativo</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Configuración</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="app-surface p-4 kpi-card">
            <p className="text-sm text-gray-600 mb-1">Préstamos con falta por pagar (Vales)</p>
            <p className="text-2xl font-bold text-gray-900">{operationalSummary.activeValesLoans}</p>
          </div>
          <div className="app-surface p-4 kpi-card">
            <p className="text-sm text-gray-600 mb-1">Productos con falta por pagar (Banco)</p>
            <p className="text-2xl font-bold text-gray-900">{operationalSummary.activeBancoProducts}</p>
          </div>
          <div className="app-surface p-4 kpi-card">
            <p className="text-sm text-gray-600 mb-1">Servicios personales</p>
            <p className="text-2xl font-bold text-gray-900">{operationalSummary.personalServicesCount}</p>
          </div>
          <div className="app-surface p-4 kpi-card">
            <p className="text-sm text-gray-600 mb-1">Recetas guardadas</p>
            <p className="text-2xl font-bold text-gray-900">{recipeSummary.totalRecipes}</p>
            <p className="mt-1 text-xs text-gray-500">{recipeSummary.totalCategories} categorías activas</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfiguracionPage
