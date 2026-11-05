import assert from 'node:assert/strict'
import { test } from 'node:test'
import { initialSettings as settings } from '@/data/mockData'
import {
  BOOKING_WINDOWS,
  DEFAULT_SLOT_MINUTES,
  LUNCH,
  SLOT_LENGTHS,
  cancellationKind,
  dayRows,
  daySlotTimes,
  firstVisibleDate,
  isLocked,
  daysLockingOn,
  isWithinHorizon,
  lastBookableDate,
  levelBookingBlock,
  lockMoment,
  nextSummary,
  openToAllLevelsFrom,
  reminderMoment,
  studentBookingBlock,
  weekSlotMinutes,
} from './rules.js'

// 2026-11-16 is a Monday. These weeks have no holiday, so the rules show
// on their own; holidays are tested in data/schoolCalendar.test.js.
const MON = '2026-11-16'
const TUE = '2026-11-17'
const WED = '2026-11-18'
const THU = '2026-11-19'
const FRI = '2026-11-20'
const LAST_FRI = '2026-11-13'
const NEXT_MON = '2026-11-23'
const at = (date, time) => ({ date, time })
const slot = (date, start, end, kind = 'open') => ({ id: `${date}-${start}`, date, start, end, kind })

// --- Item 1: her hours ------------------------------------------------------

test('25-minute slots follow the bells, with her lunch at 11h55', () => {
  assert.deepEqual(daySlotTimes(25), [
    '07:45', '08:10', // 1st period
    '08:40', '09:05', // 2nd period
    '09:35', // récréation
    '10:05', '10:30',
    '11:00', '11:25',
    '12:25', // after her lunch
    '12:50', // pause méridienne
    '13:35', '14:00',
    '14:30',
  ])
  const rows = dayRows(25)
  const lunchAt = rows.findIndex((r) => r.kind === 'lunch')
  assert.deepEqual(rows[lunchAt], { kind: 'lunch', start: '11:55', end: '12:25' })
  assert.equal(rows[lunchAt - 1].start, '11:25')
  assert.equal(rows[lunchAt + 1].start, '12:25')
})

test('no slot crosses a bell, lunch or 15h00, whatever the length', () => {
  const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3))
  for (const length of SLOT_LENGTHS) {
    for (const start of daySlotTimes(length)) {
      const s = toMin(start)
      const e = s + length
      const inside = BOOKING_WINDOWS.some((w) => s >= toMin(w.start) && e <= toMin(w.end))
      assert.ok(inside, `${length} min at ${start}`)
      assert.ok(s >= toMin(LUNCH.end) || e <= toMin(LUNCH.start), `${length} min at ${start} crosses lunch`)
    }
  }
})

test('every length offered gives slots, and 25 minutes is the default', () => {
  for (const length of SLOT_LENGTHS) assert.ok(daySlotTimes(length).length > 0, `${length} min`)
  assert.ok(SLOT_LENGTHS.includes(DEFAULT_SLOT_MINUTES))
  assert.equal(DEFAULT_SLOT_MINUTES, 25)
  assert.equal(settings.slotMinutes, DEFAULT_SLOT_MINUTES)
})

