import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Edit2, FileDown, FileText, Plus, Search, Trash2 } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import ConfirmModal from '../components/ConfirmModal'
import { useToast } from '../context/ToastContext'
import { deleteRecipe, loadRecipes, saveRecipe } from '../services/recipesSupabaseService'
import { exportCookbookPDF, exportCookbookWord, exportSingleRecipePDF, exportSingleRecipeWord } from '../recipeExport'

const emptyRecipeForm = {
  title: '',
  category: '',
  timeMinutes: 45,
  servings: '',
  ingredients: [
    { id: 'ing-1', name: '', quantity: '', unit: 'g', cost: '', note: '' }
  ],
  steps: [
    { id: 'step-1', text: '' }
  ],
  notes: ''
}

const normalizeText = (value = '') => value.trim()

const sanitizeNumberInput = (value, { allowDecimal = false } = {}) => {
  const raw = normalizeText(value)
  const cleaned = allowDecimal
    ? raw.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')
    : raw.replace(/\D/g, '')

  return cleaned
}

const ensureId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

const normalizeIngredient = (ingredient, index = 0) => ({
  id: ingredient.id || ensureId(`ing-${index}`),
  name: normalizeText(ingredient.name || ''),
  quantity: normalizeText(ingredient.quantity || ''),
  unit: normalizeText(ingredient.unit || ''),
  cost: normalizeText(ingredient.cost || ''),
  note: normalizeText(ingredient.note || '')
})

const normalizeRecipe = (recipe) => {
  const rawIngredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients
    : Array.isArray(recipe.materials)
      ? recipe.materials.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          cost: '',
          note: ''
        }))
      : []

  return {
    id: recipe.id || ensureId('recipe'),
    title: normalizeText(recipe.title || ''),
    category: normalizeText(recipe.category || ''),
    timeMinutes: Number(recipe.timeMinutes) || '',
    servings: Number(recipe.servings) || '',
    ingredients: rawIngredients.map((item, index) => normalizeIngredient(item, index)),
    steps: Array.isArray(recipe.steps)
      ? recipe.steps.map((step, index) => ({
          id: step.id || ensureId(`step-${index}`),
          text: normalizeText(step.text || '')
        }))
      : [],
    notes: normalizeText(recipe.notes || '')
  }
}

const normalizeRecipeForExport = (recipe) => ({
  ...recipe,
  cookTime: recipe.cookTime || (recipe.timeMinutes ? `${recipe.timeMinutes} min` : ''),
  tips: recipe.tips || recipe.notes || ''
})

