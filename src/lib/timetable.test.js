import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import {
  PERIODS,
  blankTimetable,
  countUnsure,
  freeIntervals,
  nextCellValue,
  parseTimetable,
  setCell,
  slotFits,
  weekTypeOn,
} from './timetable.js'

// Nameless geometry of the real sample timetable (scripts/edt-fixture.mjs).
const SAMPLE = JSON.parse(readFileSync(new URL('../data/edtSampleGeometry.json', import.meta.url), 'utf8'))
const sample = () => structuredClone(SAMPLE)

// One string per weekday, one character per period (PERIODS order:
// 7:45 8:40 10:05 11:00 11:55 12:50 13:35 14:30): X busy, . free, ? unsure.
const CHAR = { busy: 'X', free: '.', unsure: '?' }
const picture = (days) => [1, 2, 3, 4, 5].map((d) => PERIODS.map((p) => CHAR[days[d][p.start]]).join(''))

// Read by hand from the sample PDF.
const EXPECTED = {
  Q1: ['XX.XX.XX', 'XXXXX.XX', 'XXXX..X.', 'XXXXX...', 'XXXXX.XX'],
  Q2: ['XX.XX.XX', 'XXXXX.XX', 'XXXX....', 'XXXXX..X', 'XXXXX.XX'],
}

// 2026-11-16 is a Monday.
const anchor = { weekStart: '2026-11-16', type: 'Q1' }
const slot = (date, start, end) => ({ id: `${date}-${start}`, date, start, end, kind: 'open' })

// --- The test data is nameless ------------------------------------------------

test('the sample geometry keeps only times, day names and Q1/Q2 as text', () => {
  for (const { text } of SAMPLE.labels) {
    assert.match(text, /^(\d{1,2}h\d{2}|lundi|mardi|mercredi|jeudi|vendredi|samedi|Q1|Q2)$/)
  }
  // Other texts are positions only.
  for (const t of SAMPLE.texts) assert.deepEqual(Object.keys(t).sort(), ['h', 'w', 'x', 'y'])
})

// --- Reading the sample -------------------------------------------------------

test('the sample timetable is read exactly, for Q1 and Q2', () => {
  const result = parseTimetable(sample())
  assert.equal(result.ok, true)
  assert.deepEqual(picture(result.timetable.Q1), EXPECTED.Q1)
  assert.deepEqual(picture(result.timetable.Q2), EXPECTED.Q2)
  assert.equal(countUnsure(result.timetable), 0)
})

// --- A wrong reading never turns into free time -----------------------------

test('a class the reader does not recognise leaves its cell « À vérifier », not free', () => {
  const g = sample()
  // Wednesday 11:00–11:55 (English): drawn in white, so not seen as a class.
  const block = g.fills.find((f) => f.color === '#e4c5c5' && f.x0 > 300 && f.x0 < 320)
  block.color = '#ffffff'
  const { timetable } = parseTimetable(g)
  assert.equal(timetable.Q1[3]['11:00'], 'unsure')
  assert.equal(timetable.Q2[3]['11:00'], 'unsure')
})

test('a class that does not line up with the periods is « À vérifier »', () => {
  const g = sample()
  // Monday 7:45–8:40, shifted down by a third of a period.
  const block = g.fills.find((f) => f.x0 === 56.6 && f.y1 === 529.1 && f.color !== '#ffffff')
  block.y0 -= 13
  block.y1 -= 13
  const { timetable } = parseTimetable(g)
  assert.equal(timetable.Q1[1]['07:45'], 'unsure')
  assert.equal(timetable.Q1[1]['08:40'], 'unsure')
})

test('a class only partly covering a period makes the whole period busy', () => {
  const g = sample()
  // Monday 10:05–11:00 is free; add a class over its top half.
  g.fills.push({ x0: 56.6, y0: 428, y1: 448.5, x1: 182.8, color: '#abcdef' })
  const { timetable } = parseTimetable(g)
  assert.notEqual(timetable.Q1[1]['10:05'], 'free')
})

test('a Q tag outside any class makes its cell « À vérifier » for both weeks', () => {
  const g = sample()
  // Monday 10:05–11:00 is free in the sample.
  g.labels.push({ text: 'Q1', x: 170, y: 410, w: 9.3, h: 7 })
  const { timetable } = parseTimetable(g)
  assert.equal(timetable.Q1[1]['10:05'], 'unsure')
  assert.equal(timetable.Q2[1]['10:05'], 'unsure')
})

