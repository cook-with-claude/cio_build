import { ChevronDown, Info } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { BookingRules } from './MyBookingCard'

// Phone only: the booking rules, folded under the slots so the slots come
// first. A native <details>: one tap opens it, the browser handles the
// keyboard and screen readers. (On computers the rules stay in MyBookingCard.)
export default function BookingRulesDisclosure({ settings }) {
  return (
    <Card size="sm" className="py-0">
      <details className="group">
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 rounded-xl px-4 font-medium focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
          <Info className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="flex-1">Comment réserver ?</span>
          <ChevronDown
            className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-snappy group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="px-4 pb-4">
          <BookingRules settings={settings} icon={false} />
        </div>
      </details>
    </Card>
  )
}
