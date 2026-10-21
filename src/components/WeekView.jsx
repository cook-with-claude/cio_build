import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  daySlotTimes,
  formatDayNumber,
  formatTime,
  formatWeekdayLong,
  formatWeekdayShort,
  weekDays,
} from '@/lib/dates'

// Monday–Friday grid of time slots for one week.
// On a computer all five days show side by side; on a phone, buttons pick one day.
// `renderCell(date, time)` lets each side of the app decide what a slot shows;
// without it the grid is empty.
export default function WeekView({ weekStart, today, slotMinutes, renderCell }) {
  const days = weekDays(weekStart)
  const times = daySlotTimes(slotMinutes)

  // On phones, start on today if it is in this week, otherwise on Monday.
  // (The parent remounts this component when the week changes.)
  const [selectedDay, setSelectedDay] = useState(days.includes(today) ? today : days[0])

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
            <CardHeader className="flex items-center justify-between border-b py-3">
              <CardTitle className="text-sm">
                {formatWeekdayLong(date)} {formatDayNumber(date)}
              </CardTitle>
              {date === today && (
                <Badge variant="outline" className="border-today/50 bg-today/10 text-today-foreground">
                  Aujourd’hui
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y">
                {times.map((time) => (
                  <li
                    key={time}
                    className="flex min-h-12 items-center gap-3 px-3 py-1.5 md:flex-col md:items-stretch md:gap-0.5 md:px-2"
                  >
                    <span className="w-12 shrink-0 text-sm text-muted-foreground tabular-nums md:w-auto md:text-xs">
                      {formatTime(time)}
                    </span>
                    <span className="min-w-0 flex-1">{renderCell ? renderCell(date, time) : null}</span>
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
