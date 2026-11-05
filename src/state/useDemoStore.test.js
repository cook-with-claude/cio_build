import assert from 'node:assert/strict'
import { test } from 'node:test'
import { initialSettings } from '@/data/mockData'
import { summaryMessage } from '@/lib/messages'
import {
  copiableSlots,
  cutoffSummary,
  dayHasEmptyCell,
  dayHasFreeOpenSlot,
  reducer,
  upcomingAppointments,
  upcomingBookingFor,
} from './useDemoStore.js'

// 2026-11-16 is a Monday; 2026-11-09 is the Monday before.
const MON = '2026-11-16'
const TUE = '2026-11-17'
const WED = '2026-11-18'
const THU = '2026-11-19'
const LAST_FRI = '2026-11-13'
const LAST_MON = '2026-11-09'
const LAST_TUE = '2026-11-10'
const at = { date: '2026-11-11', time: '10:00' }

const slot = (id, date, start, end, kind = 'open') => ({ id, date, start, end, kind })
const makeState = ({ slots = [], bookings = [], settings = {} } = {}) => ({
  slots,
  bookings,
  settings: { ...initialSettings, ...settings },
  messages: [],
  notifications: [],
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
  const state = makeState({ slots: [slot('p', MON, '07:45', '08:10', 'protected')] })
  assert.equal(dayHasEmptyCell(state.slots, MON, 25), true)
  const next = reducer(state, { type: 'openDay', date: MON })
  const kinds = kindsOn(next, MON)
  assert.equal(kinds.length, 14) // 25-min slots between the bells, 7h45–14h55
  assert.equal(kinds[0], '07:45 protected')
  assert.ok(!kinds.some((k) => k.startsWith('11:55')), 'lunch stays closed')
  assert.ok(kinds.slice(1).every((k) => k.endsWith('open')))
  assert.equal(dayHasEmptyCell(next.slots, MON, 25), false)
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
  // "Today" is Tuesday 17 November: Monday 16 is past, Tuesday 17 is not.
  const next = reducer(state, { type: 'copyPreviousWeek', weekStart: MON, today: TUE })
  assert.deepEqual(kindsOn(next, MON), [])
  assert.deepEqual(kindsOn(next, TUE), ['09:00 open'])
})

const book = (state, slotId, id = 'bk-x', topic = 'parcoursup', topicOther = null) =>
  reducer(state, { type: 'bookSlot', id, messageId: `m-${id}`, slotId, studentId: 'stu-1', topic, topicOther, at })

test('booking an open slot confirms it and sends a message', () => {
  const next = book(makeState({ slots: [slot('a', MON, '09:00', '09:30')] }), 'a')
  assert.equal(next.bookings[0].status, 'confirmed')
  assert.equal(next.messages.length, 1)
})

test('a booking needs a topic from the list', () => {
  const state = makeState({ slots: [slot('a', MON, '09:00', '09:30')] })
  assert.equal(book(state, 'a', 'bk-x', null), state, 'no topic: nothing happens')
  assert.equal(book(state, 'a', 'bk-x', 'n’importe quoi'), state, 'not in the list: nothing happens')
  const next = book(state, 'a', 'bk-x', 'aub-early')
  assert.equal(next.bookings[0].topic, 'aub-early')
  assert.equal(next.bookings[0].topicOther, null)
  assert.ok(next.messages[0].body.includes('Sujet : AUB early admission.'))
})

test('« Autre » needs a few words, 25 characters at most', () => {
  const state = makeState({ slots: [slot('a', MON, '09:00', '09:30')] })
  assert.equal(book(state, 'a', 'bk-x', 'autre'), state, 'no text: nothing happens')
  assert.equal(book(state, 'a', 'bk-x', 'autre', '   '), state, 'only spaces: nothing happens')
  assert.equal(book(state, 'a', 'bk-x', 'autre', 'x'.repeat(26)), state, '26 characters: nothing happens')
  const next = book(state, 'a', 'bk-x', 'autre', '  Année de césure ')
  assert.equal(next.bookings[0].topicOther, 'Année de césure', 'kept without the extra spaces')
  assert.ok(next.messages[0].body.includes('Sujet : Année de césure (autre).'))
  assert.equal(book(state, 'a', 'bk-x', 'autre', 'x'.repeat(25)).bookings.length, 1, '25 characters is fine')
})

