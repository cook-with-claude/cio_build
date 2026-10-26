import { useState } from 'react'
import { CalendarPlus } from 'lucide-react'
import { toast } from 'sonner'
import MessageDialog from '@/components/MessageDialog'
import WeekView from '@/components/WeekView'
import { Button } from '@/components/ui/button'
import {
  activeBookingForSlot,
  copiableSlots,
  dayHasEmptyCell,
  slotsInCell,
  studentById,
} from '@/state/useDemoStore'
import { addDays, formatLongDate, formatWeekRange, weekDays } from '@/lib/dates'
import BookingDetailsDialog from './BookingDetailsDialog'
import CounselorCell from './CounselorCell'
import CounselorToolbar from './CounselorToolbar'
import RequestsCard from './RequestsCard'

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
    actions.copyPreviousWeek(weekStart, today)
    toast.success(`${count} créneau${count > 1 ? 'x' : ''} copié${count > 1 ? 's' : ''}`, {
      description: `Repris de la ${from}. Ce qui était déjà réglé cette semaine n’a pas changé.`,
    })
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
        renderDayExtra={(date) =>
          date >= today &&
          dayHasEmptyCell(slots, date, settings.slotMinutes) && (
            <Button
              variant="link"
              size="sm"
              className="h-auto justify-start gap-1 p-0 text-xs"
              aria-label={`Ouvrir toute la journée du ${formatLongDate(date)}`}
              onClick={() => actions.openDay(date)}
            >
              <CalendarPlus className="size-3" aria-hidden="true" />
              Ouvrir toute la journée
            </Button>
          )
        }
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
