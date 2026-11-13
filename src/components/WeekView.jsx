import { useRef, useState } from 'react'
import { useDaySwipe } from '@/lib/useDaySwipe'
import { CalendarOff, Utensils } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import SegmentedThumb from '@/components/SegmentedThumb'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  dayOffLabel,
  formatDayNumber,
  formatTime,
  formatWeekdayLong,
  formatWeekdayShort,
  weekDays,
} from '@/lib/dates'
import { dayRows } from '@/lib/rules'

// Monday–Friday grid of time slots for one week (her hours, see rules.js).
// On a computer all five days show side by side; on a phone, buttons pick one day.
// `renderCell(date, time)` lets each side of the app decide what a slot shows;
// without it the grid is empty. `renderDayExtra(date)` optionally adds a short
// line or button under the day's name. `isTimeShown(date, time)` optionally
// hides rows (the student side only lists what they can act on).
// `showLunch` adds the « Pause déjeuner » row (counselor side only).
// `isDayOff(date)` marks holidays: the day shows its name (« Vacances de
// Noël ») instead of rows. `hasDot(date)` puts a dot under the day in the
// phone day picker (the student side marks days with a free slot).
// `alignRows` gives all five day headers the same height on a computer, so
// the time rows line up across the week (counselor side).
export default function WeekView({
  alignRows,
  weekStart,
  today,
  slotMinutes,
  renderCell,
  renderDayExtra,
  isTimeShown,
  showLunch,
  isDayOff,
  hasDot,
}) {
  const days = weekDays(weekStart)
  const rows = dayRows(slotMinutes)
  const shownRows = (date) =>
    isDayOff?.(date)
      ? []
      : rows.filter((row) => (row.kind === 'lunch' ? showLunch : !isTimeShown || isTimeShown(date, row.start)))
  const hasSlotRow = (date) => shownRows(date).some((row) => row.kind === 'slot')

  // On phones, start on the first day with something listed (when rows are
  // filtered), else on today if it is in this week, otherwise on Monday.
  // (The parent remounts this component when the week changes.)
  const [selectedDay, setSelectedDay] = useState(
    () =>
      (isTimeShown && days.find(hasSlotRow)) ||
      (days.includes(today) ? today : days[0]),
  )

  // Apple experiment: on phones, swipe the day card left/right to change day.
  const gridRef = useRef(null)
  useDaySwipe(gridRef, days, selectedDay, setSelectedDay)

  return (
    // The week's arrival is animated by App (View Transitions, from the side
    // of the arrow pressed); this only fades in when nothing else does.
    <section className="flex flex-col gap-3">
      {/* Phone only: pick one day. */}
      <ToggleGroup
        type="single"
        spacing={1}
        value={selectedDay}
        // Ignore clicks on the already-selected day (one day is always shown).
        onValueChange={(value) => value && setSelectedDay(value)}
        aria-label="Jour affiché"
        className="relative grid w-full grid-cols-5 rounded-xl bg-muted p-1 md:hidden"
      >
        <SegmentedThumb value={selectedDay} className="rounded-lg bg-background shadow-sm ring-1 ring-foreground/5" />
        {days.map((date) => (
          <ToggleGroupItem
            key={date}
            value={date}
            className="relative z-10 h-auto flex-col gap-0 rounded-lg py-1.5 hover:bg-transparent data-[state=on]:bg-transparent data-[state=on]:text-primary"
          >
            <span className="text-xs font-normal text-muted-foreground">{formatWeekdayShort(date)}</span>
            <span
              className={cn(
                'text-base font-semibold',
                isDayOff?.(date) && 'font-normal text-muted-foreground',
                date === today && 'text-today-foreground',
              )}
            >
              {formatDayNumber(date)}
            </span>
            {/* Always takes its room, so days with and without a dot line up. */}
            <span
              className={cn('size-1.5 rounded-full', hasDot?.(date) ? 'bg-success' : 'bg-transparent')}
              aria-hidden="true"
            />
            {hasDot?.(date) && <span className="sr-only">créneau disponible</span>}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {/* With `alignRows`, on a computer each day spans two shared rows
          (header, then times) via subgrid: all five headers take the tallest
          one's height, so the time rows line up across the week. */}
      <div
        ref={gridRef}
        style={{ viewTransitionName: 'week-grid' }}
        className={cn('grid gap-3 max-md:touch-pan-y md:grid-cols-5 md:gap-2', alignRows && 'md:gap-y-0')}
      >
        {days.map((date) => (
          <Card
            key={date}
            size="sm"
            className={cn(
              'gap-0 py-0',
              // grid-cols-1 (minmax(0, 1fr)) keeps the column at the card's
              // width: without it, a long no-wrap line (e.g. « … (autre) »)
              // widens the column and gets clipped instead of truncated.
              alignRows && 'md:row-span-2 md:grid md:grid-cols-1 md:grid-rows-subgrid',
              date !== selectedDay && 'max-md:hidden',
              date === today && 'ring-2 ring-today',
              date < today && 'opacity-60',
            )}
          >
            {/* The badge shares the title's line (and wraps under it if the
                column is narrow); the day's extra line gets the full width. */}
            <CardHeader className={cn('flex flex-col gap-0.5 py-3', hasSlotRow(date) && 'border-b')}>
              <div className="flex w-full flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <CardTitle className="text-sm">
                  {formatWeekdayLong(date)} {formatDayNumber(date)}
                </CardTitle>
                {date === today && (
                  <Badge variant="outline" className="border-today/50 bg-today/10 text-today-foreground">
                    Aujourd’hui
                  </Badge>
                )}
              </div>
              {isDayOff?.(date) ? (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarOff className="size-3 shrink-0" aria-hidden="true" />
                  {dayOffLabel(date)}
                </span>
              ) : (
                renderDayExtra?.(date)
              )}
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y">
                {shownRows(date).map((row) => (
                  <li
                    key={`${row.kind}-${row.start}`}
                    className={cn(
                      'flex min-h-12 items-center gap-3 px-3 py-1.5 md:flex-col md:items-stretch md:gap-0.5 md:px-2',
                      row.kind === 'lunch' && 'bg-muted/60',
                    )}
                  >
                    <span className="w-12 shrink-0 text-sm text-muted-foreground tabular-nums md:w-auto md:text-xs">
                      {formatTime(row.start)}
                    </span>
                    <span className="min-w-0 flex-1">
                      {row.kind === 'lunch' ? (
                        // Not clickable, never bookable.
                        <span className="flex h-11 items-center gap-1.5 px-2 text-sm text-muted-foreground">
                          <Utensils className="size-4 shrink-0" aria-hidden="true" />
                          <span className="truncate">Pause déjeuner</span>
                        </span>
                      ) : renderCell ? (
                        renderCell(date, row.start)
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
