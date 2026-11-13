import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SCREEN_EDGE, startsAtScreenEdge } from './gestures.js'

test('a touch near the left edge belongs to the browser (iPhone "back" swipe)', () => {
  assert.equal(startsAtScreenEdge(0, 390), true)
  assert.equal(startsAtScreenEdge(18, 390), true)
  assert.equal(startsAtScreenEdge(SCREEN_EDGE - 1, 390), true)
})

test('a touch near the right edge belongs to the browser ("forward" swipe)', () => {
  assert.equal(startsAtScreenEdge(390 - 10, 390), true)
  assert.equal(startsAtScreenEdge(390 - SCREEN_EDGE + 1, 390), true)
})

test('a touch inside the screen can start a day swipe', () => {
  assert.equal(startsAtScreenEdge(SCREEN_EDGE, 390), false)
  assert.equal(startsAtScreenEdge(195, 390), false)
  assert.equal(startsAtScreenEdge(390 - SCREEN_EDGE, 390), false)
})
