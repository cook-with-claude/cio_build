// What the student side shows, computed from the demo state. Shared by the
// student week view and the week title (in App), so both always agree.

import { daySlotTimes, weekDays } from '@/lib/dates'
import { isLocked, isWithinHorizon } from '@/lib/rules'
import { activeBookingForSlot, slotsInCell } from '@/state/useDemoStore'

// True when a student could book `slot` right now.
function isBookable(state, now, slot) {
  const { bookings, settings } = state
  return (
    slot.kind === 'open' &&
    !activeBookingForSlot(bookings, slot.id) &&
    !isLocked(slot.date, now, settings) &&
    isWithinHorizon(slot.date, now, settings)
  )
}

// What the student sees in one cell, and which slot a click would book.
// status: "available" | "unavailable" | "mine-confirmed" | "mine-pending"
export function studentCell(state, studentId, now, date, time) {
  const inCell = slotsInCell(state.slots, date, time, state.settings.slotMinutes)
  for (const s of inCell) {
    const b = activeBookingForSlot(state.bookings, s.id)
    if (b?.studentId === studentId) {
      return { status: b.status === 'pending' ? 'mine-pending' : 'mine-confirmed' }
    }
  }
  const bookable = inCell.find((s) => isBookable(state, now, s))
  return bookable ? { status: 'available', slot: bookable } : { status: 'unavailable' }
}

// The soonest slot a student could book, or undefined.
export function nextAvailableSlot(state, now) {
  return state.slots
    .filter((s) => isBookable(state, now, s))
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))[0]
}

function dayStatuses(state, studentId, now, date) {
  return daySlotTimes(state.settings.slotMinutes).map(
    (time) => studentCell(state, studentId, now, date, time).status,
  )
}

// The short line under a day's name, or null.
// Built only from what the cells already show, so it reveals nothing more
// about her schedule (docs/rules.md, privacy).
export function studentDayNote(state, studentId, now, date) {
  if (isLocked(date, now, state.settings)) return 'closed'
  const statuses = dayStatuses(state, studentId, now, date)
  if (statuses.includes('available') || statuses.some((s) => s.startsWith('mine'))) return null
  return 'none-available'
}

// True when not a single slot of the week can be booked.
export function weekHasNoAvailableSlot(state, studentId, now, weekStart) {
  return weekDays(weekStart).every(
    (date) => !dayStatuses(state, studentId, now, date).includes('available'),
  )
}
