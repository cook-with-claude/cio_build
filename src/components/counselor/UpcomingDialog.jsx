import { CalendarCheck, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { addDays, formatLongDate, formatTime } from '@/lib/dates'
import { topicLabel } from '@/lib/messages'

function dayHeading(date, today) {
  if (date === today) return `Aujourd’hui · ${formatLongDate(date)}`
  if (date === addDays(today, 1)) return `Demain · ${formatLongDate(date)}`
  return formatLongDate(date)
}

// All the counselor's next appointments, grouped by day, in a window that
// fills the screen on phones. A click opens the same details as in the calendar.
// appointments: [{ booking, slot, student }], soonest first
export default function UpcomingDialog({ appointments, today, onOpen, onClose }) {
  const days = [...new Set(appointments.map(({ slot }) => slot.date))]

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-svh max-h-svh w-full max-w-full flex-col rounded-none sm:h-[85svh] sm:max-w-3xl sm:rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="size-4" aria-hidden="true" />
            Prochains rendez-vous ({appointments.length})
          </DialogTitle>
          <DialogDescription>Cliquez sur un rendez-vous pour l’annuler ou le déplacer.</DialogDescription>
        </DialogHeader>

        <div className="-mx-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4">
          {appointments.length === 0 && <p className="text-muted-foreground">Aucun rendez-vous à venir.</p>}

          {days.map((date) => (
            <section key={date} aria-label={formatLongDate(date)} className="flex flex-col gap-1">
              <h3 className="text-xs font-medium text-muted-foreground uppercase">{dayHeading(date, today)}</h3>
              <ul className="divide-y rounded-lg border">
                {appointments
                  .filter(({ slot }) => slot.date === date)
                  .map(({ booking, slot, student }) => {
                    const topic = topicLabel(booking.topic)
                    return (
                      <li key={booking.id}>
                        <button
                          type="button"
                          onClick={() => onOpen(booking)}
                          className="flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                        >
                          <span className="w-12 shrink-0 font-medium tabular-nums">{formatTime(slot.start)}</span>
                          <span className="min-w-0 flex-1 truncate">
                            {student.name} · {student.className}
                            {topic && <span className="text-muted-foreground"> · {topic}</span>}
                          </span>
                          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        </button>
                      </li>
                    )
                  })}
              </ul>
            </section>
          ))}
        </div>

        <DialogFooter className="rounded-none sm:rounded-b-xl">
          <Button className="h-11 md:h-9" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
