import { CalendarCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { addDays, formatLongDate, formatTime } from '@/lib/dates'
import { topicLabel } from '@/lib/messages'

// How many appointments to list before pointing to the calendar.
const MAX_SHOWN = 6

function dayHeading(date, today) {
  if (date === today) return `Aujourd’hui · ${formatLongDate(date)}`
  if (date === addDays(today, 1)) return `Demain · ${formatLongDate(date)}`
  return formatLongDate(date)
}

// The counselor's next appointments at a glance, grouped by day.
// A click opens the same details as in the calendar.
// appointments: [{ booking, slot, student }], soonest first
export default function UpcomingCard({ appointments, today, onOpen }) {
  const shown = appointments.slice(0, MAX_SHOWN)
  const hidden = appointments.length - shown.length
  const days = [...new Set(shown.map(({ slot }) => slot.date))]

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck className="size-4" aria-hidden="true" />
          Prochains rendez-vous ({appointments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {appointments.length === 0 && <p className="text-sm text-muted-foreground">Aucun rendez-vous à venir.</p>}

        {days.map((date) => (
          <section key={date} aria-label={formatLongDate(date)} className="flex flex-col gap-1">
            <h3 className="text-xs font-medium text-muted-foreground uppercase">{dayHeading(date, today)}</h3>
            <ul className="divide-y">
              {shown
                .filter(({ slot }) => slot.date === date)
                .map(({ booking, slot, student }) => {
                  const topic = topicLabel(booking.topic)
                  return (
                    <li key={booking.id}>
                      <button
                        type="button"
                        onClick={() => onOpen(booking)}
                        className="flex min-h-11 w-full items-center gap-3 rounded-md py-1 text-left text-sm hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                      >
                        <span className="w-12 shrink-0 font-medium tabular-nums">{formatTime(slot.start)}</span>
                        <span className="min-w-0 flex-1 truncate">
                          {student.name} · {student.className}
                          {topic && <span className="text-muted-foreground"> · {topic}</span>}
                        </span>
                      </button>
                    </li>
                  )
                })}
            </ul>
          </section>
        ))}

        {hidden > 0 && (
          <p className="text-sm text-muted-foreground">
            Et {hidden} autre{hidden > 1 ? 's' : ''}, à voir dans le calendrier ci-dessous.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
