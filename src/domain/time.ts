// IST date and time helpers. India has no daylight saving, so IST is always UTC+5:30.
// Dates are 'YYYY-MM-DD' strings and times 'HH:mm' strings, both in IST.

const IST_MS = 330 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
const WEEKDAYS: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

const pad = (n: number) => String(n).padStart(2, '0')

/** The IST calendar date of an instant. */
export function istDate(d: Date): string {
  const s = new Date(d.getTime() + IST_MS)
  return `${s.getUTCFullYear()}-${pad(s.getUTCMonth() + 1)}-${pad(s.getUTCDate())}`
}

/** Minutes since IST midnight for an instant. */
export function istMinutes(d: Date): number {
  const s = new Date(d.getTime() + IST_MS)
  return s.getUTCHours() * 60 + s.getUTCMinutes()
}

/** The instant at a given IST date and time. */
export function istInstant(date: string, time = '00:00'): Date {
  return new Date(`${date}T${time}:00+05:30`)
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

export function fromMinutes(min: number): string {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`
}

/** Shift a date string by whole days. */
export function addDays(date: string, days: number): string {
  const t = Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10)) + days * DAY_MS
  return new Date(t).toISOString().slice(0, 10)
}

/** Whole days from a to b (b − a). */
export function daysBetween(a: string, b: string): number {
  const ta = Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10))
  const tb = Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10))
  return Math.round((tb - ta) / DAY_MS)
}

export function weekday(date: string): Weekday {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay()
  return WEEKDAYS[day]!
}

/** Monday of the Mon–Sun week holding the date. */
export function weekStart(date: string): string {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay()
  return addDays(date, -((day + 6) % 7))
}

/** Sunday of the Mon–Sun week holding the date ("the coming Sunday"; a Sunday is its own). */
export function weekEnd(date: string): string {
  return addDays(weekStart(date), 6)
}

export function inRange(date: string, range: { from: string; to: string }): boolean {
  return date >= range.from && date <= range.to
}

/** "2:15", "10:15": the 12-hour clock without am/pm, as on the mockups' timeline. */
export function shortTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const h12 = ((h ?? 0) + 11) % 12 + 1
  return `${h12}:${pad(m ?? 0)}`
}
