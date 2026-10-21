import { useState } from 'react'
import WeekView from '@/components/WeekView'
import { activeBookingForSlot, slotsInCell } from '@/state/useDemoStore'
import { formatLongDate, weekDays } from '@/lib/dates'
import CounselorCell from './CounselorCell'
import CounselorToolbar from './CounselorToolbar'

// "closed" | "open" | "protected" | "booked" for one cell of the grid.
function cellStatus(inCell, bookings) {
  if (inCell.length === 0) return 'closed'
  if (inCell.some((s) => activeBookingForSlot(bookings, s.id))) return 'booked'
  if (inCell.some((s) => s.kind === 'open')) return 'open'
  return 'protected'
}

function weekCounts(slots, bookings, weekStart) {
  const days = weekDays(weekStart)
  const counts = { open: 0, booked: 0, protected: 0 }
  for (const s of slots) {
    if (!days.includes(s.date)) continue
    if (s.kind === 'protected') counts.protected++
    else if (activeBookingForSlot(bookings, s.id)) counts.booked++
    else counts.open++
  }
  return counts
}

export default function CounselorView({ state, actions, weekStart, today }) {
  const { slots, bookings, settings } = state
  const [tool, setTool] = useState('open')

  return (
    <div className="flex flex-col gap-4">
      <CounselorToolbar
        tool={tool}
        onToolChange={setTool}
        counts={weekCounts(slots, bookings, weekStart)}
        settings={settings}
        onSettingsChange={actions.updateSettings}
      />

      <WeekView
        key={weekStart}
        weekStart={weekStart}
        today={today}
        slotMinutes={settings.slotMinutes}
        renderCell={(date, time) => (
          <CounselorCell
            status={cellStatus(slotsInCell(slots, date, time, settings.slotMinutes), bookings)}
            tool={tool}
            time={time}
            dayLabel={formatLongDate(date)}
            disabled={date < today}
            onToggle={() => actions.toggleCell(date, time, tool)}
          />
        )}
      />
    </div>
  )
}
