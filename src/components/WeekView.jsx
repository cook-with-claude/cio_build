import { useState } from 'react'
import { Utensils } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { formatDayNumber, formatTime, formatWeekdayLong, formatWeekdayShort, weekDays } from '@/lib/dates'
import { dayRows } from '@/lib/rules'

// Monday–Friday grid of time slots for one week (her hours, see rules.js).
// On a computer all five days show side by side; on a phone, buttons pick one day.
// `renderCell(date, time)` lets each side of the app decide what a slot shows;
// without it the grid is empty. `renderDayExtra(date)` optionally adds a short
// line or button under the day's name. `isTimeShown(date, time)` optionally
// hides rows (the student side only lists what they can act on).
// `showLunch` adds the « Pause déjeuner » row (counselor side only).
export default function WeekView({ weekStart, today, slotMinutes, renderCell, renderDayExtra, isTimeShown, showLunch }) {
  const days = weekDays(weekStart)
  const rows = dayRows(slotMinutes)
  const shownRows = (date) =>
    rows.filter((row) => (row.kind === 'lunch' ? showLunch : !isTimeShown || isTimeShown(date, row.start)))
  const hasSlotRow = (date) => shownRows(date).some((row) => row.kind === 'slot')

  // On phones, start on the first day with something listed (when rows are
  // filtered), else on today if it is in this week, otherwise on Monday.
  // (The parent remounts this component when the week changes.)
  const [selectedDay, setSelectedDay] = useState(
    () =>
      (isTimeShown && days.find(hasSlotRow)) ||
      (days.includes(today) ? today : days[0]),
  )

  return (
    <section className="flex flex-col gap-3">
      {/* Phone only: pick one day. */}
      <ToggleGroup
        type="single"
        spacing={1}
        value={selectedDay}
        // Ignore clicks on the already-selected day (one day is always shown).
        onValueChange={(value) => value && setSelectedDay(value)}
        aria-label="Jour affiché"
        className="grid w-full grid-cols-5 rounded-lg bg-muted p-1 md:hidden"
      >
        {days.map((date) => (
          <ToggleGroupItem
            key={date}
            value={date}
            className="h-auto flex-col gap-0 py-1.5 data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:shadow-sm"
          >
            <span className="text-xs font-normal text-muted-foreground">{formatWeekdayShort(date)}</span>
            <span className={cn('text-base font-semibold', date === today && 'text-today-foreground')}>
              {formatDayNumber(date)}
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="grid gap-3 md:grid-cols-5 md:gap-2">
        {days.map((date) => (
          <Card
            key={date}
            size="sm"
            className={cn(
              'gap-0 py-0',
              date !== selectedDay && 'hidden md:flex',
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
              {renderDayExtra?.(date)}
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
                        <span className="flex h-11 items-center gap-1.5 px-2 text-sm text-muted-foreground md:h-9">
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
