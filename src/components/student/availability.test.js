import assert from 'node:assert/strict'
import { test } from 'node:test'
import { initialSettings } from '@/data/mockData'
import { nextAvailableSlot, studentCell, studentDayNote, weekHasNoAvailableSlot } from './availability.js'

// 2026-11-02 is a Monday.
const MON = '2026-11-02'
const TUE = '2026-11-03'
const WED = '2026-11-04'
const ME = 'stu-1'
const mondayEvening = { date: MON, time: '21:30' }
const mondayMorning = { date: MON, time: '10:00' }

const slot = (id, date, start, end, kind = 'open') => ({ id, date, start, end, kind })
const makeState = ({ slots = [], bookings = [] } = {}) => ({ slots, bookings, settings: initialSettings, messages: [] })

test('an open, free, unlocked slot shows as available', () => {
  const state = makeState({ slots: [slot('a', WED, '09:00', '09:30')] })
  assert.equal(studentCell(state, ME, mondayEvening, WED, '09:00').status, 'available')
})

test('an open slot after the cutoff shows as unavailable', () => {
  const state = makeState({ slots: [slot('a', TUE, '09:00', '09:30')] })
  assert.equal(studentCell(state, ME, mondayEvening, TUE, '09:00').status, 'unavailable')
})

test("someone else's booking and protected time look the same: unavailable", () => {
  const state = makeState({
    slots: [slot('a', WED, '09:00', '09:30'), slot('p', WED, '09:30', '10:00', 'protected')],
    bookings: [{ id: 'b', slotId: 'a', studentId: 'stu-2', status: 'confirmed' }],
  })
  assert.equal(studentCell(state, ME, mondayEvening, WED, '09:00').status, 'unavailable')
  assert.equal(studentCell(state, ME, mondayEvening, WED, '09:30').status, 'unavailable')
})

test('the day note says why a day has nothing to book', () => {
  const state = makeState({ slots: [slot('a', TUE, '09:00', '09:30')] })
  assert.equal(studentDayNote(state, ME, mondayEvening, TUE), 'closed')
  assert.equal(studentDayNote(state, ME, mondayEvening, WED), 'none-available')
  assert.equal(studentDayNote(state, ME, mondayMorning, TUE), null)
})

test('a locked day says "closed" even without any slot (nothing leaks)', () => {
  assert.equal(studentDayNote(makeState(), ME, mondayEvening, TUE), 'closed')
})

test('no day note on a day holding my own booking', () => {
  const state = makeState({
    slots: [slot('a', WED, '09:00', '09:30')],
    bookings: [{ id: 'b', slotId: 'a', studentId: ME, status: 'confirmed' }],
  })
  assert.equal(studentDayNote(state, ME, mondayEvening, WED), null)
})

test('the week note appears only when nothing in the week can be booked', () => {
  const empty = makeState({ slots: [slot('a', TUE, '09:00', '09:30')] })
  assert.equal(weekHasNoAvailableSlot(empty, ME, mondayEvening, MON), true)
  assert.equal(weekHasNoAvailableSlot(empty, ME, mondayMorning, MON), false)
})

test('the next available slot skips locked, booked and protected ones', () => {
  const state = makeState({
    slots: [
      slot('locked', TUE, '09:00', '09:30'),
      slot('taken', WED, '08:00', '08:30'),
      slot('prot', WED, '08:30', '09:00', 'protected'),
      slot('later', '2026-11-10', '10:00', '10:30'),
      slot('next', WED, '14:00', '14:30'),
    ],
    bookings: [{ id: 'b', slotId: 'taken', studentId: 'stu-2', status: 'confirmed' }],
  })
  assert.equal(nextAvailableSlot(state, mondayEvening).id, 'next')
})

test('no next available slot when nothing can be booked', () => {
  const state = makeState({ slots: [slot('far', '2026-12-01', '09:00', '09:30')] }) // beyond 2 weeks
  assert.equal(nextAvailableSlot(state, mondayEvening), undefined)
})
