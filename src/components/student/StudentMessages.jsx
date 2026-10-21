import { useState } from 'react'
import { ChevronRight, Mail } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import MessageDialog from '@/components/MessageDialog'
import { formatLongDate, formatTime } from '@/lib/dates'

// The automatic messages this student received, newest first (demo stand-in for their inbox).
export default function StudentMessages({ messages, email }) {
  const [shown, setShown] = useState(null)
  if (messages.length === 0) return null

  const newestFirst = [...messages].reverse()

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="size-4" aria-hidden="true" />
          Vos messages ({messages.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y border-t">
          {newestFirst.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => setShown(m)}
                className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <span className="flex flex-col">
                  <span className="font-medium">{m.subject}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatLongDate(m.sentAt.date)} à {formatTime(m.sentAt.time)}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
      {shown && <MessageDialog message={shown} to={email} title="Message reçu" onClose={() => setShown(null)} />}
    </Card>
  )
}
