import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import { jsPDF } from 'jspdf'
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Packer,
  Paragraph,
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

const dotLeader = (label, pageNumber) => {
  const base = safeText(label).trim()
  const dots = Math.max(8, 52 - base.length)
  return `${base} ${'.'.repeat(dots)} ${pageNumber}`
}

const line = () => ({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 520, y2: 0, lineWidth: 0.5, lineColor: '#dddddd' }] })

const buildSingleRecipeBody = (recipe, options = {}) => {
  const category = getCategory(recipe).toUpperCase()
  const title = safeText(recipe.title).trim()
  const servings = safeText(recipe.servings).trim()
  const meta = getMetaText(recipe)
  const topSpacing = options.topSpacing ?? 32

  const content = []

  content.push({ text: category, style: 'categoryLabel', margin: [0, topSpacing, 0, 6] })
  content.push({ ...line(), margin: [0, 0, 0, 20] })

  content.push({ text: title, style: 'recipeTitle', margin: [0, 0, 0, 12] })
  if (meta) content.push({ text: meta, style: 'metaLine', margin: [0, 0, 0, 30] })

  content.push({
    columns: [
      { width: '*', text: 'INGREDIENTES', style: 'ingredientsHeader' },
      { width: 120, text: servings, style: 'servingsText', alignment: 'right' }
    ],
    columnGap: 10
  })
  content.push({ ...line(), margin: [0, 6, 0, 16] })

  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : []
  if (ingredients.length) {
    ingredients.forEach((ingredient) => {
      const qty = safeText(ingredient.quantity).trim()
      const unit = safeText(ingredient.unit).trim()
      const amount = [qty, unit].filter(Boolean).join(' ') || '-'

      content.push({
        columns: [
          { width: 90, text: amount, style: 'ingredientQty', alignment: 'right' },
          { width: '*', text: safeText(ingredient.name).trim() || '-', style: 'ingredientName' }
        ],
        columnGap: 12,
        margin: [0, 0, 0, 8]
      })

      if (safeText(ingredient.note).trim()) {
        content.push({ text: safeText(ingredient.note).trim(), style: 'ingredientNote', margin: [104, 0, 0, 10] })
      }
    })
  } else {
    content.push({ text: '- Sin ingredientes', style: 'ingredientNote', margin: [0, 0, 0, 24] })
  }

  content.push({ text: '', margin: [0, 0, 0, 16] })
  content.push({ text: 'ELABORACIÓN', style: 'stepsHeader', margin: [0, 0, 0, 6] })
  content.push({ ...line(), margin: [0, 0, 0, 14] })

  const steps = Array.isArray(recipe.steps) ? recipe.steps : []
  steps.forEach((step, index) => {
    const text = typeof step === 'string' ? step : (step && (step.text || step.description || ''))
    content.push({
      columns: [
        { width: 26, text: `${index + 1}.`, style: 'stepNumber' },
        { width: '*', text: safeText(text).trim() || '-', style: 'stepText' }
      ],
      columnGap: 8,
      margin: [0, 0, 0, 10]
    })
  })

  const tipsText = getTipsText(recipe)
  if (tipsText.trim()) {
    content.push({ text: '', margin: [0, 14, 0, 4] })
    content.push({ text: 'CONSEJOS:', style: 'tipsLabel', margin: [0, 0, 0, 4] })
    content.push({ text: tipsText.trim(), style: 'tipsText' })
  }

  return content
}

