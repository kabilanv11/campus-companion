import Dexie, { type EntityTable } from 'dexie'
import type { ThemeSetting } from '@/lib/theme'

// Build spec 4.2. Ids are crypto.randomUUID(); dates 'YYYY-MM-DD' (IST); times 'HH:mm'.

export interface AppSettings {
  key: 'app'
  theme: ThemeSetting
  name: string
  section: string
  createdAt: string
  lastExportAt?: string
}

export interface CourseOverride {
  id: string
  course: string
  professor?: string
  room?: string
  effectiveFrom: string
}

export type SessionKind = 'regular' | 'makeup' | 'extra' | 'guest'
export type SessionStatus = 'present' | 'absent' | 'cancelled'

export interface StoredSession {
  /** Regular sessions: `${date}_${slot}_${course}`; others: a UUID. */
  id: string
  date: string
  start: string
  course: string
  kind: SessionKind
  venue?: string
  status?: SessionStatus
  markedAt?: string
}

export type TaskType = 'assignment' | 'quiz' | 'reading' | 'exam' | 'other'

export interface Task {
  id: string
  title: string
  course?: string
  type: TaskType
  /** Undated tasks sit in Later and never enter Needs you. */
  due?: string
  dueTime?: string
  doneAt?: string
  createdAt: string
}

export interface ClubEvent {
  id: string
  club: string
  title: string
  date: string
  start: string
  end: string
  venue?: string
}

export interface Club {
  code: string
  name: string
}

export class CampusDB extends Dexie {
  settings!: EntityTable<AppSettings, 'key'>
  courseOverrides!: EntityTable<CourseOverride, 'id'>
  sessions!: EntityTable<StoredSession, 'id'>
  tasks!: EntityTable<Task, 'id'>
  clubEvents!: EntityTable<ClubEvent, 'id'>
  clubs!: EntityTable<Club, 'code'>

  constructor(name = 'campus-companion') {
    super(name)
    this.version(1).stores({
      settings: 'key',
      courseOverrides: 'id, course, effectiveFrom',
      sessions: 'id, date, course',
      tasks: 'id, due, doneAt',
      clubEvents: 'id, date',
      clubs: 'code',
    })
    this.on('populate', (tx) => {
      tx.table('clubs').bulkAdd([
        { code: 'SAM', name: 'Samaritans' },
        { code: 'TEDx', name: 'TEDx' },
      ])
    })
  }
}

export const db = new CampusDB()

export const DEFAULT_SETTINGS: Omit<AppSettings, 'createdAt'> = {
  key: 'app',
  theme: 'system',
  name: 'Kabilan',
  section: 'D',
}

/** Returns the settings row, creating it on first run. */
export async function getSettings(database: CampusDB = db): Promise<AppSettings> {
  const existing = await database.settings.get('app')
  if (existing) return existing
  const fresh: AppSettings = { ...DEFAULT_SETTINGS, createdAt: new Date().toISOString() }
  await database.settings.put(fresh)
  return fresh
}

export async function updateSettings(patch: Partial<Omit<AppSettings, 'key'>>, database: CampusDB = db) {
  const current = await getSettings(database)
  await database.settings.put({ ...current, ...patch })
}
