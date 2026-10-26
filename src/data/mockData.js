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
// - Only the minimum fields: name, class, school email, bookings, optional topic.
//
// Dates are generated relative to "this week", so the demo never shows
// stale dates whenever it is presented.

import { addDays, startOfWeek, todayInBeirut, weekDays } from '../lib/dates.js'

// Topics a student may optionally attach to a booking.
export const TOPICS = [
  { id: 'parcoursup', label: 'Parcoursup' },
  { id: 'etranger', label: 'Études à l’étranger' },
  { id: 'specialites', label: 'Choix de spécialités' },
  { id: 'metiers', label: 'Métiers' },
  { id: 'autre', label: 'Autre' },
]

// students: id, name, className, email
export const students = [
  { id: 'stu-1', name: 'Élève Test 1', className: 'Terminale A', email: 'eleve.test1@example.com' },
  { id: 'stu-2', name: 'Élève Test 2', className: 'Terminale B', email: 'eleve.test2@example.com' },
  { id: 'stu-3', name: 'Élève Test 3', className: 'Première C', email: 'eleve.test3@example.com' },
  { id: 'stu-4', name: 'Élève Test 4', className: 'Seconde A', email: 'eleve.test4@example.com' },
]

// In the demo there is no login: the student view acts as this student.
export const DEMO_STUDENT_ID = 'stu-1'

// settings: one set of options chosen by the counselor.
export const initialSettings = {
  slotMinutes: 30, // OPEN in v1-scope: length of one slot
  cutoffTime: '17:00', // next day's bookings lock the day before at this time
  approvalMode: false, // when on, bookings are requests she accepts or refuses
  bookingHorizonWeeks: 2, // OPEN: how many weeks ahead students can book
  oneUpcomingBookingPerStudent: true, // OPEN: limit to one upcoming booking
}

// The first Monday–Friday day after `date`.
function nextSchoolDay(date) {
  let d = addDays(date, 1)
  while (!weekDays(startOfWeek(d)).includes(d)) d = addDays(d, 1)
  return d
}

// Builds the slots and bookings around `today` (exported for the tests).
export function buildSchedule(today = todayInBeirut()) {
  const thisMonday = startOfWeek(today)
  const nextMonday = addDays(thisMonday, 7)
  const day = (offset) => addDays(nextMonday, offset) // 0 = next Monday … 4 = next Friday
  // The next two school days, whatever day the demo is shown: the first
  // locks at the cutoff today, the second stays bookable, so the 17h00 rule
  // can be shown live. Their times (14h00–15h30) are free all next week.
  const soon1 = nextSchoolDay(today)
  const soon2 = nextSchoolDay(soon1)

  // slots: id, date, start, end, kind
  //   kind "open"      -> students can book it
  //   kind "protected" -> "Temps protégé": her own work time, never bookable
  // A time with no slot row is simply closed.
  const slots = [
    { id: 'slot-1', date: day(0), start: '09:00', end: '09:30', kind: 'open' },
    { id: 'slot-2', date: day(0), start: '09:30', end: '10:00', kind: 'open' },
    { id: 'slot-3', date: day(0), start: '10:00', end: '10:30', kind: 'protected' },
    { id: 'slot-4', date: day(1), start: '11:00', end: '11:30', kind: 'open' },
    { id: 'slot-5', date: day(1), start: '11:30', end: '12:00', kind: 'open' },
    { id: 'slot-6', date: day(2), start: '08:00', end: '08:30', kind: 'protected' },
    { id: 'slot-7', date: day(2), start: '08:30', end: '09:00', kind: 'protected' },
    { id: 'slot-8', date: day(3), start: '13:00', end: '13:30', kind: 'open' },
    { id: 'slot-9', date: day(3), start: '13:30', end: '14:00', kind: 'open' },
    { id: 'slot-10', date: day(4), start: '10:00', end: '10:30', kind: 'open' },
    { id: 'slot-11', date: soon1, start: '14:00', end: '14:30', kind: 'open' },
    { id: 'slot-12', date: soon1, start: '14:30', end: '15:00', kind: 'open' },
    { id: 'slot-13', date: soon2, start: '14:00', end: '14:30', kind: 'open' },
    { id: 'slot-14', date: soon2, start: '15:00', end: '15:30', kind: 'protected' },
  ]

  // bookings: id, slotId, studentId, topic (a TOPICS id, or null), status, createdAt
  //   status "confirmed" -> booked
  //   status "pending"   -> waiting for her answer (approval mode)
  //   status "refused" / "cancelled" -> kept so the student can be informed
  const bookings = [
    { id: 'bk-1', slotId: 'slot-2', studentId: 'stu-2', topic: 'parcoursup', status: 'confirmed', createdAt: thisMonday },
    { id: 'bk-2', slotId: 'slot-8', studentId: 'stu-3', topic: null, status: 'confirmed', createdAt: thisMonday },
    { id: 'bk-3', slotId: 'slot-12', studentId: 'stu-4', topic: 'specialites', status: 'confirmed', createdAt: today },
  ]

  return { slots, bookings }
}

const schedule = buildSchedule()
export const initialSlots = schedule.slots
export const initialBookings = schedule.bookings
