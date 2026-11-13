import { useEffect } from 'react'
import { animateSpring, haptic, project, rubberband, velocityTracker } from '@/lib/spring'

const PHONE = '(max-width: 639.98px)'

// Phone bottom sheet: drag it down to dismiss (WWDC "Designing Fluid Interfaces").
// - Starts only from the grabber or the header (never inside scrolling content),
//   after 6px of downward movement, then follows the finger 1:1.
// - Upward, it rubber-bands: it resists instead of stopping dead.
// - On release, the velocity's direction decides first (moving up = stay),
//   then the projected resting point (where a flick would land) decides
//   close vs. snap back. The spring starts at the finger's velocity.
// - Grabbing it again mid-animation picks it up where it is on screen.
// `el`: the sheet element (or null until it exists). `onDismiss`: closes it (Radix path).
export function useSheetDrag(el, onDismiss, enabled = true) {
  useEffect(() => {
    if (!el || !enabled) return
    const scrim = el.previousElementSibling?.matches('[data-slot$="overlay"]') ? el.previousElementSibling : null

    let start = null // { y, offset } once a press started on the handle
    let dragging = false
    let offset = 0 // current translateY in px
    let spring = null
    const tracker = velocityTracker()

    const apply = (y) => {
      offset = y
      el.style.transform = y ? `translateY(${y}px)` : ''
      if (scrim) scrim.style.opacity = y > 0 ? String(Math.max(0, 1 - y / el.offsetHeight)) : ''
    }

    const onDown = (e) => {
      if (!window.matchMedia(PHONE).matches || e.button > 0) return
      if (!e.target.closest('[data-sheet-handle], [data-slot="dialog-header"]')) return
      if (e.target.closest('button, a, input, select, textarea, [role="button"]')) return
      // Interrupt: take over from the spring at its live position.
      if (spring) {
        spring.stop()
        spring = null
      }
      start = { y: e.clientY, offset }
      tracker.reset()
      tracker.add(offset, e.timeStamp)
    }

    const onMove = (e) => {
      if (!start) return
      const raw = start.offset + (e.clientY - start.y)
      if (!dragging) {
        if (Math.abs(e.clientY - start.y) < 6) return
        dragging = true
        try {
          el.setPointerCapture(e.pointerId)
        } catch {
          // Pointer already gone: tracking still works inside the element.
        }
        el.style.animation = 'none' // the open animation must not fight the finger
      }
      e.preventDefault()
      apply(raw >= 0 ? raw : rubberband(raw, el.offsetHeight))
      tracker.add(offset, e.timeStamp)
    }

    const onUp = () => {
      if (!start) return
      start = null
      if (!dragging) return
      dragging = false
      const v = tracker.velocity()
      const height = el.offsetHeight
      const projected = offset + project(v, 0.995)
      const dismiss = v > -50 && projected > height * 0.4

      spring = animateSpring({
        from: offset,
        to: dismiss ? height : 0,
        velocity: v,
        // Thrown away: no bounce needed. Snapping back after a pull: a hint of one.
        damping: dismiss ? 1 : 0.85,
        response: 0.35,
        onUpdate: apply,
        onComplete: () => {
          spring = null
          if (dismiss) {
            el.setAttribute('data-dragged-out', '')
            haptic(8)
            onDismiss()
          }
        },
      })
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    return () => {
      spring?.stop()
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
    }
  }, [el, onDismiss, enabled])
}
