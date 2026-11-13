import { useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

// Apple experiment: the "selected" background of a segmented control
// (ToggleGroup) as ONE piece that slides to the chosen option, like iOS.
// Put it as the first child of a `relative` ToggleGroup; the items keep
// their own text colour but drop their selected background.
// `value` is only there to re-measure when the selection changes.
export default function SegmentedThumb({ value, className }) {
  const ref = useRef(null)
  const [box, setBox] = useState(null)
  // No slide on the very first placement (nothing moved yet).
  const [ready, setReady] = useState(false)

  useLayoutEffect(() => {
    const group = ref.current?.parentElement
    if (!group) return
    const measure = () => {
      const on = group.querySelector('[data-state="on"]')
      if (!on) return setBox(null)
      setBox({ x: on.offsetLeft, y: on.offsetTop, w: on.offsetWidth, h: on.offsetHeight })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(group)
    for (const item of group.children) ro.observe(item)
    return () => ro.disconnect()
  }, [value])

  useLayoutEffect(() => {
    if (box && !ready) {
      const id = requestAnimationFrame(() => setReady(true))
      return () => cancelAnimationFrame(id)
    }
  }, [box, ready])

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute top-0 left-0 z-0',
        ready && 'segment-thumb',
        !box && 'opacity-0',
        className,
      )}
      style={box ? { translate: `${box.x}px ${box.y}px`, width: box.w, height: box.h } : undefined}
    />
  )
}
