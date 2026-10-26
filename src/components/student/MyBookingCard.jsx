import { BellRing, CalendarCheck, CalendarX, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { formatLongDate, formatTime } from '@/lib/dates'
import { isLocked, lockMoment } from '@/lib/rules'
import { slotMoment, topicLabel } from '@/lib/messages'

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
              Vous pouvez réserver jusqu’à {formatTime(settings.cutoffTime)} la veille du rendez-vous, et
              jusqu’à {settings.bookingHorizonWeeks} semaines à l’avance. Vous pouvez aussi toujours passer
              au bureau du CIO.
            </span>
          </p>
        </CardContent>
      </Card>
    )
  }

  const { booking, slot } = upcoming
  const pending = booking.status === 'pending'
  const lock = lockMoment(slot.date, settings)
  const locked = isLocked(slot.date, now, settings)
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
            {locked && (
              <p className="text-sm text-muted-foreground">
                Il n’est plus possible d’annuler en ligne. En cas d’empêchement, prévenez la conseillère
                d’orientation.
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
          {!locked && (
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
                    Le créneau du {slotMoment(slot)} sera libéré pour un autre élève. Vous pouvez annuler
                    jusqu’au {formatLongDate(lock.date)} à {formatTime(lock.time)}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="h-11 md:h-9">Garder le rendez-vous</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" className="h-11 md:h-9" onClick={onCancel}>
                    Oui, annuler
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
