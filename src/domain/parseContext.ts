import aliases from '@data/aliases.json'
import type { ReferenceData } from '@/data'
import type { Club, CourseOverride, StoredSession } from '@/db/schema'
import { termOf } from './calendar'
import type { ParseContext } from './parse'
import { overrideFor, sessionsForDate } from './sessions'

/** Builds the parser's context from reference data and what's stored. */
export function parseContext(data: ReferenceData, stored: StoredSession[], overrides: CourseOverride[], clubs: Club[]): ParseContext {
  const ctx = { data, stored, overrides }
  const courses = new Map<string, { code: string; name: string }>()
  for (const t of data.timetables) for (const c of t.courses) courses.set(c.code, { code: c.code, name: c.name })
  return {
    courses: [...courses.values()],
    courseAliases: aliases.courses as Record<string, string[]>,
    clubs,
    clubAliases: aliases.clubs as Record<string, string[]>,
    places: aliases.places as Record<string, string>,
    classStarts: (course, date) =>
      sessionsForDate(date, ctx)
        .filter((s) => s.course === course && s.status !== 'cancelled')
        .map((s) => s.start),
    roomFor: (course, date) => overrideFor(course, date, overrides).room ?? data.timetables.find((t) => t.term === termOf(date, data.calendar)?.id)?.location.room ?? 'G-6',
    examWindow: (kind, date) => {
      const term = termOf(date, data.calendar)
      return kind === 'midterm' ? term?.midterm_exams.from : term?.endterm_exams.from
    },
  }
}
