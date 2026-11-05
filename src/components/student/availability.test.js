import assert from 'node:assert/strict'
import { test } from 'node:test'
import { initialSettings } from '@/data/mockData'
import { blankTimetable, setCell } from '@/lib/timetable'
import {
  dayHasAvailableSlot,
  nextAvailableSlot,
  studentCell,
  studentDayNote,
  studentWeekNote,
  weekHasNoAvailableSlot,
} from './availability.js'

// 2026-11-16 is a Monday. Bookings close 2 days before, at 15h00: on Monday
// evening, Wednesday is closed and Thursday is the first day still open.
const MON = '2026-11-16'
const WED = '2026-11-18'
const THU = '2026-11-19'
const ME = 'stu-1'
const mondayEvening = { date: MON, time: '21:30' }
const mondayMorning = { date: MON, time: '10:00' }

const slot = (id, date, start, end, kind = 'open') => ({ id, date, start, end, kind })
const makeState = ({ slots = [], bookings = [] } = {}) => ({ slots, bookings, settings: initialSettings, messages: [] })

test('an open, free, unlocked slot shows as available', () => {
  const state = makeState({ slots: [slot('a', THU, '09:00', '09:30')] })
  assert.equal(studentCell(state, ME, mondayEvening, THU, '09:00').status, 'available')
})

test('an open slot after the cutoff shows as unavailable', () => {
  const state = makeState({ slots: [slot('a', WED, '09:00', '09:30')] })
  assert.equal(studentCell(state, ME, mondayEvening, WED, '09:00').status, 'unavailable')
})

test("someone else's booking and protected time look the same: unavailable", () => {
  const state = makeState({
    slots: [slot('a', THU, '09:00', '09:30'), slot('p', THU, '09:30', '10:00', 'protected')],
    bookings: [{ id: 'b', slotId: 'a', studentId: 'stu-2', status: 'confirmed' }],
  })
  assert.equal(studentCell(state, ME, mondayEvening, THU, '09:00').status, 'unavailable')
  assert.equal(studentCell(state, ME, mondayEvening, THU, '09:30').status, 'unavailable')
})

test('the day note says why a day has nothing to book', () => {
  const state = makeState({ slots: [slot('a', WED, '09:00', '09:30')] })
  assert.equal(studentDayNote(state, ME, mondayEvening, WED), 'closed')
  assert.equal(studentDayNote(state, ME, mondayEvening, THU), 'none-available')
  assert.equal(studentDayNote(state, ME, mondayMorning, WED), null)
})

test('a locked day says "closed" even without any slot (nothing leaks)', () => {
  assert.equal(studentDayNote(makeState(), ME, mondayEvening, WED), 'closed')
})

test('no day note on a day holding my own booking', () => {
  const state = makeState({
    slots: [slot('a', THU, '09:00', '09:30')],
    bookings: [{ id: 'b', slotId: 'a', studentId: ME, status: 'confirmed' }],
  })
  assert.equal(studentDayNote(state, ME, mondayEvening, THU), null)
})

test('the week note appears only when nothing in the week can be booked', () => {
  const empty = makeState({ slots: [slot('a', WED, '09:00', '09:30')] })
  assert.equal(weekHasNoAvailableSlot(empty, ME, mondayEvening, MON), true)
  assert.equal(weekHasNoAvailableSlot(empty, ME, mondayMorning, MON), false)
})

test('the next available slot skips locked, booked and protected ones', () => {
  const state = makeState({
    slots: [
      slot('locked', WED, '09:00', '09:30'),
      slot('taken', THU, '08:00', '08:30'),
      slot('prot', THU, '08:30', '09:00', 'protected'),
      slot('later', '2026-11-24', '10:00', '10:30'),
      slot('next', THU, '14:00', '14:30'),
    ],
    bookings: [{ id: 'b', slotId: 'taken', studentId: 'stu-2', status: 'confirmed' }],
  })
  assert.equal(nextAvailableSlot(state, mondayEvening).id, 'next')
})

