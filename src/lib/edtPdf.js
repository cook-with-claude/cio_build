// Reads a Pronote timetable PDF (« Mon emploi du temps », Année scolaire)
// into plain, nameless geometry that parseTimetable (timetable.js) turns into
// free and busy periods. Experiment: see docs/edt-import-spec.md.
//
// Privacy: the only words kept are the time labels (« 7h45 »), the day names
// and the « Q1 » / « Q2 » tags. Every other text (subjects, teachers, rooms,
// the student's name) is reduced to the point at its centre, and colours to
// "white" or "coloured", so no name, not even its length, leaves this file.
//
// `pdfjs` is the pdf.js module, passed in by the caller: the browser loads it
// only when a student opens the import (edtPdfBrowser.js); the tests load
// the Node build.
//
// Coordinates are PDF units (1/72 inch), with y going UP from the bottom of
// the page, as in the PDF itself.

const KEPT_TEXT = /^(\d{1,2}h\d{2}|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|Q1|Q2)$/i

const round = (n) => Math.round(n * 10) / 10

// [x0, y0, x1, y1] of the box (x0, y0)-(x1, y1) once the transform `m` is applied.
function transformBox(m, x0, y0, x1, y1) {
  const corners = [
    [x0, y0],
    [x1, y0],
    [x0, y1],
    [x1, y1],
  ].map(([x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]])
  const xs = corners.map((c) => c[0])
  const ys = corners.map((c) => c[1])
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)].map(round)
}

const multiply = (m, n) => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
]

// Text items -> kept labels (with their text and box) and anonymous points.
export function textGeometry(items) {
  const labels = []
  const texts = []
  for (const item of items) {
    const text = item.str?.trim()
    if (!text) continue
    const [x, y, w, h] = [item.transform[4], item.transform[5], item.width, item.height]
    if (KEPT_TEXT.test(text)) labels.push({ text, x: round(x), y: round(y), w: round(w), h: round(h) })
    else texts.push({ x: round(x + w / 2), y: round(y + h / 2) })
  }
  return { labels, texts }
}

// Drawing commands -> filled shapes ("white" or "coloured") and horizontal lines.
// Each shape is reduced to its bounding box: Pronote draws every class as a
// plain rectangle.
export function shapeGeometry(operatorList, OPS) {
  const FILLS = new Set([OPS.fill, OPS.eoFill, OPS.fillStroke, OPS.eoFillStroke, OPS.closeFillStroke, OPS.closeEOFillStroke])
  const STROKES = new Set([OPS.stroke, OPS.closeStroke])
  // Colours set some other way (patterns, other colour spaces) count as
  // coloured: never mistaken for the white background.
  const OTHER_FILL_COLOURS = new Set([OPS.setFillGray, OPS.setFillCMYKColor, OPS.setFillColor, OPS.setFillColorN, OPS.setFillColorSpace])

  const fills = []
  const hlines = []
  let state = { m: [1, 0, 0, 1, 0, 0], fill: 'coloured' }
  const stack = []
  const { fnArray, argsArray } = operatorList

  for (let i = 0; i < fnArray.length; i++) {
    const fn = fnArray[i]
    const args = argsArray[i]
    if (fn === OPS.save) stack.push(state)
    else if (fn === OPS.restore) state = stack.pop() ?? state
    else if (fn === OPS.transform) state = { ...state, m: multiply(state.m, args) }
    else if (fn === OPS.paintFormXObjectBegin) {
      stack.push(state)
      if (args?.[0]) state = { ...state, m: multiply(state.m, args[0]) }
    } else if (fn === OPS.paintFormXObjectEnd) state = stack.pop() ?? state
    else if (fn === OPS.setFillRGBColor) {
      state = { ...state, fill: String(args[0]).toLowerCase() === '#ffffff' ? 'white' : 'coloured' }
    } else if (OTHER_FILL_COLOURS.has(fn)) state = { ...state, fill: 'coloured' }
    else if (fn === OPS.constructPath) {
      const [paintOp, , minMax] = args
      if (!minMax) continue
      const [x0, y0, x1, y1] = transformBox(state.m, minMax[0], minMax[1], minMax[2], minMax[3])
      // Tiny fills are the dots of the dashed recess lines: not classes.
      const tiny = x1 - x0 < 4 && y1 - y0 < 4
      if (FILLS.has(paintOp) && !tiny) fills.push({ x0, y0, x1, y1, color: state.fill })
      else if (STROKES.has(paintOp) && y1 - y0 < 0.5 && x1 > x0) hlines.push({ x0, x1, y: y0 })
    }
  }
  return { fills, hlines }
}

// The whole PDF (bytes) -> geometry of its first page, plus the page count.
export async function readTimetableGeometry(pdfjs, data) {
  const task = pdfjs.getDocument({ data, verbosity: pdfjs.VerbosityLevel.ERRORS })
  try {
    const doc = await task.promise
    const page = await doc.getPage(1)
    const { items } = await page.getTextContent()
    const operatorList = await page.getOperatorList()
    return { pages: doc.numPages, ...textGeometry(items), ...shapeGeometry(operatorList, pdfjs.OPS) }
  } finally {
    await task.destroy()
  }
}
