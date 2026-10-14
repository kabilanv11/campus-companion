import type { ReferenceData } from '@/data'
import type { Course, Timetable } from '@/data/types'
import type { CourseOverride, SessionKind, SessionStatus, StoredSession } from '@/db/schema'
import { isPostMidterm, noClassReason, termOf } from './calendar'
import { fromMinutes, toMinutes, weekday } from './time'

/** A class on a given day, with everything a row needs to render. */
export interface Session {
  id: string
  date: string
  start: string
  end: string
  course: string
  kind: SessionKind
  slot?: string
  professor: string
  room: string
  /** True when the room differs from the timetable's default (shown in the accent). */
  roomChanged: boolean
  status?: SessionStatus
  markedAt?: string
}

export interface SessionContext {
  data: ReferenceData
  stored: StoredSession[]
  overrides: CourseOverride[]
}

export const regularSessionId = (date: string, slot: string, course: string) => `${date}_${slot}_${course}`

function professorFor(course: Course, postMidterm: boolean): string {
  const want = postMidterm ? 'post_midterm' : 'pre_midterm'
  return (course.faculty.find((f) => f.applies === want) ?? course.faculty.find((f) => f.applies === 'all') ?? course.faculty[0])?.name ?? ''
}

/** The newest override in force on the date, per field: a room change and a professor change can come from different rows. */
export function overrideFor(course: string, date: string, overrides: CourseOverride[]): { professor?: string; room?: string } {
  const inForce = overrides
    .filter((o) => o.course === course && o.effectiveFrom <= date)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))
  return {
    professor: inForce.find((o) => o.professor)?.professor,
    room: inForce.find((o) => o.room)?.room,
  }
}

function courseRunsOn(course: Course, postMidterm: boolean): boolean {
  if (course.length !== 'half') return true
  return (course.runs ?? 'pre_midterm') === 'pre_midterm' ? !postMidterm : postMidterm
}

/** Build spec 6.1: every session on a date, regular and added, sorted by start time. */
export function sessionsForDate(date: string, ctx: SessionContext): Session[] {
  const { data, stored, overrides } = ctx
  const term = termOf(date, data.calendar)
  const timetable: Timetable | undefined = term && data.timetables.find((t) => t.term === term.id)
  const postMidterm = term ? isPostMidterm(date, term) : false
  const storedOnDate = stored.filter((s) => s.date === date)
  const byId = new Map(storedOnDate.map((s) => [s.id, s]))
  const defaultRoom = timetable?.location.room ?? 'G-6'
  const length = timetable?.session_length_minutes ?? 90

  const build = (base: {
    id: string
    start: string
    end: string
    course: string
    kind: SessionKind
    slot?: string
    venue?: string
  }): Session => {
    const course = timetable?.courses.find((c) => c.code === base.course)
    const ov = overrideFor(base.course, date, overrides)
    const saved = byId.get(base.id)
    const { venue, ...rest } = base
    const room = saved?.venue ?? venue ?? ov.room ?? defaultRoom
    return {
      ...rest,
      date,
      professor: ov.professor ?? (course ? professorFor(course, postMidterm) : ''),
      room,
      roomChanged: room !== defaultRoom,
      status: saved?.status,
      markedAt: saved?.markedAt,
    }
  }

  const out: Session[] = []

  if (timetable && noClassReason(date, data.calendar) === null) {
    const day = weekday(date)
    for (const entry of timetable.weekly) {
      if (entry.day !== day) continue
      const course = timetable.courses.find((c) => c.code === entry.course)
      const slot = timetable.slots.find((s) => s.id === entry.slot)
      if (!course || !slot || !courseRunsOn(course, postMidterm)) continue
      out.push(build({ id: regularSessionId(date, slot.id, course.code), start: slot.start, end: slot.end, course: course.code, kind: 'regular', slot: slot.id }))
    }
  }

  // Makeup, extra and guest sessions are stored records; they happen whatever the calendar says.
  for (const s of storedOnDate) {
    if (s.kind === 'regular') continue
    out.push(build({ id: s.id, start: s.start, end: fromMinutes(toMinutes(s.start) + length), course: s.course, kind: s.kind, venue: s.venue }))
  }

  return out.sort((a, b) => a.start.localeCompare(b.start) || a.course.localeCompare(b.course))
}