test('a layout that is not the CPF one is not read at all', () => {
  const noDays = sample()
  noDays.labels = noDays.labels.filter((l) => l.text !== 'mercredi')
  assert.deepEqual(parseTimetable(noDays), { ok: false, reason: 'days' })

  const noTicks = sample()
  noTicks.hlines = []
  assert.deepEqual(parseTimetable(noTicks), { ok: false, reason: 'axis' })

  const otherTimes = sample()
  otherTimes.labels.find((l) => l.text === '10h05').text = '10h00'
  assert.deepEqual(parseTimetable(otherTimes), { ok: false, reason: 'periods' })

  const twoPages = sample()
  twoPages.pages = 2
  assert.deepEqual(parseTimetable(twoPages), { ok: false, reason: 'pages' })

  const noClasses = sample()
  noClasses.fills = noClasses.fills.filter((f) => f.color === '#ffffff')
  assert.deepEqual(parseTimetable(noClasses), { ok: false, reason: 'no-classes' })
})

// --- Manual entry and corrections -----------------------------------------------

test('manual entry starts with every period « Cours », except lunch', () => {
  const t = blankTimetable()
  assert.deepEqual(picture(t.Q1), Array(5).fill('XXXXX.XX'))
  assert.deepEqual(picture(t.Q2), Array(5).fill('XXXXX.XX'))
})

test('a tap turns « À vérifier » into « Cours », then switches Cours / Libre', () => {
  assert.equal(nextCellValue('unsure'), 'busy')
  assert.equal(nextCellValue('busy'), 'free')
  assert.equal(nextCellValue('free'), 'busy')
})

test('setCell changes one cell of one week type only', () => {
  const t = setCell(blankTimetable(), 'Q2', 3, '10:05', 'free')
  assert.equal(t.Q2[3]['10:05'], 'free')
  assert.equal(t.Q1[3]['10:05'], 'busy')
  assert.equal(blankTimetable().Q2[3]['10:05'], 'busy')
})

// --- Week types -----------------------------------------------------------------

test('Q1 and Q2 alternate every calendar week from the week the student named', () => {
  assert.equal(weekTypeOn('2026-11-16', anchor), 'Q1')
  assert.equal(weekTypeOn('2026-11-20', anchor), 'Q1') // same week, Friday
  assert.equal(weekTypeOn('2026-11-23', anchor), 'Q2')
  assert.equal(weekTypeOn('2026-11-30', anchor), 'Q1')
  assert.equal(weekTypeOn('2026-11-09', anchor), 'Q2') // the week before
  assert.equal(weekTypeOn('2026-11-19', { weekStart: '2026-11-16', type: 'Q2' }), 'Q2')
})

// --- Matching -------------------------------------------------------------------

test('free time merges free periods with recesses and lunch', () => {
  const { timetable } = parseTimetable(sample())
  // Monday: classes 7:45–9:35, 11:00–12:50 and 13:35–15:25.
  assert.deepEqual(freeIntervals(timetable.Q1, 1), [
    { start: '09:35', end: '11:00' },
    { start: '12:50', end: '13:35' },
  ])
  // Thursday in Q1: free from 12:50 to the end of the periods read.
  assert.deepEqual(freeIntervals(timetable.Q1, 4), [
    { start: '09:35', end: '10:05' },
    { start: '12:50', end: '15:25' },
  ])
})

test('a slot fits only if it is entirely inside the student’s free time', () => {
  const { timetable } = parseTimetable(sample())
  const fits = (date, start, end) => slotFits(timetable, anchor, slot(date, start, end))
  const MON = '2026-11-16'
  assert.equal(fits(MON, '09:30', '10:00'), false) // starts during a class
  assert.equal(fits(MON, '10:00', '10:30'), true) // recess + free period
  assert.equal(fits(MON, '10:30', '11:00'), true)
  assert.equal(fits(MON, '11:00', '11:30'), false)
  assert.equal(fits(MON, '12:30', '13:00'), false) // lunch starts at 12:50
  assert.equal(fits(MON, '13:00', '13:30'), true)
  assert.equal(fits(MON, '07:30', '08:00'), false) // before the school day
})

test('a slot is matched against that week’s type', () => {
  const { timetable } = parseTimetable(sample())
  // Wednesday 13:35–14:30 has a class in Q1 weeks only.
  const fits = (date) => slotFits(timetable, anchor, slot(date, '14:00', '14:30'))
  assert.equal(fits('2026-11-18'), false) // Q1
  assert.equal(fits('2026-11-25'), true) // Q2
})

test('« À vérifier » counts as busy', () => {
  const t = setCell(blankTimetable('free'), 'Q1', 1, '10:05', 'unsure')
  assert.equal(slotFits(t, anchor, slot('2026-11-16', '10:00', '10:30')), false)
  assert.equal(slotFits(t, anchor, slot('2026-11-16', '09:30', '10:00')), true)
})
