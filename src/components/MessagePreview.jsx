import { Mail } from 'lucide-react'

// On-screen preview of an automatic message (the demo sends no real e-mail).
export default function MessagePreview({ to, subject, body }) {
  return (
    <figure className="overflow-hidden rounded-lg border bg-muted/40 text-sm">
      <figcaption className="flex items-center gap-2 border-b bg-muted px-3 py-2 text-xs text-muted-foreground">
        <Mail className="size-3.5" aria-hidden="true" />
        Aperçu du message envoyé à {to}
      </figcaption>
      <div className="flex flex-col gap-2 px-3 py-3">
        <p className="font-medium">{subject}</p>
        {body.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      <p className="border-t px-3 py-2 text-xs text-muted-foreground">
        Démo : aucun e-mail n’est réellement envoyé.
      </p>
    </figure>
  )
}
