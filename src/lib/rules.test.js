import assert from 'node:assert/strict'
import { test } from 'node:test'
import { initialSettings as settings } from '@/data/mockData'
import {
  cancellationKind,
  dayRows,
  daySlotTimes,
  firstVisibleDate,
  isLocked,
  isWithinHorizon,
  lastBookableDate,
  lockMoment,
  reminderMoment,
  studentBookingBlock,
  summaryDate,
  summaryMoment,
  weekSlotMinutes,
} from './rules.js'

// 2026-11-02 is a Monday.
const MON = '2026-11-02'
const TUE = '2026-11-03'
const WED = '2026-11-04'
const LAST_FRI = '2026-10-30'
const NEXT_MON = '2026-11-09'
const at = (date, time) => ({ date, time })
const slot = (date, start, end, kind = 'open') => ({ id: `${date}-${start}`, date, start, end, kind })

// --- Item 1: her hours ------------------------------------------------------

test('30-minute slots fill 7h30–12h00 and 12h30–15h00, with lunch in between', () => {
  const times = daySlotTimes(30)
  assert.equal(times.length, 14) // 9 in the morning + 5 in the afternoon
  assert.equal(times[0], '07:30')
  assert.equal(times.at(-1), '14:30')
  assert.ok(!times.includes('12:00'), 'nothing starts at lunch')
  const rows = dayRows(30)
  const lunchAt = rows.findIndex((r) => r.kind === 'lunch')
  assert.deepEqual(rows[lunchAt], { kind: 'lunch', start: '12:00', end: '12:30' })
  assert.equal(rows[lunchAt - 1].start, '11:30')
  assert.equal(rows[lunchAt + 1].start, '12:30')
})

test('no slot crosses lunch or runs past 15h00, whatever the length', () => {
  const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3))
  for (const length of [15, 20, 30, 45, 60]) {
    for (const start of daySlotTimes(length)) {
      const s = toMin(start)
      const e = s + length
      const inMorning = s >= toMin('07:30') && e <= toMin('12:00')
      const inAfternoon = s >= toMin('12:30') && e <= toMin('15:00')
      assert.ok(inMorning || inAfternoon, `${length} min at ${start}`)
    }
  }
})

test('leftover time at the end of a window is not a slot', () => {
  // 45 min: the morning (4h30) divides evenly; the afternoon (2h30) leaves 14h45–15h00 empty.
  assert.deepEqual(daySlotTimes(45), ['07:30', '08:15', '09:00', '09:45', '10:30', '11:15', '12:30', '13:15', '14:00'])
  // 60 min: 11h30–12h00 and 14h30–15h00 are left over.
  assert.deepEqual(daySlotTimes(60), ['07:30', '08:30', '09:30', '10:30', '12:30', '13:30'])
})

// --- Item 2: slot length per week ---------------------------------------------

test('a week with no slot yet takes the length from the settings', () => {
  assert.equal(weekSlotMinutes([], MON, { ...settings, slotMinutes: 45 }), 45)
})

test('a prepared week keeps its length when the setting changes', () => {
  const slots = [slot(TUE, '09:00', '09:30')]
  assert.equal(weekSlotMinutes(slots, MON, { ...settings, slotMinutes: 45 }), 30)
  // Only this week counts: next week is still unprepared.
  assert.equal(weekSlotMinutes(slots, NEXT_MON, { ...settings, slotMinutes: 45 }), 45)
})

test('protected time alone also marks a week as prepared', () => {
  const slots = [slot(WED, '08:00', '08:20', 'protected')]
  assert.equal(weekSlotMinutes(slots, MON, settings), 20)
})

// --- Item 3: cutoff on the previous school day, 15h00 by default -------------

test('the cutoff is 15h00 by default', () => {
  assert.equal(settings.cutoffTime, '15:00')
})

test('a day locks on the previous school day at the cutoff time', () => {
  assert.deepEqual(lockMoment(TUE, settings), { date: MON, time: '15:00' })
})

