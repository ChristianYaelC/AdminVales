import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import { jsPDF } from 'jspdf'
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  LeaderType,
  Packer,
  Paragraph,
  PageNumber,
  Tab,
  TabStopPosition,
  TabStopType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType
} from 'docx'

const pdfVfs = pdfFonts?.pdfMake?.vfs || pdfFonts?.default?.pdfMake?.vfs || pdfFonts?.vfs
if (pdfVfs) {
  pdfMake.vfs = pdfVfs
}
// Do not set `pdfMake.fonts` to custom names unless the VFS contains those font files.
// We'll prefer to use the embedded VFS fonts (if any) or fallback to jsPDF.

const CM_TO_PT = (cm) => Math.round(cm * 28.3464567)
const CM_TO_TWIPS = (cm) => Math.round((cm / 2.54) * 1440)

const PDF_MARGIN = CM_TO_PT(2.5)
const DOCX_MARGIN = CM_TO_TWIPS(2.5)

const safeText = (value) => (value === null || value === undefined ? '' : String(value))

const cleanFilename = (value) => {
  const text = safeText(value).trim().replace(/[\\/:*?"<>|]+/g, '_')
  return text || 'receta'
}

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const getCookTimeText = (recipe) => safeText(recipe.cookTime || recipe.timeMinutes)

const getTipsText = (recipe) => safeText(recipe.tips || recipe.notes)

const getMetaText = (recipe) => {
  const parts = []
  const cookTime = getCookTimeText(recipe)
  if (cookTime) parts.push(`Tiempo: ${cookTime}`)
  if (safeText(recipe.servings)) parts.push(`Raciones: ${safeText(recipe.servings)}`)
  return parts.join(' · ')
}

const getCategory = (recipe) => safeText(recipe.category) || 'Sin categoría'

const groupByCategory = (recipes = []) => {
  const ordered = []
  const grouped = new Map()

  recipes.forEach((recipe) => {
    const category = getCategory(recipe)
    if (!grouped.has(category)) {
      grouped.set(category, [])
      ordered.push(category)
    }
    grouped.get(category).push(recipe)
  })

  return { ordered, grouped }
}

const line = () => ({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 453, y2: 0, lineWidth: 0.5, lineColor: '#dddddd' }] })

const buildSingleRecipeBody = (recipe, options = {}) => {
  const category = getCategory(recipe).toUpperCase()
  const title = safeText(recipe.title).trim()
  const servings = safeText(recipe.servings).trim()
  const meta = getMetaText(recipe)
  const topSpacing = options.topSpacing ?? 32

  const content = []
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : []
  const steps = Array.isArray(recipe.steps) ? recipe.steps : []
  const tipsText = getTipsText(recipe).trim()

  content.push({ text: category, style: 'categoryLabel', margin: [0, topSpacing, 0, 6] })
  content.push({ ...line(), margin: [0, 0, 0, 18] })
  content.push({ text: title, style: 'recipeTitle', margin: [0, 0, 0, 10] })
  if (meta) {
    content.push({ text: meta, style: 'metaLine', margin: [0, 0, 0, 18] })
  }

  content.push({ text: 'INGREDIENTES', style: 'ingredientsHeader', margin: [0, 0, 0, 8] })
  content.push({ ...line(), margin: [0, 0, 0, 12] })

  if (ingredients.length) {
    ingredients.forEach((ingredient) => {
      const qty = safeText(ingredient.quantity).trim()
      const unit = safeText(ingredient.unit).trim()
      const amount = [qty, unit].filter(Boolean).join(' ') || '-'
      const name = safeText(ingredient.name).trim() || '-'
      const note = safeText(ingredient.note).trim()

      content.push({
        text: [
          { text: `${amount} `, style: 'ingredientQty', bold: true },
          { text: name, style: 'ingredientName' }
        ],
        margin: [0, 0, 0, note ? 2 : 8]
      })

      if (note) {
        content.push({ text: note, style: 'ingredientNote', margin: [0, 0, 0, 8] })
      }
    })
  } else {
    content.push({ text: '- Sin ingredientes', style: 'ingredientNote', margin: [0, 0, 0, 4] })
  }

  content.push({ text: 'ELABORACIÓN', style: 'stepsHeader', margin: [0, 14, 0, 8] })
  content.push({ ...line(), margin: [0, 0, 0, 12] })

  if (steps.length) {
    steps.forEach((step, index) => {
      const text = typeof step === 'string' ? step : (step && (step.text || step.description || ''))
      content.push({
        columns: [
          { text: `${index + 1}.`, style: 'stepNumber', width: 22 },
          { text: safeText(text).trim() || '-', style: 'stepText', width: '*' }
        ],
        columnGap: 8,
        margin: [0, 0, 0, 5]
      })
    })
  } else {
    content.push({ text: '- Sin pasos', style: 'stepText', margin: [0, 0, 0, 4] })
  }

  if (tipsText) {
    content.push({ text: 'CONSEJOS', style: 'tipsLabel', margin: [0, 12, 0, 4] })
    content.push({ text: tipsText, style: 'tipsText', margin: [0, 0, 0, 0] })
  }

  return content
}

