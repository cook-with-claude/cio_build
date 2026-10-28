import { useMemo, useReducer } from 'react'
import { initialBookings, initialSettings, initialSlots, students } from '@/data/mockData'
import { addDays, addMinutes, isSchoolDay, timeToMinutes, weekDays } from '@/lib/dates'
import {
  LATE_CANCEL_REASONS,
  acceptedMessage,
  autoDeclinedMessage,
  cancelledByCounselorMessage,
  confirmationMessage,
  lateCancellationNotice,
  movedMessage,
  refusedMessage,
} from '@/lib/messages'
import {
  cancellationKind,
  daySlotTimes,
  isLocked,
  lockMoment,
  slotMinutesOn,
  summaryDate,
  summaryMoment,
} from '@/lib/rules'

// In-memory state for the demo (resets on reload). Every change goes through
// one of the actions below, so they can later become Supabase queries.
//
// `messages` is a demo-only log of the automatic e-mails a student would
// receive, so the student side can show them. The real app would send the
// e-mail and keep no copy (minimum data, docs/rules.md).
// `notifications` is the same for the counselor (« Vos notifications »).

// Bookings that still hold their slot (cancelled/refused ones free it).
export const ACTIVE_BOOKING_STATUSES = ['confirmed', 'pending']

let nextId = 1
const newId = (prefix) => `${prefix}-new-${nextId++}`

// Slots of `date` that overlap the cell [start, start + minutes).
export function slotsInCell(slots, date, start, minutes) {
  const end = addMinutes(start, minutes)
  return slots.filter((s) => s.date === date && s.start < end && s.end > start)
}

export function activeBookingForSlot(bookings, slotId) {
  return bookings.find((b) => b.slotId === slotId && ACTIVE_BOOKING_STATUSES.includes(b.status))
}

export const studentById = (id) => students.find((s) => s.id === id)

const slotLength = (s) => timeToMinutes(s.end) - timeToMinutes(s.start)

// Last week's slots that "Copier la semaine précédente" would add to the week
// starting `weekStart`: those landing on an empty time of a school day (not a
// holiday), from `today` on.
// If this week already has slots, only those of the same length are copied
// (a prepared week keeps its length, see weekSlotMinutes in rules.js).
export function copiableSlots(slots, weekStart, today) {
  const lastWeek = weekDays(addDays(weekStart, -7))
  const thisWeek = weekDays(weekStart)
  const existing = slots.find((s) => thisWeek.includes(s.date))
  return slots.filter((s) => {
    if (!lastWeek.includes(s.date)) return false
    if (existing && slotLength(s) !== slotLength(existing)) return false
    const date = addDays(s.date, 7)
    return date >= today && isSchoolDay(date) && slotsInCell(slots, date, s.start, timeToMinutes(s.end) - timeToMinutes(s.start)).length === 0
  })
}

// True when "Ouvrir toute la journée" would open at least one cell.
export function dayHasEmptyCell(slots, date, minutes) {
  return isSchoolDay(date) && daySlotTimes(minutes).some((start) => slotsInCell(slots, date, start, minutes).length === 0)
}

// Open slots of `date` that nobody has booked: what "Fermer toute la journée" closes.
const freeOpenSlots = (state, date) =>
  state.slots.filter((s) => s.date === date && s.kind === 'open' && !activeBookingForSlot(state.bookings, s.id))

