import assert from 'node:assert/strict'
import { test } from 'node:test'
import { initialSettings } from '@/data/mockData'
import { copiableSlots, dayHasEmptyCell, reducer, upcomingBookingFor } from './useDemoStore.js'

// 2026-11-02 is a Monday; 2026-10-26 is the Monday before.
const MON = '2026-11-02'
const TUE = '2026-11-03'
const LAST_MON = '2026-10-26'
const LAST_TUE = '2026-10-27'
const at = { date: '2026-10-28', time: '10:00' }

const slot = (id, date, start, end, kind = 'open') => ({ id, date, start, end, kind })
const makeState = ({ slots = [], bookings = [], settings = {} } = {}) => ({
  slots,
  bookings,
  settings: { ...initialSettings, ...settings },
  messages: [],
})
const kindsOn = (state, date) =>
  state.slots
    .filter((s) => s.date === date)
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((s) => `${s.start} ${s.kind}`)

test('a click opens an empty cell, a second click closes it', () => {
  let state = reducer(makeState(), { type: 'toggleCell', date: MON, start: '09:00', kind: 'open' })
  assert.deepEqual(kindsOn(state, MON), ['09:00 open'])
  state = reducer(state, { type: 'toggleCell', date: MON, start: '09:00', kind: 'open' })
  assert.deepEqual(kindsOn(state, MON), [])
})

test('a click with the other tool switches open to protected', () => {
  let state = makeState({ slots: [slot('a', MON, '09:00', '09:30')] })
  state = reducer(state, { type: 'toggleCell', date: MON, start: '09:00', kind: 'protected' })
  assert.deepEqual(kindsOn(state, MON), ['09:00 protected'])
})

test('a booked cell cannot be closed by a click', () => {
  const state = makeState({
    slots: [slot('a', MON, '09:00', '09:30')],
    bookings: [{ id: 'b', slotId: 'a', studentId: 'stu-1', status: 'confirmed' }],
  })
  assert.equal(reducer(state, { type: 'toggleCell', date: MON, start: '09:00', kind: 'open' }), state)
})

test('"Ouvrir toute la journée" fills empty cells and keeps protected time', () => {
  const state = makeState({ slots: [slot('p', MON, '08:00', '08:30', 'protected')] })
  assert.equal(dayHasEmptyCell(state.slots, MON, 30), true)
  const next = reducer(state, { type: 'openDay', date: MON })
  const kinds = kindsOn(next, MON)
  assert.equal(kinds.length, 15)
  assert.equal(kinds[0], '08:00 protected')
  assert.ok(kinds.slice(1).every((k) => k.endsWith('open')))
  assert.equal(dayHasEmptyCell(next.slots, MON, 30), false)
})

test('"Copier la semaine précédente" only fills empty times', () => {
  const state = makeState({
    slots: [
      slot('l1', LAST_MON, '09:00', '09:30'),
      slot('l2', LAST_TUE, '10:00', '10:30', 'protected'),
      slot('l3', LAST_TUE, '11:00', '11:30'),
      slot('t1', TUE, '11:00', '11:30', 'protected'), // already set this week: kept
    ],
  })
  assert.equal(copiableSlots(state.slots, MON, at.date).length, 2)
  const next = reducer(state, { type: 'copyPreviousWeek', weekStart: MON, today: at.date })
  assert.deepEqual(kindsOn(next, MON), ['09:00 open'])
  assert.deepEqual(kindsOn(next, TUE), ['10:00 protected', '11:00 protected'])
})

test('copying twice adds nothing the second time', () => {
  let state = makeState({ slots: [slot('l1', LAST_MON, '09:00', '09:30')] })
  state = reducer(state, { type: 'copyPreviousWeek', weekStart: MON, today: at.date })
  assert.equal(copiableSlots(state.slots, MON, at.date).length, 0)
})

test('copying skips days that are already past', () => {
  const state = makeState({ slots: [slot('l1', LAST_MON, '09:00', '09:30'), slot('l2', LAST_TUE, '09:00', '09:30')] })
  // "Today" is Tuesday 3 November: Monday 2 is past, Tuesday 3 is not.
  const next = reducer(state, { type: 'copyPreviousWeek', weekStart: MON, today: TUE })
  assert.deepEqual(kindsOn(next, MON), [])
  assert.deepEqual(kindsOn(next, TUE), ['09:00 open'])
})

const book = (state, slotId, id = 'bk-x') =>
  reducer(state, { type: 'bookSlot', id, messageId: `m-${id}`, slotId, studentId: 'stu-1', topic: null, at })

test('booking an open slot confirms it and sends a message', () => {
  const next = book(makeState({ slots: [slot('a', MON, '09:00', '09:30')] }), 'a')
  assert.equal(next.bookings[0].status, 'confirmed')
  assert.equal(next.messages.length, 1)
})

test('in approval mode, a booking becomes a request', () => {
  const next = book(makeState({ slots: [slot('a', MON, '09:00', '09:30')], settings: { approvalMode: true } }), 'a')
  assert.equal(next.bookings[0].status, 'pending')
})

test('protected time and taken slots cannot be booked', () => {
  const protectedState = makeState({ slots: [slot('p', MON, '09:00', '09:30', 'protected')] })
  assert.equal(book(protectedState, 'p'), protectedState)
  const taken = book(makeState({ slots: [slot('a', MON, '09:00', '09:30')] }), 'a', 'bk-1')
  assert.equal(book(taken, 'a', 'bk-2'), taken)
})

test('a cancelled booking frees the slot again', () => {
  let state = book(makeState({ slots: [slot('a', MON, '09:00', '09:30')] }), 'a', 'bk-1')
  state = reducer(state, { type: 'studentCancel', bookingId: 'bk-1' })
  assert.equal(state.bookings[0].status, 'cancelled')
  assert.equal(book(state, 'a', 'bk-2').bookings.length, 2)
})

test('the counselor can cancel and close the slot in one go', () => {
  let state = book(makeState({ slots: [slot('a', MON, '09:00', '09:30')] }), 'a', 'bk-1')
  state = reducer(state, { type: 'counselorCancel', bookingId: 'bk-1', closeSlot: true, messageId: 'm2', at })
  assert.equal(state.bookings[0].status, 'cancelled')
  assert.deepEqual(state.slots, [])
  assert.equal(state.messages.length, 2)
})

test('moving a booking frees the old slot', () => {
  let state = book(makeState({ slots: [slot('a', MON, '09:00', '09:30'), slot('b', TUE, '09:00', '09:30')] }), 'a', 'bk-1')
  state = reducer(state, { type: 'moveBooking', bookingId: 'bk-1', toSlotId: 'b', messageId: 'm2', at })
  assert.equal(state.bookings[0].slotId, 'b')
  assert.equal(book(state, 'a', 'bk-2').bookings.length, 2)
})

test("a student's next booking ignores past and cancelled ones", () => {
  const state = makeState({
    slots: [slot('old', LAST_MON, '09:00', '09:30'), slot('a', MON, '09:00', '09:30'), slot('b', TUE, '09:00', '09:30')],
    bookings: [
      { id: 'b0', slotId: 'old', studentId: 'stu-1', status: 'confirmed' },
      { id: 'b1', slotId: 'a', studentId: 'stu-1', status: 'cancelled' },
      { id: 'b2', slotId: 'b', studentId: 'stu-1', status: 'confirmed' },
    ],
  })
  assert.equal(upcomingBookingFor(state, 'stu-1', at.date).booking.id, 'b2')
})
