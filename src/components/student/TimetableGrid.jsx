import { BookOpen, Check, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { formatTime, formatWeekdayLong, formatWeekdayShort, weekDays } from '@/lib/dates'
import { PERIODS, WEEKDAYS, WEEK_TYPES, countUnsure, nextCellValue, setCell } from '@/lib/timetable'

// Weekday names, taken from any Monday–Friday (only the names are used).
const NAMED_WEEK = weekDays('2026-11-16')
const DAY_SHORT = Object.fromEntries(WEEKDAYS.map((d, i) => [d, formatWeekdayShort(NAMED_WEEK[i])]))
const DAY_LONG = Object.fromEntries(WEEKDAYS.map((d, i) => [d, formatWeekdayLong(NAMED_WEEK[i])]))

const CELL = {
  busy: { label: 'Cours', icon: BookOpen, className: 'bg-muted text-foreground hover:bg-muted/70' },
  free: {
    label: 'Libre',
    icon: Check,
    className: 'border-success/30 bg-success/10 text-success-foreground hover:bg-success/20',
  },
  unsure: {
    label: 'À vérifier',
    icon: TriangleAlert,
    className: 'bg-highlight/40 text-foreground ring-2 ring-highlight hover:bg-highlight/60',
  },
}

// The student's timetable as a Pronote-like grid, one week type at a time:
// each period is « Cours », « Libre » or « À vérifier »; a tap changes it
// (see nextCellValue). Recesses are not shown: they are always free.
export default function TimetableGrid({ timetable, weekType, onWeekTypeChange, onChange }) {
  const days = timetable[weekType]

  return (
    <div className="flex flex-col gap-3">
      <ToggleGroup
        type="single"
        spacing={1}
        value={weekType}
        onValueChange={(value) => value && onWeekTypeChange(value)}
        aria-label="Type de semaine"
        className="grid w-full grid-cols-2 rounded-lg bg-muted p-1"
      >
        {WEEK_TYPES.map((w) => {
          const unsure = countUnsure(timetable, [w])
          return (
            <ToggleGroupItem
              key={w}
              value={w}
              className="h-11 gap-1.5 data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:shadow-sm md:h-9"
            >
              Semaine {w}
              {unsure > 0 && (
                <span className="rounded-full bg-highlight px-1.5 text-xs font-medium text-foreground">
                  {unsure} à vérifier
                </span>
              )}
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>

      <table className="w-full table-fixed border-separate border-spacing-1 text-xs">
        <caption className="sr-only">Emploi du temps, semaine {weekType}</caption>
        <thead>
          <tr>
            <th scope="col" className="w-11">
              <span className="sr-only">Heure</span>
            </th>
            {WEEKDAYS.map((d) => (
              <th key={d} scope="col" className="font-medium text-muted-foreground">
                <abbr title={DAY_LONG[d]} className="no-underline">
                  {DAY_SHORT[d]}
                </abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERIODS.map((p) => (
            <tr key={p.start}>
              <th scope="row" className="pr-1 text-right align-middle font-normal text-muted-foreground tabular-nums">
                {formatTime(p.start)}
                {p.lunch && <span className="block text-[10px]">Déjeuner</span>}
              </th>
              {WEEKDAYS.map((d) => {
                const value = days[d][p.start]
                const { label, icon: Icon, className } = CELL[value]
                return (
                  <td key={d} className="p-0">
                    <button
                      type="button"
                      onClick={() => onChange(setCell(timetable, weekType, d, p.start, nextCellValue(value)))}
                      aria-label={`${DAY_LONG[d]}, ${formatTime(p.start)}–${formatTime(p.end)}, semaine ${weekType} : ${label}. Toucher pour changer.`}
                      className={cn(
                        'press flex h-11 w-full items-center justify-center gap-1 rounded-md border border-transparent px-0.5 font-medium transition-colors md:h-9',
                        'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                        className,
                      )}
                    >
                      <Icon className="size-3.5 shrink-0 max-sm:hidden" aria-hidden="true" />
                      {/* Phones are narrow: « À vérifier » becomes « ? ». */}
                      <span className="truncate">
                        {value === 'unsure' ? (
                          <>
                            <span className="sm:hidden">?</span>
                            <span className="max-sm:hidden">{label}</span>
                          </>
                        ) : (
                          label
                        )}
                      </span>
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
