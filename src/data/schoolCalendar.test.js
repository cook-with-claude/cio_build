import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DEMO_STUDENT_ID, buildSchedule, initialSettings } from '@/data/mockData'
import { dayOffLabel, isSchoolDay, nextSchoolDay, previousSchoolDay } from '@/lib/dates'
import { isLocked, lockMoment } from '@/lib/rules'
import { dayHasEmptyCell, reducer } from '@/state/useDemoStore'
import { studentCell } from '@/components/student/availability'
import { SCHOOL_YEARS } from './schoolCalendar.js'

const isDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d))

// --- The data itself ---------------------------------------------------------

test('every school year is well formed and in order', () => {
  SCHOOL_YEARS.forEach((year, i) => {
    assert.ok(isDate(year.firstDay) && isDate(year.lastDay), year.name)
    assert.ok(year.firstDay < year.lastDay, year.name)
    if (i > 0) assert.ok(SCHOOL_YEARS[i - 1].lastDay < year.firstDay, `${year.name} comes after the year before`)
    for (const off of year.daysOff) {
      assert.ok(isDate(off.from) && (off.to === undefined || isDate(off.to)), off.label)
      assert.ok(off.from <= (off.to ?? off.from), `${off.label}: "from" is not after "to"`)
      assert.ok(off.label.trim().length > 0)
    }
  })
})

// --- 2026-2027 ---------------------------------------------------------------

test('holidays and breaks of 2026-2027 are not school days', () => {
  assert.equal(dayOffLabel('2026-10-28'), 'Vacances de mi-trimestre')
  assert.equal(dayOffLabel('2026-12-25'), 'Vacances de Noël')
  assert.equal(dayOffLabel('2027-01-01'), 'Vacances de Noël')
  assert.equal(dayOffLabel('2027-01-06'), 'Noël arménien')
  assert.equal(dayOffLabel('2027-02-17'), 'Vacances d’hiver')
  assert.equal(dayOffLabel('2027-03-10'), 'Fitr')
  assert.equal(dayOffLabel('2027-04-14'), 'Vacances de printemps')
  assert.equal(dayOffLabel('2027-05-17'), 'Adha')
  for (const d of ['2026-10-26', '2026-10-30', '2026-12-21', '2027-01-06', '2027-03-29', '2027-05-03']) {
    assert.equal(isSchoolDay(d), false, d)
  }
})

test('ordinary weekdays are school days, weekends are not', () => {
  assert.equal(isSchoolDay('2026-11-02'), true) // Monday after the mid-term break
  assert.equal(isSchoolDay('2027-01-04'), true) // Monday after Christmas
  assert.equal(isSchoolDay('2027-01-05'), true) // Tuesday before Armenian Christmas
  assert.equal(isSchoolDay('2026-11-07'), false) // Saturday
  assert.equal(dayOffLabel('2026-11-07'), null) // a weekend is not a holiday
})

test('school days skip holidays in both directions', () => {
  assert.equal(previousSchoolDay('2026-11-02'), '2026-10-23') // last day before the mid-term break
  assert.equal(nextSchoolDay('2026-12-18'), '2027-01-04') // over Christmas
  assert.equal(nextSchoolDay('2027-01-05'), '2027-01-07') // over Armenian Christmas
  assert.equal(previousSchoolDay('2027-03-30'), '2027-03-24') // over Annonciation, Good Friday, Easter Monday
})

test('the cutoff falls on the last school day before a holiday', () => {
  // Monday 2 November locks on Friday 23 October at 15h00, before the break.
  assert.deepEqual(lockMoment('2026-11-02', initialSettings), { date: '2026-10-23', time: '15:00' })
  assert.equal(isLocked('2026-11-02', { date: '2026-10-23', time: '14:59' }, initialSettings), false)
  assert.equal(isLocked('2026-11-02', { date: '2026-10-28', time: '10:00' }, initialSettings), true)
})

// --- Summer and missing years -----------------------------------------------

const TWO_YEARS = [
  { name: 'A', firstDay: '2030-09-16', lastDay: '2031-06-27', daysOff: [] },
  { name: 'B', firstDay: '2031-09-15', lastDay: '2032-06-25', daysOff: [] },
]

test('the summer between two listed years is a holiday', () => {
  assert.equal(dayOffLabel('2031-07-15', TWO_YEARS), 'Vacances d’été')
  assert.equal(dayOffLabel('2031-06-27', TWO_YEARS), null) // last day of year A
  assert.equal(dayOffLabel('2031-09-15', TWO_YEARS), null) // first day of year B
})

test('after the last listed year, weekdays count as school days (calendar not added yet)', () => {
  assert.equal(dayOffLabel('2032-09-14', TWO_YEARS), null)
})

// --- The app on holidays -----------------------------------------------------

const MID_TERM_DAY = '2026-10-28'
const makeState = (slots = []) => ({ slots, bookings: [], settings: initialSettings, messages: [], notifications: [] })

test('she cannot open or protect time on a holiday', () => {
  let state = reducer(makeState(), { type: 'toggleCell', date: MID_TERM_DAY, start: '09:00', kind: 'open' })
  assert.equal(state.slots.length, 0)
  state = reducer(state, { type: 'openDay', date: MID_TERM_DAY })
  assert.equal(state.slots.length, 0)
  assert.equal(dayHasEmptyCell([], MID_TERM_DAY, 30), false)
})

test('she can still close a slot set on a day that became a holiday', () => {
  const s = { id: 'old', date: MID_TERM_DAY, start: '09:00', end: '09:30', kind: 'open' }
  const state = reducer(makeState([s]), { type: 'toggleCell', date: MID_TERM_DAY, start: '09:00', kind: 'open' })
  assert.equal(state.slots.length, 0)
})

test('copying last week skips holidays', () => {
  // Week of 19 Oct (school) -> week of 26 Oct (mid-term break): nothing to copy.
  const s = { id: 'l', date: '2026-10-19', start: '09:00', end: '09:30', kind: 'open' }
  const state = reducer(makeState([s]), { type: 'copyPreviousWeek', weekStart: '2026-10-26', today: '2026-10-19', batchId: 'c' })
  assert.deepEqual(state.slots.map((x) => x.id), ['l'])
})

test('a student can never book a slot on a holiday', () => {
  // Christmas break, seen from a school day well before its cutoff.
  const s = { id: 'x', date: '2026-12-21', start: '09:00', end: '09:30', kind: 'open' }
  const now = { date: '2026-12-15', time: '10:00' }
  assert.equal(studentCell(makeState([s]), DEMO_STUDENT_ID, now, '2026-12-21', '09:00').status, 'unavailable')
})

test('the fake data never puts a slot on a holiday, even when shown during one', () => {
  for (const today of ['2026-10-23', '2026-10-28', '2026-12-17', '2026-12-23', '2027-04-14']) {
    for (const s of buildSchedule(today).slots) assert.ok(isSchoolDay(s.date), `${today}: ${s.id} on ${s.date}`)
  }
})
