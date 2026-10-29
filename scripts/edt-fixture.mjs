// Turns the private sample timetable (private-samples/edt-sample.pdf, never
// committed) into the nameless test data src/data/edtSampleGeometry.json:
// times, day names, Q1/Q2 tags and shapes only (see src/lib/edtPdf.js).
//
// Run it again only if the sample PDF changes:
//   node scripts/edt-fixture.mjs

import { readFileSync, writeFileSync } from 'node:fs'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import { readTimetableGeometry } from '../src/lib/edtPdf.js'

const pdf = new URL('../private-samples/edt-sample.pdf', import.meta.url)
const out = new URL('../src/data/edtSampleGeometry.json', import.meta.url)

const geometry = await readTimetableGeometry(pdfjs, new Uint8Array(readFileSync(pdf)))

// One item per line: readable in a diff, and still small.
const lines = (items) => `[\n    ${items.map((item) => JSON.stringify(item)).join(',\n    ')}\n  ]`
const json = `{
  "pages": ${geometry.pages},
  "labels": ${lines(geometry.labels)},
  "texts": ${lines(geometry.texts)},
  "fills": ${lines(geometry.fills)},
  "hlines": ${lines(geometry.hlines)}
}
`
writeFileSync(out, json)
console.log(`Wrote ${out.pathname}: ${geometry.labels.length} labels, ${geometry.texts.length} anonymous texts, ${geometry.fills.length} fills, ${geometry.hlines.length} lines.`)
