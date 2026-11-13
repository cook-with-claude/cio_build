import { useEffect, useRef } from 'react'
import { startsAtScreenEdge } from '@/lib/gestures'
import { animateSpring, haptic, project, rubberband, velocityTracker } from '@/lib/spring'
import { PHONE_QUERY as PHONE } from '@/lib/useIsPhone'

// Phone: swipe the shown day left/right to go to the next/previous day.
// - Touch and pen only (a mouse keeps clicking), phones only.
// - Never from the screen's edges: there the swipe is the browser's own
//   "back"/"forward" gesture (see gestures.js).
// - Waits for 10px of mostly-horizontal movement, so taps and vertical
//   scrolling are left alone; then follows the finger 1:1.
// - Monday and Friday are soft edges: it rubber-bands instead of stopping.
// - On release, the velocity's direction and the projected landing point
//   decide; the card leaves the way it was thrown, the next day comes in
//   from the other side, both at the finger's speed.
// - A touch during the motion grabs it where it is.
export function useDaySwipe(ref, days, selectedDay, setSelectedDay) {
  const latest = useRef({ days, selectedDay, setSelectedDay })
  latest.current = { days, selectedDay, setSelectedDay }

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let start = null
    let mode = null // null (undecided) | 'swipe' | 'ignore'
    let offset = 0
    let spring = null
    let swallowClick = false
    const tracker = velocityTracker()

    const apply = (x) => {
      offset = x
      el.style.transform = x ? `translateX(${x}px)` : ''
      // Large moving surfaces fade a little while they travel (WWDC accessibility).
      el.style.opacity = x ? String(1 - Math.min(0.35, Math.abs(x) / el.offsetWidth / 2)) : ''
    }
    const neighbour = (dir) => {
      const { days, selectedDay } = latest.current
      return days[days.indexOf(selectedDay) + dir]
    }

    const onDown = (e) => {
      if (e.pointerType === 'mouse' || !window.matchMedia(PHONE).matches) return
      // The edges belong to the browser, even while a card is still settling
      // (its last second is sub-pixel, so it looks still but is "moving").
      if (startsAtScreenEdge(e.clientX, window.innerWidth)) return
      if (spring) {
        spring.stop()
        spring = null
      }
      start = { x: e.clientX, y: e.clientY, offset }
      mode = offset ? 'swipe' : null
      tracker.reset()
      tracker.add(offset, e.timeStamp)
    }

    const onMove = (e) => {
      if (!start || mode === 'ignore') return
      const dx = e.clientX - start.x
      const dy = e.clientY - start.y
      if (!mode) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
          mode = 'ignore'
          return
        }
        if (Math.abs(dx) < 10) return
        mode = 'swipe'
        try {
          el.setPointerCapture(e.pointerId)
        } catch {
          // Pointer already gone: tracking still works inside the element.
        }
      }
      const raw = start.offset + dx
      const width = el.offsetWidth
      const blocked = (raw > 0 && !neighbour(-1)) || (raw < 0 && !neighbour(1))
      apply(blocked ? rubberband(raw, width) : raw)
      tracker.add(offset, e.timeStamp)
    }

    const settle = (velocity) => {
      spring = animateSpring({
        from: offset,
        to: 0,
        velocity,
        damping: 0.85,
        response: 0.35,
        onUpdate: apply,
        onComplete: () => (spring = null),
      })
    }

    const onUp = (e) => {
      if (!start) return
      const wasSwipe = mode === 'swipe'
      start = null
      mode = null
      if (!wasSwipe) return
      swallowClick = true
      setTimeout(() => (swallowClick = false), 80)
      const v = e.type === 'pointercancel' ? 0 : tracker.velocity()
      const width = el.offsetWidth
      const projected = offset + project(v, 0.995)
      const dir = projected < -width * 0.3 && v <= 50 ? 1 : projected > width * 0.3 && v >= -50 ? -1 : 0
      const next = dir && neighbour(dir)
      if (!next) return settle(v)

      // Out the way it was thrown...
      spring = animateSpring({
        from: offset,
        to: -dir * width,
        velocity: v,
        damping: 1,
        response: 0.25,
        onUpdate: apply,
        onComplete: () => {
          // ...and the next day in from the other side, still moving.
          latest.current.setSelectedDay(next)
          haptic(6)
          apply(dir * width * 0.5)
          settle(Math.min(Math.abs(v), 2500) * -dir)
        },
      })
    }

    // A swipe that ended on a slot must not also book it.
    const onClick = (e) => {
      if (swallowClick) {
        e.stopPropagation()
        e.preventDefault()
      }
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    el.addEventListener('click', onClick, true)
    return () => {
      spring?.stop()
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      el.removeEventListener('click', onClick, true)
    }
  }, [ref])
}
