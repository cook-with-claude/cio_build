// What the student side shows, computed from the demo state. Shared by the
// student week view and the week title (in App), so both always agree.

import { daySlotTimes, weekDays } from '@/lib/dates'
import { isLocked, isWithinHorizon } from '@/lib/rules'
import { activeBookingForSlot, slotsInCell } from '@/state/useDemoStore'

// What the student sees in one cell, and which slot a click would book.
// status: "available" | "unavailable" | "mine-confirmed" | "mine-pending"
export function studentCell(state, studentId, now, date, time) {
  const { slots, bookings, settings } = state
  const inCell = slotsInCell(slots, date, time, settings.slotMinutes)
  for (const s of inCell) {
    const b = activeBookingForSlot(bookings, s.id)
    if (b?.studentId === studentId) {
      return { status: b.status === 'pending' ? 'mine-pending' : 'mine-confirmed' }
    }
  }
  const bookable =
    !isLocked(date, now, settings) && isWithinHorizon(date, now, settings)
      ? inCell.find((s) => s.kind === 'open' && !activeBookingForSlot(bookings, s.id))
      : null
  return bookable ? { status: 'available', slot: bookable } : { status: 'unavailable' }
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