function RecetasPage() {
  const [recipes, setRecipes] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRecipeId, setSelectedRecipeId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ ...emptyRecipeForm })
  const [isHydrated, setIsHydrated] = useState(false)
  const [formErrors, setFormErrors] = useState([])
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [recipeToDelete, setRecipeToDelete] = useState(null)
  const { showToast } = useToast()

  useEffect(() => {
    loadRecipes()
      .then((loadedRecipes) => {
        const normalized = Array.isArray(loadedRecipes) ? loadedRecipes.map(normalizeRecipe) : []
        setRecipes(normalized)
        setSelectedRecipeId(normalized[0]?.id || null)
      })
      .catch((error) => {
        console.warn('Error cargando recetas desde Supabase:', error)
        setRecipes([])
        setSelectedRecipeId(null)
        showToast('No se pudieron cargar las recetas desde Supabase', 'error')
      })
      .finally(() => setIsHydrated(true))
  }, [])

  const filteredRecipes = useMemo(() => {
    const term = normalizeText(searchTerm).toLowerCase()
    if (!term) return recipes
    return recipes.filter((recipe) => {
      return recipe.title.toLowerCase().includes(term) || recipe.category.toLowerCase().includes(term)
    })
  }, [recipes, searchTerm])

  const selectedRecipe = recipes.find((recipe) => recipe.id === selectedRecipeId) || null

  const resetForm = () => {
    setFormData({ ...emptyRecipeForm })
    setEditingId(null)
    setFormErrors([])
  }

  const openNewForm = () => {
    resetForm()
    setSelectedRecipeId(null)
    setShowForm(true)
  }

  const openEditForm = (recipe) => {
    setFormErrors([])
    setFormData({
      title: recipe.title || '',
      category: recipe.category || '',
      timeMinutes: recipe.timeMinutes || '',
      servings: recipe.servings || '',
      ingredients: recipe.ingredients.map((item) => ({ ...item })),
      steps: recipe.steps.map((step) => ({ ...step })),
      notes: recipe.notes || ''
    })
    setEditingId(recipe.id)
    setShowForm(true)
  }

  const handleIngredientChange = (id, field, value) => {
    const nextValue = field === 'quantity'
      ? sanitizeNumberInput(value)
      : field === 'cost'
        ? sanitizeNumberInput(value, { allowDecimal: true })
        : value

    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((ingredient) =>
        ingredient.id === id ? { ...ingredient, [field]: nextValue } : ingredient
      )
    }))
  }

  const handleStepChange = (id, value) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.map((step) =>
        step.id === id ? { ...step, text: value } : step
      )
    }))
  }

  const addIngredient = () => {
    setFormData((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        { id: ensureId('ing'), name: '', quantity: '', unit: 'g', cost: '', note: '' }
      ]
    }))
  }

  const removeIngredient = (id) => {
    setFormData((prev) => {
      if (prev.ingredients.length <= 1) return prev

      return {
        ...prev,
        ingredients: prev.ingredients.filter((ingredient) => ingredient.id !== id)
      }
    })
  }

  const addStep = () => {
    setFormData((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        { id: ensureId('step'), text: '' }
      ]
    }))
  }

  const removeStep = (id) => {
    setFormData((prev) => {
      if (prev.steps.length <= 1) return prev

      return {
        ...prev,
        steps: prev.steps.filter((step) => step.id !== id)
      }
    })
  }

  const validateRecipePayload = (recipePayload) => {
    const nextErrors = []

    if (!recipePayload.title || recipePayload.title.length < 2) {
      nextErrors.push('El título debe tener al menos 2 caracteres.')
    }

    if (recipePayload.title.length > 120) {
      nextErrors.push('El título no puede exceder 120 caracteres.')
    }

    if (recipePayload.category && recipePayload.category.length > 80) {
      nextErrors.push('La categoría no puede exceder 80 caracteres.')
    }

    if (recipePayload.timeMinutes !== '' && (!Number.isInteger(recipePayload.timeMinutes) || recipePayload.timeMinutes < 1 || recipePayload.timeMinutes > 1440)) {
      nextErrors.push('El tiempo estimado debe ser un número entero entre 1 y 1440 minutos.')
    }

    if (recipePayload.servings !== '' && (!Number.isInteger(recipePayload.servings) || recipePayload.servings < 1 || recipePayload.servings > 1000)) {
      nextErrors.push('Las raciones deben ser un número entero entre 1 y 1000.')
    }

    const validIngredients = recipePayload.ingredients.filter((item) => item.name)
    if (validIngredients.length === 0) {
      nextErrors.push('Agrega al menos un ingrediente con nombre.')
    }

    const invalidCosts = recipePayload.ingredients.some((item) => item.cost && Number.isNaN(Number(item.cost)))
    if (invalidCosts) {
      nextErrors.push('Los costos deben ser numéricos si se capturan.')
    }

    const validSteps = recipePayload.steps.filter((step) => step.text)
    if (validSteps.length === 0) {
      nextErrors.push('Agrega al menos un paso en el proceso.')
    }

    return nextErrors
  }

  const handleSaveRecipe = (event) => {
    event.preventDefault()

    const recipePayload = normalizeRecipe({
      id: editingId || ensureId('recipe'),
      title: formData.title,
      category: formData.category,
      timeMinutes: formData.timeMinutes,
      servings: formData.servings,
      ingredients: formData.ingredients,
      steps: formData.steps,
      notes: formData.notes
    })

    const nextErrors = validateRecipePayload(recipePayload)
    if (nextErrors.length) {
      setFormErrors(nextErrors)
      return
    }

    saveRecipe(recipePayload, editingId)
      .then((savedRecipe) => {
        setFormErrors([])
        setRecipes((prev) => {
          const nextRecipes = editingId
            ? prev.map((recipe) => (recipe.id === editingId ? normalizeRecipe(savedRecipe) : recipe))
            : [normalizeRecipe(savedRecipe), ...prev]
          return nextRecipes
        })
        setSelectedRecipeId(savedRecipe.id)
        setShowForm(false)
        setEditingId(null)
        showToast(editingId ? 'Receta actualizada en Supabase' : 'Receta guardada en Supabase')
      })
      .catch((error) => {
        console.warn('Error guardando receta en Supabase:', error)
        setFormErrors([error?.message || 'No se pudo guardar la receta en Supabase'])
        showToast('No se pudo guardar la receta en Supabase', 'error')
      })
  }

  const requestDeleteRecipe = (recipe) => {
    setRecipeToDelete(recipe)
    setIsConfirmModalOpen(true)
  }

  const handleConfirmDeleteRecipe = () => {
    if (!recipeToDelete) return

    deleteRecipe(recipeToDelete.id)
      .then(() => {
        const remaining = recipes.filter((recipe) => recipe.id !== recipeToDelete.id)
        setRecipes(remaining)
        if (selectedRecipeId === recipeToDelete.id) {
          setSelectedRecipeId(remaining[0]?.id || null)
        }
        showToast('Receta eliminada de Supabase')
      })
      .catch((error) => {
        console.warn('Error eliminando receta en Supabase:', error)
        showToast('No se pudo eliminar la receta en Supabase', 'error')
      })
      .finally(() => {
        setIsConfirmModalOpen(false)
        setRecipeToDelete(null)
      })
  }

  const handleDownloadRecipeWord = (recipe) => {
    exportSingleRecipeWord(normalizeRecipeForExport(recipe))
  }

  const handleDownloadAllWord = () => {
    if (!recipes.length) return
    exportCookbookWord(recipes.map(normalizeRecipeForExport))
  }

  const handleDownloadRecipePdf = (recipe) => {
    console.log('handleDownloadRecipePdf invoked for', recipe.title)
    try { if (typeof window !== 'undefined') window.__lastPdfExport = { invoked: true, when: Date.now(), title: recipe.title } } catch (e) {}
    exportSingleRecipePDF(normalizeRecipeForExport(recipe)).catch((err) => { console.error('exportSingleRecipePDF error', err); try { if (typeof window !== 'undefined') window.__lastPdfExport = { error: String(err) } } catch (e) {} ; alert('Error generando PDF. Revisa la consola.') })
  }

  const handleDownloadAllPdf = () => {
    if (!recipes.length) return
    try { if (typeof window !== 'undefined') window.__lastPdfExport = { invokedCookbook: true, when: Date.now(), count: recipes.length } } catch (e) {}
    exportCookbookPDF(recipes.map(normalizeRecipeForExport)).catch((err) => { console.error('exportCookbookPDF error', err); try { if (typeof window !== 'undefined') window.__lastPdfExport = { error: String(err) } } catch (e) {} ; alert('Error generando PDF del recetario. Revisa la consola.') })
  }

  return (
    <div className="p-5 bg-gray-50 min-h-full page-enter">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="panel-title mb-1">Gestor culinario</p>
            <div className="flex flex-wrap items-end gap-3">
              <h1 className="text-3xl font-bold text-gray-900 leading-none">Recetas</h1>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm">
                {recipes.length} recetas
              </span>
            </div>
          </div>
        </div>

        <div className="app-surface p-5 sm:p-5 mb-6">
          <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
            <div className="flex-1 max-w-2xl">
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar receta</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Por titulo o categoria"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition shadow-sm"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 xl:gap-4">
              <button onClick={openNewForm} className="btn-primary">
                <Plus size={18} />
                <span>Nueva receta</span>
              </button>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="panel-title mb-2">Exportar recetario</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadAllWord}
                    disabled={!recipes.length}
                    className="btn-primary px-3 py-2 text-xs"
                    title="Descargar en formato Word .docx"
                  >
                    <FileText size={14} />
                    Word
                  </button>
                  <button
                    onClick={handleDownloadAllPdf}
                    disabled={!recipes.length}
                    className="btn-danger px-3 py-2 text-xs"
                    title="Descargar en formato PDF"
                  >
                    <FileDown size={14} />
                    PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5">
          <div className="space-y-4">
            {filteredRecipes.length === 0 ? (
              <EmptyState
                title="No hay recetas registradas"
                description="Agrega la primera receta para verla en esta lista."
              />
            ) : (
              filteredRecipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => setSelectedRecipeId(recipe.id)}
                  className={`w-full text-left app-surface px-4 py-3 transition ${selectedRecipeId === recipe.id ? 'border-blue-300 bg-blue-50' : 'hover:border-blue-200'}`}
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{recipe.title || 'Receta sin titulo'}</p>
                    <p className="text-xs text-gray-500 mt-1">{recipe.category || 'Sin categoria'} · {[recipe.timeMinutes ? `${recipe.timeMinutes} min` : null, recipe.servings ? `Raciones: ${recipe.servings}` : null].filter(Boolean).join(' · ') || 'Tiempo libre'}</p>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                    <span>{recipe.ingredients.length} ingredientes</span>
                    <span>{recipe.steps.length} pasos</span>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="space-y-5 min-w-0">
            {showForm ? (
              <div className="app-surface p-5 sm:p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="panel-title mb-1">Crear nueva</p>
                    <h2 className="text-xl font-bold text-gray-900 mt-1">{editingId ? 'Editar receta' : 'Nueva receta'}</h2>
                    <p className="mt-3 text-sm text-gray-600">Los cambios se guardan en Supabase.</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowForm(false)
                      resetForm()
                    }}
                    className="text-gray-400 hover:text-gray-600 font-medium text-lg"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveRecipe} className="space-y-5">
                  {formErrors.length > 0 && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      <p className="font-semibold mb-2 inline-flex items-center gap-2">
                        <AlertCircle size={16} />
                        Corrige lo siguiente para guardar:
                      </p>
                      <ul className="list-disc pl-5 space-y-1">
                        {formErrors.map((error) => (
                          <li key={error}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-7">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Titulo de la receta</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                        placeholder="Ej. Alcachofas con jamón"
                        required
                      />
                    </div>
                    <div className="lg:col-span-5">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Categoria</label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                        placeholder="Ej. Verduras, Postre"
                      />
                    </div>
                    <div className="lg:col-span-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Tiempo estimado (min)</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.timeMinutes}
                        onChange={(event) => setFormData((prev) => ({ ...prev, timeMinutes: event.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                      />
                    </div>
                    <div className="lg:col-span-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Raciones (opcional)</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.servings}
                        onChange={(event) => setFormData((prev) => ({ ...prev, servings: event.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                        placeholder="Ej. 4"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-900">Ingredientes</h3>
                      <button
                        type="button"
                        onClick={addIngredient}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <Plus size={16} />
                        Agregar ingrediente
                      </button>
                    </div>

                    <div className="space-y-3">
                      {formData.ingredients.map((ingredient) => (
                        <div key={ingredient.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[2fr_0.7fr_0.7fr_0.8fr_28px] gap-3">
                            <div className="space-y-2">
                              <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 leading-none">Ingrediente</label>
                              <input
                                type="text"
                                value={ingredient.name}
                                onChange={(event) => handleIngredientChange(ingredient.id, 'name', event.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition bg-white"
                                placeholder="Ingrediente"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 leading-none">Cant.</label>
                              <input
                                type="text"
                                value={ingredient.quantity}
                                onChange={(event) => handleIngredientChange(ingredient.id, 'quantity', event.target.value)}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition bg-white"
                                placeholder="Cant."
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 leading-none">Unidad</label>
                              <input
                                type="text"
                                value={ingredient.unit}
                                onChange={(event) => handleIngredientChange(ingredient.id, 'unit', event.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition bg-white"
                                placeholder="Unidad"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 leading-none">Costo</label>
                              <input
                                type="text"
                                value={ingredient.cost}
                                onChange={(event) => handleIngredientChange(ingredient.id, 'cost', event.target.value)}
                                inputMode="decimal"
                                pattern="[0-9.]*"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition bg-white"
                                placeholder="Costo"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeIngredient(ingredient.id)}
                              className="inline-flex items-center justify-center h-10 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition self-start xl:self-end xl:mt-6"
                              aria-label="Eliminar ingrediente"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="mt-3 grid grid-cols-1 xl:grid-cols-[1fr_28px] gap-3 items-start">
                            <div>
                              <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 mb-2">Nota (opcional)</label>
                              <textarea
                                value={ingredient.note}
                                onChange={(event) => handleIngredientChange(ingredient.id, 'note', event.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm min-h-[72px] placeholder-gray-400 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition resize-y bg-white leading-6"
                                placeholder="Por ejemplo: añadir al final, usar muy frío, reposar 10 minutos..."
                              />
                            </div>
                            <div className="hidden xl:block" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-gray-500">Costo y nota son opcionales. Útiles para compras o recordatorios.</p>
                  </div>

                  <div className="border-t border-slate-200 pt-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-900">Proceso</h3>
                      <button
                        type="button"
                        onClick={addStep}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <Plus size={16} />
                        Agregar paso
                      </button>
                    </div>

                    <div className="space-y-3">
                      {formData.steps.map((step, index) => (
                        <div key={step.id} className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-1">{index + 1}</div>
                          <textarea
                            value={step.text}
                            onChange={(event) => handleStepChange(step.id, event.target.value)}
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm min-h-[96px] placeholder-gray-400 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition resize-y leading-6 bg-white"
                            placeholder="Describe el paso"
                          />
                          <button
                            type="button"
                            onClick={() => removeStep(step.id)}
                            className="inline-flex items-center justify-center h-10 w-10 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition mt-1 flex-shrink-0"
                            aria-label="Eliminar paso"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-5">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Recomendaciones y notas</label>
                    <textarea
                      value={formData.notes}
                      onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm min-h-[140px] placeholder-gray-400 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition resize-y leading-6 bg-white"
                      placeholder="Consejos, variaciones, observaciones, trucos..."
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false)
                        resetForm()
                      }}
                      className="btn-neutral"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                    >
                      {editingId ? 'Guardar cambios' : 'Crear receta'}
                    </button>
                  </div>
                </form>
              </div>
            ) : selectedRecipe ? (
              <div className="space-y-5">
                <div className="app-surface p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="panel-title mb-1">Receta seleccionada</p>
                      <h2 className="text-2xl font-semibold text-gray-900 mt-1">{selectedRecipe.title || 'Receta sin titulo'}</h2>
                      <p className="text-sm text-gray-500 mt-2">{selectedRecipe.category || 'Sin categoria'} · {[selectedRecipe.timeMinutes ? `${selectedRecipe.timeMinutes} min` : null, selectedRecipe.servings ? `Raciones: ${selectedRecipe.servings}` : null].filter(Boolean).join(' · ') || 'Tiempo libre'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditForm(selectedRecipe)}
                        className="btn-primary px-3 py-2 text-sm"
                      >
                        <Edit2 size={16} />
                        Editar
                      </button>
                      <button
                        onClick={() => requestDeleteRecipe(selectedRecipe)}
                        className="btn-danger px-3 py-2 text-sm"
                      >
                        <Trash2 size={16} />
                        Eliminar
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                      <p className="panel-title mb-1">Ingredientes</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedRecipe.ingredients.length}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                      <p className="panel-title mb-1">Pasos</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedRecipe.steps.length}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                      <p className="panel-title mb-1">Tiempo</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedRecipe.timeMinutes ? `${selectedRecipe.timeMinutes} min` : 'Libre'}</p>
                    </div>
                  </div>
                </div>

                <div className="app-surface p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Ingredientes</h3>
                  </div>

                  {selectedRecipe.ingredients.length === 0 ? (
                    <EmptyState title="Sin ingredientes" description="Agrega ingredientes para ver el detalle." />
                  ) : (
                    <div className="overflow-x-auto stable-scroll-x">
                      <table className="min-w-full text-sm">
                        <thead className="text-xs uppercase text-gray-500 border-b">
                          <tr>
                            <th className="py-2 text-left">Cantidad</th>
                            <th className="py-2 text-left">Unidad</th>
                            <th className="py-2 text-left">Ingrediente</th>
                            <th className="py-2 text-left">Costo</th>
                            <th className="py-2 text-left">Nota</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {selectedRecipe.ingredients.map((item) => (
                            <tr key={item.id} className="text-gray-700">
                              <td className="py-2 pr-3">{item.quantity || '-'}</td>
                              <td className="py-2 pr-3">{item.unit || '-'}</td>
                              <td className="py-2 pr-3 font-medium text-gray-900">{item.name || 'Ingrediente'}</td>
                              <td className="py-2 pr-3">{item.cost || '-'}</td>
                              <td className="py-2 pr-3">{item.note || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="app-surface p-5 sm:p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Proceso</h3>
                  {selectedRecipe.steps.length === 0 ? (
                    <EmptyState title="Sin pasos" description="Agrega el proceso para completar la receta." />
                  ) : (
                    <ol className="space-y-3">
                      {selectedRecipe.steps.map((step, index) => (
                        <li key={step.id} className="flex gap-3">
                          <div className="h-7 w-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-semibold">
                            {index + 1}
                          </div>
                          <p className="text-sm text-gray-700">{step.text || '-'}</p>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>

                {selectedRecipe.notes && (
                  <div className="app-surface p-5 sm:p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Recomendaciones</h3>
                    <p className="text-sm text-gray-600">{selectedRecipe.notes}</p>
                  </div>
                )}

                <div className="app-surface p-5 sm:p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Exportar esta receta</h3>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleDownloadRecipeWord(selectedRecipe)}
                      className="btn-primary px-4 py-2 text-sm"
                      title="Descargar en formato Word .docx"
                    >
                      <FileText size={16} />
                      Word
                    </button>
                    <button
                      onClick={() => handleDownloadRecipePdf(selectedRecipe)}
                      className="btn-danger px-4 py-2 text-sm"
                      title="Descargar en formato PDF"
                    >
                      <FileDown size={16} />
                      PDF
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                title="Selecciona una receta"
                description="Elige una receta de la lista para ver sus detalles y exportarla."
              />
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Eliminar receta"
        message={recipeToDelete ? `¿Deseas eliminar "${recipeToDelete.title || 'esta receta'}"? No se puede deshacer.` : ''}
        type="deleteRecipe"
        onConfirm={handleConfirmDeleteRecipe}
        onCancel={() => {
          setIsConfirmModalOpen(false)
          setRecipeToDelete(null)
        }}
      />
    </div>
  )
}

export default RecetasPage
