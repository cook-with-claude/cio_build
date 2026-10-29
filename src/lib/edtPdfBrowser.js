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
export async function readTimetableFile(file) {
  try {
    const pdfjs = await loadPdfjs()
    const geometry = await readTimetableGeometry(pdfjs, new Uint8Array(await file.arrayBuffer()))
    return parseTimetable(geometry)
  } catch {
    // Not a PDF, damaged, password-protected…: the student types it in instead.
    return { ok: false, reason: 'unreadable' }
  }
}
