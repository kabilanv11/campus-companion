import type { ReferenceData } from '@/data'
import type { ClubEvent } from '@/db/schema'
import { canMissDisplay, type CanMissDisplay, type CourseAttendance } from './attendance'
import { mealsForDate, type Meal } from './meals'
import type { Session } from './sessions'
import { addDays, istDate, istMinutes, toMinutes } from './time'

export type ItemState = 'past' | 'island' | 'nextMeal' | 'later'

export type TimelineItem =
  | { type: 'class'; key: string; start: string; end: string; state: ItemState; session: Session; canMark: boolean; canMiss?: CanMissDisplay }
  | { type: 'club'; key: string; start: string; end: string; state: ItemState; event: ClubEvent; clash?: { course: string; canMiss?: CanMissDisplay } }
  | { type: 'meal'; key: string; start: string; end: string; state: ItemState; meal: Meal }

/** Evening switch-over (after snacks) and the end of dinner. */
export const TOMORROW_FROM = '18:00'
export const DINNER_ENDS = '21:30'

export interface DayInput {
  date: string
  sessions: Session[]
  clubEvents: ClubEvent[]
  meals: Meal[]
  attendance: Map<string, CourseAttendance>
}

const overlaps = (a: { start: string; end: string }, b: { start: string; end: string }) => a.start < b.end && b.start < a.end

/**
 * Build spec 6.3: one day's classes, club events and meals in time order, each with its state.
 * `nowMin` is minutes since midnight on that day (negative or 0 for a day that hasn't begun).
 * `openMeal: false` keeps every meal collapsed (the evening view, where tonight's dinner is open instead).
 */
export function buildTimeline(day: DayInput, nowMin: number, opts: { openMeal?: boolean } = {}): TimelineItem[] {
  const openMeal = opts.openMeal ?? true
  const classes = day.sessions
  const started = (start: string) => toMinutes(start) <= nowMin
  const ended = (end: string) => toMinutes(end) <= nowMin

  // The island: the class in progress, else the next to start. Cancelled classes are never the island.
  const live = classes.filter((s) => s.status !== 'cancelled')
  const island =
    live.find((s) => started(s.start) && !ended(s.end)) ?? live.find((s) => !started(s.start))

  const nextMeal = openMeal
    ? day.meals.find((m) => started(m.start) && !ended(m.end)) ?? day.meals.find((m) => !started(m.start))
    : undefined

  const stateOf = (key: string, end: string, isIsland: boolean, isMeal: boolean): ItemState => {
    if (isIsland) return 'island'
    if (isMeal && nextMeal && key === `meal-${nextMeal.meal}`) return 'nextMeal'
    return ended(end) ? 'past' : 'later'
  }

  const canMissFor = (course: string) => {
    const a = day.attendance.get(course)
    return a ? canMissDisplay(a.canMiss) : undefined
  }

  const items: (TimelineItem & { order: number })[] = []

  for (const s of classes) {
    items.push({
      type: 'class',
      key: `class-${s.id}`,
      start: s.start,
      end: s.end,
      state: stateOf(`class-${s.id}`, s.end, s === island, false),
      session: s,
      canMark: started(s.start) && !s.status,
      canMiss: canMissFor(s.course),
      order: 1,
    })
  }

  for (const e of day.clubEvents) {
    const clashWith = live.find((s) => overlaps(s, e))
    items.push({
      type: 'club',
      key: `club-${e.id}`,
      start: e.start,
      end: e.end,
      state: stateOf(`club-${e.id}`, e.end, false, false),
      event: e,
      clash: clashWith ? { course: clashWith.course, canMiss: canMissFor(clashWith.course) } : undefined,
      order: 2,
    })
  }

  for (const m of day.meals) {
    const key = `meal-${m.meal}`
    items.push({ type: 'meal', key, start: m.start, end: m.end, state: stateOf(key, m.end, false, true), meal: m, order: 0 })
  }

  // Time order; at the same minute a meal comes before a class, and a class before a club event.
  items.sort((a, b) => a.start.localeCompare(b.start) || a.order - b.order)
  return items.map(({ order: _order, ...item }) => item as TimelineItem)
}

export interface TodayView {
  /** 'tomorrow' from 18:00: the timeline shows the next day. */
  mode: 'today' | 'tomorrow'
  /** The date the timeline shows. */
  date: string
  /** Evening only, until dinner ends: tonight's dinner, open, above tomorrow's timeline. */
  tonight?: Meal
  items: TimelineItem[]
}

export interface DayLoader {
  data: ReferenceData
  sessionsFor: (date: string) => Session[]
  clubEventsFor: (date: string) => ClubEvent[]
  attendance: Map<string, CourseAttendance>
}

/** Build spec 5: what Today shows at a given moment. */
export function todayView(now: Date, load: DayLoader): TodayView {
  const today = istDate(now)
  const mins = istMinutes(now)
  const dayInput = (date: string): DayInput => ({
    date,
    sessions: load.sessionsFor(date),
    clubEvents: load.clubEventsFor(date),
    meals: mealsForDate(date, load.data),
    attendance: load.attendance,
  })

  if (mins < toMinutes(TOMORROW_FROM)) {
    return { mode: 'today', date: today, items: buildTimeline(dayInput(today), mins) }
  }

  const tomorrow = addDays(today, 1)
  const dinnerOpen = mins < toMinutes(DINNER_ENDS)
  const tonight = dinnerOpen ? mealsForDate(today, load.data).find((m) => m.meal === 'dinner') : undefined
  // Tomorrow hasn't begun: nothing is past, the island is its first class.
  const items = buildTimeline(dayInput(tomorrow), -1, { openMeal: !dinnerOpen })
  return { mode: 'tomorrow', date: tomorrow, tonight, items }
}
