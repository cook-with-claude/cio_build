import { useEffect, useRef } from 'react'

// Apple experiment: when `value` changes (not on first show), the element
// gives a small spring "settle", right where the click happened, so the
// change is noticed at its cause (WWDC feedback: causality).
export function usePulseOnChange(value) {
  const ref = useRef(null)
  const previous = useRef(value)
  useEffect(() => {
    if (previous.current === value) return
    previous.current = value
    const el = ref.current
    if (!el?.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const easing = getComputedStyle(document.documentElement).getPropertyValue('--ease-spring-bouncy').trim() || 'ease-out'
    el.animate([{ scale: 0.9, filter: 'brightness(1.08)' }, { scale: 1, filter: 'brightness(1)' }], {
      duration: 525,
      easing,
    })
  }, [value])
  return ref
}
