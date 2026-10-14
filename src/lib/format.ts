import { daysBetween, shortTime, weekday } from '@/domain/time'

const DAY = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' } as const
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const dayShort = (date: string) => DAY[weekday(date)]
export const dayNum = (date: string) => String(Number(date.slice(8, 10)))
const MONTH_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export const monthLong = (date: string) => MONTH_LONG[Number(date.slice(5, 7)) - 1]!
export const monthShort = (date: string) => MONTH[Number(date.slice(5, 7)) - 1]!

/** "Thu" within the coming week, "Mon 19" beyond it, "Mon 2 Nov" in another month. */
export function dayLabel(date: string, today: string): string {
  const d = daysBetween(today, date)
  if (d === 0) return 'Today'
  if (d === -1) return 'Yesterday'
  if (d === 1) return 'Tomorrow'
  if (d > 1 && d < 7) return dayShort(date)
  return date.slice(0, 7) === today.slice(0, 7) ? `${dayShort(date)} ${dayNum(date)}` : `${dayShort(date)} ${dayNum(date)} ${monthShort(date)}`
}

/** "11 PM", "2:15 PM": a deadline time with its half of the day. */
export function clockLabel(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const suffix = (h ?? 0) >= 12 ? 'PM' : 'AM'
  return m ? `${shortTime(time)} ${suffix}` : `${((h ?? 0) + 11) % 12 + 1} ${suffix}`
}

export const WORD_DAY = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' } as const
