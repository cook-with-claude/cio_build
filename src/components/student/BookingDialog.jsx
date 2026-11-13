import { useState } from 'react'
import { haptic } from '@/lib/spring'
import { CalendarClock, CircleAlert, CircleCheck, Hourglass, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import MessagePreview from '@/components/MessagePreview'
import { formatLongDate, formatTime } from '@/lib/dates'
import { lockMoment } from '@/lib/rules'
import { confirmationMessage, slotMoment } from '@/lib/messages'
import { OTHER_TOPIC, OTHER_TOPIC_MAX_LENGTH, topicError, topicsFor } from '@/lib/topics'

// Booking flow for one slot: pick a topic (required; the list depends on the
// student's level), confirm, see the confirmation.
// The parent remounts it (key) for each slot, so it always starts fresh.
// `levelNotice` ({ title, body }) when the student's level can't book yet.
export default function BookingDialog({ slot, student, settings, existing, levelNotice, onConfirm, onClose }) {
  const [topic, setTopic] = useState('')
  const [otherText, setOtherText] = useState('')
  const [tried, setTried] = useState(false) // show errors once they tried to confirm
  const [done, setDone] = useState(null) // the booking once made

  const lock = lockMoment(slot.date, settings)
  const approval = settings.approvalMode
  const blocked = !done && existing && settings.oneUpcomingBookingPerStudent
  const topics = topicsFor(student.level)
  const error = topicError(topic, otherText, student.level)
  const showError = tried && error
  const isOther = topic === OTHER_TOPIC

  function confirm() {
    if (error) {
      setTried(true)
      return
    }
    const choice = { topic, topicOther: isOther ? otherText.trim() : null }
    onConfirm(choice)
    haptic(12) // a commit moment: the booking is made
    setDone({ ...choice, status: approval ? 'pending' : 'confirmed' })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent largeClose className="max-h-[90svh] overflow-y-auto max-md:overscroll-contain sm:max-w-md">
        {levelNotice && !done ? (
          <>
            <DialogHeader>
              <DialogTitle>{levelNotice.title}</DialogTitle>
              <DialogDescription>{levelNotice.body}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button className="h-11 md:h-9" onClick={onClose}>
                Compris
              </Button>
            </DialogFooter>
          </>
        ) : blocked ? (
          <>
            <DialogHeader>
              <DialogTitle>Vous avez déjà un rendez-vous</DialogTitle>
              <DialogDescription>
                Votre prochain rendez-vous est le {slotMoment(existing.slot)}. Pour en choisir un autre,
                annulez-le d’abord depuis « Votre prochain rendez-vous ».
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button className="h-11 md:h-9" onClick={onClose}>
                Compris
              </Button>
            </DialogFooter>
          </>
        ) : done ? (
          <>
            <DialogHeader>
              <div className="animate-pop mb-1 flex size-12 items-center justify-center rounded-full bg-success/15 text-success-foreground ring-4 ring-success/10">
                {done.status === 'pending' ? <Hourglass aria-hidden="true" /> : <CircleCheck aria-hidden="true" />}
              </div>
              <DialogTitle>{done.status === 'pending' ? 'Demande envoyée' : 'Rendez-vous confirmé'}</DialogTitle>
              <DialogDescription>
                {done.status === 'pending'
                  ? `Votre demande pour le ${slotMoment(slot)} attend la réponse de la conseillère d’orientation.`
                  : `Vous avez rendez-vous le ${slotMoment(slot)} avec la conseillère d’orientation.`}
              </DialogDescription>
            </DialogHeader>
            <MessagePreview
              to={student.email}
              {...confirmationMessage({ student, slot, booking: done, lock })}
            />
            <DialogFooter>
              <Button className="h-11 md:h-9" onClick={onClose}>
                Fermer
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Réserver ce créneau</DialogTitle>
              <DialogDescription className="flex items-center gap-2">
                <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
                {formatLongDate(slot.date)}, de {formatTime(slot.start)} à {formatTime(slot.end)}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2">
              <Label id="topic-label">Sujet</Label>
              <ToggleGroup
                type="single"
                variant="outline"
                spacing={2}
                value={topic}
                onValueChange={setTopic}
                aria-labelledby="topic-label"
                aria-describedby="topic-help"
                className="flex w-full flex-wrap"
              >
                {topics.map((t) => (
                  <ToggleGroupItem
                    key={t.id}
                    value={t.id}
                    className="h-11 rounded-full px-3 md:h-9 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    {t.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              {isOther && (
                <div className="flex flex-col gap-1.5 pt-1">
                  <Label htmlFor="topic-other" className="font-normal">
                    Précisez le sujet
                  </Label>
                  <Input
                    id="topic-other"
                    name="topicOther"
                    value={otherText}
                    maxLength={OTHER_TOPIC_MAX_LENGTH}
                    onChange={(e) => setOtherText(e.target.value)}
                    placeholder="Ex. : année de césure"
                    autoComplete="off"
                    autoFocus
                    aria-invalid={showError ? true : undefined}
                    aria-describedby="topic-other-count"
                    className="h-11 md:h-9"
                  />
                  <p id="topic-other-count" className="self-end text-xs text-muted-foreground tabular-nums">
                    {otherText.length}/{OTHER_TOPIC_MAX_LENGTH} caractères
                  </p>
                </div>
              )}
              {showError ? (
                <p id="topic-help" role="alert" className="flex items-center gap-1.5 text-sm font-medium text-destructive">
                  <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
                  {error}
                </p>
              ) : (
                <p id="topic-help" className="text-xs text-muted-foreground">
                  Pour aider la conseillère à préparer l’entretien.
                </p>
              )}
            </div>

            <p className="flex gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                {approval
                  ? 'La conseillère doit accepter votre demande. '
                  : ''}
                Vous pourrez annuler librement jusqu’au {formatLongDate(lock.date)} à {formatTime(lock.time)}, puis
                jusqu’au début du rendez-vous en indiquant un motif.
              </span>
            </p>

            <DialogFooter>
              <Button variant="outline" className="h-11 md:h-9" onClick={onClose}>
                Annuler
              </Button>
              <Button className="h-11 md:h-9" onClick={confirm}>
                {approval ? 'Envoyer la demande' : 'Confirmer la réservation'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
