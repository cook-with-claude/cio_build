import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  addDays,
  formatTime,
  formatWeekRange,
  nextSchoolDay,
  nowInBeirut,
  previousSchoolDay,
  startOfWeek,
} from './dates.js'

test('addDays crosses month and year ends', () => {
  assert.equal(addDays('2026-10-31', 1), '2026-11-01')
  assert.equal(addDays('2026-12-31', 1), '2027-01-01')
  assert.equal(addDays('2026-11-01', -1), '2026-10-31')
})

test('startOfWeek gives the Monday, also from a Sunday', () => {
  assert.equal(startOfWeek('2026-11-04'), '2026-11-02') // Wednesday
  assert.equal(startOfWeek('2026-11-02'), '2026-11-02') // Monday
  assert.equal(startOfWeek('2026-11-08'), '2026-11-02') // Sunday
})

// Slot times inside her hours are tested in rules.test.js.

test('school days skip the weekend in both directions', () => {
  assert.equal(nextSchoolDay('2026-11-02'), '2026-11-03') // Monday -> Tuesday
  assert.equal(nextSchoolDay('2026-11-06'), '2026-11-09') // Friday -> Monday
  assert.equal(nextSchoolDay('2026-11-07'), '2026-11-09') // Saturday -> Monday
  assert.equal(previousSchoolDay('2026-11-09'), '2026-11-06') // Monday -> Friday
  assert.equal(previousSchoolDay('2026-11-08'), '2026-11-06') // Sunday -> Friday
  assert.equal(previousSchoolDay('2026-11-04'), '2026-11-03') // Wednesday -> Tuesday
})

test('times and weeks read the French way', () => {
  assert.equal(formatTime('08:00'), '8h00')
  assert.equal(formatWeekRange('2026-11-02'), 'Semaine du 2 au 6 novembre 2026')
  assert.equal(formatWeekRange('2026-10-26'), 'Semaine du 26 au 30 octobre 2026')
  assert.equal(formatWeekRange('2026-11-30'), 'Semaine du 30 novembre au 4 décembre 2026')
})

test('the clock uses Beirut time, whatever the computer timezone', () => {
  // 21:30 UTC on 2 November is 23:30 in Beirut (UTC+2 in winter).
  assert.deepEqual(nowInBeirut(new Date('2026-11-02T21:30:00Z')), { date: '2026-11-02', time: '23:30' })
  // 22:30 UTC is already the next day in Beirut.
  assert.deepEqual(nowInBeirut(new Date('2026-11-02T22:30:00Z')), { date: '2026-11-03', time: '00:30' })
})
