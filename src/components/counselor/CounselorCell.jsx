import { CircleCheck, Lock, UserCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/dates'

// What one time cell shows on the counselor side, and the one-click action on it.
// status: "closed" | "open" | "protected" | "booked"

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
    className: 'bg-primary font-medium text-primary-foreground',
  },
}

const TOOL_VERB = { open: 'ouvrir aux élèves', protected: 'marquer en temps protégé' }

export default function CounselorCell({ status, tool, time, dayLabel, disabled, onToggle }) {
  const look = LOOK[status]
  const Icon = look.icon
  const locked = disabled || status === 'booked'

  // Spell out what a click will do, for screen readers.
  let hint = ''
  if (status === 'booked') hint = 'Créneau réservé.'
  else if (!disabled) hint = status === tool ? 'Cliquer pour fermer.' : `Cliquer pour ${TOOL_VERB[tool]}.`

  return (
    <button
      type="button"
      disabled={locked}
      onClick={onToggle}
      aria-label={`${dayLabel}, ${formatTime(time)} : ${look.label}. ${hint}`}
      className={cn(
        'flex h-11 w-full items-center md:h-9 gap-1.5 rounded-md px-2 text-left text-sm transition-colors duration-150',
        'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
        'disabled:cursor-default',
        disabled && status !== 'booked' && 'opacity-60 hover:bg-transparent',
        look.className,
      )}
    >
      {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
      <span className="truncate">{look.label}</span>
    </button>
  )
}