const buildCookbookPagePlan = (recipes = []) => {
  const { ordered, grouped } = groupByCategory(recipes)
  const pages = [{ type: 'cover' }, { type: 'toc' }]

  ordered.forEach((category) => {
    pages.push({ type: 'divider', category })
    grouped.get(category).forEach((recipe) => {
      pages.push({ type: 'recipe', category, recipe })
    })
  })

  return { ordered, grouped, pages }
}

const buildCookbookPdfDefinition = (recipes = []) => {
  const { ordered, grouped, pages } = buildCookbookPagePlan(recipes)
  const content = []

  // Cover page
  content.push({
    stack: [
      { text: 'RECETARIO', style: 'coverTitle' },
      { ...line(), margin: [0, 20, 0, 0] }
    ],
    alignment: 'center',
    margin: [0, 170, 0, 0],
    pageBreak: 'after'
  })

  content.push({ text: 'ÍNDICE', style: 'tocTitle', margin: [0, 0, 0, 8] })
  content.push({ ...line(), margin: [0, 0, 0, 16] })

  let pageNumber = 3
  ordered.forEach((category) => {
    content.push({ text: category.toUpperCase(), style: 'tocCategory', margin: [0, 6, 0, 8] })
    grouped.get(category).forEach((recipe) => {
      content.push({
        columns: [
          { text: safeText(recipe.title).trim(), style: 'tocRecipe', width: '*' },
          { text: String(pageNumber), style: 'tocPage', width: 'auto', alignment: 'right' }
        ],
        columnGap: 12,
        margin: [0, 0, 0, 4]
      })
      pageNumber += 1
    })
    content.push({ text: '', margin: [0, 0, 0, 12] })
    pageNumber += 1
  })

  ordered.forEach((category) => {
    content.push({
      stack: [
        { ...line(), margin: [0, 0, 0, 22] },
        { text: category.toUpperCase(), style: 'dividerTitle', margin: [0, 0, 0, 22] },
        { ...line(), margin: [0, 0, 0, 0] }
      ],
      alignment: 'center',
      margin: [0, 180, 0, 0],
      pageBreak: 'before'
    })

    grouped.get(category).forEach((recipe) => {
      content.push({
        stack: buildSingleRecipeBody(recipe, { topSpacing: 36 }),
        pageBreak: 'before'
      })
    })
  })

  return {
    pageSize: 'A4',
    pageMargins: [PDF_MARGIN, PDF_MARGIN, PDF_MARGIN, PDF_MARGIN],
    defaultStyle: { color: '#1a1a1a' },
    content,
    styles: {
      coverTitle: { fontSize: 60, color: '#111111' },
      coverSubtitle: { fontSize: 22, color: '#555555' },
      tocTitle: { fontSize: 26, color: '#111111' },
      tocCategory: { fontSize: 13, color: '#333333', bold: true },
      tocRecipe: { fontSize: 11, color: '#222222' },
      tocPage: { fontSize: 11, color: '#666666' },
      dividerTitle: { fontSize: 32, color: '#111111', bold: true },
      categoryLabel: { fontSize: 10, color: '#777777' },
      recipeTitle: { fontSize: 40, color: '#111111' },
      metaLine: { fontSize: 10, color: '#666666' },
      ingredientsHeader: { fontSize: 15, color: '#111111', bold: true },
      servingsText: { fontSize: 10, color: '#777777' },
      ingredientQty: { fontSize: 11, color: '#111111' },
      ingredientName: { fontSize: 11, color: '#222222' },
      ingredientNote: { fontSize: 9, color: '#777777', italics: true },
      stepsHeader: { fontSize: 15, color: '#111111', bold: true },
      stepNumber: { fontSize: 11, color: '#111111', bold: true },
      stepText: { fontSize: 11, color: '#222222', lineHeight: 1.35 },
      tipsLabel: { fontSize: 12, color: '#111111', bold: true },
      tipsText: { fontSize: 10, color: '#555555', italics: true },
      footerText: { fontSize: 9, color: '#666666' }
    },
    footer: (currentPage) => {
      const page = pages[currentPage - 1]
      if (!page || page.type !== 'recipe') return { text: '', margin: [40, 10, 40, 0] }

      return {
        margin: [40, 10, 40, 0],
        columns: [
          { text: page.category.toUpperCase(), style: 'footerText', alignment: 'left' },
          { text: String(currentPage), style: 'footerText', alignment: 'right' }
        ]
      }
    }
  }
}

