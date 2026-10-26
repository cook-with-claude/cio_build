import assert from 'node:assert/strict'
import { test } from 'node:test'
import { initialSettings as settings } from '@/data/mockData'
import { isLocked, isWithinHorizon, lastBookableDate, lockMoment } from './rules.js'

// 2026-11-02 is a Monday.
const MON = '2026-11-02'
const TUE = '2026-11-03'
const WED = '2026-11-04'
const at = (date, time) => ({ date, time })

test('a day locks the day before at the cutoff time', () => {
  assert.deepEqual(lockMoment(TUE, settings), { date: MON, time: '17:00' })
})

test("Monday's bookings lock on Sunday", () => {
  assert.deepEqual(lockMoment('2026-11-09', settings), { date: '2026-11-08', time: '17:00' })
})

test('tomorrow is still bookable just before the cutoff', () => {
  assert.equal(isLocked(TUE, at(MON, '16:59'), settings), false)
})

test('tomorrow locks exactly at the cutoff', () => {
  assert.equal(isLocked(TUE, at(MON, '17:00'), settings), true)
})

test('tomorrow stays locked in the evening (21h30)', () => {
  assert.equal(isLocked(TUE, at(MON, '21:30'), settings), true)
})

test('the day after tomorrow is still bookable in the evening', () => {
  assert.equal(isLocked(WED, at(MON, '21:30'), settings), false)
})

test('no same-day bookings, even early in the morning', () => {
  assert.equal(isLocked(MON, at(MON, '07:00'), settings), true)
})

test('past days are locked', () => {
  assert.equal(isLocked(MON, at(TUE, '08:00'), settings), true)
})

test('the cutoff follows the setting', () => {
  const noon = { ...settings, cutoffTime: '12:00' }
  assert.equal(isLocked(TUE, at(MON, '11:59'), noon), false)
  assert.equal(isLocked(TUE, at(MON, '12:00'), noon), true)
})

test('students can book up to the horizon (2 weeks), not beyond', () => {
  const now = at(MON, '10:00')
  assert.equal(lastBookableDate(now, settings), '2026-11-16')
  assert.equal(isWithinHorizon('2026-11-16', now, settings), true)
  assert.equal(isWithinHorizon('2026-11-17', now, settings), false)
})
