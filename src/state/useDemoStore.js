import { useReducer } from 'react'
import { initialBookings, initialSettings, initialSlots, students } from '@/data/mockData'
import { addDays, addMinutes, daySlotTimes, timeToMinutes, weekDays } from '@/lib/dates'
import {
  acceptedMessage,
  cancelledByCounselorMessage,
  confirmationMessage,
  movedMessage,
  refusedMessage,
} from '@/lib/messages'
import { lockMoment } from '@/lib/rules'

// In-memory state for the demo (resets on reload). Every change goes through
// one of the actions below, so they can later become Supabase queries.
//
// `messages` is a demo-only log of the automatic e-mails a student would
// receive, so the student side can show them. The real app would send the
// e-mail and keep no copy (minimum data, docs/rules.md).

// Bookings that still hold their slot (cancelled/refused ones free it).
export const ACTIVE_BOOKING_STATUSES = ['confirmed', 'pending']

let nextId = 1
const newId = (prefix) => `${prefix}-new-${nextId++}`

// Slots of `date` that overlap the cell [start, start + minutes).
// Overlap (rather than an exact start match) keeps existing slots visible
// even after the counselor changes the slot length.
export function slotsInCell(slots, date, start, minutes) {
  const end = addMinutes(start, minutes)
  return slots.filter((s) => s.date === date && s.start < end && s.end > start)
}

export function activeBookingForSlot(bookings, slotId) {
  return bookings.find((b) => b.slotId === slotId && ACTIVE_BOOKING_STATUSES.includes(b.status))
}

export const studentById = (id) => students.find((s) => s.id === id)

// Last week's slots that "Copier la semaine précédente" would add to the week
// starting `weekStart`: those landing on an empty time, from `today` on.
export function copiableSlots(slots, weekStart, today) {
  const lastWeek = weekDays(addDays(weekStart, -7))
  return slots.filter((s) => {
    if (!lastWeek.includes(s.date)) return false
    const date = addDays(s.date, 7)
    return date >= today && slotsInCell(slots, date, s.start, timeToMinutes(s.end) - timeToMinutes(s.start)).length === 0
  })
}

// True when "Ouvrir toute la journée" would open at least one cell.
export function dayHasEmptyCell(slots, date, minutes) {
  return daySlotTimes(minutes).some((start) => slotsInCell(slots, date, start, minutes).length === 0)
}

const updateBooking = (bookings, id, changes) => bookings.map((b) => (b.id === id ? { ...b, ...changes } : b))

// Adds the automatic message for `booking` to the log.
function withMessage(state, { id, booking, at, compose, extra = {} }) {
  const student = studentById(booking.studentId)
  const slot = state.slots.find((s) => s.id === booking.slotId)
  const { subject, body } = compose({ student, slot, booking, ...extra })
  const message = { id, studentId: student.id, bookingId: booking.id, subject, body, sentAt: at }
  return { ...state, messages: [...state.messages, message] }
}

