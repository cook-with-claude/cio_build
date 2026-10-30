// Light / dark look of the app. The counselor picks it in Réglages.
// Demo shortcut: her choice also applies to the student view. Later, each
// user should get their own setting (students have no settings yet).
//
// The choice is kept in the browser (localStorage), not in the demo data:
// it's a display preference, so it survives a reload.
// index.html reads the same key before the page draws: change both together.

export const THEMES = ['system', 'light', 'dark']
export const DEFAULT_THEME = 'system'
export const THEME_STORAGE_KEY = 'cio-theme'

// "system" follows the device's own light/dark setting.
export function isDarkTheme(theme, systemPrefersDark) {
  return theme === 'dark' || (theme === 'system' && systemPrefersDark)
}

// The browser's storage, or null when it's blocked (some private windows).
export function browserStorage() {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

// The saved choice, or the default when nothing valid is saved.
export function readTheme(storage) {
  try {
    const saved = storage?.getItem(THEME_STORAGE_KEY)
    return THEMES.includes(saved) ? saved : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

// If storage is blocked, the choice still applies until the page is reloaded.
export function saveTheme(storage, theme) {
  try {
    storage?.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Nothing to do: see above.
  }
}
