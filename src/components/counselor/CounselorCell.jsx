import { CircleCheck, Hourglass, Lock, UserCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/dates'
import { topicLabel } from '@/lib/messages'

// What one time cell shows on the counselor side, and the one-click action on it.
// status: "closed" | "open" | "protected" | "booked" | "requested"
// For "booked"/"requested", `booking` and `student` are given and a click opens the details.

const LOOK = {
  closed: {
    label: 'Fermé',
    icon: null,
    className:
      'border border-dashed border-border text-muted-foreground hover:border-primary/40 hover:bg-accent hover:text-accent-foreground',
  },
  open: {
    label: 'Disponible',
    icon: CircleCheck,
    className: 'border border-success/30 bg-success/10 font-medium text-success-foreground hover:bg-success/15',
  },
  protected: {
    label: 'Temps protégé',
    icon: Lock,
    className:
      'border border-border text-muted-foreground bg-[repeating-linear-gradient(135deg,var(--muted)_0_6px,var(--background)_6px_12px)] hover:border-foreground/30',
  },
  booked: {
    label: 'Réservé',
    icon: UserCheck,
    className: 'bg-primary text-primary-foreground hover:bg-primary/90',
  },
  requested: {
    label: 'Demande',
    icon: Hourglass,
    className: 'border border-cpf-yellow bg-highlight/60 text-foreground hover:bg-highlight',
  },
}

const TOOL_VERB = { open: 'ouvrir aux élèves', protected: 'marquer en temps protégé' }

export default function CounselorCell({ status, tool, time, dayLabel, disabled, booking, student, onToggle, onOpenBooking }) {
  const look = LOOK[status]
  const Icon = look.icon
  const hasBooking = status === 'booked' || status === 'requested'

  if (hasBooking) {
    const topic = topicLabel(booking.topic)
    return (
      <button
        type="button"
        onClick={onOpenBooking}
        aria-label={`${dayLabel}, ${formatTime(time)} : ${look.label}, ${student.name}, ${student.className}${topic ? `, ${topic}` : ''}. Voir le détail.`}
        className={cn(
          'flex min-h-11 w-full flex-col items-start justify-center rounded-md px-2 py-1 text-left text-sm transition-colors duration-150 md:min-h-9',
          'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
          look.className,
        )}
      >
        <span className="flex w-full items-center gap-1.5 font-medium">
          <Icon className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{student.name}</span>
        </span>
        <span className="w-full truncate text-xs opacity-90">
          {status === 'requested' ? 'Demande · ' : ''}
          {student.className}
          {topic ? ` · ${topic}` : ''}
        </span>
      </button>
    )
  }

  // Spell out what a click will do, for screen readers.
  const hint = disabled ? '' : status === tool ? 'Cliquer pour fermer.' : `Cliquer pour ${TOOL_VERB[tool]}.`

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      aria-label={`${dayLabel}, ${formatTime(time)} : ${look.label}. ${hint}`}
      className={cn(
        'flex h-11 w-full items-center gap-1.5 rounded-md px-2 text-left text-sm transition-colors duration-150 md:h-9',
        'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
        'disabled:cursor-default',
        disabled && 'opacity-60 hover:bg-transparent',
        look.className,
      )}
    >
      {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
      <span className="truncate">{look.label}</span>
    </button>
  )
}