const buildSinglePdfDefinition = (recipe) => ({
  pageSize: 'A4',
  pageMargins: [PDF_MARGIN, PDF_MARGIN, PDF_MARGIN, PDF_MARGIN],
  defaultStyle: { color: '#1a1a1a' },
  content: buildSingleRecipeBody(recipe),
  styles: {
    coverTitle: { fontSize: 60, color: '#111111' },
    coverSubtitle: { fontSize: 22, color: '#555555' },
    tocTitle: { fontSize: 26, color: '#111111' },
    tocCategory: { fontSize: 13, color: '#333333', bold: true },
    tocRecipe: { fontSize: 11, color: '#222222' },
    tocPage: { fontSize: 11, color: '#666666' },
    dividerTitle: { fontSize: 32, color: '#111111', bold: true },
    categoryLabel: { fontSize: 10, color: '#777777' },
    recipeTitle: { fontSize: 40, color: '#111111' },
    metaLine: { fontSize: 10, color: '#666666' },
    ingredientsHeader: { fontSize: 15, color: '#111111', bold: true },
    servingsText: { fontSize: 10, color: '#777777' },
    ingredientQty: { fontSize: 11, color: '#111111' },
    ingredientName: { fontSize: 11, color: '#222222' },
    ingredientNote: { fontSize: 9, color: '#777777', italics: true },
    stepsHeader: { fontSize: 15, color: '#111111', bold: true },
    stepNumber: { fontSize: 11, color: '#111111', bold: true },
    stepText: { fontSize: 11, color: '#222222', lineHeight: 1.35 },
    tipsLabel: { fontSize: 12, color: '#111111', bold: true },
    tipsText: { fontSize: 10, color: '#555555', italics: true },
    footerText: { fontSize: 9, color: '#666666' }
  }
})
export async function exportSingleRecipePDF(recipe) {
  try {
    let pm = pdfMake
    try { if (typeof window !== 'undefined') window.__lastPdfExport = { step: 'start', title: safeText(recipe.title) } } catch (e) {}

    const needsLoad = !pm || !pm.createPdf || !pm.vfs || Object.keys(pm.vfs || {}).length === 0
    if (needsLoad) {
      try {
        console.log('Intentando cargar pdfmake dinámicamente...')
        const [pdfMakeModule, pdfFontsModule] = await Promise.all([
          import('pdfmake/build/pdfmake'),
          import('pdfmake/build/vfs_fonts')
        ])
        pm = pdfMakeModule.default || pdfMakeModule
        const vfs = pdfFontsModule?.pdfMake?.vfs || pdfFontsModule?.default?.pdfMake?.vfs || pdfFontsModule?.vfs || pdfFontsModule
        if (vfs) pm.vfs = vfs
        try { if (typeof window !== 'undefined') window.__lastPdfExport = { step: 'loaded', vfsCount: Object.keys(pm.vfs || {}).length } } catch (e) {}
        console.log('pdfmake cargado dinámicamente, vfsCount=', Object.keys(pm.vfs || {}).length)
      } catch (loadErr) {
        console.error('No se pudo cargar pdfmake dinámicamente:', loadErr)
        try { if (typeof window !== 'undefined') window.__lastPdfExport = { step: 'load-failed', error: String(loadErr) } } catch (e) {}
      }
    }

    if (!pm || !pm.createPdf || !pm.vfs || Object.keys(pm.vfs || {}).length === 0) {
      console.error('pdfMake no está disponible en runtime después del intento de carga — usando jsPDF como fallback')
      try {
        const doc = new jsPDF({ unit: 'pt', format: 'a4' })
        const lines = buildSingleRecipeBody(recipe).map((c) => (c.text ? String(c.text) : ''))
        doc.setFont('Helvetica', 'normal')
        doc.setFontSize(12)
        let y = 40
        lines.forEach((ln) => {
          if (!ln) { y += 12; return }
          const split = doc.splitTextToSize(ln, 520)
          doc.text(split, 40, y)
          y += split.length * 14
          if (y > 760) { doc.addPage(); y = 40 }
        })
        doc.save(`${cleanFilename(recipe.title)}-fallback.pdf`)
      } catch (errJs) {
        console.error('jsPDF fallback falló:', errJs)
        alert('No fue posible generar el PDF. Revisa la consola.')
      }
      return
    }

    const def = buildSinglePdfDefinition(recipe)
    try {
      console.log('Generando PDF para', recipe.title)
      try { if (typeof window !== 'undefined') window.__lastPdfExport = { step: 'creating', title: safeText(recipe.title) } } catch (e) {}

      const pdfDoc = pm.createPdf(def)
      pdfDoc.getBuffer((buffer) => {
        try {
          const blob = new Blob([buffer], { type: 'application/pdf' })
          downloadBlob(blob, `${cleanFilename(recipe.title)}.pdf`)
          try { if (typeof window !== 'undefined') window.__lastPdfExport = { step: 'done', title: safeText(recipe.title) } } catch (e) {}
        } catch (e) {
          console.error('Error creating blob from pdfMake buffer:', e)
          try { if (typeof window !== 'undefined') window.__lastPdfExport = { step: 'blob-failed', error: String(e) } } catch (err) {}
        }
      })
    } catch (errPdf) {
      console.error('pdfMake.createPdf falló:', errPdf)
      try { if (typeof window !== 'undefined') window.__lastPdfExport = { step: 'create-failed', error: String(errPdf) } } catch (e) {}
      throw errPdf
    }
  } catch (err) {
    console.error('Error exportando PDF:', err)
    alert('Error al generar el PDF. Revisa la consola para más detalles.')
  }
}

