import { useEffect, useState } from 'react'
import { browserStorage, isDarkTheme, readTheme, saveTheme } from '@/lib/theme'

const DARK_QUERY = '(prefers-color-scheme: dark)'

// The chosen theme ("system" | "light" | "dark"), a setter that remembers it,
// and whether the page is dark right now. Adds the `dark` class to <html>,
// which switches the colours in index.css.
export function useTheme() {
  const [theme, setTheme] = useState(() => readTheme(browserStorage()))
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => window.matchMedia(DARK_QUERY).matches)

  // Follow the device live when it switches (e.g. dark mode at sunset).
  useEffect(() => {
    const query = window.matchMedia(DARK_QUERY)
    const onChange = () => setSystemPrefersDark(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const dark = isDarkTheme(theme, systemPrefersDark)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  function changeTheme(next) {
    setTheme(next)
    saveTheme(browserStorage(), next)
  }

  return [theme, changeTheme, dark]
}
