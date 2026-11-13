import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import RoleSwitch from '@/components/RoleSwitch'

// Phone only: every demo-only control (Élève/Conseillère, demo date, level)
// behind one « Démo » button in the header, so the page starts with what a
// student came for. On computers they stay in the header and the dashed
// panel (App.jsx). `children`: the demo date panel (DemoClock, bare).
export default function DemoSheet({ role, onRoleChange, children }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-11 shrink-0 gap-1.5 rounded-full px-3.5 shadow-sm">
          <SlidersHorizontal aria-hidden="true" />
          Démo
        </Button>
      </DialogTrigger>
      <DialogContent largeClose className="max-h-[90svh] overflow-y-auto max-md:overscroll-contain sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Réglages de la démo</DialogTitle>
          <DialogDescription>Démo · données fictives</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted-foreground">Voir en tant que</span>
          <RoleSwitch
            role={role}
            wide
            onChange={(next) => {
              onRoleChange(next)
              // Show the chosen side right away.
              setOpen(false)
            }}
          />
        </div>
        {children}
      </DialogContent>
    </Dialog>
  )
}
