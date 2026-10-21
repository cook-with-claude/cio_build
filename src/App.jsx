import { useState } from 'react'
import { CalendarCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import RoleSwitch from '@/components/RoleSwitch'
import WeekNav from '@/components/WeekNav'
import WeekView from '@/components/WeekView'
import { initialSettings } from '@/data/mockData'
import { addDays, startOfWeek, todayInBeirut } from '@/lib/dates'

export default function App() {
  const today = todayInBeirut()
  const currentWeek = startOfWeek(today)

  const [role, setRole] = useState('student')
  const [weekStart, setWeekStart] = useState(currentWeek)
  const [settings] = useState(initialSettings)

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <CalendarCheck className="size-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="leading-tight font-semibold">Rendez-vous d’orientation</span>
              <Badge variant="secondary" className="mt-0.5">Démo · données fictives</Badge>
            </div>
          </div>
          <RoleSwitch role={role} onChange={setRole} />
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5">
        <p className="text-muted-foreground">
          {role === 'student'
            ? 'Espace élève : choisissez un créneau avec la conseillère d’orientation.'
            : 'Espace conseillère : gérez vos créneaux de la semaine.'}
        </p>

        <WeekNav
          weekStart={weekStart}
          isCurrentWeek={weekStart === currentWeek}
          onPrevious={() => setWeekStart(addDays(weekStart, -7))}
          onNext={() => setWeekStart(addDays(weekStart, 7))}
          onToday={() => setWeekStart(currentWeek)}
        />

        <WeekView key={weekStart} weekStart={weekStart} today={today} slotMinutes={settings.slotMinutes} />
      </main>
    </div>
  )
}
