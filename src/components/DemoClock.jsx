import { ChevronLeft, ChevronRight, Clock, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { addDays, formatLongDate, formatTime, minutesToTime } from '@/lib/dates'

// Every half hour from 7h00 to 21h30.
const TIMES = Array.from({ length: 30 }, (_, i) => minutesToTime(7 * 60 + i * 30))

// Demo-only tool: pretend it is another day or time, to show the cutoff and
// no-same-day rules live during the presentation. Not part of the real app.
export default function DemoClock({ now, simulated, onChange }) {
  // Keep the current time selectable even if it is not on a half hour.
  const times = TIMES.includes(now.time) ? TIMES : [...TIMES, now.time].sort()

  return (
    <section
      aria-label="Date de la démo"
      className="flex flex-col gap-2 rounded-lg border border-dashed bg-muted/50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-muted-foreground">Date de la démo :</span>
        <span className="font-medium" aria-live="polite">
          {formatLongDate(now.date)}, {formatTime(now.time)}
        </span>
        <Badge variant={simulated ? 'default' : 'secondary'}>{simulated ? 'simulée' : 'heure réelle'}</Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="size-11 md:size-8"
          aria-label="Jour précédent"
          onClick={() => onChange({ ...now, date: addDays(now.date, -1) })}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-11 md:size-8"
          aria-label="Jour suivant"
          onClick={() => onChange({ ...now, date: addDays(now.date, 1) })}
        >
          <ChevronRight />
        </Button>
        <Select value={now.time} onValueChange={(time) => onChange({ ...now, time })}>
          <SelectTrigger aria-label="Heure de la démo" className="w-28 bg-background data-[size=default]:h-11 md:data-[size=default]:h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {times.map((t) => (
              <SelectItem key={t} value={t}>
                {formatTime(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {simulated && (
          <Button variant="ghost" className="h-11 md:h-8" onClick={() => onChange(null)}>
            <RotateCcw aria-hidden="true" />
            Heure réelle
          </Button>
        )}
      </div>
    </section>
  )
}