// Exported for the tests.
export function reducer(state, action) {
  switch (action.type) {
    // Counselor clicks a cell with a tool ("open" or "protected"):
    // a cell already of that kind is closed again, otherwise it becomes that kind.
    // Cells holding an active booking are never changed here.
    case 'toggleCell': {
      const { date, start, kind } = action
      const minutes = state.settings.slotMinutes
      const inCell = slotsInCell(state.slots, date, start, minutes)
      if (inCell.some((s) => activeBookingForSlot(state.bookings, s.id))) return state

      const alreadyThisKind = inCell.length > 0 && inCell.every((s) => s.kind === kind)
      const end = addMinutes(start, minutes)
      const ids = new Set(inCell.map((s) => s.id))
      const slots = state.slots.filter((s) => !ids.has(s.id))
      // A slot longer than the cell (e.g. 30 min after switching to 15-min cells)
      // keeps the parts outside the clicked cell.
      for (const s of inCell) {
        if (s.start < start) slots.push({ ...s, id: newId('slot'), end: start })
        if (s.end > end) slots.push({ ...s, id: newId('slot'), start: end })
      }
      if (!alreadyThisKind) {
        slots.push({ id: newId('slot'), date, start, end, kind })
      }
      return { ...state, slots }
    }

    // Counselor opens a whole day in one click: every empty cell becomes open.
    // Protected time and existing slots are left as they are.
    case 'openDay': {
      const { date } = action
      const minutes = state.settings.slotMinutes
      const added = daySlotTimes(minutes)
        .filter((start) => slotsInCell(state.slots, date, start, minutes).length === 0)
        .map((start) => ({ id: newId('slot'), date, start, end: addMinutes(start, minutes), kind: 'open' }))
      return { ...state, slots: [...state.slots, ...added] }
    }

    // Counselor copies last week's open and protected slots into this week.
    // Only fills empty time: nothing already set this week is changed, and
    // days before `today` are skipped.
    case 'copyPreviousWeek': {
      const added = copiableSlots(state.slots, action.weekStart, action.today).map((s) => ({
        ...s,
        id: newId('slot'),
        date: addDays(s.date, 7),
      }))
      return { ...state, slots: [...state.slots, ...added] }
    }

    case 'updateSettings':
      return { ...state, settings: { ...state.settings, ...action.changes } }

    // Student books an open slot. In approval mode it becomes a request.
    // (The screens check the time rules; this only refuses impossible bookings.)
    case 'bookSlot': {
      const { id, messageId, slotId, studentId, topic, at } = action
      const slot = state.slots.find((s) => s.id === slotId)
      if (!slot || slot.kind !== 'open' || activeBookingForSlot(state.bookings, slotId)) return state
      const status = state.settings.approvalMode ? 'pending' : 'confirmed'
      const booking = { id, slotId, studentId, topic, status, createdAt: at.date }
      const next = { ...state, bookings: [...state.bookings, booking] }
      return withMessage(next, {
        id: messageId,
        booking,
        at,
        compose: confirmationMessage,
        extra: { lock: lockMoment(slot.date, state.settings) },
      })
    }

    // Student cancels their own booking. The record is kept (status "cancelled").
    case 'studentCancel':
      return { ...state, bookings: updateBooking(state.bookings, action.bookingId, { status: 'cancelled' }) }

    // Counselor answers a request (approval mode): "confirmed" or "refused".
    case 'answerRequest': {
      const booking = state.bookings.find((b) => b.id === action.bookingId)
      if (booking?.status !== 'pending') return state
      const changed = { ...booking, status: action.status }
      const next = { ...state, bookings: updateBooking(state.bookings, booking.id, { status: action.status }) }
      const compose = action.status === 'confirmed' ? acceptedMessage : refusedMessage
      return withMessage(next, { id: action.messageId, booking: changed, at: action.at, compose })
    }

    // Counselor cancels a booking; optionally closes the slot so nobody else books it.
    case 'counselorCancel': {
      const booking = state.bookings.find((b) => b.id === action.bookingId)
      if (!booking) return state
      let next = { ...state, bookings: updateBooking(state.bookings, booking.id, { status: 'cancelled' }) }
      next = withMessage(next, { id: action.messageId, booking, at: action.at, compose: cancelledByCounselorMessage })
      if (action.closeSlot) next = { ...next, slots: next.slots.filter((s) => s.id !== booking.slotId) }
      return next
    }

    // Counselor moves a booking to another free open slot; the old slot becomes free.
    case 'moveBooking': {
      const booking = state.bookings.find((b) => b.id === action.bookingId)
      const from = state.slots.find((s) => s.id === booking?.slotId)
      const to = state.slots.find((s) => s.id === action.toSlotId)
      if (!booking || !to || to.kind !== 'open' || activeBookingForSlot(state.bookings, to.id)) return state
      const moved = { ...booking, slotId: to.id }
      const next = { ...state, bookings: updateBooking(state.bookings, booking.id, { slotId: to.id }) }
      return withMessage(next, { id: action.messageId, booking: moved, at: action.at, compose: movedMessage, extra: { from, to } })
    }

    default:
      throw new Error(`Unknown action: ${action.type}`)
  }
}

// The student's next booking that still holds a slot (today or later), if any.
export function upcomingBookingFor(state, studentId, today) {
  return state.bookings
    .filter((b) => b.studentId === studentId && ACTIVE_BOOKING_STATUSES.includes(b.status))
    .map((b) => ({ booking: b, slot: state.slots.find((s) => s.id === b.slotId) }))
    .filter(({ slot }) => slot && slot.date >= today)
    .sort((a, b) => (a.slot.date + a.slot.start).localeCompare(b.slot.date + b.slot.start))[0]
}

export function useDemoStore() {
  const [state, dispatch] = useReducer(reducer, {
    slots: initialSlots,
    bookings: initialBookings,
    settings: initialSettings,
    messages: [],
  })

  // Actions that send a message return its id, so the screen can preview it.
  // `at` is the (possibly simulated) current moment: { date, time }.
  const withMessageId = (action) => {
    const messageId = newId('msg')
    dispatch({ ...action, messageId })
    return messageId
  }

  const actions = {
    toggleCell: (date, start, kind) => dispatch({ type: 'toggleCell', date, start, kind }),
    openDay: (date) => dispatch({ type: 'openDay', date }),
    copyPreviousWeek: (weekStart, today) => dispatch({ type: 'copyPreviousWeek', weekStart, today }),
    updateSettings: (changes) => dispatch({ type: 'updateSettings', changes }),
    bookSlot: (slotId, studentId, topic, at) =>
      withMessageId({ type: 'bookSlot', id: newId('bk'), slotId, studentId, topic, at }),
    cancelBooking: (bookingId) => dispatch({ type: 'studentCancel', bookingId }),
    acceptRequest: (bookingId, at) => withMessageId({ type: 'answerRequest', bookingId, status: 'confirmed', at }),
    refuseRequest: (bookingId, at) => withMessageId({ type: 'answerRequest', bookingId, status: 'refused', at }),
    counselorCancel: (bookingId, closeSlot, at) => withMessageId({ type: 'counselorCancel', bookingId, closeSlot, at }),
    moveBooking: (bookingId, toSlotId, at) => withMessageId({ type: 'moveBooking', bookingId, toSlotId, at }),
  }

  return [state, actions]
}
