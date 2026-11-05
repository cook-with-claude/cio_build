import { useState } from 'react'
import { CalendarCheck, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import MessageDialog from '@/components/MessageDialog'
import { formatLongDate, formatTime } from '@/lib/dates'
import { summaryMessage } from '@/lib/messages'

// Top of the counselor side: open the list of next appointments, and preview
// « Liste définitive » (the summary she receives just after the cutoff, for
// every day that has just locked).
// summary: see cutoffSummary in useDemoStore.js
export default function CounselorShortcuts({ upcomingCount, onShowUpcoming, summary }) {
  const [showSummary, setShowSummary] = useState(false)

  return (
    <div className="flex animate-in flex-wrap items-center gap-2 duration-200 fade-in-0">
      {/* Orange, so it isn't mistaken for the blue "selected" look of the switches. */}
      <Button className="h-11 bg-cpf-orange-text text-white hover:bg-cpf-orange-hover md:h-9" onClick={onShowUpcoming}>
        <CalendarCheck aria-hidden="true" />
        Prochains rendez-vous ({upcomingCount})
      </Button>
      <Button variant="ghost" className="h-11 md:h-9" onClick={() => setShowSummary(true)}>
        <ClipboardList aria-hidden="true" />
        Liste définitive
      </Button>

      {showSummary && (
        <MessageDialog
          title="Aperçu de la liste définitive"
          description={`Envoyé automatiquement le ${formatLongDate(summary.sentAt.date)} à ${formatTime(summary.sentAt.time)}, juste après la clôture des réservations pour ${summary.days.length > 1 ? 'ces jours' : 'ce jour'}.`}
          message={summaryMessage(summary)}
          to="la conseillère d’orientation"
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  )
}
