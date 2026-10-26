import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import MessageDialog from '@/components/MessageDialog'
import { formatLongDate, formatTime } from '@/lib/dates'

// Automatic messages someone received, newest first (demo stand-in for an
// inbox): « Vos messages » for the student, « Vos notifications » for the
// counselor. Hidden while empty.
// messages: [{ id, subject, body, sentAt: { date, time } }]
export default function MessageList({ title, icon: Icon, messages, to, dialogTitle }) {
  const [shown, setShown] = useState(null)
  if (messages.length === 0) return null

  const newestFirst = [...messages].reverse()

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-4" aria-hidden="true" />
          {title} ({messages.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y border-t">
          {newestFirst.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => setShown(m)}
                className="group flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <span className="flex flex-col">
                  <span className="font-medium">{m.subject}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatLongDate(m.sentAt.date)} à {formatTime(m.sentAt.time)}
                  </span>
                </span>
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 ease-snappy group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
      {shown && <MessageDialog message={shown} to={to} title={dialogTitle} onClose={() => setShown(null)} />}
    </Card>
  )
}