export async function exportCookbookPDF(recipes) {
  try {
    let pm = pdfMake
    try { if (typeof window !== 'undefined') window.__lastPdfExport = { step: 'cookbook-start' } } catch (e) {}
    const needsLoad = !pm || !pm.createPdf || !pm.vfs || Object.keys(pm.vfs || {}).length === 0
    if (needsLoad) {
      try {
        console.log('Intentando cargar pdfmake dinámicamente (cookbook)...')
        const [pdfMakeModule, pdfFontsModule] = await Promise.all([
          import('pdfmake/build/pdfmake'),
          import('pdfmake/build/vfs_fonts')
        ])
        pm = pdfMakeModule.default || pdfMakeModule
        const vfs = pdfFontsModule?.pdfMake?.vfs || pdfFontsModule?.default?.pdfMake?.vfs || pdfFontsModule?.vfs || pdfFontsModule
        if (vfs) pm.vfs = vfs
        try { if (typeof window !== 'undefined') window.__lastPdfExport = { step: 'cookbook-loaded', vfsCount: Object.keys(pm.vfs || {}).length } } catch (e) {}
        console.log('pdfmake cargado dinámicamente (cookbook), vfsCount=', Object.keys(pm.vfs || {}).length)
      } catch (loadErr) {
        console.error('No se pudo cargar pdfmake dinámicamente:', loadErr)
        try { if (typeof window !== 'undefined') window.__lastPdfExport = { step: 'cookbook-load-failed', error: String(loadErr) } } catch (e) {}
      }
    }

    if (!pm || !pm.createPdf) {
      console.error('pdfMake no está disponible en runtime después del intento de carga — usando jsPDF como fallback')
      try {
        const doc = new jsPDF({ unit: 'pt', format: 'a4' })
        doc.setFont('Helvetica', 'normal')
        doc.setFontSize(14)
        let y = 40
        recipes.forEach((recipe, idx) => {
          const title = safeText(recipe.title)
          doc.text(title, 40, y)
          y += 24
          const lines = buildSingleRecipeBody(recipe).map((c) => (c.text ? String(c.text) : ''))
          lines.forEach((ln) => {
            if (!ln) { y += 8; return }
            const split = doc.splitTextToSize(ln, 520)
            doc.text(split, 40, y)
            y += split.length * 14
            if (y > 760) { doc.addPage(); y = 40 }
          })
          if (idx < recipes.length - 1) { doc.addPage(); y = 40 }
        })
        doc.save('recetario-fallback.pdf')
      } catch (errJs) {
        console.error('jsPDF fallback falló (cookbook):', errJs)
        alert('No fue posible generar el PDF del recetario. Revisa la consola.')
      }
      return
    }

    const def = buildCookbookPdfDefinition(recipes)
    try {
      console.log('Generando recetario PDF')
      try { if (typeof window !== 'undefined') window.__lastPdfExport = { step: 'cookbook-creating' } } catch (e) {}
      
      // Use getBuffer() + downloadBlob for better browser compatibility
      const pdfDoc = pm.createPdf(def)
      pdfDoc.getBuffer((buffer) => {
        try {
          const blob = new Blob([buffer], { type: 'application/pdf' })
          downloadBlob(blob, 'recetario.pdf')
          try { if (typeof window !== 'undefined') window.__lastPdfExport = { step: 'cookbook-done' } } catch (e) {}
        } catch (e) {
          console.error('Error creating blob from pdfMake buffer (cookbook):', e)
          try { if (typeof window !== 'undefined') window.__lastPdfExport = { step: 'cookbook-blob-failed', error: String(e) } } catch (err) {}
        }
      })
    } catch (errPdf) {
      console.error('pdfMake.createPdf falló (cookbook):', errPdf)
      try { if (typeof window !== 'undefined') window.__lastPdfExport = { step: 'cookbook-create-failed', error: String(errPdf) } } catch (e) {}
      throw errPdf
    }
  } catch (err) {
    console.error('Error exportando recetario PDF:', err)
    alert('Error al generar el PDF del recetario. Revisa la consola para más detalles.')
  }
}

