import { useState } from 'react'
import { CalendarMinus, CalendarPlus } from 'lucide-react'
import { toast } from 'sonner'
import MessageDialog from '@/components/MessageDialog'
import WeekView from '@/components/WeekView'
import { Button } from '@/components/ui/button'
import {
  ACTIVE_BOOKING_STATUSES,
  activeBookingForSlot,
  copiableSlots,
  dayHasEmptyCell,
  dayHasFreeOpenSlot,
  slotsInCell,
  studentById,
  upcomingAppointments,
} from '@/state/useDemoStore'
import { addDays, formatLongDate, formatWeekRange, weekDays } from '@/lib/dates'
import BookingDetailsDialog from './BookingDetailsDialog'
import CounselorCell from './CounselorCell'
import CounselorToolbar from './CounselorToolbar'
import RequestsCard from './RequestsCard'
import UpcomingCard from './UpcomingCard'

// What one cell shows: { status, booking? }.
// status: "closed" | "open" | "protected" | "booked" | "requested"
function cellFor(inCell, bookings) {
  if (inCell.length === 0) return { status: 'closed' }
  for (const s of inCell) {
    const booking = activeBookingForSlot(bookings, s.id)
    if (booking) return { status: booking.status === 'pending' ? 'requested' : 'booked', booking }
  }
  if (inCell.some((s) => s.kind === 'open')) return { status: 'open' }
  return { status: 'protected' }
}

function weekCounts(slots, bookings, weekStart) {
  const days = weekDays(weekStart)
  const counts = { open: 0, booked: 0, protected: 0 }
  for (const s of slots) {
    if (!days.includes(s.date)) continue
    if (s.kind === 'protected') counts.protected++
    else if (activeBookingForSlot(bookings, s.id)) counts.booked++
    else counts.open++
  }
  return counts
}

// A small link-style button under a day's name.
function DayAction({ icon: Icon, label, date, onClick }) {
  return (
    <Button
      variant="link"
      size="sm"
      className="h-auto justify-start gap-1 p-0 text-xs"
      aria-label={`${label} du ${formatLongDate(date)}`}
      onClick={onClick}
    >
      <Icon className="size-3" aria-hidden="true" />
      {label}
    </Button>
  )
}

export default function CounselorView({ state, actions, weekStart, now }) {
  const { slots, bookings, settings, messages } = state
  const [tool, setTool] = useState('open')
  const [openBookingId, setOpenBookingId] = useState(null)
  const [shownMessage, setShownMessage] = useState(null) // { messageId, to }

  const today = now.date
  const openBooking = bookings.find((b) => b.id === openBookingId)

  // Pending requests from today on, soonest first.
  const requests = bookings
    .filter((b) => b.status === 'pending')
    .map((booking) => ({ booking, slot: slots.find((s) => s.id === booking.slotId), student: studentById(booking.studentId) }))
    .filter(({ slot }) => slot && slot.date >= today)
    .sort((a, b) => (a.slot.date + a.slot.start).localeCompare(b.slot.date + b.slot.start))

  // One-click answer from the list: confirm with a toast that links to the message sent.
  function answer(booking, student, accept) {
    const messageId = accept ? actions.acceptRequest(booking.id, now) : actions.refuseRequest(booking.id, now)
    toast.success(accept ? 'Demande acceptée' : 'Demande refusée', {
      description: `Un message a été envoyé à ${student.name}.`,
      action: { label: 'Voir le message', onClick: () => setShownMessage({ messageId, to: student.email }) },
    })
  }

  function copyPreviousWeek() {
    const count = copiableSlots(slots, weekStart, today).length
    const from = formatWeekRange(addDays(weekStart, -7)).toLowerCase()
    if (count === 0) {
      toast.info('Rien à copier', { description: `Aucun créneau à reprendre de la ${from}.` })
      return
    }
    const batchId = actions.copyPreviousWeek(weekStart, today)
    toast.success(`${count} créneau${count > 1 ? 'x' : ''} copié${count > 1 ? 's' : ''}`, {
      description: `Repris de la ${from}. Ce qui était déjà réglé cette semaine n’a pas changé.`,
      action: { label: 'Annuler', onClick: () => actions.undoCopy(batchId) },
    })
  }

  // Booked slots stay open: say so, since she may want to cancel them too.
  function closeDay(date) {
    const kept = bookings.filter(
      (b) => ACTIVE_BOOKING_STATUSES.includes(b.status) && slots.find((s) => s.id === b.slotId)?.date === date,
    ).length
    actions.closeDay(date)
    if (kept > 0) {
      toast.info('Journée fermée', {
        description: `${kept} rendez-vous ${kept > 1 ? 'restent prévus' : 'reste prévu'} ce jour-là. Cliquez dessus pour l’annuler ou le déplacer.`,
      })
    }
  }

  const shown = shownMessage && messages.find((m) => m.id === shownMessage.messageId)

  return (
    <div className="flex flex-col gap-4">
      <RequestsCard
        requests={requests}
        onAccept={(booking, student) => answer(booking, student, true)}
        onRefuse={(booking, student) => answer(booking, student, false)}
        onOpen={(booking) => setOpenBookingId(booking.id)}
      />

      <UpcomingCard
        appointments={upcomingAppointments(state, today)}
        today={today}
        onOpen={(booking) => setOpenBookingId(booking.id)}
      />

      <CounselorToolbar
        tool={tool}
        onToolChange={setTool}
        counts={weekCounts(slots, bookings, weekStart)}
        settings={settings}
        onSettingsChange={actions.updateSettings}
        onCopyPreviousWeek={copyPreviousWeek}
      />

      <WeekView
        key={weekStart}
        weekStart={weekStart}
        today={today}
        slotMinutes={settings.slotMinutes}
        renderDayExtra={(date) => {
          if (date < today) return null
          const canOpen = dayHasEmptyCell(slots, date, settings.slotMinutes)
          const canClose = dayHasFreeOpenSlot(state, date)
          return (
            (canOpen || canClose) && (
              <div className="flex flex-col items-start gap-1">
                {canOpen && (
                  <DayAction
                    icon={CalendarPlus}
                    label="Ouvrir toute la journée"
                    date={date}
                    onClick={() => actions.openDay(date)}
                  />
                )}
                {canClose && (
                  <DayAction
                    icon={CalendarMinus}
                    label="Fermer toute la journée"
                    date={date}
                    onClick={() => closeDay(date)}
                  />
                )}
              </div>
            )
          )
        }}
        renderCell={(date, time) => {
          const cell = cellFor(slotsInCell(slots, date, time, settings.slotMinutes), bookings)
          return (
            <CounselorCell
              status={cell.status}
              booking={cell.booking}
              student={cell.booking && studentById(cell.booking.studentId)}
              tool={tool}
              time={time}
              dayLabel={formatLongDate(date)}
              disabled={date < today}
              onToggle={() => actions.toggleCell(date, time, tool)}
              onOpenBooking={() => setOpenBookingId(cell.booking.id)}
            />
          )
        }}
      />

      {openBooking && (
        <BookingDetailsDialog
          key={openBooking.id}
          booking={openBooking}
          state={state}
          actions={actions}
          now={now}
          onClose={() => setOpenBookingId(null)}
        />
      )}

      {shown && (
        <MessageDialog message={shown} to={shownMessage.to} onClose={() => setShownMessage(null)} />
      )}
    </div>
  )
}
