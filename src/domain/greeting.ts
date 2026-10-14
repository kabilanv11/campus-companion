import type { AcademicCalendar } from '@/data/types'
import { noClassReason, termOf } from './calendar'
import { addDays, istDate, istMinutes, toMinutes, weekday } from './time'

// Build spec 6.6. Always the full form ("Good morning, Kabilan"), never a bare "Morning".

export type Bucket = 'morning' | 'afternoon' | 'evening' | 'night'

export const POOLS: Record<Bucket, string[]> = {
  morning: [
    'Good morning, {name}',
    'Rise and shine, {name}',
    'A fresh start, {name}',
    'Hello and good morning, {name}',
    'Top of the morning, {name}',
    'Bright and early, {name}',
    'Good morning to you, {name}',
    'A new day, {name}',
    'Up and at it, {name}',
    'Hope you slept well, {name}',
    'Coffee first, {name}',
    "Here's to a good day, {name}",
    'Good day ahead, {name}',
    'Start strong, {name}',
    'Make it a good one, {name}',
  ],
  afternoon: [
    'Good afternoon, {name}',
    'Hope lunch was good, {name}',
    'Halfway there, {name}',
    'Good afternoon to you, {name}',
    'Keep it going, {name}',
    'Hello again, {name}',
    'Steady on, {name}',
    'The day is yours, {name}',
    'Hope the day is going well, {name}',
    'Back at it, {name}',
    'Onwards, {name}',
    'Good to see you, {name}',
    'Hang in there, {name}',
    'Stay sharp, {name}',
    'On with the day, {name}',
  ],
  evening: [
    'Good evening, {name}',
    'Hope the day went well, {name}',
    'Time to unwind, {name}',
    'Nicely done today, {name}',
    'Good evening to you, {name}',
    "Day's nearly done, {name}",
    'Settle in, {name}',
    'Hello this evening, {name}',
    'Take a breather, {name}',
    'Well played today, {name}',
    'Easy does it, {name}',
    'Winding down, {name}',
    'A quiet evening, {name}',
    'Put your feet up, {name}',
    'Any plans tonight, {name}?',
  ],
  night: [
    'Good night, {name}',
    'Almost bedtime, {name}',
    'Quiet hours, {name}',
    "Tomorrow's sorted, {name}",
    'One last look, {name}',
    'Rest well, {name}',
    'Sleep well, {name}',
    'The day is done, {name}',
    'Lights out soon, {name}',
    'Wrapping up, {name}',
    'A calm night, {name}',
    'Time to recharge, {name}',
    'See you in the morning, {name}',
    'Slow down for the night, {name}',
    'Unplug soon, {name}',
  ],
}

export const CONTEXT_POOLS = {
  lateNight: ['Still up, {name}?', 'Get some sleep, {name}', "It's late, {name}", 'Bed is calling, {name}', 'Past bedtime, {name}'],
  festival: ['Happy {label}, {name}'],
  dayOff: ['Enjoy the day off, {name}', 'A slow day, {name}', 'No classes today, {name}'],
  breakDay: ['Enjoy the break, {name}', 'Rest up, {name}', 'A slow day, {name}'],
  exams: ['Good luck today, {name}', "You've got this, {name}", 'Deep breath, {name}', 'One paper at a time, {name}', 'Exam week, {name}'],
  afterBreak: ['Welcome back, {name}', 'Back to campus, {name}', 'Good to have you back, {name}'],
  fridayEvening: ['Happy Friday, {name}', 'Friday at last, {name}', "The weekend's here, {name}", 'Friday evening, {name}. Well earned'],
}

/** No-class labels that are festivals, so the greeting says "Happy <label>". */
const FESTIVALS = /dussehra|diwali|deepawali|holi\b|gandhi jayanti|republic day|independence day|christmas|eid|guru nanak|janmashtami|ganesh|navratri|pongal|onam|lohri|new year/i

export function bucketOf(minutes: number): Bucket {
  if (minutes >= 5 * 60 && minutes < 12 * 60) return 'morning'
  if (minutes >= 12 * 60 && minutes < 17 * 60) return 'afternoon'
  if (minutes >= 17 * 60 && minutes < 21 * 60) return 'evening'
  return 'night'
}

