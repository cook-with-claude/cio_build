import { test } from 'node:test'
import assert from 'node:assert/strict'
import { project, rubberband, springCurve, springStep, velocityTracker } from './spring.js'

test('a critically damped spring reaches its target without overshooting', () => {
  const { points } = springCurve({ damping: 1, response: 0.4 })
  assert.equal(points[0], 0)
  assert.equal(points.at(-1), 1)
  assert.ok(points.every((p) => p <= 1.0001))
})

test('an under-damped spring overshoots a little, then settles', () => {
  const { points } = springCurve({ damping: 0.8, response: 0.35 })
  const peak = Math.max(...points)
  assert.ok(peak > 1 && peak < 1.05, `peak ${peak}`)
  assert.equal(points.at(-1), 1)
})

test('a lower response settles sooner', () => {
  assert.ok(springCurve({ response: 0.3 }).duration < springCurve({ response: 0.5 }).duration)
})

test('a spring keeps the velocity it was given', () => {
  const next = springStep({ x: 0, v: 500 }, 0, { damping: 1, response: 0.4 }, 1 / 240)
  assert.ok(next.x > 0, 'moves in the direction of the velocity first')
})

test('momentum projection follows Apple’s formula', () => {
  assert.equal(project(0), 0)
  assert.ok(Math.abs(project(1000) - 499) < 0.01) // 1 * 0.998 / 0.002
  assert.ok(project(-1000) < 0)
})

test('rubber band resists more the further you pull', () => {
  const a = rubberband(50, 300)
  const b = rubberband(200, 300)
  assert.ok(a < 50 && b < 200)
  assert.ok(b / 200 < a / 50)
  assert.equal(rubberband(-50, 300), -a)
})

test('velocity tracker measures px per second over recent samples', () => {
  const t = velocityTracker(100)
  t.add(0, 0)
  t.add(10, 10)
  t.add(50, 50)
  assert.equal(t.velocity(), 1000)
  t.add(50, 400) // old samples dropped: no movement since
  assert.equal(t.velocity(), 0)
})
