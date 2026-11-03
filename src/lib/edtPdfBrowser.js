// Browser side of the timetable import: loads pdf.js only when a student
// picks a file (it is large), reads the PDF on their device (nothing is sent
// anywhere), and returns the result of parseTimetable (timetable.js).

import { readTimetableGeometry } from './edtPdf.js'
import { parseTimetable } from './timetable.js'

let pdfjsPromise
function loadPdfjs() {
  pdfjsPromise ??= Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]).then(
    ([pdfjs, worker]) => {
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default
      return pdfjs
    },
    (error) => {
      pdfjsPromise = undefined // e.g. offline: try again next time
      throw error
    },
  )
  return pdfjsPromise
}

// A File from <input type="file"> -> { ok: true, timetable } or { ok: false, reason }.
// The student only sees « Nous n'avons pas pu lire ce PDF »; the console
// says why, so a bug can be told apart from an unexpected PDF layout.
export async function readTimetableFile(file) {
  let result
  try {
    const pdfjs = await loadPdfjs()
    const geometry = await readTimetableGeometry(pdfjs, new Uint8Array(await file.arrayBuffer()))
    result = parseTimetable(geometry)
  } catch (error) {
    // Not a PDF, damaged, password-protected, pdf.js failed to load, or a bug.
    console.warn('[EDT] The PDF could not be read:', error)
    return { ok: false, reason: 'unreadable' }
  }
  if (!result.ok) console.warn(`[EDT] Unexpected timetable layout (reason: ${result.reason}).`)
  return result
}
