import { CalendarX, Lock, Mail } from 'lucide-react'
import { Suspense, lazy, useState } from 'react'
import MessageDialog from '@/components/MessageDialog'
import MessageList from '@/components/MessageList'
import WeekView from '@/components/WeekView'
import { DEMO_STUDENT_ID, students } from '@/data/mockData'
import { formatLongDate, formatTime, isSchoolDay } from '@/lib/dates'
import { reminderMessage } from '@/lib/messages'
import { reminderMoment, weekSlotMinutes } from '@/lib/rules'
import { upcomingBookingFor } from '@/state/useDemoStore'
import { dayHasAvailableSlot, studentCell, studentDayNote } from './availability'
import BookingDialog from './BookingDialog'
import MyBookingCard from './MyBookingCard'
import StudentCell from './StudentCell'
import TimetableCard from './TimetableCard'

// In the demo there is no login: the student side acts as one fake student.
const student = students.find((s) => s.id === DEMO_STUDENT_ID)

// Timetable experiment: the import (and pdf.js behind it) only loads when opened.
const TimetableImportDialog = lazy(() => import('./TimetableImportDialog'))

// The short line under a day's name (see studentDayNote).
const DAY_NOTES = {
  closed: 'Réservations closes',
  'none-available': 'Aucun créneau disponible',
  'none-compatible': 'Aucun créneau compatible',
}

export default function StudentView({ state, actions, weekStart, now }) {
  const { settings } = state
  const [bookingSlot, setBookingSlot] = useState(null) // slot being booked (dialog open)
  const [notice, setNotice] = useState('')
  const [showReminder, setShowReminder] = useState(false)
  // Timetable experiment: "import" | "manual" | "edit" while its dialog is open.
  const [timetableMode, setTimetableMode] = useState(null)

  const upcoming = upcomingBookingFor(state, student.id, now.date)
  const myMessages = state.messages.filter((m) => m.studentId === student.id)

  // `reason` is only given after the cutoff (late cancellation).
  function cancel(reason) {
    actions.cancelBooking(upcoming.booking.id, now, reason)
    setNotice(
      reason
        ? 'Votre rendez-vous a été annulé. La conseillère d’orientation a été prévenue.'
        : 'Votre rendez-vous a été annulé.',
    )
  }

  return (
    // Fades in when switching to the student side.
    <div className="flex animate-in flex-col gap-4 duration-200 fade-in-0">
      <MyBookingCard
        upcoming={upcoming}
        settings={settings}
        now={now}
        notice={notice}
        onCancel={cancel}
        onShowReminder={() => setShowReminder(true)}
      />

      <TimetableCard
        timetable={state.timetable}
        weekStart={weekStart}
        onImport={() => setTimetableMode('import')}
        onManual={() => setTimetableMode('manual')}
        onEdit={() => setTimetableMode('edit')}
        onRemove={actions.clearTimetable}
        onWeekType={actions.setWeekType}
        onOnlyCompatible={actions.setOnlyCompatible}
      />

      <MessageList title="Vos messages" icon={Mail} messages={myMessages} to={student.email} dialogTitle="Message reçu" />

      <WeekView
        key={weekStart}
        weekStart={weekStart}
        today={now.date}
        slotMinutes={weekSlotMinutes(state.slots, weekStart, settings)}
        // Only list what the student can act on; the day note explains empty days.
        isTimeShown={(date, time) => studentCell(state, student.id, now, date, time).status !== 'unavailable'}
        isDayOff={(date) => !isSchoolDay(date)}
        hasDot={(date) => dayHasAvailableSlot(state, student.id, now, date)}
        renderDayExtra={(date) => {
          const note = studentDayNote(state, student.id, now, date)
          if (!note) return null
          const Icon = note === 'closed' ? Lock : CalendarX
          return (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Icon className="size-3 shrink-0" aria-hidden="true" />
              {DAY_NOTES[note]}
            </span>
          )
        }}
        renderCell={(date, time) => {
          const cell = studentCell(state, student.id, now, date, time)
          return (
            <StudentCell
              status={cell.status}
              fits={cell.fits}
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

      {timetableMode && (
        <Suspense fallback={null}>
          <TimetableImportDialog
            mode={timetableMode}
            initial={state.timetable?.days}
            anchor={state.timetable?.anchor}
            today={now.date}
            onSave={actions.setTimetable}
            onClose={() => setTimetableMode(null)}
          />
        </Suspense>
      )}

      {showReminder && upcoming && (
        <MessageDialog
          title="Aperçu du rappel"
          description={`Envoyé automatiquement le ${formatLongDate(reminderMoment(upcoming.slot).date)} à ${formatTime(reminderMoment(upcoming.slot).time)}, le matin du rendez-vous.`}
          message={reminderMessage({ student, slot: upcoming.slot, booking: upcoming.booking })}
          to={student.email}
          onClose={() => setShowReminder(false)}
        />
      )}
    </div>
  )
}