/** FNV-1a: a small stable hash so the same date and bucket always pick the same line. */
export function hash(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

const pick = (pool: string[], seed: string) => pool[hash(seed) % pool.length]!

export interface Greeting {
  text: string
  /** Which pool it came from, for tests and the day-read. */
  source: Bucket | keyof typeof CONTEXT_POOLS
}

export function greeting(now: Date, name: string, cal: AcademicCalendar): Greeting {
  const date = istDate(now)
  const mins = istMinutes(now)
  const bucket = bucketOf(mins)
  // Night runs past midnight: seed by the evening it started on, so the line holds until morning.
  const seedDate = bucket === 'night' && mins < 5 * 60 ? addDays(date, -1) : date
  const seed = `${seedDate}|${bucket}`
  const fill = (line: string, label = '') => line.replace('{name}', name).replace('{label}', label)

  const choose = (source: Greeting['source'], pool: string[], label?: string): Greeting => ({
    text: fill(pick(pool, `${seed}|${source}`), label),
    source,
  })

  if (mins >= toMinutes('23:30') || mins < 5 * 60) return choose('lateNight', CONTEXT_POOLS.lateNight)

  const reason = noClassReason(date, cal)
  if (reason?.kind === 'holiday' && FESTIVALS.test(reason.label)) return choose('festival', CONTEXT_POOLS.festival, reason.label)
  if (reason?.kind === 'exams') return choose('exams', CONTEXT_POOLS.exams)
  if (reason?.kind === 'holiday' && weekday(date) !== 'sun') return choose('dayOff', CONTEXT_POOLS.dayOff)
  if (reason?.kind === 'break') return choose('breakDay', CONTEXT_POOLS.breakDay)

  if (isFirstDayAfterBreak(date, cal)) return choose('afterBreak', CONTEXT_POOLS.afterBreak)
  if (weekday(date) === 'fri' && bucket === 'evening') return choose('fridayEvening', CONTEXT_POOLS.fridayEvening)

  return choose(bucket, POOLS[bucket])
}

/** The first class day after two or more consecutive days off that included a break (not just a weekend). */
export function isFirstDayAfterBreak(date: string, cal: AcademicCalendar): boolean {
  if (noClassReason(date, cal) !== null) return false
  const term = termOf(date, cal)
  if (term && date === term.classes_resume) return true
  if (term && date === term.start) return true
  let d = addDays(date, -1)
  let sawBreak = false
  let off = 0
  while (off < 30) {
    const r = noClassReason(d, cal)
    const weekend = weekday(d) === 'sun' || weekday(d) === 'sat'
    if (r?.kind === 'break') sawBreak = true
    else if (!r && !weekend) break
    off++
    d = addDays(d, -1)
  }
  return sawBreak && off >= 2
}

// Day-read: one serif line of facts, shown only when true and worth saying.

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
const word = (n: number) => WORDS[n] ?? String(n)
const plural = (n: number, one: string, many: string) => `${word(n)} ${n === 1 ? one : many}`
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const DAY_NAME: Record<string, string> = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' }

export interface DayFacts {
  mode: 'today' | 'tomorrow'
  /** The date the timeline shows. */
  date: string
  /** Classes on that date, cancelled ones excluded. */
  classes: number
  /** Classes that haven't started yet (today mode). */
  classesToGo: number
  quizzes: number
  /** Open tasks due on that date. */
  due: number
  noClass?: { label: string; festival?: boolean } | null
}

export function dayRead(f: DayFacts): string | null {
  const dayName = DAY_NAME[weekday(f.date)]!
  if (f.noClass) {
    if (f.mode === 'tomorrow') return `No classes tomorrow · ${f.noClass.label}`
    return f.noClass.festival ? 'No classes today' : `No classes · ${f.noClass.label}`
  }
  const quiz = f.quizzes > 0 ? ` and ${f.quizzes === 1 ? 'a quiz' : `${word(f.quizzes)} quizzes`}` : ''

  if (f.mode === 'tomorrow') {
    if (f.classes === 0) return null
    if (f.classes >= 4) return `Packed ${dayName} tomorrow: ${plural(f.classes, 'class', 'classes')}${quiz}`
    if (f.classes <= 2) return `Light ${dayName} tomorrow, just ${plural(f.classes, 'class', 'classes')}${quiz}`
    return `${cap(plural(f.classes, 'class', 'classes'))} tomorrow${quiz}`
  }

  if (f.classes > 0 && f.classesToGo === f.classes) {
    if (f.classes >= 4) return `Packed ${dayName}: ${plural(f.classes, 'class', 'classes')}${quiz}`
    if (f.classes <= 2) return `Light ${dayName}: just ${plural(f.classes, 'class', 'classes')}${quiz}`
    return `${cap(plural(f.classes, 'class', 'classes'))} today${quiz}`
  }
  if (f.classesToGo > 0) return `${cap(plural(f.classesToGo, 'class', 'classes'))} to go`
  if (f.due === 0) return 'Nothing due today'
  return null
}

export function isFestival(label: string): boolean {
  return FESTIVALS.test(label)
}

