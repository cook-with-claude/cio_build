import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import MessagePreview from '@/components/MessagePreview'

// Shows one sent message in a window (e.g. from a "Voir le message" link).
export default function MessageDialog({ message, to, title = 'Message envoyé', description, onClose }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <MessagePreview to={to} subject={message.subject} body={message.body} />
        <DialogFooter>
          <Button className="h-11 md:h-9" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