export const dayHasFreeOpenSlot = (state, date) => freeOpenSlots(state, date).length > 0

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
    // Cells use the week's own slot length, so they always match her slots.
    // Nothing new can be opened or protected on a holiday (closing still works).
    case 'toggleCell': {
      const { date, start, kind } = action
      const minutes = slotMinutesOn(state.slots, date, state.settings)
      const inCell = slotsInCell(state.slots, date, start, minutes)
      if (inCell.some((s) => activeBookingForSlot(state.bookings, s.id))) return state

      const alreadyThisKind = inCell.length > 0 && inCell.every((s) => s.kind === kind)
      if (!alreadyThisKind && !isSchoolDay(date)) return state
      const end = addMinutes(start, minutes)
      const ids = new Set(inCell.map((s) => s.id))
      const slots = state.slots.filter((s) => !ids.has(s.id))
      if (!alreadyThisKind) {
        slots.push({ id: newId('slot'), date, start, end, kind })
      }
      return { ...state, slots }
    }

    // Counselor opens a whole day in one click: every empty cell becomes open.
    // Protected time and existing slots are left as they are.
    case 'openDay': {
      const { date } = action
      if (!isSchoolDay(date)) return state
      const minutes = slotMinutesOn(state.slots, date, state.settings)
      const added = daySlotTimes(minutes)
        .filter((start) => slotsInCell(state.slots, date, start, minutes).length === 0)
        .map((start) => ({ id: newId('slot'), date, start, end: addMinutes(start, minutes), kind: 'open' }))
      return { ...state, slots: [...state.slots, ...added] }
    }

    // Counselor closes a whole day in one click (e.g. she is away).
    // Booked slots stay: cancelling a booking is a separate, explicit step.
    // Protected time stays too: it is already closed to students.
    case 'closeDay': {
      const ids = new Set(freeOpenSlots(state, action.date).map((s) => s.id))
      return { ...state, slots: state.slots.filter((s) => !ids.has(s.id)) }
    }

    // Counselor copies last week's open and protected slots into this week.
    // Only fills empty time: nothing already set this week is changed, and
    // days before `today` are skipped. The copies share `batchId` in their
    // ids, so the copy can be undone.
    case 'copyPreviousWeek': {
      const added = copiableSlots(state.slots, action.weekStart, action.today).map((s, i) => ({
        ...s,
        id: `${action.batchId}-${i}`,
        date: addDays(s.date, 7),
      }))
      return { ...state, slots: [...state.slots, ...added] }
    }

    // "Annuler" right after a copy: removes the copied slots, except any a
    // student has booked in the meantime.
    case 'undoCopy': {
      const prefix = `${action.batchId}-`
      const slots = state.slots.filter((s) => !s.id.startsWith(prefix) || activeBookingForSlot(state.bookings, s.id))
      return { ...state, slots }
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
    // Before the cutoff, the slot reopens for other students. After it, until
    // the session starts, a reason from LATE_CANCEL_REASONS is required: the
    // slot closes (her free time) and she is notified at once.
    case 'studentCancel': {
      const { bookingId, reason, at, notificationId } = action
      const booking = state.bookings.find((b) => b.id === bookingId)
      const slot = state.slots.find((s) => s.id === booking?.slotId)
      if (!slot || !ACTIVE_BOOKING_STATUSES.includes(booking.status)) return state
      const kind = cancellationKind(slot, at, state.settings)
      if (kind === 'none') return state
      if (kind === 'free') {
        return { ...state, bookings: updateBooking(state.bookings, bookingId, { status: 'cancelled' }) }
      }
      if (!LATE_CANCEL_REASONS.some((r) => r.id === reason)) return state
      const student = studentById(booking.studentId)
      // The slot is removed, so the notification keeps its date and times.
      const slotCopy = { date: slot.date, start: slot.start, end: slot.end }
      const notification = {
        id: notificationId,
        kind: 'lateCancel',
        bookingId,
        studentId: student.id,
        slot: slotCopy,
        reason,
        ...lateCancellationNotice({ student, slot: slotCopy, reason }),
        sentAt: at,
      }
      return {
        ...state,
        bookings: updateBooking(state.bookings, bookingId, { status: 'cancelled', lateReason: reason }),
        slots: state.slots.filter((s) => s.id !== slot.id),
        notifications: [...state.notifications, notification],
      }
    }

    // When a day's cutoff passes, requests she hasn't answered for that day are
    // declined automatically, and each student gets the usual refusal message.
    // Runs whenever the (demo) clock changes.
    case 'declineExpiredRequests': {
      const { at } = action
      let next = state
      for (const booking of state.bookings) {
        const slot = state.slots.find((s) => s.id === booking.slotId)
        if (booking.status !== 'pending' || !slot || !isLocked(slot.date, at, state.settings)) continue
        const changes = { status: 'refused', autoDeclined: true }
        next = { ...next, bookings: updateBooking(next.bookings, booking.id, changes) }
        next = withMessage(next, {
          id: `msg-auto-${booking.id}`,
          booking: { ...booking, ...changes },
          at,
          compose: autoDeclinedMessage,
        })
      }
      return next
    }

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

// The counselor's confirmed bookings from `today` on, soonest first:
// [{ booking, slot, student }]. Pending requests are listed separately.
export function upcomingAppointments(state, today) {
  return state.bookings
    .filter((b) => b.status === 'confirmed')
    .map((booking) => ({
      booking,
      slot: state.slots.find((s) => s.id === booking.slotId),
      student: studentById(booking.studentId),
    }))
    .filter(({ slot }) => slot && slot.date >= today)
    .sort((a, b) => (a.slot.date + a.slot.start).localeCompare(b.slot.date + b.slot.start))
}

// What « Résumé de demain » would contain if sent now: the next school day's
// confirmed bookings, its requests declined automatically (those still pending
// are declined at the cutoff, before the summary is sent) and its late
// cancellations. Each list is [{ slot, student, … }], sorted by time.
export function tomorrowSummary(state, now) {
  const date = summaryDate(now)
  const byTime = (a, b) => a.slot.start.localeCompare(b.slot.start)
  const onDate = (keep) =>
    state.bookings
      .filter(keep)
      .map((booking) => ({
        booking,
        slot: state.slots.find((s) => s.id === booking.slotId),
        student: studentById(booking.studentId),
      }))
      .filter(({ slot }) => slot?.date === date)
      .sort(byTime)
  return {
    date,
    sentAt: summaryMoment(date, state.settings),
    confirmed: onDate((b) => b.status === 'confirmed'),
    declined: onDate((b) => b.status === 'pending' || b.autoDeclined),
    lateCancellations: state.notifications
      .filter((n) => n.kind === 'lateCancel' && n.slot.date === date)
      .map((n) => ({ slot: n.slot, student: studentById(n.studentId), reason: n.reason }))
      .sort(byTime),
  }
}

export function useDemoStore() {
  const [state, dispatch] = useReducer(reducer, {
    slots: initialSlots,
    bookings: initialBookings,
    settings: initialSettings,
    messages: [],
    notifications: [],
  })

  // The same functions on every render (dispatch never changes), so screens
  // and effects can rely on them.
  const actions = useMemo(() => {
    // Actions that send a message return its id, so the screen can preview it.
    // `at` is the (possibly simulated) current moment: { date, time }.
    const withMessageId = (action) => {
      const messageId = newId('msg')
      dispatch({ ...action, messageId })
      return messageId
    }

    return {
      toggleCell: (date, start, kind) => dispatch({ type: 'toggleCell', date, start, kind }),
      openDay: (date) => dispatch({ type: 'openDay', date }),
      closeDay: (date) => dispatch({ type: 'closeDay', date }),
      // Returns the copy's id, to undo it with undoCopy.
      copyPreviousWeek: (weekStart, today) => {
        const batchId = newId('copy')
        dispatch({ type: 'copyPreviousWeek', weekStart, today, batchId })
        return batchId
      },
      undoCopy: (batchId) => dispatch({ type: 'undoCopy', batchId }),
      updateSettings: (changes) => dispatch({ type: 'updateSettings', changes }),
      bookSlot: (slotId, studentId, topic, at) =>
        withMessageId({ type: 'bookSlot', id: newId('bk'), slotId, studentId, topic, at }),
      // `reason` is only needed after the cutoff (a LATE_CANCEL_REASONS id).
      cancelBooking: (bookingId, at, reason) =>
        dispatch({ type: 'studentCancel', bookingId, at, reason, notificationId: newId('notif') }),
      declineExpiredRequests: (at) => dispatch({ type: 'declineExpiredRequests', at }),
      acceptRequest: (bookingId, at) => withMessageId({ type: 'answerRequest', bookingId, status: 'confirmed', at }),
      refuseRequest: (bookingId, at) => withMessageId({ type: 'answerRequest', bookingId, status: 'refused', at }),
      counselorCancel: (bookingId, closeSlot, at) => withMessageId({ type: 'counselorCancel', bookingId, closeSlot, at }),
      moveBooking: (bookingId, toSlotId, at) => withMessageId({ type: 'moveBooking', bookingId, toSlotId, at }),
    }
  }, [])

  return [state, actions]
}
