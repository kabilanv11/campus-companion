import { referenceData } from '@/data'
import type { ClubEvent, CourseOverride, StoredSession, Task } from '@/db/schema'
import { attendanceByCourse } from '@/domain/attendance'
import { sessionsForDate, type SessionContext } from '@/domain/sessions'
import type { DayLoader } from '@/domain/timeline'
import { istInstant } from '@/domain/time'

export const at = (date: string, time = '00:00') => istInstant(date, time)

export function ctx(stored: StoredSession[] = [], overrides: CourseOverride[] = []): SessionContext {
  return { data: referenceData, stored, overrides }
}

export function loader(c: SessionContext = ctx(), clubEvents: ClubEvent[] = [], date = '2026-10-14'): DayLoader {
  return {
    data: c.data,
    sessionsFor: (d) => sessionsForDate(d, c),
    clubEventsFor: (d) => clubEvents.filter((e) => e.date === d),
    attendance: attendanceByCourse(date, c),
  }
}

let n = 0
export function task(p: Partial<Task> & Pick<Task, 'due' | 'type'>): Task {
  n++
  return { id: `t${n}`, title: `task ${n}`, createdAt: `2026-10-01T00:00:0${n % 10}.000Z`, ...p }
}

export function mark(id: string, status: StoredSession['status'], extra: Partial<StoredSession> = {}): StoredSession {
  const [date, slot, course] = id.split('_') as [string, string, string]
  return { id, date, start: '00:00', course, kind: 'regular', status, markedAt: `${date}T18:00:00.000Z`, slot, ...extra } as StoredSession
}
