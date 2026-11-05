import assert from 'node:assert/strict'
import { test } from 'node:test'
import { addDays, addMinutes } from '@/lib/dates'
import { daySlotTimes, isLocked, lockDay } from '@/lib/rules'
import { topicError } from '@/lib/topics'
import { DEMO_STUDENTS, LEVELS, buildSchedule, initialSettings, students } from './mockData.js'

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
    // The first day is bookable this morning. When a day locks today (every
    // school day but Thursday), it is that one: it locks at 15h00.
    assert.equal(isLocked(first, { date: today, time: '14:59' }, initialSettings), false)
    assert.equal(isLocked(first, { date: today, time: '15:00' }, initialSettings), lockDay(first) === today)
    // The second is still bookable tonight.
    assert.equal(isLocked(second, { date: today, time: '21:30' }, initialSettings), false)
  })

  test(`fake data shown on ${today}: every booking points to an open slot`, () => {
    for (const b of bookings) assert.equal(slots.find((s) => s.id === b.slotId)?.kind, 'open')
  })

  test(`fake data shown on ${today}: every booking has a valid topic`, () => {
    for (const b of bookings) {
      const level = students.find((s) => s.id === b.studentId).level
      assert.equal(topicError(b.topic, b.topicOther, level), null, b.id)
    }
  })

  test(`fake data shown on ${today}: the demo students start with no booking`, () => {
    const demoIds = Object.values(DEMO_STUDENTS)
    assert.ok(bookings.every((b) => !demoIds.includes(b.studentId)))
  })
}

test('there is one demo student per level, of that level', () => {
  for (const { id } of LEVELS) {
    assert.equal(students.find((s) => s.id === DEMO_STUDENTS[id])?.level, id)
  }
})
