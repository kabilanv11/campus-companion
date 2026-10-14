import type { Session } from '@/domain/sessions'
import { db, type SessionStatus, type StoredSession } from './schema'

export type Undo = () => Promise<void>

/** Stores a status on each session. Returns an undo that puts the previous records back. */
export async function markSessions(sessions: Session[], status: SessionStatus): Promise<Undo> {
  const ids = sessions.map((s) => s.id)
  const before = await db.sessions.bulkGet(ids)
  const markedAt = new Date().toISOString()
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
  await db.tasks.update(id, { doneAt: done ? new Date().toISOString() : undefined })
  return async () => {
    if (before) await db.tasks.put(before)
  }
}
