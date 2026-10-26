import assert from 'node:assert/strict'
import { test } from 'node:test'
import { addDays } from '@/lib/dates'
import { isLocked } from '@/lib/rules'
import { buildSchedule, initialSettings } from './mockData.js'

// Monday 2 to Sunday 8 November 2026: the demo can be shown on any of them.
const DAYS = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays('2026-11-02', i))

for (const today of DAYS) {
  const { slots, bookings } = buildSchedule(today)

  test(`fake data shown on ${today}: no two slots overlap`, () => {
    for (const a of slots) {
      for (const b of slots) {
        if (a !== b && a.date === b.date) assert.ok(a.end <= b.start || b.end <= a.start, `${a.id} overlaps ${b.id}`)
      }
    }
  })

  test(`fake data shown on ${today}: the 17h00 rule can be shown live`, () => {
    const soon = slots.filter((s) => s.id === 'slot-11' || s.id === 'slot-13')
    const [first, second] = soon.map((s) => s.date)
    assert.equal(isLocked(first, { date: today, time: '16:59' }, initialSettings), false)
    assert.equal(isLocked(first, { date: today, time: '17:00' }, initialSettings), first === addDays(today, 1))
    assert.equal(isLocked(second, { date: today, time: '21:30' }, initialSettings), false)
  })

  test(`fake data shown on ${today}: every booking points to an open slot`, () => {
    for (const b of bookings) assert.equal(slots.find((s) => s.id === b.slotId)?.kind, 'open')
  })
}
