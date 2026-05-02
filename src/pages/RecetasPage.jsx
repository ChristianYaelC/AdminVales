import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Edit2, FileDown, FileText, Plus, Search, Trash2 } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { exportCookbookPDF, exportCookbookWord, exportSingleRecipePDF, exportSingleRecipeWord } from '../recipeExport'

const STORAGE_KEY = 'vales_recetas'

const demoRecipe = {
  title: 'Alcachofas con jamón y aceite de limón',
  category: 'Verduras',
  timeMinutes: 75,
  servings: 4,
  ingredients: [
    { id: 'ing-1', name: 'Alcachofas enteras', quantity: '8', unit: '', cost: '', note: 'Sumergir en agua con limón para evitar oxidación' },
    { id: 'ing-2', name: 'Jamón serrano en taquitos', quantity: '150', unit: 'g', cost: '', note: 'Usar un jamón curado de buena calidad' },
    { id: 'ing-3', name: 'Aceite de oliva virgen extra', quantity: '4', unit: 'cucharadas', cost: '', note: '' },
    { id: 'ing-4', name: 'Zumo de limón', quantity: '1', unit: 'limón', cost: '', note: 'Al gusto, añadir más si requiere brillo' },
    { id: 'ing-5', name: 'Ajo', quantity: '2', unit: 'dientes', cost: '', note: 'Picado muy fino' },
    { id: 'ing-6', name: 'Perejil fresco', quantity: '1', unit: 'manojo', cost: '', note: 'Picar finamente' },
    { id: 'ing-7', name: 'Sal gruesa', quantity: '1', unit: 'cucharadita', cost: '', note: '' },
    { id: 'ing-8', name: 'Pimienta negra molida', quantity: 'Al gusto', unit: '', cost: '', note: '' },
    { id: 'ing-9', name: 'Agua', quantity: 'Suficiente', unit: '', cost: '', note: 'Para cocer las alcachofas' },
    { id: 'ing-10', name: 'Mantequilla (opcional)', quantity: '1', unit: 'cucharada', cost: '', note: 'Para un acabado más suave' },
    { id: 'ing-11', name: 'Pan rallado (opcional)', quantity: '2', unit: 'cucharadas', cost: '', note: 'Para gratinar si se desea' },
    { id: 'ing-12', name: 'Vino blanco (opcional)', quantity: '50', unit: 'ml', cost: '', note: 'Un chorrito para desglasar' }
  ],
  steps: [
    { id: 'step-1', text: 'Lavar bien las alcachofas; retirar hojas exteriores duras y cortar las puntas con cuidado.' },
    { id: 'step-2', text: 'Cortar el tallo y pelarlo si es necesario. Frotar con limón para evitar que se oxiden.' },
    { id: 'step-3', text: 'Llena una olla con agua, añade sal gruesa y el jugo de medio limón; llevar a ebullición.' },
    { id: 'step-4', text: 'Cocer las alcachofas durante 25-35 minutos hasta que la base esté tierna; pinchar con un cuchillo para comprobar.' },
    { id: 'step-5', text: 'Mientras tanto, cortar el jamón en taquitos pequeños y reservar.' },
    { id: 'step-6', text: 'En una sartén amplia calentar el aceite de oliva a fuego medio; añadir los ajos picados y pochar hasta dorar ligeramente.' },
    { id: 'step-7', text: 'Agregar el jamón y saltear un par de minutos hasta que suelte aroma y parte de su grasa.' },
    { id: 'step-8', text: 'Si se desea, añadir un chorrito de vino blanco para desglasar y dejar reducir un minuto.' },
    { id: 'step-9', text: 'Incorporar las alcachofas cocidas (enteras o partidas por la mitad) a la sartén y mezclar con cuidado.' },
    { id: 'step-10', text: 'Saltear a fuego vivo un par de minutos para que se impregnen los sabores; añadir la mantequilla si se emplea.' },
    { id: 'step-11', text: 'Probar de sal y corregir. Añadir zumo de limón al gusto para dar brillo y acidez.' },
    { id: 'step-12', text: 'Espolvorear perejil fresco picado por encima y un poco de pimienta negra recién molida.' },
    { id: 'step-13', text: 'Si se desea gratinar: espolvorear pan rallado, poner bajo el grill un par de minutos hasta dorar.' },
    { id: 'step-14', text: 'Dejar reposar 3-4 minutos antes de servir para asentar jugos y temperaturas.' },
    { id: 'step-15', text: 'Presentar las alcachofas acompañadas del jamón y un chorrito extra de aceite de oliva virgen.' },
    { id: 'step-16', text: 'Anotar variaciones: se puede sustituir el jamón por panceta o añadir guindilla para un toque picante.' },
    { id: 'step-17', text: 'Para conservar: guardar en un recipiente hermético en refrigeración hasta 48 horas; recalentar suavemente.' },
    { id: 'step-18', text: 'Consejo: para una versión vegana, omitir el jamón y añadir tomates secos y aceitunas para carácter.' }
  ],
  notes: 'Servir al momento para mantener la textura de las alcachofas y el aroma del jamón. Esta receta incluye varias alternativas y pasos detallados para que, al imprimir, el documento ocupe suficiente espacio y permita revisar diseño y paginación. Puedes ajustar el número de ingredientes o ampliar las explicaciones para probar distintos saltos de página en el PDF.'
}

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

  useEffect(() => {
    const parsedRecipes = [normalizeRecipe(demoRecipe)]

    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedRecipes))
    setRecipes(parsedRecipes)
    setSelectedRecipeId(parsedRecipes[0]?.id || null)
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes))
  }, [recipes, isHydrated])

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
  }

  const openNewForm = () => {
    resetForm()
    setSelectedRecipeId(null)
    setShowForm(true)
  }

  const openEditForm = (recipe) => {
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
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((ingredient) => ingredient.id !== id)
    }))
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
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.filter((step) => step.id !== id)
    }))
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

    if (editingId) {
      setRecipes((prev) => prev.map((recipe) => (recipe.id === editingId ? recipePayload : recipe)))
      setSelectedRecipeId(editingId)
    } else {
      setRecipes((prev) => [recipePayload, ...prev])
      setSelectedRecipeId(null)
    }

    setShowForm(false)
    setEditingId(null)
  }

  const handleDeleteRecipe = (id) => {
    const remaining = recipes.filter((recipe) => recipe.id !== id)
    setRecipes(remaining)
    if (selectedRecipeId === id) {
      setSelectedRecipeId(remaining[0]?.id || null)
    }
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
    <div className="p-6 bg-gray-50 min-h-full page-enter">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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

        <div className="flex flex-col gap-6 mb-8">
          <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
            <div className="flex-1 max-w-2xl">
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar receta</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Por titulo o categoria"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 xl:gap-4">
              <button
                onClick={openNewForm}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-secondary text-white font-medium shadow hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 transition-all"
              >
                <Plus size={18} />
                <span>Nueva receta</span>
              </button>
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold text-gray-600 mb-2">Exportar recetario</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadAllWord}
                    disabled={!recipes.length}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-white text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    title="Descargar en formato Word .docx"
                  >
                    <FileText size={14} />
                    Word
                  </button>
                  <button
                    onClick={handleDownloadAllPdf}
                    disabled={!recipes.length}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-white text-xs bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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

        <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
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
                  className={`w-full text-left rounded-xl border px-4 py-3 transition ${selectedRecipeId === recipe.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-200'}`}
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

          <div className="space-y-6 min-w-0">
            {showForm ? (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-medium">Crear nueva</p>
                    <h2 className="text-xl font-bold text-gray-900 mt-1">{editingId ? 'Editar receta' : 'Nueva receta'}</h2>
                    <p className="mt-3 text-sm text-gray-600">Los cambios se guardan localmente en este dispositivo.</p>
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

                  <div className="border-t border-gray-200 pt-5">
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
                        <div key={ingredient.id} className="rounded-xl border border-gray-200 bg-gray-50/70 p-3">
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
                    <p className="mt-3 text-xs text-gray-500">💡 Costo y nota son opcionales. Útiles para compras o recordatorios.</p>
                  </div>

                  <div className="border-t border-gray-200 pt-5">
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

                  <div className="border-t border-gray-200 pt-5">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Recomendaciones y notas</label>
                    <textarea
                      value={formData.notes}
                      onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm min-h-[140px] placeholder-gray-400 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition resize-y leading-6 bg-white"
                      placeholder="Consejos, variaciones, observaciones, trucos..."
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false)
                        resetForm()
                      }}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 focus:ring-2 focus:ring-gray-300 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 transition shadow-sm"
                    >
                      {editingId ? 'Guardar cambios' : 'Crear receta'}
                    </button>
                  </div>
                </form>
              </div>
            ) : selectedRecipe ? (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Receta seleccionada</p>
                      <h2 className="text-2xl font-semibold text-gray-900 mt-1">{selectedRecipe.title || 'Receta sin titulo'}</h2>
                      <p className="text-sm text-gray-500 mt-2">{selectedRecipe.category || 'Sin categoria'} · {[selectedRecipe.timeMinutes ? `${selectedRecipe.timeMinutes} min` : null, selectedRecipe.servings ? `Raciones: ${selectedRecipe.servings}` : null].filter(Boolean).join(' · ') || 'Tiempo libre'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditForm(selectedRecipe)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-sm text-blue-700 hover:bg-blue-100 focus:ring-2 focus:ring-blue-200 transition"
                      >
                        <Edit2 size={16} />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteRecipe(selectedRecipe.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600 hover:bg-red-100 focus:ring-2 focus:ring-red-200 transition"
                      >
                        <Trash2 size={16} />
                        Eliminar
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                      <p className="text-xs text-gray-500">Ingredientes</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedRecipe.ingredients.length}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                      <p className="text-xs text-gray-500">Pasos</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedRecipe.steps.length}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                      <p className="text-xs text-gray-500">Tiempo</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedRecipe.timeMinutes ? `${selectedRecipe.timeMinutes} min` : 'Libre'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen size={18} className="text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Ingredientes</h3>
                  </div>

                  {selectedRecipe.ingredients.length === 0 ? (
                    <EmptyState title="Sin ingredientes" description="Agrega ingredientes para ver el detalle." />
                  ) : (
                    <div className="overflow-x-auto">
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

                <div className="bg-white border border-gray-200 rounded-xl p-6">
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
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Recomendaciones</h3>
                    <p className="text-sm text-gray-600">{selectedRecipe.notes}</p>
                  </div>
                )}

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Exportar esta receta</h3>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleDownloadRecipeWord(selectedRecipe)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white text-sm bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-300 transition-colors shadow-sm"
                      title="Descargar en formato Word .docx"
                    >
                      <FileText size={16} />
                      Word (.docx)
                    </button>
                    <button
                      onClick={() => handleDownloadRecipePdf(selectedRecipe)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white text-sm bg-red-500 hover:bg-red-600 focus:ring-2 focus:ring-red-300 transition-colors shadow-sm"
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
    </div>
  )
}

export default RecetasPage
