// Booking rules (see docs/rules.md and docs/v1-scope.md), in one place.
// `now` is { date, time } in Beirut, so a demo can pretend it is another day.

import { addDays } from './dates.js'

// The moment a day's bookings are locked: the day before, at the cutoff time.
export function lockMoment(date, settings) {
  return { date: addDays(date, -1), time: settings.cutoffTime }
}

// True once students can no longer book or cancel on `date`.
// Also covers "no same-day bookings": today and past days are always locked.
export function isLocked(date, now, settings) {
  if (date <= now.date) return true
  const lock = lockMoment(date, settings)
  return now.date > lock.date || (now.date === lock.date && now.time >= lock.time)
}

// Last date students can book, given the booking horizon in weeks.
export function lastBookableDate(now, settings) {
  return addDays(now.date, settings.bookingHorizonWeeks * 7)
}

export function isWithinHorizon(date, now, settings) {
  return date <= lastBookableDate(now, settings)
}
