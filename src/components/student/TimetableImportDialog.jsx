import { useRef, useState } from 'react'
import { FileUp, Info, LoaderCircle, ShieldCheck, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { addDays, formatWeekRange, isSchoolDay, startOfWeek, weekDays } from '@/lib/dates'
import { readTimetableFile } from '@/lib/edtPdfBrowser'
import { WEEK_TYPES, blankTimetable, countUnsure } from '@/lib/timetable'
import TimetableGrid from './TimetableGrid'

// Experiment (docs/edt-import-spec.md). Three short steps:
//   "file":  how to get the PDF from Pronote, and the file picker;
//   "check": the student checks (and corrects) what was read, Q1 then Q2;
//   "week":  « Cette semaine, c'est une semaine Q1 ou Q2 ? »
// `mode`: "import" starts at "file"; "manual" starts at "check" with every
// period « Cours »; "edit" starts at "check" with `initial` and keeps the
// week type as it was (no "week" step).
// Nothing is saved until the student says « C'est correct ».

// The week the Q1/Q2 question is about: this week, or during a break the
// next week with school (a holiday week may have no type in Pronote).
function questionWeek(today) {
  let monday = startOfWeek(today)
  for (let i = 0; i < 12 && !weekDays(monday).some(isSchoolDay); i++) monday = addDays(monday, 7)
  return monday
}

export default function TimetableImportDialog({ mode, initial, anchor, today, onSave, onClose }) {
  const [step, setStep] = useState(mode === 'import' ? 'file' : 'check')
  const [draft, setDraft] = useState(() => (mode === 'edit' ? initial : blankTimetable()))
  const [weekType, setWeekType] = useState('Q1') // tab shown in the grid
  const [seen, setSeen] = useState(['Q1']) // tabs the student has looked at
  const [source, setSource] = useState(mode) // "import" (read from the PDF), "failed", "manual", "edit"
  const [reading, setReading] = useState(false)
  const fileInput = useRef(null)

  const unsure = countUnsure(draft)
  const askedWeek = questionWeek(today)
  const isThisWeek = askedWeek === startOfWeek(today)

  function showWeek(w) {
    setWeekType(w)
    setSeen((s) => (s.includes(w) ? s : [...s, w]))
  }

  async function readFile(file) {
    if (!file) return
    setReading(true)
    const result = await readTimetableFile(file)
    setReading(false)
    setDraft(result.ok ? result.timetable : blankTimetable())
    setSource(result.ok ? 'import' : 'failed')
    setWeekType('Q1')
    setSeen(['Q1'])
    setStep('check')
  }

  function confirmCheck() {
    if (mode === 'edit') {
      onSave(draft, anchor)
      onClose()
    } else setStep('week')
  }

  const nextUnseen = WEEK_TYPES.find((w) => !seen.includes(w))

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-svh max-h-svh w-full max-w-full flex-col rounded-none sm:h-auto sm:max-h-[90svh] sm:max-w-xl sm:rounded-xl">
        {step === 'file' && (
          <>
            <DialogHeader>
              <DialogTitle>Importer votre emploi du temps</DialogTitle>
              <DialogDescription>
                Pour voir d’un coup d’œil les créneaux où vous n’avez pas cours.
              </DialogDescription>
            </DialogHeader>

            <div className="-mx-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4">
              <section aria-labelledby="edt-how" className="flex flex-col gap-2">
                <h3 id="edt-how" className="text-sm font-medium">
                  Récupérer le PDF dans Pronote
                </h3>
                <ol className="list-decimal space-y-1 pl-5 text-sm">
                  <li>Vie scolaire › Mon emploi du temps.</li>
                  <li>Cliquez sur l’icône PDF.</li>
                  <li>
                    Dans les réglages (roue dentée), choisissez <span className="font-medium">« Année scolaire »</span>,
                    puis Valider.
                  </li>
                  <li>« Voir le PDF », puis enregistrez-le.</li>
                </ol>
              </section>

              <p className="flex gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  Le fichier reste sur votre appareil : il n’est envoyé nulle part. Seuls les horaires sont gardés,
                  aucun nom.
                </span>
              </p>

              <input
                ref={fileInput}
                type="file"
                accept=".pdf,application/pdf"
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                onChange={(e) => {
                  readFile(e.target.files?.[0])
                  e.target.value = '' // so choosing the same file again still works
                }}
              />
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                className="h-11 md:h-9"
                disabled={reading}
                onClick={() => {
                  // Start from every period « Cours », even after a PDF was read.
                  setDraft(blankTimetable())
                  setSource('manual')
                  setWeekType('Q1')
                  setSeen(['Q1'])
                  setStep('check')
                }}
              >
                Saisir à la main
              </Button>
              <Button className="h-11 md:h-9" disabled={reading} onClick={() => fileInput.current?.click()}>
                {reading ? (
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                ) : (
                  <FileUp aria-hidden="true" />
                )}
                {reading ? 'Lecture du PDF…' : 'Choisir le PDF'}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'check' && (
          <>
            <DialogHeader>
              <DialogTitle>Vérifiez votre emploi du temps</DialogTitle>
              <DialogDescription>
                Comparez avec Pronote. Touchez une case pour passer de « Cours » à « Libre ».
              </DialogDescription>
            </DialogHeader>

            <div className="-mx-4 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4">
              {source === 'failed' && (
                <p role="alert" className="flex gap-2 rounded-md bg-highlight/30 px-3 py-2 text-sm">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>
                    Nous n’avons pas pu lire ce PDF. Indiquez vos heures libres à la main : touchez chaque case où
                    vous n’avez pas cours.
                  </span>
                </p>
              )}
              {source === 'manual' && (
                <p className="flex gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>Touchez chaque case où vous n’avez pas cours.</span>
                </p>
              )}
              {unsure > 0 && (
                <p role="status" className="flex gap-2 rounded-md bg-highlight/30 px-3 py-2 text-sm">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>
                    {unsure === 1
                      ? 'Une case n’a pas pu être lue avec certitude : indiquez si vous avez cours.'
                      : `${unsure} cases n’ont pas pu être lues avec certitude : indiquez si vous avez cours.`}
                  </span>
                </p>
              )}

              <TimetableGrid timetable={draft} weekType={weekType} onWeekTypeChange={showWeek} onChange={setDraft} />

              <p className="text-xs text-muted-foreground">
                La récréation et la pause méridienne comptent comme du temps libre. Seules les heures où la
                conseillère d’orientation reçoit sont affichées.
              </p>
            </div>

            <DialogFooter className="sm:items-center">
              {unsure > 0 && !nextUnseen && (
                <span className="text-sm text-muted-foreground sm:mr-auto">
                  {unsure === 1 ? 'Il reste 1 case à vérifier.' : `Il reste ${unsure} cases à vérifier.`}
                </span>
              )}
              {mode === 'import' && (
                <Button variant="outline" className="h-11 md:h-9" onClick={() => setStep('file')}>
                  Retour
                </Button>
              )}
              {nextUnseen ? (
                <Button className="h-11 md:h-9" onClick={() => showWeek(nextUnseen)}>
                  Vérifier la semaine {nextUnseen}
                </Button>
              ) : (
                <Button className="h-11 md:h-9" disabled={unsure > 0} onClick={confirmCheck}>
                  C’est correct
                </Button>
              )}
            </DialogFooter>
          </>
        )}

        {step === 'week' && (
          <>
            <DialogHeader>
              <DialogTitle>
                {isThisWeek ? 'Cette semaine, c’est une semaine Q1 ou Q2 ?' : 'La semaine de la rentrée, c’est une semaine Q1 ou Q2 ?'}
              </DialogTitle>
              <DialogDescription>
                {formatWeekRange(askedWeek)}. Vous le voyez dans Pronote, sur votre emploi du temps de la semaine.
                Ensuite, l’application alterne d’une semaine à l’autre.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-2">
              {WEEK_TYPES.map((w) => (
                <Button
                  key={w}
                  variant="outline"
                  className="h-14 text-base"
                  onClick={() => {
                    onSave(draft, { weekStart: askedWeek, type: w })
                    onClose()
                  }}
                >
                  Semaine {w}
                </Button>
              ))}
            </div>

            <DialogFooter>
              <Button variant="ghost" className="h-11 md:h-9" onClick={() => setStep('check')}>
                Retour
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
