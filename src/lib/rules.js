// Booking rules (see docs/rules.md and docs/v1-scope.md), in one place.
// `now` is { date, time } in Beirut, so a demo can pretend it is another day.

import {
  addDays,
  addMinutes,
  minutesToTime,
  nextSchoolDay,
  previousSchoolDay,
  startOfWeek,
  timeToMinutes,
  weekDays,
} from './dates.js'

// --- Her hours -------------------------------------------------------------
// Official 2026-27 timetable: she is present Mon/Tue/Wed/Fri 7:30–15:15 and
// Thu 7:30–15:00. Her slots follow the school bells (Pronote, « Organisation
// d'une journée »), so a student never misses class for a session: these
// windows run from one bell to the next, the same every day. Her lunch moves
// to 11:55–12:25, inside a period (bell grid, Nadim 2026-10-30, to check
// with her; docs/rules.md still says 12:00–12:30).
export const BOOKING_WINDOWS = [
  { start: '07:45', end: '08:40' },
  { start: '08:40', end: '09:35' },
  { start: '09:35', end: '10:05' }, // récréation
  { start: '10:05', end: '11:00' },
  { start: '11:00', end: '11:55' },
  { start: '12:25', end: '12:50' }, // after her lunch
  { start: '12:50', end: '13:35' }, // pause méridienne
  { start: '13:35', end: '14:30' },
  { start: '14:30', end: '15:00' }, // she leaves at 15:00 on Thursdays
]
export const LUNCH = { start: '11:55', end: '12:25' }

// The rows of one day: the slot start times of each window, with lunch in
// between. Each window starts at a bell and holds as many back-to-back slots
// as fit; leftover time before the next bell is not a slot, so slots never
// cross a bell, lunch or 15:00.
// -> [{ kind: "slot", start }, …, { kind: "lunch", start, end }, …]
export function dayRows(slotMinutes) {
  const rows = []
  const afterLunch = BOOKING_WINDOWS.findIndex((w) => w.start >= LUNCH.end)
  BOOKING_WINDOWS.forEach((window, i) => {
    if (i === afterLunch) rows.push({ kind: 'lunch', ...LUNCH })
    const end = timeToMinutes(window.end)
    for (let t = timeToMinutes(window.start); t + slotMinutes <= end; t += slotMinutes) {
      rows.push({ kind: 'slot', start: minutesToTime(t) })
    }
  })
  return rows
}

// Start times of every slot of a day, e.g. 07:30, 08:00 … 11:30, 12:30 … 14:30.
export const daySlotTimes = (slotMinutes) =>
  dayRows(slotMinutes)
    .filter((row) => row.kind === 'slot')
    .map((row) => row.start)

// --- Slot length -------------------------------------------------------------
// The lengths she can pick in « Durée d'un créneau ». 25 minutes fits two
// slots in each period; every length here gives at least one slot a day.
export const SLOT_LENGTHS = [15, 20, 25, 30, 45]
export const DEFAULT_SLOT_MINUTES = 25

// A week keeps the length it was prepared with: a new « Durée d'un créneau »
// only applies to weeks with no slot yet (open or protected), so the grid's
// cells always match her slots.
export function weekSlotMinutes(slots, weekStart, settings) {
  const days = weekDays(weekStart)
  const first = slots
    .filter((s) => days.includes(s.date))
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))[0]
  return first ? timeToMinutes(first.end) - timeToMinutes(first.start) : settings.slotMinutes
}

export const slotMinutesOn = (slots, date, settings) => weekSlotMinutes(slots, startOfWeek(date), settings)

// --- Cutoff ------------------------------------------------------------------
// The moment a day's bookings are locked: the previous school day at the
// cutoff time (Monday locks on Friday).
export function lockMoment(date, settings) {
  return { date: previousSchoolDay(date), time: settings.cutoffTime }
}

// True once students can no longer book (or cancel freely) on `date`.
// Also covers "no same-day bookings": today and past days are always locked.
export function isLocked(date, now, settings) {
  if (date <= now.date) return true
  const lock = lockMoment(date, settings)
  return now.date > lock.date || (now.date === lock.date && now.time >= lock.time)
}

// True once the session has begun.
export function hasStarted(slot, now) {
  return now.date > slot.date || (now.date === slot.date && now.time >= slot.start)
}

// How a student can cancel their booking right now:
//   "free" before the cutoff: the slot reopens for other students
//   "late" after the cutoff, until the session starts: a reason is required,
//          the slot closes (her free time) and she is notified
//   "none" once the session has started
export function cancellationKind(slot, now, settings) {
  if (hasStarted(slot, now)) return 'none'
  return isLocked(slot.date, now, settings) ? 'late' : 'free'
}

// --- Horizon -----------------------------------------------------------------
// Last date students can book, given the booking horizon in weeks.
export function lastBookableDate(now, settings) {
  return addDays(now.date, settings.bookingHorizonWeeks * 7)
}

export function isWithinHorizon(date, now, settings) {
  return date <= lastBookableDate(now, settings)
}

// First day on which students will see `date` as bookable.
export function firstVisibleDate(date, settings) {
  return addDays(date, -settings.bookingHorizonWeeks * 7)
}

// Why students can't book an open slot on `date` right now, or null if they can:
//   "closed"  today, a past day, or after the cutoff
//   "too-far" beyond the booking horizon
export function studentBookingBlock(date, now, settings) {
  if (isLocked(date, now, settings)) return 'closed'
  if (!isWithinHorizon(date, now, settings)) return 'too-far'
  return null
}

// --- Automatic messages ------------------------------------------------------
// The reminder reaches the student on the morning of the session.
export const REMINDER_TIME = '07:00'
export const reminderMoment = (slot) => ({ date: slot.date, time: REMINDER_TIME })

// The day covered by « Résumé de demain »: the next school day.
export const summaryDate = (now) => nextSchoolDay(now.date)

// She receives it a few minutes after that day locks (15h05 with the default
// 15h00 cutoff), so requests declined at the cutoff are already final.
export const SUMMARY_DELAY_MINUTES = 5
export function summaryMoment(date, settings) {
  const lock = lockMoment(date, settings)
  return { date: lock.date, time: addMinutes(lock.time, SUMMARY_DELAY_MINUTES) }
}
