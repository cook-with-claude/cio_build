// ALL fake data for the demo lives in this one file.
//
// Each export below mirrors a future database table, so it can later be
// replaced by Supabase with minimal changes:
//   students  -> table "students"
//   slots     -> table "slots"
//   bookings  -> table "bookings"
//   settings  -> one row in table "settings"
//
// Rules for this file (see docs/rules.md):
// - Only obviously fake people. Never real names, classes or emails.
// - Only the minimum fields: name, class, level, school email, bookings, topic.
//
// Dates are generated relative to "this week", so the demo never shows
// stale dates whenever it is presented.

import { addDays, isSchoolDay, nextSchoolDay, startOfWeek, todayInBeirut, weekDays } from '../lib/dates.js'
import { DEFAULT_SLOT_MINUTES, lockDay } from '../lib/rules.js'

// The levels that can book (the topics are in lib/topics.js).
export const LEVELS = [
  { id: 'terminale', label: 'Terminale' },
  { id: 'premiere', label: 'Première' },
  { id: 'seconde', label: 'Seconde' },
]

// students: id, name, className, level (a LEVELS id), email
// In the real app, the level comes from the school roster.
export const students = [
  { id: 'stu-1', name: 'Élève Test 1', className: 'Terminale A', level: 'terminale', email: 'eleve.test1@example.com' },
  { id: 'stu-2', name: 'Élève Test 2', className: 'Terminale B', level: 'terminale', email: 'eleve.test2@example.com' },
  { id: 'stu-3', name: 'Élève Test 3', className: 'Première C', level: 'premiere', email: 'eleve.test3@example.com' },
  { id: 'stu-4', name: 'Élève Test 4', className: 'Seconde A', level: 'seconde', email: 'eleve.test4@example.com' },
  { id: 'stu-5', name: 'Élève Test 5', className: 'Première B', level: 'premiere', email: 'eleve.test5@example.com' },
  { id: 'stu-6', name: 'Élève Test 6', className: 'Seconde B', level: 'seconde', email: 'eleve.test6@example.com' },
]

// In the demo there is no login: the student view acts as one of these
// students, picked with « Niveau de l’élève (démo) ». They start with no booking.
export const DEMO_STUDENTS = { terminale: 'stu-1', premiere: 'stu-5', seconde: 'stu-6' }
export const DEMO_STUDENT_ID = DEMO_STUDENTS.terminale

// settings: one set of options chosen by the counselor.
export const initialSettings = {
  slotMinutes: DEFAULT_SLOT_MINUTES, // length of one slot (25 min), for weeks not prepared yet
  cutoffTime: '15:00', // a day's bookings lock at this time, 2 days before (see lockDay in rules.js)
  approvalMode: false, // when on, bookings are requests she accepts or refuses
  bookingHorizonWeeks: 2, // how many weeks ahead students can book
  oneUpcomingBookingPerStudent: true, // limit to one upcoming booking
}

// Builds the slots and bookings around `today` (exported for the tests).
export function buildSchedule(today = todayInBeirut()) {
  const thisMonday = startOfWeek(today)
  // The next week with no holiday (see schoolCalendar.js), so every slot
  // below lands on a school day.
  let nextMonday = addDays(thisMonday, 7)
  while (!weekDays(nextMonday).every(isSchoolDay)) nextMonday = addDays(nextMonday, 7)
  const day = (offset) => addDays(nextMonday, offset) // 0 = that Monday … 4 = that Friday
  // Two days soon, whatever day the demo is shown, so the 15h00 rule can be
  // shown live: the first is the first day still bookable this morning (it
  // locks at 15h00 today when a day locks today: on a Monday, Wednesday), the
  // second is still bookable tonight. Their times (14h00–14h55) are free all
  // next week.
  const firstDayLockingFrom = (from, after) => {
    let d = nextSchoolDay(after)
    while (lockDay(d) < from) d = nextSchoolDay(d)
    return d
  }
  const soon1 = firstDayLockingFrom(today, today)
  const soon2 = firstDayLockingFrom(addDays(today, 1), soon1)

  // slots: id, date, start, end, kind
  //   kind "open"      -> students can book it
  //   kind "protected" -> "Temps protégé": her own work time, never bookable
  // A time with no slot row is simply closed.
  const slots = [
    { id: 'slot-1', date: day(0), start: '09:05', end: '09:30', kind: 'open' },
    { id: 'slot-2', date: day(0), start: '09:35', end: '10:00', kind: 'open' }, // récréation
    { id: 'slot-3', date: day(0), start: '10:05', end: '10:30', kind: 'protected' },
    { id: 'slot-4', date: day(1), start: '11:00', end: '11:25', kind: 'open' },
    { id: 'slot-5', date: day(1), start: '11:25', end: '11:50', kind: 'open' },
    { id: 'slot-6', date: day(2), start: '07:45', end: '08:10', kind: 'protected' },
    { id: 'slot-7', date: day(2), start: '08:10', end: '08:35', kind: 'protected' },
    { id: 'slot-8', date: day(3), start: '12:50', end: '13:15', kind: 'open' }, // pause méridienne
    { id: 'slot-9', date: day(3), start: '13:35', end: '14:00', kind: 'open' },
    { id: 'slot-10', date: day(4), start: '10:05', end: '10:30', kind: 'open' },
    { id: 'slot-11', date: soon1, start: '14:00', end: '14:25', kind: 'open' },
    { id: 'slot-12', date: soon1, start: '14:30', end: '14:55', kind: 'open' },
    { id: 'slot-13', date: soon2, start: '14:00', end: '14:25', kind: 'open' },
    { id: 'slot-14', date: soon2, start: '14:30', end: '14:55', kind: 'protected' },
  ]

  // bookings: id, slotId, studentId, topic (a TOPICS id), topicOther, status, createdAt
  //   topicOther -> the student's few words when topic is "autre" (max 25 characters), else null
  //   status "confirmed" -> booked
  //   status "pending"   -> waiting for her answer (approval mode)
  //   status "refused" / "cancelled" -> kept so the student can be informed
  //   autoDeclined: true -> refused because she hadn't answered by the cutoff
  //   lateReason (a LATE_CANCEL_REASONS id) -> cancelled by the student after the cutoff
  const bookings = [
    { id: 'bk-1', slotId: 'slot-2', studentId: 'stu-2', topic: 'parcoursup', topicOther: null, status: 'confirmed', createdAt: thisMonday },
    { id: 'bk-2', slotId: 'slot-8', studentId: 'stu-3', topic: 'autre', topicOther: 'Année de césure', status: 'confirmed', createdAt: thisMonday },
    { id: 'bk-3', slotId: 'slot-12', studentId: 'stu-4', topic: 'specialites', topicOther: null, status: 'confirmed', createdAt: today },
  ]

  return { slots, bookings }
}

const schedule = buildSchedule()
export const initialSlots = schedule.slots
export const initialBookings = schedule.bookings
