import { useSyncExternalStore } from 'react'

// "Phone layout": screens narrower than Tailwind's `md` breakpoint (768px).
// The same limit as the phone day picker and the day swipe (WeekView), so
// everything switches at one width. Tablets and computers keep the desktop
// layout.
export const PHONE_QUERY = '(max-width: 767.98px)'

function subscribe(onChange) {
  const mql = window.matchMedia(PHONE_QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

// True while the screen is phone-sized; updates when it is resized or rotated.
export function useIsPhone() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(PHONE_QUERY).matches)
}