const buildSinglePdfDefinition = (recipe) => ({
  pageSize: 'A4',
  pageMargins: [PDF_MARGIN, PDF_MARGIN, PDF_MARGIN, PDF_MARGIN],
  defaultStyle: { font: 'Helvetica', color: '#1a1a1a' },
  content: buildSingleRecipeBody(recipe, { topSpacing: 36 }),
  styles: {
    categoryLabel: { fontSize: 10, color: '#888888', bold: false },
    recipeTitle: { fontSize: 40, bold: true, color: '#1a1a1a' },
    metaLine: { fontSize: 10, color: '#888888' },
    ingredientsHeader: { fontSize: 13, bold: true, color: '#1a1a1a' },
    servingsText: { fontSize: 10, italics: true, color: '#888888' },
    ingredientQty: { fontSize: 11, bold: true, color: '#1a1a1a' },
    ingredientName: { fontSize: 11, color: '#1a1a1a' },
    ingredientNote: { fontSize: 9, italics: true, color: '#999999' },
    stepsHeader: { fontSize: 13, bold: true, color: '#1a1a1a' },
    stepNumber: { fontSize: 11, bold: true, color: '#1a1a1a' },
    stepText: { fontSize: 11, color: '#1a1a1a', lineHeight: 1.5 },
    tipsLabel: { fontSize: 11, bold: true, color: '#1a1a1a' },
    tipsText: { fontSize: 10, italics: true, color: '#444444' }
  }
})

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

  content.push({
    stack: [
      { text: 'RECETARIO', style: 'coverTitle' },
      { text: 'Cocina Tradicional y Gourmet', style: 'coverSubtitle', margin: [0, 14, 0, 0] },
      { ...line(), margin: [120, 20, 120, 0] }
    ],
    alignment: 'center',
    margin: [0, 170, 0, 0]
  })
  content.push({ text: '', pageBreak: 'after' })

  content.push({ text: 'ÍNDICE', style: 'tocTitle', margin: [0, 0, 0, 8] })
  content.push({ ...line(), margin: [0, 0, 0, 16] })

  let pageNumber = 3
  ordered.forEach((category) => {
    content.push({ text: category.toUpperCase(), style: 'tocCategory', margin: [0, 4, 0, 8] })
    grouped.get(category).forEach((recipe) => {
      content.push({ text: dotLeader(`    ${safeText(recipe.title).trim()}`, pageNumber), style: 'tocRecipe', margin: [0, 0, 0, 4] })
      pageNumber += 1
    })
    content.push({ text: '', margin: [0, 0, 0, 16] })
    pageNumber += 1
  })

  content.push({ text: '', pageBreak: 'after' })

  ordered.forEach((category) => {
    content.push({
      stack: [
        { ...line(), margin: [70, 0, 70, 22] },
        { text: category.toUpperCase(), style: 'dividerTitle', margin: [0, 0, 0, 22] },
        { ...line(), margin: [70, 0, 70, 0] }
      ],
      alignment: 'center',
      margin: [0, 180, 0, 0],
      pageBreak: 'before'
    })
    content.push({ text: '', pageBreak: 'after' })

    grouped.get(category).forEach((recipe) => {
      content.push({ stack: buildSingleRecipeBody(recipe, { topSpacing: 36 }), pageBreak: 'before' })
      content.push({ text: '', pageBreak: 'after' })
    })
  })

  return {
    pageSize: 'A4',
    pageMargins: [PDF_MARGIN, PDF_MARGIN, PDF_MARGIN, PDF_MARGIN],
    defaultStyle: { font: 'Helvetica', color: '#1a1a1a' },
    content,
    styles: {
      coverTitle: { fontSize: 60, bold: true, color: '#1a1a1a' },
      coverSubtitle: { fontSize: 24, color: '#1a1a1a' },
      tocTitle: { fontSize: 24, bold: true, color: '#1a1a1a' },
      tocCategory: { fontSize: 12, bold: true, color: '#1a1a1a' },
      tocRecipe: { fontSize: 11, color: '#1a1a1a' },
      dividerTitle: { fontSize: 32, bold: true, color: '#1a1a1a' },
      categoryLabel: { fontSize: 10, color: '#888888' },
      recipeTitle: { fontSize: 40, bold: true, color: '#1a1a1a' },
      metaLine: { fontSize: 10, color: '#888888' },
      ingredientsHeader: { fontSize: 13, bold: true, color: '#1a1a1a' },
      servingsText: { fontSize: 10, italics: true, color: '#888888' },
      ingredientQty: { fontSize: 11, bold: true, color: '#1a1a1a' },
      ingredientName: { fontSize: 11, color: '#1a1a1a' },
      ingredientNote: { fontSize: 9, italics: true, color: '#999999' },
      stepsHeader: { fontSize: 13, bold: true, color: '#1a1a1a' },
      stepNumber: { fontSize: 11, bold: true, color: '#1a1a1a' },
      stepText: { fontSize: 11, color: '#1a1a1a', lineHeight: 1.5 },
      tipsLabel: { fontSize: 11, bold: true, color: '#1a1a1a' },
      tipsText: { fontSize: 10, italics: true, color: '#444444' },
      footerText: { fontSize: 9, color: '#888888' }
    },
    footer: (currentPage) => {
      const page = pages[currentPage - 1]
      if (!page || page.type !== 'recipe') return { text: '' }

      return {
        columns: [
          { text: page.category.toUpperCase(), style: 'footerText', alignment: 'left' },
          { text: String(currentPage), style: 'footerText', alignment: 'right' }
        ]
      }
    }
  }
}

