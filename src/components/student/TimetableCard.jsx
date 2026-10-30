import { CalendarCheck, CalendarRange, Check, FileUp, Pencil, Repeat, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { otherWeekType, weekTypeOn } from '@/lib/timetable'

// Experiment (docs/edt-import-spec.md): the student's timetable, on the
// student view. Without one: how to add it. With one: the type of the week
// on screen (Q1/Q2, which the student can correct) and the
// « Seulement les créneaux compatibles » switch.
export default function TimetableCard({ timetable, weekStart, onImport, onManual, onEdit, onRemove, onWeekType, onOnlyCompatible }) {
  if (!timetable) {
    return (
      <Card size="sm">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <CalendarRange className="size-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="flex items-center gap-2 font-medium">
                Votre emploi du temps <Badge variant="outline">Bêta</Badge>
              </p>
              <p className="text-sm text-muted-foreground">
                Importez-le depuis Pronote pour voir les créneaux où vous n’avez pas cours.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="ghost" className="h-11 md:h-9" onClick={onManual}>
              Saisir à la main
            </Button>
            <Button variant="outline" className="h-11 md:h-9" onClick={onImport}>
              <FileUp aria-hidden="true" />
              Importer le PDF Pronote
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const type = weekTypeOn(weekStart, timetable.anchor)

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success-foreground">
              <CalendarCheck className="size-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="flex items-center gap-2 font-medium">
                Votre emploi du temps <Badge variant="outline">Bêta</Badge>
              </p>
              <p className="flex flex-wrap items-center gap-x-2 text-sm">
                <span>
                  Semaine affichée : <span className="font-semibold">semaine {type}</span>
                </span>
                <Button
                  variant="link"
                  className="h-11 px-0 md:h-auto"
                  onClick={() => onWeekType({ weekStart, type: otherWeekType(type) })}
                >
                  <Repeat aria-hidden="true" />
                  C’est une semaine {otherWeekType(type)}
                </Button>
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="ghost" className="h-11 md:h-9" onClick={onRemove}>
              <Trash2 aria-hidden="true" />
              Retirer
            </Button>
            <Button variant="outline" className="h-11 md:h-9" onClick={onEdit}>
              <Pencil aria-hidden="true" />
              Modifier
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-success px-1.5 py-0.5 text-xs font-medium text-white">
              <Check className="size-3" aria-hidden="true" />
              Compatible
            </span>
            <span>: vous n’avez pas cours pendant ce créneau.</span>
          </p>
          <div className="flex min-h-11 items-center gap-2 md:min-h-0">
            <Switch id="only-compatible" checked={timetable.onlyCompatible} onCheckedChange={onOnlyCompatible} />
            <Label htmlFor="only-compatible">Seulement les créneaux compatibles</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