test('no next available slot when nothing can be booked', () => {
  const state = makeState({ slots: [slot('far', '2026-12-15', '09:00', '09:30')] }) // beyond 2 weeks
  assert.equal(nextAvailableSlot(state, mondayEvening), undefined)
})

test('the phone day picker dot marks only days with a slot the student can book', () => {
  const state = makeState({
    slots: [slot('a', THU, '09:00', '09:30'), slot('p', WED, '09:00', '09:30', 'protected'), slot('late', WED, '10:00', '10:30')],
  })
  assert.equal(dayHasAvailableSlot(state, ME, mondayEvening, THU), true)
  assert.equal(dayHasAvailableSlot(state, ME, mondayEvening, WED), false) // protected, and Wednesday is locked
})

// --- Timetable experiment (docs/edt-import-spec.md) -------------------------

// Free all Thursday 8:40–9:35 (+ the recess until 10:05), busy otherwise; this week is Q1.
const thursdayMorningFree = (onlyCompatible = false) => ({
  days: setCell(setCell(blankTimetable(), 'Q1', 4, '08:40', 'free'), 'Q2', 4, '08:40', 'free'),
  anchor: { weekStart: MON, type: 'Q1' },
  onlyCompatible,
})
const twoThursdaySlots = () => [slot('fit', THU, '09:00', '09:30'), slot('clash', THU, '11:00', '11:30')]

test('without a timetable, available cells say nothing about fitting', () => {
  const state = makeState({ slots: twoThursdaySlots() })
  assert.equal(studentCell(state, ME, mondayEvening, THU, '09:00').fits, undefined)
})

test('with a timetable, available cells say whether the slot fits the student’s free time', () => {
  const state = { ...makeState({ slots: twoThursdaySlots() }), timetable: thursdayMorningFree() }
  assert.equal(studentCell(state, ME, mondayEvening, THU, '09:00').fits, true)
  const clash = studentCell(state, ME, mondayEvening, THU, '11:00')
  assert.equal(clash.status, 'available') // still listed while the switch is off
  assert.equal(clash.fits, false)
})

test('« Seulement les créneaux compatibles » hides slots that clash with a class', () => {
  const state = { ...makeState({ slots: twoThursdaySlots() }), timetable: thursdayMorningFree(true) }
  assert.equal(studentCell(state, ME, mondayEvening, THU, '09:00').status, 'available')
  assert.equal(studentCell(state, ME, mondayEvening, THU, '11:00').status, 'unavailable')
})

test('with the switch on, a day whose slots all clash says so', () => {
  const state = {
    ...makeState({ slots: [slot('clash', THU, '11:00', '11:30')] }),
    timetable: thursdayMorningFree(true),
  }
  assert.equal(studentDayNote(state, ME, mondayEvening, THU), 'none-compatible')
  assert.equal(dayHasAvailableSlot(state, ME, mondayEvening, THU), false)
  assert.equal(nextAvailableSlot(state, mondayEvening), undefined)
  assert.equal(weekHasNoAvailableSlot(state, ME, mondayEvening, MON), true)
})

test('the week note says « compatible » only when the switch hides slots', () => {
  const clash = { ...makeState({ slots: [slot('clash', THU, '11:00', '11:30')] }), timetable: thursdayMorningFree(true) }
  assert.equal(studentWeekNote(clash, ME, mondayEvening, MON), 'none-compatible')

  // Switch on, but nothing open at all that week: nothing is hidden.
  const empty = { ...makeState(), timetable: thursdayMorningFree(true) }
  assert.equal(studentWeekNote(empty, ME, mondayEvening, MON), 'none-available')

  // Something to book: no note.
  const fit = { ...makeState({ slots: [slot('fit', THU, '09:00', '09:30')] }), timetable: thursdayMorningFree(true) }
  assert.equal(studentWeekNote(fit, ME, mondayEvening, MON), null)
})
