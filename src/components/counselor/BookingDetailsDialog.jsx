import { useState } from 'react'
import { ArrowRightLeft, BellRing, CalendarClock, Check, CircleCheck, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import MessagePreview from '@/components/MessagePreview'
import { formatLongDate, formatTime } from '@/lib/dates'
import { reminderMessage, topicLabel } from '@/lib/messages'
import { lockMoment } from '@/lib/rules'
import { activeBookingForSlot, studentById } from '@/state/useDemoStore'

const slotLabel = (s) => `${formatLongDate(s.date)}, ${formatTime(s.start)}–${formatTime(s.end)}`

// Counselor view of one booking or request, with the actions she can take.
// view: "details" | "move" | "cancel" | "reminder" | "done"
export default function BookingDetailsDialog({ booking, state, actions, now, onClose }) {
  const [view, setView] = useState('details')
  const [moveTo, setMoveTo] = useState('')
  const [closeSlot, setCloseSlot] = useState(true)
  const [sent, setSent] = useState(null) // { title, messageId }

  const { slots, bookings, settings, messages } = state
  const student = studentById(booking.studentId)
  // Remembered, so the dialog still works if the slot is closed after a cancellation.
  const [slotSnapshot] = useState(() => slots.find((s) => s.id === booking.slotId))
  const slot = slots.find((s) => s.id === booking.slotId) ?? slotSnapshot
  const topic = topicLabel(booking.topic)
  const pending = booking.status === 'pending'
  const past = slot.date < now.date
  const lock = lockMoment(slot.date, settings)

  // Free open slots she can move the booking to (from tomorrow on).
  const freeSlots = slots
    .filter((s) => s.kind === 'open' && s.date > now.date && !activeBookingForSlot(bookings, s.id))
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))

  const done = (title, messageId) => {
    setSent({ title, messageId })
    setView('done')
  }

  const sentMessage = sent && messages.find((m) => m.id === sent.messageId)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
        {view === 'done' ? (
          <>
            <DialogHeader>
              <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-success/10 text-success-foreground">
                <CircleCheck aria-hidden="true" />
              </div>
              <DialogTitle>{sent.title}</DialogTitle>
              <DialogDescription>Ce message est envoyé automatiquement à l’élève :</DialogDescription>
            </DialogHeader>
            {sentMessage && <MessagePreview to={student.email} subject={sentMessage.subject} body={sentMessage.body} />}
            <DialogFooter>
              <Button className="h-11 md:h-9" onClick={onClose}>
                Fermer
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{pending ? 'Demande de rendez-vous' : 'Rendez-vous'}</DialogTitle>
              <DialogDescription className="flex items-center gap-2">
                <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
                {slotLabel(slot)}
              </DialogDescription>
            </DialogHeader>

            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-lg border p-3 text-sm">
              <dt className="text-muted-foreground">Élève</dt>
              <dd className="font-medium">{student.name}</dd>
              <dt className="text-muted-foreground">Classe</dt>
              <dd>{student.className}</dd>
              <dt className="text-muted-foreground">Sujet</dt>
              <dd>{topic ?? <span className="text-muted-foreground">Non précisé</span>}</dd>
              <dt className="text-muted-foreground">Statut</dt>
              <dd>
                {pending ? (
                  <Badge className="bg-highlight text-foreground">En attente de votre réponse</Badge>
                ) : (
                  <Badge className="bg-success text-white">Confirmé</Badge>
                )}
              </dd>
            </dl>

            {view === 'move' && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="move-to">Nouveau créneau</Label>
                {freeSlots.length ? (
                  <Select value={moveTo} onValueChange={setMoveTo}>
                    <SelectTrigger id="move-to" className="w-full data-[size=default]:h-11 md:data-[size=default]:h-9">
                      <SelectValue placeholder="Choisir un créneau libre" />
                    </SelectTrigger>
                    <SelectContent>
                      {freeSlots.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {slotLabel(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aucun créneau libre : ouvrez d’abord un créneau dans le planning.
                  </p>
                )}
              </div>
            )}

            {view === 'cancel' && (
              <div className="flex flex-col gap-3 rounded-lg bg-muted p-3 text-sm">
                <p>Un message courtois sera envoyé à l’élève, qui pourra choisir un autre créneau.</p>
                <div className="flex items-center gap-3">
                  <Checkbox id="close-slot" checked={closeSlot} onCheckedChange={(v) => setCloseSlot(v === true)} />
                  <Label htmlFor="close-slot" className="font-normal">
                    Fermer aussi ce créneau aux autres élèves
                  </Label>
                </div>
              </div>
            )}

            {view === 'reminder' && (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">
                  Envoyé automatiquement le {formatLongDate(lock.date)} à {formatTime(lock.time)}, quand les
                  rendez-vous du lendemain sont arrêtés.
                </p>
                <MessagePreview to={student.email} {...reminderMessage({ student, slot, booking })} />
              </div>
            )}

            <DialogFooter className="flex-wrap">
              {past ? (
                <Button className="h-11 md:h-9" onClick={onClose}>
                  Fermer
                </Button>
              ) : view === 'move' ? (
                <>
                  <Button variant="outline" className="h-11 md:h-9" onClick={() => setView('details')}>
                    Retour
                  </Button>
                  <Button
                    className="h-11 md:h-9"
                    disabled={!moveTo}
                    onClick={() => done('Rendez-vous déplacé', actions.moveBooking(booking.id, moveTo, now))}
                  >
                    Déplacer et prévenir l’élève
                  </Button>
                </>
              ) : view === 'cancel' ? (
                <>
                  <Button variant="outline" className="h-11 md:h-9" onClick={() => setView('details')}>
                    Retour
                  </Button>
                  <Button
                    variant="destructive"
                    className="h-11 md:h-9"
                    onClick={() => done('Rendez-vous annulé', actions.counselorCancel(booking.id, closeSlot, now))}
                  >
                    Annuler et prévenir l’élève
                  </Button>
                </>
              ) : pending ? (
                <>
                  <Button
                    variant="outline"
                    className="h-11 md:h-9"
                    onClick={() => done('Demande refusée', actions.refuseRequest(booking.id, now))}
                  >
                    <X aria-hidden="true" />
                    Refuser
                  </Button>
                  <Button
                    className="h-11 md:h-9"
                    onClick={() => done('Demande acceptée', actions.acceptRequest(booking.id, now))}
                  >
                    <Check aria-hidden="true" />
                    Accepter
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className="h-11 md:h-9"
                    onClick={() => setView(view === 'reminder' ? 'details' : 'reminder')}
                  >
                    <BellRing aria-hidden="true" />
                    {view === 'reminder' ? 'Masquer le rappel' : 'Aperçu du rappel'}
                  </Button>
                  <Button variant="outline" className="h-11 md:h-9" onClick={() => setView('cancel')}>
                    Annuler
                  </Button>
                  <Button className="h-11 md:h-9" onClick={() => setView('move')}>
                    <ArrowRightLeft aria-hidden="true" />
                    Déplacer
                  </Button>
                </>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
