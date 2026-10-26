import { useState } from 'react'
import { BellRing, CalendarCheck, CalendarX, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatLongDate, formatTime } from '@/lib/dates'
import { cancellationKind, lockMoment } from '@/lib/rules'
import { LATE_CANCEL_REASONS, slotMoment, topicLabel } from '@/lib/messages'

// After the cutoff: cancelling needs a reason from a fixed list (no free text).
function LateCancelButton({ slot, onCancel }) {
  const [reason, setReason] = useState('')

  return (
    <AlertDialog onOpenChange={(open) => !open && setReason('')}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="h-11 md:h-9">
          Annuler le rendez-vous
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Annuler ce rendez-vous ?</AlertDialogTitle>
          <AlertDialogDescription>
            Les réservations pour le {slotMoment(slot)} sont closes : le créneau ne sera pas proposé à un autre
            élève. La conseillère d’orientation sera prévenue avec le motif choisi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="late-reason">Motif</Label>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger id="late-reason" className="w-full data-[size=default]:h-11 md:data-[size=default]:h-9">
              <SelectValue placeholder="Choisir un motif" />
            </SelectTrigger>
            <SelectContent>
              {LATE_CANCEL_REASONS.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11 md:h-9">Garder le rendez-vous</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            className="h-11 md:h-9"
            disabled={!reason}
            onClick={() => onCancel(reason)}
          >
            Oui, annuler
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Top of the student view: the student's next booking (with cancel), or how booking works.
export default function MyBookingCard({ upcoming, settings, now, notice, onCancel, onShowReminder }) {
  if (!upcoming) {
    return (
      <Card size="sm">
        <CardContent className="flex flex-col gap-2">
          {notice && (
            <p role="status" className="flex items-center gap-2 font-medium">
              <CalendarX className="size-4 text-muted-foreground" aria-hidden="true" />
              {notice}
            </p>
          )}
          <p>
            Choisissez un créneau <span className="font-medium text-success-foreground">« Disponible »</span>{' '}
            ci-dessous.
          </p>
          <p className="flex gap-2 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              Vous pouvez réserver jusqu’à {formatTime(settings.cutoffTime)} la veille du rendez-vous (le vendredi
              pour un lundi), et jusqu’à {settings.bookingHorizonWeeks} semaines à l’avance. Vous pouvez aussi
              toujours passer au bureau du CIO.
            </span>
          </p>
        </CardContent>
      </Card>
    )
  }

  const { booking, slot } = upcoming
  const pending = booking.status === 'pending'
  const lock = lockMoment(slot.date, settings)
  // "free" before the cutoff, "late" after it (confirmed bookings only:
  // requests still pending then are declined automatically), "none" once started.
  const kind = cancellationKind(slot, now, settings)
  const topic = topicLabel(booking.topic)

  return (
    <Card size="sm" className="ring-2 ring-primary/30">
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarCheck className="size-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">Votre prochain rendez-vous</p>
            <p className="font-semibold">
              {formatLongDate(slot.date)}, {formatTime(slot.start)}–{formatTime(slot.end)}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {pending ? (
                <Badge className="bg-highlight text-foreground">En attente de validation</Badge>
              ) : (
                <Badge className="bg-success text-white">Confirmé</Badge>
              )}
              {topic && <Badge variant="outline">{topic}</Badge>}
            </div>
            {kind === 'late' && !pending && (
              <p className="text-sm text-muted-foreground">
                Les réservations pour ce jour sont closes. En cas d’empêchement, vous pouvez encore annuler en
                indiquant un motif.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {!pending && (
            <Button variant="ghost" className="h-11 md:h-9" onClick={onShowReminder}>
              <BellRing aria-hidden="true" />
              Aperçu du rappel
            </Button>
          )}
          {kind === 'free' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="h-11 md:h-9">
                  {pending ? 'Annuler la demande' : 'Annuler le rendez-vous'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Annuler ce rendez-vous ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Le créneau du {slotMoment(slot)} sera libéré pour un autre élève. Vous pouvez annuler librement
                    jusqu’au {formatLongDate(lock.date)} à {formatTime(lock.time)}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="h-11 md:h-9">Garder le rendez-vous</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" className="h-11 md:h-9" onClick={() => onCancel()}>
                    Oui, annuler
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {kind === 'late' && !pending && <LateCancelButton slot={slot} onCancel={onCancel} />}
        </div>
      </CardContent>
    </Card>
  )
}
