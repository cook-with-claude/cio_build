import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DEFAULT_THEME, THEME_STORAGE_KEY, isDarkTheme, readTheme, saveTheme } from './theme.js'

function fakeStorage(initial = {}) {
  const data = { ...initial }
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = String(value)
    },
  }
}

const blockedStorage = {
  getItem() {
    throw new Error('blocked')
  },
  setItem() {
    throw new Error('blocked')
  },
}

test('isDarkTheme: light and dark ignore the device, system follows it', () => {
  assert.equal(isDarkTheme('dark', false), true)
  assert.equal(isDarkTheme('light', true), false)
  assert.equal(isDarkTheme('system', true), true)
  assert.equal(isDarkTheme('system', false), false)
})

test('the default is "system"', () => {
  assert.equal(DEFAULT_THEME, 'system')
})

test('readTheme gives back a saved choice', () => {
  assert.equal(readTheme(fakeStorage({ [THEME_STORAGE_KEY]: 'dark' })), 'dark')
  assert.equal(readTheme(fakeStorage({ [THEME_STORAGE_KEY]: 'light' })), 'light')
})

test('readTheme falls back to the default when nothing valid is saved', () => {
  assert.equal(readTheme(fakeStorage()), DEFAULT_THEME)
  assert.equal(readTheme(fakeStorage({ [THEME_STORAGE_KEY]: 'purple' })), DEFAULT_THEME)
  assert.equal(readTheme(null), DEFAULT_THEME)
  assert.equal(readTheme(blockedStorage), DEFAULT_THEME)
})

test('saveTheme stores the choice, and never throws when storage is blocked', () => {
  const storage = fakeStorage()
  saveTheme(storage, 'dark')
  assert.equal(readTheme(storage), 'dark')
  assert.doesNotThrow(() => saveTheme(blockedStorage, 'dark'))
  assert.doesNotThrow(() => saveTheme(null, 'dark'))
})