export async function exportSingleRecipePDF(recipe) {
  try {
    let pm = pdfMake
    try { if (typeof window !== 'undefined') window.__lastPdfExport = { step: 'start', title: safeText(recipe.title) } } catch (e) {}
    // If pdfMake is not ready or vfs missing, try dynamic import at runtime
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

    // If vfs is empty after dynamic load, avoid using pdfMake and fallback to jsPDF
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
      
      // Use getBuffer() + downloadBlob for better browser compatibility
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

const makeWordLine = (text, { font, size, bold = false, italics = false, color = '1a1a1a', alignment = AlignmentType.LEFT, spacing = {} } = {}) =>
  new Paragraph({
    children: [new TextRun({ text, font, size: size * 2, bold, italics, color })],
    alignment,
    spacing
  })

const makeRuleParagraph = () =>
  new Paragraph({
    children: [new TextRun({ text: '', font: 'Times New Roman' })],
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
    return [makeWordLine('- Sin ingredientes', { font: 'Montserrat', size: 11, bold: true })]
  }

  return ingredients.flatMap((ingredient) => {
    const qty = [safeText(ingredient.quantity).trim(), safeText(ingredient.unit).trim()].filter(Boolean).join(' ')
    const para = new Paragraph({
      children: [
        new TextRun({ text: qty || '-', font: 'Montserrat', size: 22, bold: true }),
        new TextRun({ text: '  ' }),
        new TextRun({ text: safeText(ingredient.name).trim() || '-', font: 'Montserrat', size: 22, bold: true })
      ],
      spacing: { after: 120 }
    })

    const note = safeText(ingredient.note).trim()
    if (note) {
      return [para, makeWordLine(note, { font: 'Montserrat', size: 9, italics: true, color: '999999', spacing: { after: 80 } })]
    }
    return [para]
  })
}

const buildSingleRecipeWordSection = (recipe) => {
  const children = []

  children.push(makeWordLine(getCategory(recipe).toUpperCase(), { font: 'Montserrat', size: 10, color: '888888', spacing: { after: 90 } }))
  children.push(makeRuleParagraph())
  children.push(makeWordLine(safeText(recipe.title).trim(), { font: 'Playfair Display', size: 36, bold: true, spacing: { before: 320, after: 160 } }))

  const meta = getMetaText(recipe)
  if (meta) {
    children.push(makeWordLine(meta, { font: 'Lora', size: 10, color: '888888', spacing: { after: 560 } }))
  }

  children.push(makeWordLine('INGREDIENTES', { font: 'Montserrat', size: 13, bold: true, spacing: { after: 20 } }))
  if (safeText(recipe.servings).trim()) {
    children.push(makeWordLine(safeText(recipe.servings).trim(), { font: 'Open Sans', size: 10, italics: true, color: '888888', alignment: AlignmentType.RIGHT, spacing: { after: 0 } }))
  }
  // Use paragraphs for ingredients instead of a table for better portability
  const ingredientParagraphs = makeIngredientParagraphsWord(Array.isArray(recipe.ingredients) ? recipe.ingredients : [])
  ingredientParagraphs.forEach((p) => children.push(p))

  children.push(makeWordLine('ELABORACIÓN', { font: 'Lora', size: 13, bold: true, spacing: { before: 320, after: 0 } }))
  children.push(makeRuleParagraph())

  ;(Array.isArray(recipe.steps) ? recipe.steps : []).forEach((step, index) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${index + 1}. `, font: 'Open Sans', size: 22, bold: true, color: '1a1a1a' }),
          new TextRun({ text: safeText(typeof step === 'string' ? step : (step && (step.text || ''))).trim() || '-', font: 'Lora', size: 22, color: '1a1a1a' })
        ],
        spacing: { after: 180 },
        lineSpacing: 360
      })
    )
  })

  const tipsText = getTipsText(recipe)
  if (tipsText.trim()) {
    children.push(makeWordLine('CONSEJOS:', { font: 'Lora', size: 11, bold: true, spacing: { before: 220, after: 40 } }))
    children.push(makeWordLine(tipsText.trim(), { font: 'Lora', size: 10, italics: true, color: '444444' }))
  }

  return children
}

const createWordDocument = (sections) => new Document({ sections })

const cookbookFooter = (category) =>
  new Footer({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
          insideHorizontal: { style: BorderStyle.NONE },
          insideVertical: { style: BorderStyle.NONE }
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [makeWordLine(category.toUpperCase(), { font: 'Open Sans', size: 8, color: '888888' })],
                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
              }),
              new TableCell({
                children: [makeWordLine('', { font: 'Open Sans', size: 8, color: '888888', alignment: AlignmentType.RIGHT })],
                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
              })
            ]
          })
        ]
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
      new Paragraph({ children: [new TextRun({ text: 'RECETARIO', font: 'Playfair Display', size: 120, bold: true, color: '1a1a1a' })], alignment: AlignmentType.CENTER, spacing: { before: 700, after: 160 } }),
      new Paragraph({ children: [new TextRun({ text: 'Cocina Tradicional y Gourmet', font: 'Lora', size: 48, color: '1a1a1a' })], alignment: AlignmentType.CENTER, spacing: { after: 90 } }),
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
      new Paragraph({ children: [new TextRun({ text: 'ÍNDICE', font: 'Montserrat', size: 24, bold: true })], spacing: { after: 120 } }),
      makeRuleParagraph(),
      ...ordered.flatMap((category, categoryIndex) => {
        const beforeCount = ordered.slice(0, categoryIndex).reduce((sum, cat) => sum + grouped.get(cat).length + 1, 0)
        const startPage = 3 + beforeCount

        return [
          new Paragraph({ children: [new TextRun({ text: category.toUpperCase(), font: 'Montserrat', size: 12, bold: true })], spacing: { before: 220, after: 100 } }),
          ...grouped.get(category).map((recipe, recipeIndex) => new Paragraph({ children: [new TextRun({ text: dotLeader(`    ${safeText(recipe.title).trim()}`, startPage + 1 + recipeIndex), font: 'Open Sans', size: 11 })], spacing: { after: 30 } }))
        ]
      })
    ]
  })

  ordered.forEach((category) => {
    sections.push({
      properties: { page: { margin: { top: DOCX_MARGIN, right: DOCX_MARGIN, bottom: DOCX_MARGIN, left: DOCX_MARGIN } } },
      children: [
        new Paragraph({ children: [new TextRun({ text: category.toUpperCase(), font: 'Playfair Display', size: 48, bold: true })], alignment: AlignmentType.CENTER, spacing: { before: 1200, after: 120 } }),
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