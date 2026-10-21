import { useState } from 'react'
import { CalendarClock, CircleCheck, Hourglass, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { TOPICS } from '@/data/mockData'
import { formatLongDate, formatTime } from '@/lib/dates'
import { lockMoment } from '@/lib/rules'
import { confirmationMessage, slotMoment } from './messages'

// Booking flow for one slot: pick an optional topic, confirm, see the confirmation.
// The parent remounts it (key) for each slot, so it always starts fresh.
export default function BookingDialog({ slot, student, settings, existing, onConfirm, onClose }) {
  const [topic, setTopic] = useState('')
  const [done, setDone] = useState(null) // the booking once made

  const lock = lockMoment(slot.date, settings)
  const approval = settings.approvalMode
  const blocked = !done && existing && settings.oneUpcomingBookingPerStudent

  function confirm() {
    const status = approval ? 'pending' : 'confirmed'
    onConfirm(topic || null)
    setDone({ topic: topic || null, status })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
        {blocked ? (
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
              <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-success/10 text-success-foreground">
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
              <Label id="topic-label">Sujet (facultatif)</Label>
              <ToggleGroup
                type="single"
                variant="outline"
                spacing={2}
                value={topic}
                onValueChange={setTopic}
                aria-labelledby="topic-label"
                className="flex w-full flex-wrap"
              >
                {TOPICS.map((t) => (
                  <ToggleGroupItem
                    key={t.id}
                    value={t.id}
                    className="h-11 rounded-full px-3 md:h-9 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    {t.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <p className="text-xs text-muted-foreground">
                Pour aider la conseillère à préparer l’entretien, si vous le souhaitez.
              </p>
            </div>

            <p className="flex gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                {approval
                  ? 'La conseillère doit accepter votre demande. '
                  : ''}
                Vous pourrez annuler jusqu’au {formatLongDate(lock.date)} à {formatTime(lock.time)}.
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