test('leftover time before a bell is not a slot', () => {
  // 30 min: one slot per period (25 minutes are left before each bell), none after her lunch.
  assert.deepEqual(daySlotTimes(30), ['07:45', '08:40', '09:35', '10:05', '11:00', '12:50', '13:35', '14:30'])
  // 45 min: no slot in the récréation or after 14h30.
  assert.deepEqual(daySlotTimes(45), ['07:45', '08:40', '10:05', '11:00', '12:50', '13:35'])
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

// --- Item 3: cutoff 2 days before, at 15h00 by default ----------------------

test('the cutoff is 15h00 by default', () => {
  assert.equal(settings.cutoffTime, '15:00')
})

// The expected results given by Nadim (2026-11-05), Beirut time.
test('bookings close at 15h00, 2 days before (on the last school day if that is not one)', () => {
  const closes = (date) => lockMoment(date, settings)
  assert.deepEqual(closes(MON), { date: LAST_FRI, time: '15:00' }) // Monday -> Friday
  assert.deepEqual(closes(TUE), { date: LAST_FRI, time: '15:00' }) // Tuesday -> Friday
  assert.deepEqual(closes(WED), { date: MON, time: '15:00' }) // Wednesday -> Monday
  assert.deepEqual(closes(THU), { date: TUE, time: '15:00' }) // Thursday -> Tuesday
  assert.deepEqual(closes(FRI), { date: WED, time: '15:00' }) // Friday -> Wednesday
})

test('after a holiday, bookings close on the last school day before it', () => {
  const closes = (date) => lockMoment(date, settings).date
  // Mid-term break (Sat 24 October – Sun 1 November 2026):
  assert.equal(closes('2026-11-02'), '2026-10-23') // Monday after the break -> Friday before it
  assert.equal(closes('2026-11-03'), '2026-10-23') // Tuesday after the break -> Friday before it
  assert.equal(closes('2026-11-04'), '2026-11-02') // Wednesday -> Monday, as usual
  // Christmas break (19 December – 3 January): Monday 4 and Tuesday 5 January -> Friday 18 December.
  assert.equal(closes('2027-01-04'), '2026-12-18')
  assert.equal(closes('2027-01-05'), '2026-12-18')
  // Armenian Christmas (Wednesday 6 January): Friday 8 January -> Tuesday 5 January.
  assert.equal(closes('2027-01-08'), '2027-01-05')
})

test('a day is still bookable just before its cutoff, locked at it', () => {
  assert.equal(isLocked(WED, at(MON, '14:59'), settings), false)
  assert.equal(isLocked(WED, at(MON, '15:00'), settings), true)
  assert.equal(isLocked(MON, at(LAST_FRI, '14:59'), settings), false)
  assert.equal(isLocked(MON, at(LAST_FRI, '15:00'), settings), true)
  assert.equal(isLocked(TUE, at(LAST_FRI, '15:00'), settings), true)
  assert.equal(isLocked(MON, at('2026-11-15', '10:00'), settings), true) // Sunday
})

test('tomorrow is always closed; two days ahead is bookable until 15h00', () => {
  assert.equal(isLocked(TUE, at(MON, '07:00'), settings), true)
  assert.equal(isLocked(THU, at(MON, '21:30'), settings), false)
})

test('no same-day bookings, even early in the morning', () => {
  assert.equal(isLocked(MON, at(MON, '07:00'), settings), true)
})

test('past days are locked', () => {
  assert.equal(isLocked(MON, at(TUE, '08:00'), settings), true)
})

test('the cutoff follows the setting', () => {
  const noon = { ...settings, cutoffTime: '12:00' }
  assert.equal(isLocked(WED, at(MON, '11:59'), noon), false)
  assert.equal(isLocked(WED, at(MON, '12:00'), noon), true)
})

// --- Item 4: late cancellation -------------------------------------------------

test('a student cancels freely before the cutoff, late after it, not once started', () => {
  const s = slot(WED, '10:00', '10:30')
  assert.equal(cancellationKind(s, at(MON, '14:59'), settings), 'free')
  assert.equal(cancellationKind(s, at(MON, '15:00'), settings), 'late')
  assert.equal(cancellationKind(s, at(TUE, '12:00'), settings), 'late')
  assert.equal(cancellationKind(s, at(WED, '09:59'), settings), 'late')
  assert.equal(cancellationKind(s, at(WED, '10:00'), settings), 'none')
  assert.equal(cancellationKind(s, at(THU, '08:00'), settings), 'none')
})

// --- Horizon, lock hints, reminder, summary ------------------------------------

test('students can book up to the horizon (2 weeks), not beyond', () => {
  const now = at(MON, '10:00')
  assert.equal(lastBookableDate(now, settings), '2026-11-30')
  assert.equal(isWithinHorizon('2026-11-30', now, settings), true)
  assert.equal(isWithinHorizon('2026-12-01', now, settings), false)
  assert.equal(firstVisibleDate('2026-12-01', settings), '2026-11-17')
})

test('why students cannot book an open slot: closed, too far, or nothing', () => {
  const now = at(MON, '15:00')
  assert.equal(studentBookingBlock(MON, now, settings), 'closed') // today
  assert.equal(studentBookingBlock(WED, now, settings), 'closed') // past the cutoff
  assert.equal(studentBookingBlock(THU, now, settings), null)
  assert.equal(studentBookingBlock('2026-12-01', now, settings), 'too-far')
})

test('the reminder goes out at 7h00 on the morning of the session', () => {
  assert.deepEqual(reminderMoment(slot(TUE, '13:00', '13:30')), { date: TUE, time: '07:00' })
})

test('the summary covers every day that has just locked', () => {
  assert.deepEqual(daysLockingOn(LAST_FRI), [MON, TUE]) // on Friday: Monday and Tuesday
  assert.deepEqual(daysLockingOn(MON), [WED])
  assert.deepEqual(daysLockingOn(TUE), [THU])
  assert.deepEqual(daysLockingOn(WED), [FRI])
  assert.deepEqual(daysLockingOn(THU), []) // nothing locks on Thursday
  assert.deepEqual(daysLockingOn('2026-12-18'), ['2027-01-04', '2027-01-05']) // before Christmas
})

test('« Liste définitive » is sent 5 minutes after the cutoff (15h05)', () => {
  assert.deepEqual(nextSummary(at(LAST_FRI, '10:00'), settings), {
    dates: [MON, TUE],
    sentAt: { date: LAST_FRI, time: '15:05' },
  })
  // Still today's summary after it is sent.
  assert.deepEqual(nextSummary(at(MON, '18:00'), settings).dates, [WED])
  assert.deepEqual(nextSummary(at(MON, '10:00'), { ...settings, cutoffTime: '17:00' }).sentAt, { date: MON, time: '17:05' })
})

test('on a Thursday or a weekend, the preview shows the next summary', () => {
  assert.deepEqual(nextSummary(at(THU, '10:00'), settings), {
    dates: ['2026-11-23', '2026-11-24'],
    sentAt: { date: FRI, time: '15:05' },
  })
  assert.deepEqual(nextSummary(at('2026-11-15', '10:00'), settings).dates, [WED]) // Sunday -> Monday's
})

// --- Who can book: Terminale only until the end of the Toussaint break -----

test('until the end of the Toussaint break, only Terminale students can book', () => {
  for (const date of ['2026-09-14', '2026-10-23', '2026-11-01']) {
    assert.equal(levelBookingBlock('terminale', at(date, '10:00')), null, date)
    assert.equal(levelBookingBlock('premiere', at(date, '10:00')), 'terminale-only', date)
    assert.equal(levelBookingBlock('seconde', at(date, '10:00')), 'terminale-only', date)
  }
})

test('after the Toussaint break, Première and Seconde can book too', () => {
  assert.equal(levelBookingBlock('premiere', at('2026-11-02', '07:00')), null)
  assert.equal(levelBookingBlock('seconde', at('2027-03-01', '10:00')), null)
  assert.equal(openToAllLevelsFrom(at('2026-10-20', '10:00')), '2026-11-02')
})
