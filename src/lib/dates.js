// Date helpers. Every date in the app is a plain "YYYY-MM-DD" string and every
// time is a "HH:MM" string, both already in Asia/Beirut local time. Keeping them
// as strings avoids timezone conversion bugs (and maps cleanly to SQL date/time
// columns later). Arithmetic is done on UTC-midnight Date objects, which never
// shift across daylight-saving changes.

export const TIMEZONE = 'Asia/Beirut'
export const SCHOOL_DAY_START = '08:00'
export const SCHOOL_DAY_END = '15:30'

// Today's date in Beirut, whatever the computer's own timezone is.
export function todayInBeirut(now = new Date()) {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(now)
}

// Current date and time in Beirut: { date: "YYYY-MM-DD", time: "HH:MM" }.
export function nowInBeirut(now = new Date()) {
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now)
  return { date: todayInBeirut(now), time }
}

function toUtcDate(dateStr) {
  return new Date(`${dateStr}T00:00:00Z`)
}

function fromUtcDate(date) {
  return date.toISOString().slice(0, 10)
}

export function addDays(dateStr, days) {
  const d = toUtcDate(dateStr)
  d.setUTCDate(d.getUTCDate() + days)
  return fromUtcDate(d)
}

// Monday of the week containing dateStr.
export function startOfWeek(dateStr) {
  const day = toUtcDate(dateStr).getUTCDay() // 0 = Sunday … 6 = Saturday
  const offset = day === 0 ? -6 : 1 - day
  return addDays(dateStr, offset)
}

// The five school days (Monday–Friday) of the week starting on mondayStr.
export function weekDays(mondayStr) {
  return [0, 1, 2, 3, 4].map((i) => addDays(mondayStr, i))
}

export function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0')
  const m = String(minutes % 60).padStart(2, '0')
  return `${h}:${m}`
}

export function addMinutes(time, minutes) {
  return minutesToTime(timeToMinutes(time) + minutes)
}

// Start times of every slot that fits inside the school day,
// e.g. 08:00, 08:30 … 15:00 for 30-minute slots.
export function daySlotTimes(slotMinutes) {
  const times = []
  const end = timeToMinutes(SCHOOL_DAY_END)
  for (let t = timeToMinutes(SCHOOL_DAY_START); t + slotMinutes <= end; t += slotMinutes) {
    times.push(minutesToTime(t))
  }
  return times
}

// --- French labels -------------------------------------------------------

const fmt = (options) => new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', ...options })
const weekdayShort = fmt({ weekday: 'short' })
const weekdayLong = fmt({ weekday: 'long' })
const dayMonth = fmt({ day: 'numeric', month: 'long' })
const dayMonthYear = fmt({ day: 'numeric', month: 'long', year: 'numeric' })

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1)

// "Lun." / "Lundi"
export const formatWeekdayShort = (dateStr) => capitalize(weekdayShort.format(toUtcDate(dateStr)))
export const formatWeekdayLong = (dateStr) => capitalize(weekdayLong.format(toUtcDate(dateStr)))

// "26"
export const formatDayNumber = (dateStr) => String(toUtcDate(dateStr).getUTCDate())

// "lundi 26 octobre"
export const formatLongDate = (dateStr) =>
  `${weekdayLong.format(toUtcDate(dateStr))} ${dayMonth.format(toUtcDate(dateStr))}`

// "Semaine du 26 au 30 octobre 2026" (month repeated when the week spans two months)
export function formatWeekRange(mondayStr) {
  const friday = addDays(mondayStr, 4)
  const sameMonth = mondayStr.slice(0, 7) === friday.slice(0, 7)
  const from = sameMonth ? formatDayNumber(mondayStr) : dayMonth.format(toUtcDate(mondayStr))
  return `Semaine du ${from} au ${dayMonthYear.format(toUtcDate(friday))}`
}

// "08:00" -> "8h00"
export const formatTime = (time) => {
  const [h, m] = time.split(':')
  return `${Number(h)}h${m}`
}
