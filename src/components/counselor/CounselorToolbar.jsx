import { CircleCheck, Copy, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import SettingsSheet from './SettingsSheet'

const TOOLS = [
  { id: 'open', label: 'Ouvrir aux élèves', icon: CircleCheck },
  { id: 'protected', label: 'Temps protégé', icon: Lock },
]

// Pick what a click on a slot does, see the week at a glance, copy last week,
// open the settings.
export default function CounselorToolbar({ tool, onToolChange, counts, settings, onSettingsChange, onCopyPreviousWeek }) {
  return (
    <Card size="sm">
      {/* Two rows: what a click does (and the week's counts), then the buttons. */}
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <span className="text-sm font-medium whitespace-nowrap">Un clic sur un créneau :</span>
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={0}
            value={tool}
            onValueChange={(value) => value && onToolChange(value)}
            aria-label="Action d’un clic sur un créneau"
          >
            {TOOLS.map(({ id, label, icon: Icon }) => (
              <ToggleGroupItem
                key={id}
                value={id}
                className="h-11 gap-1.5 px-3 md:h-10 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                <Icon aria-hidden="true" />
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <p className="text-sm text-muted-foreground sm:ml-auto" aria-live="polite">
            {counts.open} ouvert{counts.open > 1 ? 's' : ''} · {counts.booked} réservé
            {counts.booked > 1 ? 's' : ''} · {counts.protected} protégé{counts.protected > 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="h-11 md:h-9" onClick={onCopyPreviousWeek}>
              <Copy aria-hidden="true" />
              Copier la semaine précédente
            </Button>
            <SettingsSheet settings={settings} onChange={onSettingsChange} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
