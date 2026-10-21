import { useState } from 'react'
import { CalendarCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Toaster } from '@/components/ui/sonner'
import DemoClock from '@/components/DemoClock'
import RoleSwitch from '@/components/RoleSwitch'
import WeekNav from '@/components/WeekNav'
import CounselorView from '@/components/counselor/CounselorView'
import StudentView from '@/components/student/StudentView'
import { useDemoStore } from '@/state/useDemoStore'
import { addDays, nowInBeirut, startOfWeek } from '@/lib/dates'

export default function App() {
  // Demo-only: a simulated { date, time } replaces the real Beirut clock when set.
  const [demoNow, setDemoNow] = useState(null)
  const now = demoNow ?? nowInBeirut()
  const today = now.date
  const currentWeek = startOfWeek(today)

  const [role, setRole] = useState('student')
  const [weekStart, setWeekStart] = useState(currentWeek)
  const [state, actions] = useDemoStore()

  // If the screen shows "this week", keep showing it when the demo date moves.
  function changeDemoNow(next) {
    const target = next ?? nowInBeirut()
    if (weekStart === currentWeek) setWeekStart(startOfWeek(target.date))
    setDemoNow(next)
  }

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur">
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
        {/* The four CPF colours, as on the school website. */}
        <div className="grid h-1 grid-cols-4" aria-hidden="true">
          <div className="bg-cpf-blue" />
          <div className="bg-cpf-orange" />
          <div className="bg-cpf-green" />
          <div className="bg-cpf-yellow" />
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5">
        <DemoClock now={now} simulated={demoNow !== null} onChange={changeDemoNow} />

        <p className="text-muted-foreground">
          {role === 'student'
            ? 'Espace élève : choisissez un créneau avec la conseillère d’orientation.'
            : 'Espace conseillère : ouvrez vos créneaux, protégez votre temps de travail et gérez vos rendez-vous.'}
        </p>

        <WeekNav
          weekStart={weekStart}
          isCurrentWeek={weekStart === currentWeek}
          onPrevious={() => setWeekStart(addDays(weekStart, -7))}
          onNext={() => setWeekStart(addDays(weekStart, 7))}
          onToday={() => setWeekStart(currentWeek)}
        />

        {role === 'counselor' ? (
          <CounselorView state={state} actions={actions} weekStart={weekStart} now={now} />
        ) : (
          <StudentView state={state} actions={actions} weekStart={weekStart} now={now} />
        )}
      </main>
      <Toaster position="bottom-center" containerAriaLabel="Notifications" />
    </div>
  )
}
