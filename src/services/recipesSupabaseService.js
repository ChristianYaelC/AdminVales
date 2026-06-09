import { supabase, ensureSupabaseSession, getSupabaseUserId } from '../lib/supabaseClient'

function mapRecipe(recipeRow, ingredientRows = [], stepRows = []) {
  return {
    id: recipeRow.id,
    title: recipeRow.title || '',
    category: recipeRow.category || '',
    timeMinutes: recipeRow.cook_time_minutes || '',
    servings: recipeRow.servings || '',
    ingredients: ingredientRows
      .sort((a, b) => a.position - b.position)
      .map((item) => ({
        id: item.id,
        name: item.name || '',
        quantity: item.quantity || '',
        unit: item.unit || '',
        cost: item.cost != null ? String(item.cost) : '',
        note: item.note || ''
      })),
    steps: stepRows
      .sort((a, b) => a.position - b.position)
      .map((item) => ({ id: item.id, text: item.text || '' })),
    notes: recipeRow.notes || ''
  }
}

function toRecipeRow(recipe) {
  return {
    title: recipe.title.trim(),
    category: recipe.category?.trim() || null,
    cook_time_minutes: recipe.timeMinutes === '' ? null : Number(recipe.timeMinutes),
    servings: recipe.servings === '' ? null : Number(recipe.servings),
    notes: recipe.notes?.trim() || null
  }
}

function toIngredientRows(recipeId, ingredients) {
  return ingredients.map((ingredient, index) => ({
    owner_id: null,
    recipe_id: recipeId,
    position: index + 1,
    name: ingredient.name.trim(),
    quantity: ingredient.quantity?.trim() || null,
    unit: ingredient.unit?.trim() || null,
    cost: ingredient.cost === '' ? null : Number(ingredient.cost),
    note: ingredient.note?.trim() || null
  }))
}

function toStepRows(recipeId, steps) {
  return steps.map((step, index) => ({
    owner_id: null,
    recipe_id: recipeId,
    position: index + 1,
    text: step.text.trim()
  }))
}

export async function loadRecipes() {
  await ensureSupabaseSession()

  const [recipesRes, ingredientsRes, stepsRes] = await Promise.all([
    supabase.from('recipes').select('id, title, category, cook_time_minutes, servings, notes, created_at').order('created_at', { ascending: false }),
    supabase.from('recipe_ingredients').select('id, recipe_id, position, name, quantity, unit, cost, note').order('position', { ascending: true }),
    supabase.from('recipe_steps').select('id, recipe_id, position, text').order('position', { ascending: true })
  ])

  if (recipesRes.error) throw recipesRes.error
  if (ingredientsRes.error) throw ingredientsRes.error
  if (stepsRes.error) throw stepsRes.error

  const ingredientsByRecipe = new Map()
  for (const ingredient of ingredientsRes.data || []) {
    const list = ingredientsByRecipe.get(ingredient.recipe_id) || []
    list.push(ingredient)
    ingredientsByRecipe.set(ingredient.recipe_id, list)
  }

  const stepsByRecipe = new Map()
  for (const step of stepsRes.data || []) {
    const list = stepsByRecipe.get(step.recipe_id) || []
    list.push(step)
    stepsByRecipe.set(step.recipe_id, list)
  }

  return (recipesRes.data || []).map((recipeRow) => mapRecipe(
    recipeRow,
    ingredientsByRecipe.get(recipeRow.id) || [],
    stepsByRecipe.get(recipeRow.id) || []
  ))
}

export async function saveRecipe(recipe, recipeId = null) {
  await ensureSupabaseSession()
  const ownerId = await getSupabaseUserId()

  if (recipeId) {
    const { error: updateError } = await supabase
      .from('recipes')
      .update(toRecipeRow(recipe))
      .eq('id', recipeId)

    if (updateError) throw updateError

    const { error: deleteIngredientsError } = await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId)
    if (deleteIngredientsError) throw deleteIngredientsError

    const { error: deleteStepsError } = await supabase.from('recipe_steps').delete().eq('recipe_id', recipeId)
    if (deleteStepsError) throw deleteStepsError

    const ingredientRows = toIngredientRows(recipeId, recipe.ingredients || []).map((row) => ({ ...row, owner_id: ownerId }))
    if (ingredientRows.length) {
      const { error: ingredientsInsertError } = await supabase.from('recipe_ingredients').insert(ingredientRows)
      if (ingredientsInsertError) throw ingredientsInsertError
    }

    const stepRows = toStepRows(recipeId, recipe.steps || []).map((row) => ({ ...row, owner_id: ownerId }))
    if (stepRows.length) {
      const { error: stepsInsertError } = await supabase.from('recipe_steps').insert(stepRows)
      if (stepsInsertError) throw stepsInsertError
    }

    return { ...recipe, id: recipeId }
  }

  const { data: recipeRow, error: insertError } = await supabase
    .from('recipes')
    .insert({ owner_id: ownerId, ...toRecipeRow(recipe) })
    .select('id, title, category, cook_time_minutes, servings, notes, created_at')
    .single()

  if (insertError) throw insertError

  const ingredientRows = toIngredientRows(recipeRow.id, recipe.ingredients || []).map((row) => ({ ...row, owner_id: ownerId }))
  if (ingredientRows.length) {
    const { error: ingredientsInsertError } = await supabase.from('recipe_ingredients').insert(ingredientRows)
    if (ingredientsInsertError) throw ingredientsInsertError
  }

  const stepRows = toStepRows(recipeRow.id, recipe.steps || []).map((row) => ({ ...row, owner_id: ownerId }))
  if (stepRows.length) {
    const { error: stepsInsertError } = await supabase.from('recipe_steps').insert(stepRows)
    if (stepsInsertError) throw stepsInsertError
  }

  return mapRecipe(recipeRow, ingredientRows, stepRows)
}

export async function deleteRecipe(recipeId) {
  await ensureSupabaseSession()
  const { error } = await supabase.from('recipes').delete().eq('id', recipeId)
  if (error) throw error
}