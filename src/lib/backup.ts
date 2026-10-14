import { db, type AppSettings, type CampusDB, type Club, type ClubEvent, type CourseOverride, type StoredSession, type Task } from '@/db/schema'
import { daysBetween, istDate } from '@/domain/time'

// Build spec 4.3: one JSON file with everything the user stored; Replace or Merge on import.

export const BACKUP_SCHEMA = 1

export interface BackupData {
  settings: AppSettings[]
  courseOverrides: CourseOverride[]
  sessions: StoredSession[]
  tasks: Task[]
  clubEvents: ClubEvent[]
  clubs: Club[]
}

export interface Backup {
  app: 'campus-companion'
  schema: number
  exportedAt: string
  data: BackupData
}

const TABLES = ['settings', 'courseOverrides', 'sessions', 'tasks', 'clubEvents', 'clubs'] as const

export async function buildBackup(exportedAt: string, database: CampusDB = db): Promise<Backup> {
  const [settings, courseOverrides, sessions, tasks, clubEvents, clubs] = await Promise.all(TABLES.map((t) => database.table(t).toArray()))
  return {
    app: 'campus-companion',
    schema: BACKUP_SCHEMA,
    exportedAt,
    data: { settings, courseOverrides, sessions, tasks, clubEvents, clubs } as BackupData,
  }
}

export const backupFileName = (date: string) => `campus-companion-backup-${date}.json`

/** Shares the file on Android, or downloads it where sharing files isn't supported. False if the person cancelled. */
export async function saveBackupFile(backup: Backup, date: string): Promise<boolean> {
  const name = backupFileName(date)
  const file = new File([JSON.stringify(backup, null, 1)], name, { type: 'application/json' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name })
      return true
    } catch (e) {
      if ((e as Error).name === 'AbortError') return false
      // Sharing failed for another reason: fall through to a download.
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return true
}

export type ParsedBackup = { ok: true; backup: Backup } | { ok: false; error: string }

/** Checks a file's text is a backup this version can read. */
export function parseBackup(text: string): ParsedBackup {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'This file isn’t a backup.' }
  }
  const b = raw as Partial<Backup>
  if (!b || b.app !== 'campus-companion' || typeof b.data !== 'object' || !b.data) return { ok: false, error: 'This file isn’t a Campus Companion backup.' }
  if (b.schema !== BACKUP_SCHEMA) return { ok: false, error: 'This backup is from a newer version. Update the app first.' }
  for (const t of TABLES) {
    if (!Array.isArray((b.data as unknown as Record<string, unknown>)[t])) return { ok: false, error: 'This backup is incomplete.' }
  }
  return { ok: true, backup: b as Backup }
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** "42 sessions, 9 tasks, 3 club events" */
export function backupSummary(b: Backup): string {
  const d = b.data
  const parts = [plural(d.sessions.length, 'session'), plural(d.tasks.length, 'task'), plural(d.clubEvents.length, 'club event')]
  if (d.courseOverrides.length) parts.push(plural(d.courseOverrides.length, 'course change'))
  return parts.join(', ')
}

/** Replace wipes, then loads. Merge upserts by id; for sessions the newer markedAt wins; your settings stay. */
export async function applyBackup(b: Backup, mode: 'replace' | 'merge', database: CampusDB = db): Promise<void> {
  const d = b.data
  await database.transaction('rw', TABLES.map((t) => database.table(t)), async () => {
    if (mode === 'replace') {
      await Promise.all(TABLES.map((t) => database.table(t).clear()))
      await Promise.all(TABLES.map((t) => database.table(t).bulkPut(d[t])))
      return
    }
    const existing = new Map((await database.sessions.toArray()).map((s) => [s.id, s]))
    const sessions = d.sessions.filter((s) => {
      const mine = existing.get(s.id)
      return !mine || (s.markedAt ?? '') > (mine.markedAt ?? '')
    })
    await database.sessions.bulkPut(sessions)
    await database.courseOverrides.bulkPut(d.courseOverrides)
    await database.tasks.bulkPut(d.tasks)
    await database.clubEvents.bulkPut(d.clubEvents)
    await database.clubs.bulkPut(d.clubs)
    if ((await database.settings.count()) === 0) await database.settings.bulkPut(d.settings)
  })
}

export const BACKUP_REMINDER_DAYS = 14

/** Whole days since the last export, or since first run when there's never been one. */
export function backupAge(settings: Pick<AppSettings, 'lastExportAt' | 'createdAt'>, today: string): { days: number; never: boolean } {
  const since = settings.lastExportAt ?? settings.createdAt
  return { days: Math.max(0, daysBetween(istDate(new Date(since)), today)), never: !settings.lastExportAt }
}

export const daysAgo = (days: number) => (days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`)

/** Today's quiet line under Coming up, from 14 days without a backup. */
export function backupReminder(settings: Pick<AppSettings, 'lastExportAt' | 'createdAt'> | undefined, today: string): string | null {
  if (!settings) return null
  const { days, never } = backupAge(settings, today)
  if (days < BACKUP_REMINDER_DAYS) return null
  return never ? 'Back up your data (no backup yet)' : `Back up your data (last: ${daysAgo(days)})`
}