test('the « Autre » text is dropped for any other topic', () => {
  const next = book(makeState({ slots: [slot('a', MON, '09:00', '09:30')] }), 'a', 'bk-x', 'ucas', 'leftover')
  assert.equal(next.bookings[0].topicOther, null)
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
  state = reducer(state, { type: 'studentCancel', bookingId: 'bk-1', at })
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

test('"Fermer toute la journée" closes free open slots only', () => {
  const state = makeState({
    slots: [
      slot('a', MON, '08:00', '08:30'),
      slot('b', MON, '08:30', '09:00'), // booked: kept
      slot('p', MON, '09:00', '09:30', 'protected'), // her own time: kept
      slot('t', TUE, '08:00', '08:30'), // another day: kept
    ],
    bookings: [{ id: 'bk', slotId: 'b', studentId: 'stu-1', status: 'confirmed' }],
  })
  assert.equal(dayHasFreeOpenSlot(state, MON), true)
  const next = reducer(state, { type: 'closeDay', date: MON })
  assert.deepEqual(kindsOn(next, MON), ['08:30 open', '09:00 protected'])
  assert.deepEqual(kindsOn(next, TUE), ['08:00 open'])
  assert.equal(dayHasFreeOpenSlot(next, MON), false)
})

test('undoing a copy removes the copied slots, but not one booked since', () => {
  let state = makeState({
    slots: [slot('l1', LAST_MON, '09:00', '09:30'), slot('l2', LAST_MON, '09:30', '10:00'), slot('m', MON, '11:00', '11:30')],
  })
  state = reducer(state, { type: 'copyPreviousWeek', weekStart: MON, today: at.date, batchId: 'copy-1' })
  const copied = state.slots.filter((s) => s.date === MON && s.start === '09:00')[0]
  state = book(state, copied.id, 'bk-1')
  state = reducer(state, { type: 'undoCopy', batchId: 'copy-1' })
  assert.deepEqual(kindsOn(state, MON), ['09:00 open', '11:00 open'])
})

test("the counselor's upcoming list: confirmed bookings from today on, soonest first", () => {
  const state = makeState({
    slots: [
      slot('past', LAST_MON, '09:00', '09:30'),
      slot('b', TUE, '09:00', '09:30'),
      slot('a', MON, '10:00', '10:30'),
      slot('c', MON, '11:00', '11:30'),
      slot('d', MON, '12:30', '13:00'),
    ],
    bookings: [
      { id: 'b0', slotId: 'past', studentId: 'stu-1', status: 'confirmed' },
      { id: 'b1', slotId: 'b', studentId: 'stu-1', status: 'confirmed' },
      { id: 'b2', slotId: 'a', studentId: 'stu-2', status: 'confirmed' },
      { id: 'b3', slotId: 'c', studentId: 'stu-3', status: 'cancelled' },
      { id: 'b4', slotId: 'd', studentId: 'stu-4', status: 'pending' }, // shown in "Demandes en attente"
    ],
  })
  const list = upcomingAppointments(state, MON)
  assert.deepEqual(list.map((a) => a.booking.id), ['b2', 'b1'])
  assert.equal(list[0].student.name, 'Élève Test 2')
})

// --- Item 2: a new slot length only applies to weeks not prepared yet --------

test('after the setting changes, a prepared week keeps its length', () => {
  // This week has a 25-min slot; the setting is now 45 min.
  let state = makeState({ slots: [slot('a', MON, '08:40', '09:05')], settings: { slotMinutes: 45 } })
  state = reducer(state, { type: 'toggleCell', date: TUE, start: '08:40', kind: 'open' })
  assert.equal(state.slots.find((s) => s.date === TUE).end, '09:05')
  state = reducer(state, { type: 'openDay', date: TUE })
  assert.equal(kindsOn(state, TUE).length, 14) // 25-min cells, not 45
})

test('an empty week takes the new length', () => {
  const state = reducer(makeState({ settings: { slotMinutes: 45 } }), {
    type: 'toggleCell',
    date: MON,
    start: '07:45',
    kind: 'open',
  })
  assert.equal(state.slots[0].end, '08:30')
})

test('copying last week never mixes lengths in a prepared week', () => {
  const state = makeState({
    slots: [slot('l1', LAST_MON, '09:00', '09:45'), slot('l2', LAST_TUE, '10:00', '10:30'), slot('t', TUE, '08:00', '08:30')],
  })
  // This week is prepared with 30-min slots: only the 30-min slot is copied.
  assert.deepEqual(copiableSlots(state.slots, MON, at.date).map((s) => s.id), ['l2'])
})

// --- Item 4: late cancellation -------------------------------------------------

const cancelState = () =>
  makeState({
    slots: [slot('a', WED, '10:00', '10:30')],
    bookings: [{ id: 'bk', slotId: 'a', studentId: 'stu-1', topic: 'metiers', status: 'confirmed' }],
  })
const cancel = (state, now, reason) =>
  reducer(state, { type: 'studentCancel', bookingId: 'bk', at: now, reason, notificationId: 'n1' })

test('before the cutoff, cancelling reopens the slot and notifies nobody', () => {
  const next = cancel(cancelState(), { date: MON, time: '14:59' })
  assert.equal(next.bookings[0].status, 'cancelled')
  assert.deepEqual(kindsOn(next, WED), ['10:00 open'])
  assert.deepEqual(next.notifications, [])
})

test('after the cutoff, cancelling needs a reason from the list', () => {
  const state = cancelState()
  const now = { date: MON, time: '15:00' }
  assert.equal(cancel(state, now), state, 'no reason: nothing happens')
  assert.equal(cancel(state, now, 'any free text'), state, 'not in the list: nothing happens')
})

test('a late cancellation closes the slot and notifies her with the reason', () => {
  const next = cancel(cancelState(), { date: WED, time: '09:00' }, 'malade')
  assert.equal(next.bookings[0].status, 'cancelled')
  assert.equal(next.bookings[0].lateReason, 'malade')
  assert.deepEqual(kindsOn(next, WED), [], 'the slot is closed, not reopened')
  assert.equal(next.notifications.length, 1)
  const [n] = next.notifications
  assert.equal(n.reason, 'malade')
  assert.deepEqual(n.slot, { date: WED, start: '10:00', end: '10:30' })
  assert.ok(n.body.includes('Motif : Malade.'))
})

test('once the session has started, the student can no longer cancel', () => {
  const state = cancelState()
  assert.equal(cancel(state, { date: WED, time: '10:00' }, 'malade'), state)
})

// --- Item 5: requests unanswered at the cutoff are declined automatically -----

const requestState = () =>
  makeState({
    slots: [slot('a', WED, '10:00', '10:30'), slot('b', THU, '10:00', '10:30')],
    bookings: [
      { id: 'r1', slotId: 'a', studentId: 'stu-1', topic: 'metiers', status: 'pending' },
      { id: 'r2', slotId: 'b', studentId: 'stu-2', topic: 'metiers', status: 'pending' },
    ],
    settings: { approvalMode: true },
  })
const tick = (state, now) => reducer(state, { type: 'declineExpiredRequests', at: now })

test('before the cutoff, requests keep waiting', () => {
  const state = requestState()
  assert.equal(tick(state, { date: MON, time: '14:59' }), state)
})

test('at the cutoff, requests for that day are declined, with a message about the timing', () => {
  const next = tick(requestState(), { date: MON, time: '15:00' })
  const [r1, r2] = next.bookings
  assert.equal(r1.status, 'refused')
  assert.equal(r1.autoDeclined, true)
  assert.equal(r2.status, 'pending', 'the Thursday request still waits')
  assert.equal(next.messages.length, 1)
  assert.equal(next.messages[0].studentId, 'stu-1')
  const body = next.messages[0].body.join(' ')
  assert.ok(body.includes('n’a pas pu être validée à temps'))
  assert.ok(body.includes('choisir un autre créneau'))
  assert.ok(!body.includes('ne peut malheureusement pas'), 'not worded as her refusal')
  assert.deepEqual(kindsOn(next, WED), ['10:00 open'], 'the slot itself stays')
})

test('declining is done once, even if the clock moves again', () => {
  const once = tick(requestState(), { date: MON, time: '15:00' })
  assert.equal(tick(once, { date: MON, time: '15:30' }), once)
})

// --- Item 6: « Résumé du jour » --------------------------------------------------

test('on Friday, « Résumé du jour » covers Monday and Tuesday', () => {
  let state = makeState({
    slots: [
      slot('a', TUE, '13:00', '13:30'),
      slot('b', TUE, '09:00', '09:30'),
      slot('c', MON, '10:00', '10:30'),
      slot('d', TUE, '11:00', '11:30'),
      slot('w', WED, '09:00', '09:30'),
    ],
    bookings: [
      { id: 'b1', slotId: 'a', studentId: 'stu-2', topic: 'parcoursup', status: 'confirmed' },
      { id: 'b2', slotId: 'b', studentId: 'stu-3', topic: 'autre', topicOther: 'Année de césure', status: 'confirmed' },
      { id: 'b3', slotId: 'c', studentId: 'stu-4', topic: 'ucas', status: 'pending' },
      { id: 'bk', slotId: 'd', studentId: 'stu-1', topic: 'metiers', status: 'confirmed' },
      { id: 'b5', slotId: 'w', studentId: 'stu-2', topic: 'aub', status: 'confirmed' }, // Wednesday: locks on Monday
    ],
  })
  const now = { date: LAST_FRI, time: '15:30' }
  state = tick(state, now)
  state = cancel(state, now, 'controle')
  const summary = cutoffSummary(state, now)
  assert.deepEqual(summary.sentAt, { date: LAST_FRI, time: '15:05' })
  assert.deepEqual(summary.days.map((d) => d.date), [MON, TUE])
  const [monday, tuesday] = summary.days
  assert.deepEqual(monday.confirmed, [])
  assert.deepEqual(monday.declined.map((d) => d.student.name), ['Élève Test 4'])
  assert.deepEqual(tuesday.confirmed.map((c) => c.slot.start), ['09:00', '13:00'])
  assert.deepEqual(tuesday.lateCancellations.map((l) => [l.slot.start, l.reason]), [['11:00', 'controle']])

  // The message: one heading per day, and each booking's topic (with the « Autre » text).
  const { subject, body } = summaryMessage(summary)
  assert.equal(subject, 'Résumé des rendez-vous du lundi 16 novembre et mardi 17 novembre')
  assert.ok(body.includes('Lundi 16 novembre'))
  assert.ok(body.includes('Mardi 17 novembre'))
  assert.ok(body.includes('• 9h00 · Élève Test 3 · Première C · Année de césure (autre)'))
  assert.ok(body.includes('• 10h00 · Élève Test 4 · Seconde A · UCAS'))
})

test('a one-day summary has no day heading', () => {
  const state = makeState({ slots: [slot('w', WED, '09:00', '09:30')] })
  const summary = cutoffSummary(state, { date: MON, time: '16:00' })
  assert.deepEqual(summary.days.map((d) => d.date), [WED])
  const { subject, body } = summaryMessage(summary)
  assert.equal(subject, 'Résumé des rendez-vous du mercredi 18 novembre')
  assert.equal(body[0], 'Rendez-vous confirmés : aucun.')
})

// --- Timetable experiment (docs/edt-import-spec.md) -------------------------

test('the student’s timetable is saved, its week type corrected, and removed', () => {
  const days = { Q1: {}, Q2: {} }
  let state = reducer(makeState(), { type: 'setTimetable', days, anchor: { weekStart: MON, type: 'Q1' } })
  assert.deepEqual(state.timetable, { days, anchor: { weekStart: MON, type: 'Q1' }, onlyCompatible: false })

  state = reducer(state, { type: 'setOnlyCompatible', value: true })
  state = reducer(state, { type: 'setWeekType', anchor: { weekStart: MON, type: 'Q2' } })
  assert.deepEqual(state.timetable.anchor, { weekStart: MON, type: 'Q2' })
  assert.equal(state.timetable.onlyCompatible, true)

  // Importing again keeps the switch as it was.
  state = reducer(state, { type: 'setTimetable', days, anchor: { weekStart: MON, type: 'Q1' } })
  assert.equal(state.timetable.onlyCompatible, true)

  state = reducer(state, { type: 'clearTimetable' })
  assert.equal(state.timetable, null)
})

test('week type and switch do nothing without a timetable', () => {
  const state = makeState()
  assert.equal(reducer(state, { type: 'setWeekType', anchor: { weekStart: MON, type: 'Q2' } }), state)
  assert.equal(reducer(state, { type: 'setOnlyCompatible', value: true }), state)
})
