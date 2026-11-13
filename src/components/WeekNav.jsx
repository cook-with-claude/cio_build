import { ArrowRight, CalendarDays, CalendarX, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { formatWeekRange, formatWeekRangeShort } from '@/lib/dates'

// `note` is an optional short line under the week's title, and `noteAction`
// ({ label, onClick }) an optional button under it.
// `compact` (student side on phones): the arrows and a one-line title share
// one row; « Revenir à cette semaine » takes the line under the title; the
// note and its button get the full width below the row.
export default function WeekNav({ compact = false, ...props }) {
  return compact ? <CompactWeekNav {...props} /> : <FullWeekNav {...props} />
}

function CompactWeekNav({ weekStart, isCurrentWeek, note, noteAction, onPrevious, onNext, onToday }) {
  return (
    <nav aria-label="Navigation par semaine" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="icon-lg" className="size-11 shrink-0 rounded-full shadow-sm" onClick={onPrevious} aria-label="Semaine précédente">
          <ChevronLeft />
        </Button>

        <div className="flex min-w-0 flex-col items-center text-center">
          <h2 style={{ viewTransitionName: 'week-title' }} className="text-lg leading-tight font-semibold text-balance">
            <span aria-hidden="true">{formatWeekRangeShort(weekStart)}</span>
            <span className="sr-only">{formatWeekRange(weekStart)}</span>
          </h2>
          {/* Same height either way, so the page doesn't jump; the link's
              tap area is 44px tall without making the line taller. */}
          {isCurrentWeek ? (
            <span className="flex h-6 items-center text-sm text-muted-foreground">Cette semaine</span>
          ) : (
            <Button variant="ghost" onClick={onToday} className="-my-2.5 h-11 gap-1.5 px-3 text-sm text-primary">
              <CalendarDays />
              Revenir à cette semaine
            </Button>
          )}
        </div>

        <Button variant="outline" size="icon-lg" className="size-11 shrink-0 rounded-full shadow-sm" onClick={onNext} aria-label="Semaine suivante">
          <ChevronRight />
        </Button>
      </div>

      {(note || noteAction) && (
        <div className="flex flex-col items-stretch gap-2 text-center">
          {note && (
            <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <CalendarX className="size-4 shrink-0" aria-hidden="true" />
              {note}
            </p>
          )}
          {noteAction && (
            <Button className="h-11 w-full" onClick={noteAction.onClick}>
              {noteAction.label}
              <ArrowRight aria-hidden="true" />
            </Button>
          )}
        </div>
      )}
    </nav>
  )
}

function FullWeekNav({ weekStart, isCurrentWeek, note, noteAction, onPrevious, onNext, onToday }) {
  return (
    <nav aria-label="Navigation par semaine" className="flex items-center justify-between gap-3">
      <Button variant="outline" size="icon-lg" className="size-11 rounded-full shadow-sm" onClick={onPrevious} aria-label="Semaine précédente">
        <ChevronLeft />
      </Button>

      <div className="flex min-w-0 flex-col items-center gap-1 text-center">
        <h2
          style={{ viewTransitionName: 'week-title' }}
          className="text-lg font-semibold text-balance sm:text-2xl"
        >
          {formatWeekRange(weekStart)}
        </h2>
        {note && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarX className="size-4 shrink-0" aria-hidden="true" />
            {note}
          </p>
        )}
        {noteAction && (
          <Button size="sm" className="h-11 md:h-8" onClick={noteAction.onClick}>
            {noteAction.label}
            <ArrowRight aria-hidden="true" />
          </Button>
        )}
        {/* Keep the line's height when hidden, so the layout doesn't jump. */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToday}
          className={cn('h-11 md:h-8', isCurrentWeek ? 'invisible' : 'text-primary')}
          aria-hidden={isCurrentWeek}
          tabIndex={isCurrentWeek ? -1 : 0}
        >
          <CalendarDays />
          Revenir à cette semaine
        </Button>
      </div>

      <Button variant="outline" size="icon-lg" className="size-11 rounded-full shadow-sm" onClick={onNext} aria-label="Semaine suivante">
        <ChevronRight />
      </Button>
    </nav>
  )
}
