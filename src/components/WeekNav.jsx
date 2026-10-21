import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { formatWeekRange } from '@/lib/dates'

export default function WeekNav({ weekStart, isCurrentWeek, onPrevious, onNext, onToday }) {
  return (
    <nav aria-label="Navigation par semaine" className="flex items-center justify-between gap-3">
      <Button variant="outline" size="icon-lg" className="size-11 rounded-full" onClick={onPrevious} aria-label="Semaine précédente">
        <ChevronLeft />
      </Button>

      <div className="flex min-w-0 flex-col items-center gap-1 text-center">
        <h2 className="text-base font-semibold tracking-tight text-balance sm:text-lg">
          {formatWeekRange(weekStart)}
        </h2>
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

      <Button variant="outline" size="icon-lg" className="size-11 rounded-full" onClick={onNext} aria-label="Semaine suivante">
        <ChevronRight />
      </Button>
    </nav>
  )
}