test("Monday's bookings lock on Friday, not Sunday", () => {
  assert.deepEqual(lockMoment(MON, settings), { date: LAST_FRI, time: '15:00' })
  assert.equal(isLocked(MON, at(LAST_FRI, '14:59'), settings), false)
  assert.equal(isLocked(MON, at(LAST_FRI, '15:00'), settings), true)
  assert.equal(isLocked(MON, at('2026-11-01', '10:00'), settings), true) // Sunday
})

test('tomorrow is still bookable just before the cutoff, locked at it', () => {
  assert.equal(isLocked(TUE, at(MON, '14:59'), settings), false)
  assert.equal(isLocked(TUE, at(MON, '15:00'), settings), true)
  assert.equal(isLocked(TUE, at(MON, '21:30'), settings), true)
})

test('the day after tomorrow is still bookable in the evening', () => {
  assert.equal(isLocked(WED, at(MON, '21:30'), settings), false)
})

test('no same-day bookings, even early in the morning', () => {
  assert.equal(isLocked(MON, at(MON, '07:00'), settings), true)
})

test('past days are locked', () => {
  assert.equal(isLocked(MON, at(TUE, '08:00'), settings), true)
})

test('the cutoff follows the setting', () => {
  const noon = { ...settings, cutoffTime: '12:00' }
  assert.equal(isLocked(TUE, at(MON, '11:59'), noon), false)
  assert.equal(isLocked(TUE, at(MON, '12:00'), noon), true)
})

// --- Item 4: late cancellation -------------------------------------------------

test('a student cancels freely before the cutoff, late after it, not once started', () => {
  const s = slot(TUE, '10:00', '10:30')
  assert.equal(cancellationKind(s, at(MON, '14:59'), settings), 'free')
  assert.equal(cancellationKind(s, at(MON, '15:00'), settings), 'late')
  assert.equal(cancellationKind(s, at(TUE, '09:59'), settings), 'late')
  assert.equal(cancellationKind(s, at(TUE, '10:00'), settings), 'none')
  assert.equal(cancellationKind(s, at(WED, '08:00'), settings), 'none')
})

// --- Horizon, lock hints, reminder, summary ------------------------------------

test('students can book up to the horizon (2 weeks), not beyond', () => {
  const now = at(MON, '10:00')
  assert.equal(lastBookableDate(now, settings), '2026-11-16')
  assert.equal(isWithinHorizon('2026-11-16', now, settings), true)
  assert.equal(isWithinHorizon('2026-11-17', now, settings), false)
  assert.equal(firstVisibleDate('2026-11-17', settings), '2026-11-03')
})

test('why students cannot book an open slot: closed, too far, or nothing', () => {
  const now = at(MON, '15:00')
  assert.equal(studentBookingBlock(MON, now, settings), 'closed') // today
  assert.equal(studentBookingBlock(TUE, now, settings), 'closed') // past the cutoff
  assert.equal(studentBookingBlock(WED, now, settings), null)
  assert.equal(studentBookingBlock('2026-11-17', now, settings), 'too-far')
})

test('the reminder goes out at 7h00 on the morning of the session', () => {
  assert.deepEqual(reminderMoment(slot(TUE, '13:00', '13:30')), { date: TUE, time: '07:00' })
})

test('« Résumé de demain » covers the next school day (Monday, from a Friday)', () => {
  assert.equal(summaryDate(at(MON, '10:00')), TUE)
  assert.equal(summaryDate(at(LAST_FRI, '10:00')), MON)
})

test('« Résumé de demain » is sent 5 minutes after the cutoff (15h05)', () => {
  assert.deepEqual(summaryMoment(TUE, settings), { date: MON, time: '15:05' })
  assert.deepEqual(summaryMoment(MON, settings), { date: LAST_FRI, time: '15:05' })
  assert.deepEqual(summaryMoment(TUE, { ...settings, cutoffTime: '17:00' }), { date: MON, time: '17:05' })
})
