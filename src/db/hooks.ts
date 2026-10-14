import { useLiveQuery } from 'dexie-react-hooks'
import { db, type AppSettings, type Club, type ClubEvent, type CourseOverride, type StoredSession, type Task } from './schema'

export interface UserData {
  settings?: AppSettings
  sessions: StoredSession[]
  overrides: CourseOverride[]
  tasks: Task[]
  clubEvents: ClubEvent[]
  clubs: Club[]
}

/** Everything the user has stored, kept live. Undefined until the first read finishes. */
export function useUserData(): UserData | undefined {
  return useLiveQuery(async () => {
    const [settings, sessions, overrides, tasks, clubEvents, clubs] = await Promise.all([
      db.settings.get('app'),
      db.sessions.toArray(),
      db.courseOverrides.toArray(),
      db.tasks.toArray(),
      db.clubEvents.toArray(),
      db.clubs.toArray(),
    ])
    return { settings, sessions, overrides, tasks, clubEvents, clubs }
  })
}
