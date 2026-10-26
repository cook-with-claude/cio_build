import { CalendarX, Lock } from 'lucide-react'
import { useState } from 'react'
import MessageDialog from '@/components/MessageDialog'
import WeekView from '@/components/WeekView'
import { DEMO_STUDENT_ID, students } from '@/data/mockData'
import { formatLongDate, formatTime } from '@/lib/dates'
import { reminderMessage } from '@/lib/messages'
import { lockMoment } from '@/lib/rules'
import { upcomingBookingFor } from '@/state/useDemoStore'
import { studentCell, studentDayNote } from './availability'
import BookingDialog from './BookingDialog'
import MyBookingCard from './MyBookingCard'
import StudentCell from './StudentCell'
import StudentMessages from './StudentMessages'

// In the demo there is no login: the student side acts as one fake student.
const student = students.find((s) => s.id === DEMO_STUDENT_ID)

export default function StudentView({ state, actions, weekStart, now }) {
  const { settings } = state
  const [bookingSlot, setBookingSlot] = useState(null) // slot being booked (dialog open)
  const [notice, setNotice] = useState('')
  const [showReminder, setShowReminder] = useState(false)

  const upcoming = upcomingBookingFor(state, student.id, now.date)
  const myMessages = state.messages.filter((m) => m.studentId === student.id)

  function cancel() {
    actions.cancelBooking(upcoming.booking.id)
    setNotice('Votre rendez-vous a été annulé.')
  }

  return (
    <div className="flex flex-col gap-4">
      <MyBookingCard
        upcoming={upcoming}
        settings={settings}
        now={now}
        notice={notice}
        onCancel={cancel}
        onShowReminder={() => setShowReminder(true)}
      />

      <StudentMessages messages={myMessages} email={student.email} />

      <WeekView
        key={weekStart}
        weekStart={weekStart}
        today={now.date}
        slotMinutes={settings.slotMinutes}
        // Only list what the student can act on; the day note explains empty days.
        isTimeShown={(date, time) => studentCell(state, student.id, now, date, time).status !== 'unavailable'}
        renderDayExtra={(date) => {
          const note = studentDayNote(state, student.id, now, date)
          if (!note) return null
          const Icon = note === 'closed' ? Lock : CalendarX
          return (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Icon className="size-3 shrink-0" aria-hidden="true" />
              {note === 'closed' ? 'Réservations closes' : 'Aucun créneau disponible'}
            </span>
          )
        }}
        renderCell={(date, time) => {
          const cell = studentCell(state, student.id, now, date, time)
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
          onConfirm={(topic) => actions.bookSlot(bookingSlot.id, student.id, topic, now)}
          onClose={() => setBookingSlot(null)}
        />
      )}

      {showReminder && upcoming && (
        <MessageDialog
          title="Aperçu du rappel"
          description={`Envoyé automatiquement le ${formatLongDate(lockMoment(upcoming.slot.date, settings).date)} à ${formatTime(settings.cutoffTime)}.`}
          message={reminderMessage({ student, slot: upcoming.slot, booking: upcoming.booking })}
          to={student.email}
          onClose={() => setShowReminder(false)}
        />
      )}
    </div>
  )
}
