// Student timetable (EDT) experiment: which of the counselor's slots fit a
// student's classes. See docs/edt-import-spec.md.
//
// A timetable is { Q1: days, Q2: days } (CPF alternates two week types), where
// days[weekday][periodStart] is 'busy', 'free' or 'unsure' (weekday 1 = Monday
// … 5 = Friday). 'unsure' marks a reading that needs the student's check;
// until then it counts as busy, so a wrong reading never creates a false match.

import { startOfWeek } from './dates.js'

export const WEEK_TYPES = ['Q1', 'Q2']
export const WEEKDAYS = [1, 2, 3, 4, 5]
const DAY_NAMES = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi']

// CPF school periods while the counselor is in (Pronote, « Organisation d'une
// journée »). The recesses (9:35–10:05, 15:25–15:40) are not periods: they are
// always free. Lunch is a period, free unless a class is put there.
export const PERIODS = [
  { start: '07:45', end: '08:40' },
  { start: '08:40', end: '09:35' },
  { start: '10:05', end: '11:00' },
  { start: '11:00', end: '11:55' },
  { start: '11:55', end: '12:50' },
  { start: '12:50', end: '13:35', lunch: true },
  { start: '13:35', end: '14:30' },
  { start: '14:30', end: '15:25' },
]
// The student is free only inside these bounds: before 7:45 they may not be
// at school yet, and after 15:25 the periods are not read (she leaves at 15:00).
const DAY_START = PERIODS[0].start
const DAY_END = PERIODS.at(-1).end

// --- Building and editing ---------------------------------------------------

// Every period set to `value` (lunch stays free). Used for manual entry,
// where the student marks their free periods.
export function blankTimetable(value = 'busy') {
  const days = () =>
    Object.fromEntries(
      WEEKDAYS.map((d) => [d, Object.fromEntries(PERIODS.map((p) => [p.start, p.lunch ? 'free' : value]))]),
    )
  return { Q1: days(), Q2: days() }
}

export function setCell(timetable, weekType, weekday, start, value) {
  const week = timetable[weekType]
  return { ...timetable, [weekType]: { ...week, [weekday]: { ...week[weekday], [start]: value } } }
}

// What one tap on a cell of the check grid does: « À vérifier » becomes
// « Cours » (the safe choice), then « Cours » and « Libre » alternate.
export const nextCellValue = (value) => (value === 'busy' ? 'free' : 'busy')

// « À vérifier » cells left, in all week types or only those given.
export const countUnsure = (timetable, weekTypes = WEEK_TYPES) =>
  weekTypes.flatMap((w) => WEEKDAYS.flatMap((d) => Object.values(timetable[w][d]))).filter((v) => v === 'unsure')
    .length

// --- Week types --------------------------------------------------------------

export const otherWeekType = (type) => (type === 'Q1' ? 'Q2' : 'Q1')

