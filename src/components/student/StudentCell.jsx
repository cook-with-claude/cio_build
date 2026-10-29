import { CalendarCheck, CircleCheck, Hourglass, UserCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/dates'

// What one time cell shows on the student side.
// Students only ever see « Disponible » / « Indisponible » (docs/rules.md),
// plus their own booking.
// status: "available" | "unavailable" | "mine-confirmed" | "mine-pending"
// fits (timetable experiment): true when an available slot fits the student's
// timetable (« Compatible »), false when it doesn't, undefined without one.

export default function StudentCell({ status, fits, time, dayLabel, onBook }) {
  if (status === 'available') {
    const Icon = fits ? CalendarCheck : CircleCheck
    const fitNote =
      fits === true
        ? ' Compatible avec votre emploi du temps.'
        : fits === false
          ? ' Pas compatible avec votre emploi du temps.'
          : ''
    return (
      <button
        type="button"
        onClick={onBook}
        aria-label={`${dayLabel}, ${formatTime(time)} : Disponible.${fitNote} Réserver ce créneau.`}
        className={cn(
          'flex h-11 w-full items-center gap-1.5 rounded-md border border-success/30 bg-success/10 px-2 text-left text-sm font-medium text-success-foreground md:h-9',
          'lift-sm hover:border-success/60 hover:bg-success/20 hover:shadow-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
          fits && 'border-2 border-success/70',
        )}
      >
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{fits ? 'Compatible' : 'Disponible'}</span>
      </button>
    )
  }

  if (status === 'mine-confirmed' || status === 'mine-pending') {
    const pending = status === 'mine-pending'
    const Icon = pending ? Hourglass : UserCheck
    return (
      <div
        className={cn(
          'flex h-11 items-center gap-1.5 rounded-md px-2 text-sm font-medium md:h-9',
          pending ? 'bg-highlight text-foreground' : 'bg-primary text-primary-foreground',
        )}
      >
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{pending ? 'Demande envoyée' : 'Votre rendez-vous'}</span>
      </div>
    )
  }

  return (
    <div className="flex h-11 items-center px-2 text-sm text-muted-foreground md:h-9">
      Indisponible
    </div>
  )
}
