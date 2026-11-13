import * as React from "react"
import { cn } from "cn"
import { Dialog as DialogPrimitive } from "radix-ui"

import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"
import { useSheetDrag } from "@/lib/useSheetDrag"

function Dialog({
  ...props
}) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        // Dim to focus (a modal task): a deeper scrim than before, with a soft blur.
        "scrim fixed inset-0 isolate z-50 bg-black/25 supports-backdrop-filter:backdrop-blur-[2px] dark:bg-black/50",
        className
      )}
      {...props}
    />
  )
}

// Apple experiment:
// - Computer: the dialog materializes from the button that opened it
//   (transform-origin = that button), and leaves the same way.
// - Phone: a bottom sheet with a grabber; drag it down to close (useSheetDrag).
//   `sheet={false}` keeps a dialog full-screen on phones (long lists).
// `largeClose`: on phones the ✕ is 44px instead of 36px (the student side
// and the « Démo » sheet; the counselor's dialogs keep the smaller one).
function DialogContent({
  className,
  children,
  showCloseButton = true,
  sheet = true,
  largeClose = false,
  ref,
  ...props
}) {
  // The content appears a moment after this component (Radix portal), so
  // keep the element in state: the drag hook attaches once it exists.
  const [node, setNode] = React.useState(null)
  const closeRef = React.useRef(null)
  const setRefs = React.useCallback(
    (el) => {
      // Anchor the scale to the trigger (still focused at this point).
      if (el && window.matchMedia("(min-width: 640px)").matches) {
        const trigger = document.activeElement
        if (trigger && trigger !== document.body && !el.contains(trigger)) {
          const t = trigger.getBoundingClientRect()
          const c = el.getBoundingClientRect()
          const x = Math.min(Math.max(t.left + t.width / 2 - c.left, -c.width), c.width * 2)
          const y = Math.min(Math.max(t.top + t.height / 2 - c.top, -c.height), c.height * 2)
          el.style.transformOrigin = `${x}px ${y}px`
        }
      }
      setNode(el)
      if (typeof ref === "function") ref(el)
      else if (ref) ref.current = el
    },
    [ref]
  )

  const dismiss = React.useCallback(() => closeRef.current?.click(), [])
  useSheetDrag(node, dismiss, sheet)

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={setRefs}
        data-slot="dialog-content"
        data-sheet={sheet ? "" : undefined}
        className={cn(
          "material-dialog fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-2xl bg-popover p-4 text-sm text-popover-foreground shadow-2xl shadow-black/20 ring-1 ring-foreground/10 outline-none sm:max-w-sm",
          // Phone: pinned to the bottom edge, full width, rounded top only.
          sheet &&
            "sheet-dialog max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:max-w-full max-sm:translate-none max-sm:rounded-b-none max-sm:rounded-t-3xl max-sm:pt-7 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))]",
          className
        )}
        {...props}
      >
        {sheet && (
          // The grabber: says "this can be pulled down". Phone only.
          <div
            data-sheet-handle
            aria-hidden="true"
            className="absolute inset-x-0 top-0 flex h-7 cursor-grab touch-none items-center justify-center sm:hidden"
          >
            <span className="h-1.5 w-10 rounded-full bg-foreground/20" />
          </div>
        )}
        {children}
        <DialogPrimitive.Close ref={closeRef} className="hidden" tabIndex={-1} aria-hidden="true" />
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <Button
              variant="ghost"
              className={cn(
                "absolute top-1.5 right-1.5 size-11 rounded-full max-sm:top-3 max-sm:right-3 max-sm:size-9 max-sm:bg-muted md:size-8",
                largeClose && "max-sm:top-2 max-sm:right-2 max-sm:size-11"
              )}
              size="icon-sm"
            >
              <XIcon
              />
              <span className="sr-only">Fermer</span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({
  className,
  ...props
}) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 max-sm:touch-none max-sm:select-none max-sm:pr-10", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-2xl border-t bg-muted/50 p-4 max-sm:rounded-none max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Fermer</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-lg leading-tight font-semibold text-balance",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
