import { useReducer } from 'react'
import { initialBookings, initialSettings, initialSlots } from '@/data/mockData'
import { addMinutes } from '@/lib/dates'

// In-memory state for the demo (resets on reload). Every change goes through
// one of the actions below, so they can later become Supabase queries.

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

function reducer(state, action) {
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

    case 'updateSettings':
      return { ...state, settings: { ...state.settings, ...action.changes } }

    default:
      throw new Error(`Unknown action: ${action.type}`)
  }
}

export function useDemoStore() {
  const [state, dispatch] = useReducer(reducer, {
    slots: initialSlots,
    bookings: initialBookings,
    settings: initialSettings,
  })

  const actions = {
    toggleCell: (date, start, kind) => dispatch({ type: 'toggleCell', date, start, kind }),
    updateSettings: (changes) => dispatch({ type: 'updateSettings', changes }),
  }

  return [state, actions]
}
