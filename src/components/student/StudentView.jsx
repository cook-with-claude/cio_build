import { useState } from 'react'
import WeekView from '@/components/WeekView'
import { DEMO_STUDENT_ID, students } from '@/data/mockData'
import { formatLongDate } from '@/lib/dates'
import { isLocked, isWithinHorizon } from '@/lib/rules'
import { activeBookingForSlot, slotsInCell, upcomingBookingFor } from '@/state/useDemoStore'
import BookingDialog from './BookingDialog'
import MyBookingCard from './MyBookingCard'
import StudentCell from './StudentCell'

// In the demo there is no login: the student side acts as one fake student.
const student = students.find((s) => s.id === DEMO_STUDENT_ID)

export default function StudentView({ state, actions, weekStart, now }) {
  const { slots, bookings, settings } = state
  const [bookingSlot, setBookingSlot] = useState(null) // slot being booked (dialog open)
  const [notice, setNotice] = useState('')

  const upcoming = upcomingBookingFor(state, student.id, now.date)

  // What the student sees in one cell, and which slot a click would book.
  function cellFor(date, time) {
    const inCell = slotsInCell(slots, date, time, settings.slotMinutes)
    for (const s of inCell) {
      const b = activeBookingForSlot(bookings, s.id)
      if (b?.studentId === student.id) {
        return { status: b.status === 'pending' ? 'mine-pending' : 'mine-confirmed' }
      }
    }
    const bookable =
      !isLocked(date, now, settings) && isWithinHorizon(date, now, settings)
        ? inCell.find((s) => s.kind === 'open' && !activeBookingForSlot(bookings, s.id))
        : null
    return bookable ? { status: 'available', slot: bookable } : { status: 'unavailable' }
  }

  function cancel() {
    actions.cancelBooking(upcoming.booking.id)
    setNotice('Votre rendez-vous a été annulé.')
  }

  return (
    <div className="flex flex-col gap-4">
      <MyBookingCard upcoming={upcoming} settings={settings} now={now} notice={notice} onCancel={cancel} />

      <WeekView
        key={weekStart}
        weekStart={weekStart}
        today={now.date}
        slotMinutes={settings.slotMinutes}
        renderCell={(date, time) => {
          const cell = cellFor(date, time)
          return (
            <StudentCell
              status={cell.status}
              time={time}
              dayLabel={formatLongDate(date)}
              onBook={() => {
                setNotice('')
                setBookingSlot(cell.slot)
              }}
            />
          )
        }}
      />

      {bookingSlot && (
        <BookingDialog
          key={bookingSlot.id}
          slot={bookingSlot}
          student={student}
          settings={settings}
          existing={upcoming}
          onConfirm={(topic) => actions.bookSlot(bookingSlot.id, student.id, topic, now.date)}
          onClose={() => setBookingSlot(null)}
        />
      )}
    </div>
  )
}
