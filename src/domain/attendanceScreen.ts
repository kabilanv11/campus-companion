import type { ReferenceData } from '@/data'
import type { CourseOverride, StoredSession } from '@/db/schema'
import { attendanceByCourse, termSessions, unmarked, type CourseAttendance } from './attendance'
import { termOf } from './calendar'
import type { Session } from './sessions'
import { istDate, istMinutes, toMinutes } from './time'

export interface CourseCard {
  attendance: CourseAttendance
  /** Sessions that have started, oldest first: what the expanded list shows. */
  sessions: Session[]
}

export interface AttendanceModel {
  unmarkedGroups: { date: string; sessions: Session[] }[]
  unmarkedCount: number
  /** Most urgent first: lowest can-miss, then course code. */
  courses: CourseCard[]
}

export function buildAttendance(now: Date, data: ReferenceData, stored: StoredSession[], overrides: CourseOverride[]): AttendanceModel {
  const today = istDate(now)
  const mins = istMinutes(now)
  const ctx = { data, stored, overrides }
  const term = termOf(today, data.calendar)
  const all = term ? termSessions(term.end, ctx) : []
  const started = all.filter((s) => s.date < today || (s.date === today && toMinutes(s.start) <= mins))

  const open = unmarked(started, now)
  const byDate = new Map<string, Session[]>()
  for (const s of open) byDate.set(s.date, [...(byDate.get(s.date) ?? []), s])

  const att = attendanceByCourse(today, ctx)
  const courses = [...att.values()]
    .map((a) => ({ attendance: a, sessions: started.filter((s) => s.course === a.course) }))
    // Courses that have finished (WEC after the mid-term) still show; ones not yet started are skipped.
    .filter((c) => c.sessions.length > 0 || c.attendance.held > 0)
    .sort((a, b) => a.attendance.canMiss - b.attendance.canMiss || a.attendance.course.localeCompare(b.attendance.course))

  return {
    unmarkedGroups: [...byDate.entries()].map(([date, sessions]) => ({ date, sessions })),
    unmarkedCount: open.length,
    courses,
  }
}