const daysBetween = (from, to) => (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000

// Q1 or Q2 for `date`. `anchor` = { weekStart, type }: the week the student
// named (its Monday) and its type; from there the types alternate every
// calendar week, holidays included (decided 2026-10-29, to check with the school).
export function weekTypeOn(date, anchor) {
  const weeks = Math.round(daysBetween(anchor.weekStart, startOfWeek(date)) / 7)
  return weeks % 2 === 0 ? anchor.type : otherWeekType(anchor.type)
}

// --- Matching ----------------------------------------------------------------

const weekdayOf = (date) => new Date(`${date}T00:00:00Z`).getUTCDay() // 1 = Monday

// The student's free time on one weekday of one week type, as
// [{ start, end }] blocks ("HH:MM"), recesses and lunch merged in.
export function freeIntervals(days, weekday) {
  const busy = PERIODS.filter((p) => days[weekday]?.[p.start] !== 'free')
  const free = []
  let from = DAY_START
  for (const p of busy) {
    if (p.start > from) free.push({ start: from, end: p.start })
    if (p.end > from) from = p.end
  }
  if (from < DAY_END) free.push({ start: from, end: DAY_END })
  return free
}

// True when the whole slot falls inside the student's free time that week.
export function slotFits(timetable, anchor, slot) {
  const weekday = weekdayOf(slot.date)
  if (!WEEKDAYS.includes(weekday)) return false
  const days = timetable[weekTypeOn(slot.date, anchor)]
  return freeIntervals(days, weekday).some((f) => f.start <= slot.start && slot.end <= f.end)
}

// --- Reading the PDF geometry (edtPdf.js) ------------------------------------

// Drawing noise allowed when lining things up (PDF units, 1/72 inch).
const TOL = 1.5

const fail = (reason) => ({ ok: false, reason })

// "7h45" -> "07:45", or null.
function clock(text) {
  const m = /^(\d{1,2})h(\d{2})$/.exec(text)
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : null
}

const centre = (box) => ({ x: box.x + box.w / 2, y: box.y + box.h / 2 })
const inside = (point, box) =>
  point.x >= box.x0 - TOL && point.x <= box.x1 + TOL && point.y >= box.y0 - TOL && point.y <= box.y1 + TOL

// The five day columns, from the day names at the top of the grid.
function readColumns(labels) {
  const headers = DAY_NAMES.map((name) => labels.filter((l) => l.text.toLowerCase() === name))
  if (headers.some((h) => h.length !== 1)) return null
  const centres = headers.map(([l]) => centre(l).x)
  const gaps = centres.slice(1).map((c, i) => c - centres[i])
  const step = gaps.reduce((a, b) => a + b, 0) / gaps.length
  if (gaps.some((g) => g <= 0 || Math.abs(g - step) > step * 0.05)) return null
  return centres.map((c) => ({ x0: c - step / 2, x1: c + step / 2 }))
}

// The time axis: one row per period as drawn, from the tick marks left of the
// grid and the time labels next to them. Pronote draws every period with the
// same height and recesses as a line with no height (two labels on one tick),
// so the times come from the labels, not from the distances.
function readRows(labels, hlines, gridLeft) {
  const ys = hlines
    .filter((l) => l.x1 <= gridLeft + TOL && l.x1 - l.x0 < 30)
    .map((l) => l.y)
    .sort((a, b) => b - a) // top of the page first
  const ticks = ys.filter((y, i) => i === 0 || ys[i - 1] - y > TOL)
  if (ticks.length < 2) return null
  const minGap = Math.min(...ticks.slice(1).map((y, i) => ticks[i] - y))

  const timesAt = ticks.map(() => [])
  for (const label of labels) {
    const time = clock(label.text)
    if (!time || label.x > gridLeft) continue
    const y = centre(label).y
    const nearest = ticks.reduce((best, t, i) => (Math.abs(t - y) < Math.abs(ticks[best] - y) ? i : best), 0)
    if (Math.abs(ticks[nearest] - y) > minGap / 2) return null
    timesAt[nearest].push(time)
  }
  if (timesAt.some((times) => times.length === 0 || times.length > 2)) return null

  const rows = []
  for (let i = 0; i < ticks.length - 1; i++) {
    const start = timesAt[i].toSorted().at(-1) // the later label starts the row
    const end = timesAt[i + 1].toSorted()[0]
    if (start >= end) return null
    rows.push({ start, end, y1: ticks[i], y0: ticks[i + 1] })
  }
  return { rows, ticks }
}

// Geometry of a Pronote timetable PDF -> { ok: true, timetable } or
// { ok: false, reason }. Only well-understood layouts are read; anything odd
// makes the cells it touches 'unsure', or the whole reading fail, so the
// student checks or types the timetable instead.
export function parseTimetable(geometry) {
  if (geometry.pages !== 1) return fail('pages')
  const columns = readColumns(geometry.labels)
  if (!columns) return fail('days')
  const gridLeft = columns[0].x0
  const axis = readRows(geometry.labels, geometry.hlines, gridLeft)
  if (!axis) return fail('axis')
  const { rows, ticks } = axis

  // The rows during her hours must be exactly the CPF periods.
  const shown = rows.filter((r) => r.start < DAY_END && r.end > DAY_START)
  const same =
    shown.length === PERIODS.length && shown.every((r, i) => r.start === PERIODS[i].start && r.end === PERIODS[i].end)
  if (!same) return fail('periods')

  const rowHeight = Math.min(...rows.map((r) => r.y1 - r.y0))
  const grid = { y0: ticks.at(-1), y1: ticks[0] }
  const columnAt = (x) => columns.findIndex((c) => x >= c.x0 && x <= c.x1)
  const periodAt = (y) => shown.find((r) => y >= r.y0 && y <= r.y1)

  const marks = { Q1: {}, Q2: {} } // marks[week]["weekday start"] = 'busy' | 'unsure'
  const mark = (weeks, column, start, value) => {
    for (const w of weeks) {
      const key = `${column + 1} ${start}`
      if (marks[w][key] !== 'unsure') marks[w][key] = value
    }
  }
  const tags = geometry.labels.filter((l) => /^Q[12]$/i.test(l.text))

  // Classes: filled, coloured rectangles inside one weekday column.
  const blocks = geometry.fills.filter((f) => {
    const c = { x: (f.x0 + f.x1) / 2, y: (f.y0 + f.y1) / 2 }
    return (
      f.color !== 'white' &&
      f.x1 - f.x0 >= (columns[0].x1 - columns[0].x0) * 0.3 &&
      f.y1 - f.y0 >= rowHeight * 0.5 &&
      c.y >= grid.y0 &&
      c.y <= grid.y1 &&
      columnAt(c.x) !== -1
    )
  })
  if (blocks.length === 0) return fail('no-classes')

  for (const block of blocks) {
    const column = columnAt((block.x0 + block.x1) / 2)
    const fitsColumn = block.x0 >= columns[column].x0 - TOL && block.x1 <= columns[column].x1 + TOL
    const onTick = (y) => ticks.some((t) => Math.abs(t - y) <= TOL)
    const aligned = fitsColumn && onTick(block.y0) && onTick(block.y1)
    const blockTags = new Set(tags.filter((t) => inside(centre(t), block)).map((t) => t.text.toUpperCase()))
    const weeks = blockTags.size === 1 ? [...blockTags] : WEEK_TYPES
    const value = aligned && blockTags.size < 2 ? 'busy' : 'unsure'
    for (const row of shown) {
      const overlap = Math.min(block.y1, row.y1) - Math.max(block.y0, row.y0)
      if (overlap > TOL) mark(weeks, column, row.start, value)
    }
  }

  // Text in the grid that no class rectangle explains (a Q tag on its own, or
  // a class drawn in a way we don't recognise): that cell needs checking.
  // (Anonymous texts are already reduced to their centre point.)
  const unexplained = [...tags.map(centre), ...geometry.texts].filter((p) => !blocks.some((b) => inside(p, b)))
  for (const { x, y } of unexplained) {
    const column = columnAt(x)
    const row = periodAt(y)
    if (column !== -1 && row) mark(WEEK_TYPES, column, row.start, 'unsure')
  }

  let timetable = blankTimetable('free')
  for (const w of WEEK_TYPES) {
    for (const [key, value] of Object.entries(marks[w])) {
      const [weekday, start] = key.split(' ')
      timetable = setCell(timetable, w, Number(weekday), start, value)
    }
  }
  return { ok: true, timetable }
}

