import type { Draft } from '@/domain/parse'
import { now } from '@/lib/clock'
import { fromMinutes, toMinutes } from '@/domain/time'
import { referenceData } from '@/data'
import { sessionsForDate, type Session } from '@/domain/sessions'
import { db, type CampusDB, type TaskType, type SessionStatus, type StoredSession } from './schema'

export type Undo = () => Promise<void>

/** Stores a status on each session. Returns an undo that puts the previous records back. */
export async function markSessions(sessions: Session[], status: SessionStatus): Promise<Undo> {
  const ids = sessions.map((s) => s.id)
  const before = await db.sessions.bulkGet(ids)
  const markedAt = now().toISOString()
  const next: StoredSession[] = sessions.map((s, i) => ({
    ...(before[i] ?? { id: s.id, date: s.date, start: s.start, course: s.course, kind: s.kind }),
    status,
    markedAt,
  }))
  await db.sessions.bulkPut(next)
  return async () => {
    await db.transaction('rw', db.sessions, async () => {
      const restore = before.filter((b): b is StoredSession => !!b)
      const remove = ids.filter((_, i) => !before[i])
      await db.sessions.bulkPut(restore)
      await db.sessions.bulkDelete(remove)
    })
  }
}

export async function setTaskDone(id: string, done: boolean): Promise<Undo> {
  const before = await db.tasks.get(id)
  await db.tasks.update(id, { doneAt: done ? now().toISOString() : undefined })
  return async () => {
    if (before) await db.tasks.put(before)
  }
}


/** What a draft still needs before it can be added; the sheet opens that field. */
export function missingField(d: Draft): 'course' | 'when' | null {
  if (d.type === 'cancel') return !d.course ? 'course' : !d.when?.date || !d.when.start ? 'when' : null
  if ((d.type === 'extra' || d.type === 'guest') && !d.course) return 'course'
  if ((d.type === 'extra' || d.type === 'guest' || d.type === 'club') && (!d.when?.date || !d.when.start)) return 'when'
  return null
}

/** Stores a draft as a task, a session (extra class, guest lecture) or a club event, or cancels a class (returning its undo). */
export async function saveDraft(d: Draft, existingTaskId?: string): Promise<Undo | void> {
  if (d.type === 'cancel') {
    const [stored, overrides] = await Promise.all([db.sessions.toArray(), db.courseOverrides.toArray()])
    const session = sessionsForDate(d.when!.date!, { data: referenceData, stored, overrides }).find((s) => s.course === d.course && s.start === d.when!.start)
    if (!session) return
    return markSessions([session], 'cancelled')
  }
  if (d.type === 'extra' || d.type === 'guest') {
    await db.sessions.put({
      id: crypto.randomUUID(),
      date: d.when!.date!,
      start: d.when!.start!,
      course: d.course!,
      kind: d.type === 'guest' ? 'guest' : d.makeup ? 'makeup' : 'extra',
      venue: d.venue,
    })
    return
  }
  if (d.type === 'club') {
    const start = d.when!.start!
    await db.clubEvents.put({
      id: crypto.randomUUID(),
      club: d.club ?? 'Club',
      title: d.title,
      date: d.when!.date!,
      start,
      end: d.when!.end ?? fromMinutes(toMinutes(start) + 60),
      venue: d.venue,
    })
    return
  }
  const existing = existingTaskId ? await db.tasks.get(existingTaskId) : undefined
  await db.tasks.put({
    id: existing?.id ?? crypto.randomUUID(),
    title: d.title,
    course: d.course,
    type: d.type as TaskType,
    due: d.due?.date,
    dueTime: d.due?.time,
    doneAt: existing?.doneAt,
    createdAt: existing?.createdAt ?? now().toISOString(),
  })
}

export async function deleteTask(id: string): Promise<Undo> {
  const before = await db.tasks.get(id)
  await db.tasks.delete(id)
  return async () => {
    if (before) await db.tasks.put(before)
  }
}

/**
 * Sets a course's professor or room from `date` on. Only the changed field is stored, so a later
 * timetable change to the other field still applies. Edits on the same day update that day's row.
 */
export async function setCourseField(course: string, field: 'professor' | 'room', value: string, date: string, database: CampusDB = db): Promise<void> {
  const v = value.trim()
  if (!v) return
  await database.transaction('rw', database.courseOverrides, async () => {
    const same = await database.courseOverrides.where({ course }).filter((o) => o.effectiveFrom === date).first()
    if (same) await database.courseOverrides.update(same.id, { [field]: v })
    else await database.courseOverrides.add({ id: crypto.randomUUID(), course, effectiveFrom: date, [field]: v })
  })
}

/** Adds a club; its code is the name without spaces or symbols, made unique. Returns the code, or null for an empty name. */
export async function addClub(name: string, database: CampusDB = db): Promise<string | null> {
  const n = name.trim()
  if (!n) return null
  const base = n.replace(/[^A-Za-z0-9]/g, '') || 'Club'
  const taken = new Set((await database.clubs.toArray()).map((c) => c.code.toLowerCase()))
  let code = base
  for (let i = 2; taken.has(code.toLowerCase()); i++) code = `${base}${i}`
  await database.clubs.add({ code, name: n })
  return code
}