const makeWordLine = (text, { size, bold = false, italics = false, color = '1a1a1a', alignment = AlignmentType.LEFT, spacing = {} } = {}) =>
  new Paragraph({
    children: [new TextRun({ text, size: size * 2, bold, italics, color })],
    alignment,
    spacing
  })

const makeRuleParagraph = () =>
  new Paragraph({
    children: [new TextRun({ text: '' })],
    border: {
      bottom: {
        color: 'DDDDDD',
        space: 1,
        style: BorderStyle.SINGLE,
        size: 2
      }
    }
  })

const makeIngredientParagraphsWord = (ingredients = []) => {
  if (!ingredients.length) {
    return [makeWordLine('- Sin ingredientes', { size: 11, color: '777777', italics: true })]
  }

  return ingredients.flatMap((ingredient) => {
    const qty = [safeText(ingredient.quantity).trim(), safeText(ingredient.unit).trim()].filter(Boolean).join(' ')
    const amount = qty || '-'
    const name = safeText(ingredient.name).trim() || '-'
    const note = safeText(ingredient.note).trim()
    const para = new Paragraph({
      children: [
        new TextRun({ text: `${amount} `, size: 22, bold: true, color: '1a1a1a' }),
        new TextRun({ text: name, size: 22, color: '222222' })
      ],
      spacing: { after: note ? 40 : 120 }
    })

    if (note) {
      return [para, makeWordLine(note, { size: 9, italics: true, color: '777777', spacing: { after: 80 } })]
    }
    return [para]
  })
}

