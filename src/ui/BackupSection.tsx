import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { updateSettings, type AppSettings } from '@/db/schema'
import { istDate } from '@/domain/time'
import { applyBackup, backupAge, backupSummary, buildBackup, daysAgo, parseBackup, saveBackupFile, type Backup } from '@/lib/backup'
import { now as clockNow } from '@/lib/clock'
import { dayNum, monthShort } from '@/lib/format'
import { ToastPill } from '@/ui/Toast'

const say = (message: string) => toast.custom(() => <ToastPill message={message} />, { id: 'backup', duration: 4000 })

/** Settings › Backup: export, import (Replace or Merge after a preview), last backup, and the persistence note. */
export function BackupSection({ settings, today }: { settings: AppSettings; today: string }) {
  const input = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Backup | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [persisted, setPersisted] = useState(true)

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted, () => {})
  }, [])

  const age = backupAge(settings, today)

  const exportNow = async () => {
    const at = clockNow()
    const done = await saveBackupFile(await buildBackup(at.toISOString()), istDate(at))
    if (done) await updateSettings({ lastExportAt: at.toISOString() })
  }

  const pick = async (file: File | undefined) => {
    if (!file) return
    const parsed = parseBackup(await file.text())
    if (input.current) input.current.value = ''
    setError(parsed.ok ? null : parsed.error)
    setPending(parsed.ok ? parsed.backup : null)
  }

  const apply = async (mode: 'replace' | 'merge') => {
    if (!pending) return
    await applyBackup(pending, mode)
    setPending(null)
    say(mode === 'replace' ? 'Backup restored' : 'Backup merged')
  }

  return (
    <div className="grid gap-2.5">
      <p className="text-body">
        Last backup: <span className="font-semibold">{age.never ? 'none yet' : daysAgo(age.days)}</span>
      </p>
      <div className="flex max-w-[240px] gap-1.5">
        <Button className="flex-1" onClick={exportNow}>
          Export
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => input.current?.click()}>
          Import
        </Button>
        <input ref={input} type="file" accept="application/json,.json" hidden aria-label="Backup file" onChange={(e) => pick(e.currentTarget.files?.[0])} />
      </div>
      {error && <p className="text-meta text-urgent">{error}</p>}
      {pending && (
        <div data-testid="import-preview" className="grid gap-2.5 rounded-card bg-card px-3.5 py-3 shadow-[inset_0_0_0_1px_var(--line)]">
          <p className="text-body">
            Backup from {dayNum(istDate(new Date(pending.exportedAt)))} {monthShort(istDate(new Date(pending.exportedAt)))}: {backupSummary(pending)}.
          </p>
          <p className="text-meta text-ink-2">Replace swaps everything on this phone for the backup. Merge adds it to what’s here.</p>
          <div className="flex gap-1.5">
            <Button onClick={() => apply('replace')}>Replace</Button>
            <Button variant="secondary" onClick={() => apply('merge')}>
              Merge
            </Button>
            <Button variant="text" onClick={() => setPending(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      {!persisted && <p className="text-meta text-ink-2">Android may clear data if storage runs low. Back up regularly.</p>}
    </div>
  )
}
