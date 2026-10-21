import { Check, Hourglass, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatLongDate, formatTime } from '@/lib/dates'
import { topicLabel } from '@/lib/messages'

// Pending requests (approval mode), answered in one click each.
// requests: [{ booking, slot, student }]
export default function RequestsCard({ requests, onAccept, onRefuse, onOpen }) {
  if (requests.length === 0) return null

  return (
    <Card size="sm" className="ring-2 ring-cpf-yellow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hourglass className="size-4" aria-hidden="true" />
          Demandes en attente ({requests.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {requests.map(({ booking, slot, student }) => {
            const topic = topicLabel(booking.topic)
            return (
              <li key={booking.id} className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => onOpen(booking)}
                  className="flex min-h-11 flex-col justify-center rounded-md text-left text-sm hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <span className="font-medium">
                    {student.name} · {student.className}
                  </span>
                  <span className="text-muted-foreground">
                    {formatLongDate(slot.date)} à {formatTime(slot.start)}
                    {topic ? ` · ${topic}` : ''}
                  </span>
                </button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="h-11 flex-1 sm:flex-none md:h-9"
                    onClick={() => onRefuse(booking, student)}
                    aria-label={`Refuser la demande de ${student.name}`}
                  >
                    <X aria-hidden="true" />
                    Refuser
                  </Button>
                  <Button
                    className="h-11 flex-1 sm:flex-none md:h-9"
                    onClick={() => onAccept(booking, student)}
                    aria-label={`Accepter la demande de ${student.name}`}
                  >
                    <Check aria-hidden="true" />
                    Accepter
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
