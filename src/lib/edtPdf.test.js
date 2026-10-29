import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import { readTimetableGeometry, textGeometry } from './edtPdf.js'

// The real sample PDF is private (gitignored), so this test only runs on a
// computer that has it; elsewhere it is skipped.
const PDF = new URL('../../private-samples/edt-sample.pdf', import.meta.url)
const FIXTURE = new URL('./edtSampleGeometry.json', import.meta.url)

test('reading the real sample PDF gives exactly the committed nameless geometry', { skip: !existsSync(PDF) }, async () => {
  const geometry = await readTimetableGeometry(pdfjs, new Uint8Array(readFileSync(PDF)))
  assert.deepEqual(geometry, JSON.parse(readFileSync(FIXTURE, 'utf8')))
})

test('only times, day names and Q1/Q2 keep their words; other text becomes a point', () => {
  const at = (str) => ({ str, transform: [7, 0, 0, 7, 10, 20], width: 15, height: 7 })
  const { labels, texts } = textGeometry([at('8h40'), at('mardi'), at('Q2'), at('MATHS SPE'), at('Élève Test 1'), at(' ')])
  assert.deepEqual(
    labels.map((l) => l.text),
    ['8h40', 'mardi', 'Q2'],
  )
  assert.deepEqual(texts, [
    { x: 17.5, y: 23.5 },
    { x: 17.5, y: 23.5 },
  ])
})