const buildSingleRecipeWordSection = (recipe) => {
  const children = []
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : []
  const steps = Array.isArray(recipe.steps) ? recipe.steps : []
  const tipsText = getTipsText(recipe).trim()

  children.push(makeWordLine(getCategory(recipe).toUpperCase(), { size: 10, color: '777777', spacing: { after: 70 } }))
  children.push(makeRuleParagraph())
  children.push(makeWordLine(safeText(recipe.title).trim(), { size: 36, bold: true, color: '111111', spacing: { before: 260, after: 120 } }))

  const meta = getMetaText(recipe)
  if (meta) {
    children.push(makeWordLine(meta, { size: 10, color: '777777', spacing: { after: 240 } }))
  }

  children.push(makeWordLine('INGREDIENTES', { size: 15, bold: true, color: '111111', spacing: { after: 70 } }))
  children.push(makeRuleParagraph())
  children.push(...makeIngredientParagraphsWord(ingredients))

  children.push(makeWordLine('ELABORACIÓN', { size: 15, bold: true, color: '111111', spacing: { before: 180, after: 70 } }))
  children.push(makeRuleParagraph())

  if (steps.length) {
    steps.forEach((step, index) => {
      const stepText = safeText(typeof step === 'string' ? step : (step && (step.text || step.description || ''))).trim() || '-'
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${index + 1}.`, size: 22, bold: true, color: '111111' }),
            new TextRun({ text: ' ', size: 22 }),
            new TextRun({ text: stepText, size: 22, color: '222222' })
          ],
          spacing: { after: 60 },
          lineSpacing: 280
        })
      )
    })
  } else {
    children.push(makeWordLine('- Sin pasos', { size: 11, color: '777777', italics: true, spacing: { after: 60 } }))
  }

  if (tipsText) {
    children.push(makeWordLine('CONSEJOS', { size: 12, bold: true, color: '111111', spacing: { before: 140, after: 40 } }))
    children.push(makeWordLine(tipsText, { size: 10, italics: true, color: '555555' }))
  }

  return children
}

const createWordDocument = (sections) => new Document({ sections })

const cookbookFooter = (category) =>
  new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: category.toUpperCase(), size: 8, color: '777777' }),
          new Tab(),
          new TextRun({ children: [PageNumber.CURRENT], size: 8, color: '777777' })
        ],
        tabStops: [
          {
            type: TabStopType.RIGHT,
            position: TabStopPosition.MAX,
            leader: LeaderType.DOT
          }
        ],
        indent: { left: 400, right: 400 },
        spacing: { before: 0, after: 0 }
      })
    ]
  })

export async function exportSingleRecipeWord(recipe) {
  const doc = createWordDocument([
    {
      properties: { page: { margin: { top: DOCX_MARGIN, right: DOCX_MARGIN, bottom: DOCX_MARGIN, left: DOCX_MARGIN } } },
      children: buildSingleRecipeWordSection(recipe)
    }
  ])

  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, `${cleanFilename(recipe.title)}.docx`)
}

export async function exportCookbookWord(recipes) {
  const { ordered, grouped } = groupByCategory(recipes)
  const sections = []

  sections.push({
    properties: { page: { margin: { top: DOCX_MARGIN, right: DOCX_MARGIN, bottom: DOCX_MARGIN, left: DOCX_MARGIN } } },
    children: [
      new Paragraph({ children: [new TextRun({ text: 'RECETARIO', size: 120, bold: true, color: '1a1a1a' })], alignment: AlignmentType.CENTER, spacing: { before: 700, after: 160 } }),
      makeRuleParagraph()
    ]
  })

  const pagePlan = [{ type: 'cover' }, { type: 'toc' }]
  ordered.forEach((category) => {
    pagePlan.push({ type: 'divider', category })
    grouped.get(category).forEach((recipe) => pagePlan.push({ type: 'recipe', category, recipe }))
  })

  sections.push({
    properties: { page: { margin: { top: DOCX_MARGIN, right: DOCX_MARGIN, bottom: DOCX_MARGIN, left: DOCX_MARGIN } } },
    children: [
      new Paragraph({ children: [new TextRun({ text: 'ÍNDICE', size: 24, bold: true, color: '111111' })], spacing: { after: 120 } }),
      makeRuleParagraph(),
      ...ordered.flatMap((category, categoryIndex) => {
        const beforeCount = ordered.slice(0, categoryIndex).reduce((sum, cat) => sum + grouped.get(cat).length + 1, 0)
        const startPage = 3 + beforeCount

        return [
          new Paragraph({ children: [new TextRun({ text: category.toUpperCase(), size: 12, bold: true, color: '111111' })], spacing: { before: 220, after: 80 } }),
          ...grouped.get(category).map((recipe, recipeIndex) => new Paragraph({
            children: [
              new TextRun({ text: safeText(recipe.title).trim(), size: 11, color: '222222' }),
              new Tab(),
              new TextRun({ text: String(startPage + 1 + recipeIndex), size: 11, color: '666666' })
            ],
            tabStops: [
              {
                type: TabStopType.RIGHT,
                position: TabStopPosition.MAX,
                leader: LeaderType.DOT
              }
            ],
            spacing: { after: 30 }
          }))
        ]
      })
    ]
  })

  ordered.forEach((category) => {
    sections.push({
      properties: { page: { margin: { top: DOCX_MARGIN, right: DOCX_MARGIN, bottom: DOCX_MARGIN, left: DOCX_MARGIN } } },
      children: [
        new Paragraph({ children: [new TextRun({ text: category.toUpperCase(), size: 48, bold: true, color: '111111' })], alignment: AlignmentType.CENTER, spacing: { before: 1200, after: 120 } }),
        makeRuleParagraph()
      ]
    })

    grouped.get(category).forEach((recipe) => {
      sections.push({
        properties: { page: { margin: { top: DOCX_MARGIN, right: DOCX_MARGIN, bottom: DOCX_MARGIN, left: DOCX_MARGIN } } },
        footers: { default: cookbookFooter(category) },
        children: buildSingleRecipeWordSection(recipe)
      })
    })
  })

  const doc = createWordDocument(sections)
  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, 'recetario.docx')
}

export default {
  exportSingleRecipePDF,
  exportSingleRecipeWord,
  exportCookbookPDF,
  exportCookbookWord
}