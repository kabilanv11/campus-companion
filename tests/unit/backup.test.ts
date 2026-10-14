import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { CampusDB, getSettings } from '@/db/schema'
import { applyBackup, backupReminder, backupSummary, buildBackup, parseBackup } from '@/lib/backup'

const fresh = () => new CampusDB(`b-${crypto.randomUUID()}`)

async function seed(db: CampusDB) {
  await getSettings(db)
  await db.sessions.bulkPut([
    { id: '2026-10-14_II_MPI', date: '2026-10-14', start: '10:15', course: 'MPI', kind: 'regular', status: 'present', markedAt: '2026-10-14T06:00:00.000Z' },
    { id: '2026-10-14_III_OM', date: '2026-10-14', start: '12:00', course: 'OM', kind: 'regular', status: 'absent', markedAt: '2026-10-14T08:00:00.000Z' },
  ])
  await db.tasks.put({ id: 't1', title: 'case', type: 'assignment', course: 'MAC', due: '2026-10-16', createdAt: '2026-10-12T00:00:00.000Z' })
  await db.clubEvents.put({ id: 'e1', club: 'SAM', title: 'Drive', date: '2026-10-15', start: '18:00', end: '19:30' })
}

describe('backup', () => {
  it('round-trips through Replace: export, wipe, import restores everything', async () => {
    const a = fresh()
    await seed(a)
    const text = JSON.stringify(await buildBackup('2026-10-14T10:00:00.000Z', a))
    const parsed = parseBackup(text)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(backupSummary(parsed.backup)).toBe('2 sessions, 1 task, 1 club event')

    const b = fresh()
    await b.open()
    await b.tasks.put({ id: 'other', title: 'gone after replace', type: 'other', createdAt: '2026-10-01T00:00:00.000Z' })
    await applyBackup(parsed.backup, 'replace', b)
    expect(await buildBackup('2026-10-14T10:00:00.000Z', b)).toEqual(await buildBackup('2026-10-14T10:00:00.000Z', a))
  })

  it('Merge upserts by id and keeps the newer mark', async () => {
    const a = fresh()
    await seed(a)
    const backup = await buildBackup('x', a)
    const b = fresh()
    await b.open()
    await b.sessions.put({ id: '2026-10-14_II_MPI', date: '2026-10-14', start: '10:15', course: 'MPI', kind: 'regular', status: 'cancelled', markedAt: '2026-10-14T09:00:00.000Z' })
    await b.sessions.put({ id: '2026-10-14_III_OM', date: '2026-10-14', start: '12:00', course: 'OM', kind: 'regular', status: 'present', markedAt: '2026-10-14T07:00:00.000Z' })
    await b.tasks.put({ id: 'mine', title: 'kept', type: 'other', createdAt: '2026-10-01T00:00:00.000Z' })
    await applyBackup(backup, 'merge', b)
    expect((await b.sessions.get('2026-10-14_II_MPI'))?.status).toBe('cancelled') // mine is newer
    expect((await b.sessions.get('2026-10-14_III_OM'))?.status).toBe('absent') // backup's is newer
    expect((await b.tasks.toArray()).map((t) => t.id).sort()).toEqual(['mine', 't1'])
  })

  it('rejects files that are not backups or from a newer schema', () => {
    expect(parseBackup('nope').ok).toBe(false)
    expect(parseBackup('{"app":"other"}').ok).toBe(false)
    expect(parseBackup(JSON.stringify({ app: 'campus-companion', schema: 2, data: {} }))).toMatchObject({ ok: false, error: expect.stringMatching(/newer/) })
  })

  it('reminds on Today from 14 days without a backup', () => {
    const s = { createdAt: '2026-09-01T00:00:00.000Z', lastExportAt: '2026-10-01T04:00:00.000Z' }
    expect(backupReminder(s, '2026-10-14')).toBeNull()
    expect(backupReminder(s, '2026-10-15')).toBe('Back up your data (last: 14 days ago)')
    expect(backupReminder({ createdAt: '2026-10-10T00:00:00.000Z' }, '2026-10-14')).toBeNull()
    expect(backupReminder({ createdAt: '2026-09-01T00:00:00.000Z' }, '2026-10-14')).toBe('Back up your data (no backup yet)')
  })
})
