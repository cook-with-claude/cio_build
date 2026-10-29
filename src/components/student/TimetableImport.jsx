import { Component, Suspense, lazy } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// The timetable import (and pdf.js behind it) only downloads when opened.
const TimetableImportDialog = lazy(() => import('./TimetableImportDialog'))

// If that download fails (offline, or the site was updated since the page
// was opened), show a message instead of letting the whole page go blank.
class LoadErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.warn('[EDT] The timetable import could not open:', error)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function LoadFailedDialog({ onClose }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>L’import n’a pas pu s’ouvrir</DialogTitle>
          <DialogDescription>
            Vérifiez votre connexion à Internet, puis rechargez la page pour réessayer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button className="h-11 md:h-9" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Same props as TimetableImportDialog.
export default function TimetableImport(props) {
  return (
    <LoadErrorBoundary fallback={<LoadFailedDialog onClose={props.onClose} />}>
      <Suspense fallback={null}>
        <TimetableImportDialog {...props} />
      </Suspense>
    </LoadErrorBoundary>
  )
}
