import type { ReferenceData } from '@/data'
import type { Course } from '@/data/types'
import { termOf } from './calendar'
import { sessionsForDate, type Session, type SessionContext } from './sessions'
import { addDays, istDate, istMinutes, toMinutes } from './time'

export const MIN_ATTENDANCE = 0.8

export type CanMissDisplay =
  | { kind: 'number'; value: number; urgent: boolean } // ≥2 in Ink, 1 in red
  | { kind: 'cantMiss' } // 0
  | { kind: 'short'; by: number } // below 80%

export interface CourseAttendance {
  course: string
  total: number
  held: number
  attended: number
  absences: number
  /** Sessions still to come: total − held. */
  left: number
  allowed: number
  canMiss: number
  display: CanMissDisplay
}

export function canMissDisplay(canMiss: number): CanMissDisplay {
  if (canMiss < 0) return { kind: 'short', by: -canMiss }
  if (canMiss === 0) return { kind: 'cantMiss' }
  return { kind: 'number', value: canMiss, urgent: canMiss === 1 }
}

/** Build spec 6.2. Cancelled and unmarked sessions don't count as held. */
export function courseAttendance(course: Pick<Course, 'code' | 'total_sessions'>, sessions: Session[]): CourseAttendance {
  const mine = sessions.filter((s) => s.course === course.code)
  const held = mine.filter((s) => s.status === 'present' || s.status === 'absent').length
  const absences = mine.filter((s) => s.status === 'absent').length
  const total = course.total_sessions
  const allowed = Math.floor((1 - MIN_ATTENDANCE) * total + 1e-9)
  const canMiss = allowed - absences
  return {
    course: course.code,
    total,
    held,
    attended: held - absences,
    absences,
    left: Math.max(0, total - held),
    allowed,
    canMiss,
    display: canMissDisplay(canMiss),
  }
}

/** Every session of the term from its start through `through` (inclusive). */
export function termSessions(through: string, ctx: SessionContext): Session[] {
  const term = termOf(through, ctx.data.calendar)
  if (!term) return []
  const out: Session[] = []
  for (let d = term.start; d <= through; d = addDays(d, 1)) out.push(...sessionsForDate(d, ctx))
  return out
}

/** Attendance for every course of the term containing the date, counting the whole term's records. */
export function attendanceByCourse(date: string, ctx: SessionContext): Map<string, CourseAttendance> {
  const data: ReferenceData = ctx.data
  const term = termOf(date, data.calendar)
  const timetable = term && data.timetables.find((t) => t.term === term.id)
  const map = new Map<string, CourseAttendance>()
  if (!term || !timetable) return map
  const sessions = termSessions(term.end, ctx)
  for (const c of timetable.courses) map.set(c.code, courseAttendance(c, sessions))
  return map
}

/** Sessions that have started and have no status yet, oldest first. */
export function unmarked(sessions: Session[], now: Date): Session[] {
  const today = istDate(now)
  const mins = istMinutes(now)
  return sessions
    .filter((s) => !s.status && (s.date < today || (s.date === today && toMinutes(s.start) <= mins)))
    .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))
}
