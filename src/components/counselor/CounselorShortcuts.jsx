import { useState } from 'react'
import { CalendarCheck, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import MessageDialog from '@/components/MessageDialog'
import { formatLongDate, formatTime } from '@/lib/dates'
import { tomorrowSummaryMessage } from '@/lib/messages'

// Top of the counselor side: open the list of next appointments, and preview
// « Résumé de demain » (the summary she receives just after the cutoff).
// summary: see tomorrowSummary in useDemoStore.js
export default function CounselorShortcuts({ upcomingCount, onShowUpcoming, summary }) {
  const [showSummary, setShowSummary] = useState(false)

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Orange, so it isn't mistaken for the blue "selected" look of the switches. */}
      <Button className="h-11 bg-cpf-orange-text text-white hover:bg-cpf-orange-text/90 md:h-9" onClick={onShowUpcoming}>
        <CalendarCheck aria-hidden="true" />
        Prochains rendez-vous ({upcomingCount})
      </Button>
      <Button variant="ghost" className="h-11 md:h-9" onClick={() => setShowSummary(true)}>
        <ClipboardList aria-hidden="true" />
        Résumé de demain
      </Button>

      {showSummary && (
        <MessageDialog
          title="Aperçu du résumé de demain"
          description={`Envoyé automatiquement le ${formatLongDate(summary.sentAt.date)} à ${formatTime(summary.sentAt.time)}, juste après la clôture des réservations pour ce jour.`}
          message={tomorrowSummaryMessage(summary)}
          to="la conseillère d’orientation"
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  )
}
