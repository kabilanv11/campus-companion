import { menuFor, termFor, timetableFor, type ReferenceData } from '@/data'
import type { ClubEvent, CourseOverride, StoredSession, Task } from '@/db/schema'
import { attendanceByCourse, unmarked } from './attendance'
import { noClassReason } from './calendar'
import { dayRead, greeting, isFestival, type Greeting } from './greeting'
import { sessionsForDate, type Session } from './sessions'
import { inNeedsYou, isOverdue, needsYou } from './tasks'
import { todayView, type TodayView } from './timeline'
import { addDays, daysBetween, istDate, istMinutes, toMinutes } from './time'

export interface TodayInput {
  now: Date
  name: string
  data: ReferenceData
  stored: StoredSession[]
  overrides: CourseOverride[]
  tasks: Task[]
  clubEvents: ClubEvent[]
}

export type ComingUpItem =
  | { type: 'task'; task: Task; date: string }
  | { type: 'noClass'; label: string; date: string }

export interface TodayModel {
  today: string
  greeting: Greeting
  dayRead: string | null
  view: TodayView
  /** Open tasks due or in their lead window, most urgent first. */
  needs: Task[]
  /** Unmarked classes from earlier days (and today, in the evening), one group per day. */
  markGroups: { date: string; sessions: Session[] }[]
  /** Today's started, unmarked classes for the "Mark everything so far present" line. */
  markSoFar: Session[]
  /** Reading / quiz / exam tags on a class row, keyed by session id. */
  tags: Map<string, { label: string; urgent: boolean }[]>
  comingUp: ComingUpItem[]
  /** When no data file covers the date shown: "Menu for November", "Timetable for Term III". */
  missing: { menu?: string; timetable?: string }
}

const COMING_UP_TASK_DAYS = 7
const COMING_UP_NO_CLASS_DAYS = 14
const MONTH_NAME = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function buildToday(input: TodayInput): TodayModel {
  const { now, data } = input
  const today = istDate(now)
  const ctx = { data, stored: input.stored, overrides: input.overrides }
  const attendance = attendanceByCourse(today, ctx)
  const view = todayView(now, {
    data,
    sessionsFor: (d) => sessionsForDate(d, ctx),
    clubEventsFor: (d) => input.clubEvents.filter((e) => e.date === d),
    attendance,
  })
  const shown = view.date
  const open = input.tasks.filter((t) => !t.doneAt)

  // Unmarked classes: earlier days go to Needs you; in the evening today's do too.
  const pastDays = [1, 2].map((n) => addDays(today, -n)).reverse()
  const groupDays = view.mode === 'tomorrow' ? [...pastDays, today] : pastDays
  const markGroups = groupDays
    .map((date) => ({ date, sessions: unmarked(sessionsForDate(date, ctx), now) }))
    .filter((g) => g.sessions.length > 0)
  const markSoFar = view.mode === 'today' ? unmarked(sessionsForDate(today, ctx), now).filter((s) => s.date === today) : []

  // Tags: a reading, quiz or exam due on the shown day, on that course's class rows.
  const tags = new Map<string, { label: string; urgent: boolean }[]>()
  const shownSessions = view.items.flatMap((i) => (i.type === 'class' ? [i.session] : []))
  for (const t of open) {
    if (t.due !== shown || !t.course || !['reading', 'quiz', 'exam'].includes(t.type)) continue
    const s = shownSessions.find((x) => x.course === t.course && (!t.dueTime || x.start === t.dueTime)) ?? shownSessions.find((x) => x.course === t.course)
    if (!s) continue
    const list = tags.get(s.id) ?? []
    list.push({ label: t.type === 'reading' ? 'Reading' : t.type === 'quiz' ? 'Quiz' : 'Exam', urgent: t.type !== 'reading' || inNeedsYou(t, today) })
    tags.set(s.id, list)
  }

  // Coming up: open tasks not yet in Needs you, due within a week, and the next no-class days.
  const comingUp: ComingUpItem[] = open
    .filter((t) => !inNeedsYou(t, today) && daysBetween(today, t.due) <= COMING_UP_TASK_DAYS)
    .sort((a, b) => a.due.localeCompare(b.due) || (a.dueTime ?? '24:00').localeCompare(b.dueTime ?? '24:00'))
    .map((task) => ({ type: 'task' as const, task, date: task.due }))
  let lastLabel = ''
  for (let d = addDays(shown, 1); daysBetween(today, d) <= COMING_UP_NO_CLASS_DAYS; d = addDays(d, 1)) {
    const r = noClassReason(d, data.calendar)
    if (!r || r.kind === 'outside-term' || r.label === lastLabel) {
      lastLabel = r && r.kind !== 'outside-term' ? r.label : ''
      continue
    }
    lastLabel = r.label
    comingUp.push({ type: 'noClass', label: r.label, date: d })
  }
  comingUp.sort((a, b) => a.date.localeCompare(b.date))

  // Day-read facts for the shown day.
  const reason = noClassReason(shown, data.calendar)
  const live = shownSessions.filter((s) => s.status !== 'cancelled')
  const mins = view.mode === 'today' ? istMinutes(now) : -1
  const noClass = reason && reason.kind !== 'outside-term' && live.length === 0 ? { label: reason.label, festival: isFestival(reason.label) } : null

  const term = termFor(shown, data)
  const missing: TodayModel['missing'] = {}
  if (!menuFor(shown, data)) missing.menu = `Menu for ${MONTH_NAME[Number(shown.slice(5, 7)) - 1]}`
  if (term && !timetableFor(shown, data)) missing.timetable = `Timetable for Term ${term.id}`

  return {
    today,
    greeting: greeting(now, input.name, data.calendar),
    dayRead: dayRead({
      mode: view.mode,
      date: shown,
      classes: live.length,
      classesToGo: live.filter((s) => toMinutes(s.start) > mins).length,
      quizzes: open.filter((t) => t.type === 'quiz' && t.due === shown).length,
      due: open.filter((t) => t.due === shown).length,
      noClass,
    }),
    view,
    needs: needsYou(input.tasks, today),
    markGroups,
    markSoFar,
    tags,
    comingUp,
    missing,
  }
}

export { isOverdue }
