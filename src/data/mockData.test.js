import assert from 'node:assert/strict'
import { test } from 'node:test'
import { addDays, addMinutes, isSchoolDay } from '@/lib/dates'
import { daySlotTimes, isLocked } from '@/lib/rules'
import { buildSchedule, initialSettings } from './mockData.js'

// Monday 16 to Sunday 22 November 2026 (Monday to Friday are all school days, see
// schoolCalendar.test.js for the demo during holidays): any day can be shown.
const DAYS = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays('2026-11-16', i))

for (const today of DAYS) {
  const { slots, bookings } = buildSchedule(today)

  test(`fake data shown on ${today}: no two slots overlap`, () => {
    for (const a of slots) {
      for (const b of slots) {
        if (a !== b && a.date === b.date) assert.ok(a.end <= b.start || b.end <= a.start, `${a.id} overlaps ${b.id}`)
      }
    }
  })

  test(`fake data shown on ${today}: every slot fits her hours and the default length`, () => {
    const starts = daySlotTimes(initialSettings.slotMinutes)
    for (const s of slots) {
      const fits = starts.includes(s.start) && s.end === addMinutes(s.start, initialSettings.slotMinutes)
      assert.ok(fits, `${s.id} at ${s.start}–${s.end}`)
    }
  })

  test(`fake data shown on ${today}: the 15h00 rule can be shown live`, () => {
    const soon = slots.filter((s) => s.id === 'slot-11' || s.id === 'slot-13')
    const [first, second] = soon.map((s) => s.date)
    // On a school day, the next school day locks at 15h00 today. At the
    // weekend, Monday already locked on Friday.
    assert.equal(isLocked(first, { date: today, time: '14:59' }, initialSettings), !isSchoolDay(today))
    assert.equal(isLocked(first, { date: today, time: '15:00' }, initialSettings), true)
    assert.equal(isLocked(second, { date: today, time: '21:30' }, initialSettings), false)
  })

  test(`fake data shown on ${today}: every booking points to an open slot`, () => {
    for (const b of bookings) assert.equal(slots.find((s) => s.id === b.slotId)?.kind, 'open')
  })
}
