import { useMemo } from 'react'
import { referenceData } from '@/data'
import { markSessions, setTaskDone } from '@/db/actions'
import { useUserData } from '@/db/hooks'
import type { Session } from '@/domain/sessions'
import { shortTime, istMinutes, fromMinutes, weekday } from '@/domain/time'
import { buildToday } from '@/domain/today'
import type { SessionStatus, Task } from '@/db/schema'
import { Button } from '@/components/ui/button'
import { WORD_DAY, dayLabel } from '@/lib/format'
import { backupReminder } from '@/lib/backup'
import { undoToast } from '@/lib/toast'
import { useNow } from '@/lib/useNow'
import { Page, SectionLabel } from '@/ui/Page'
import { ComingUp } from '@/ui/today/ComingUp'
import { MealRow, Timeline } from '@/ui/today/Timeline'
import { NeedsYou, taskTitle } from '@/ui/today/NeedsYou'

export function Today({ onSchedule, onBackup }: { onSchedule: () => void; onBackup: () => void }) {
  const now = useNow()
  const user = useUserData()

  const model = useMemo(
    () =>
      user &&
      buildToday({
        now,
        name: user.settings?.name ?? 'Kabilan',
        data: referenceData,
        stored: user.sessions,
        overrides: user.overrides,
        tasks: user.tasks,
        clubEvents: user.clubEvents,
      }),
    [now, user],
  )

  if (!model || !user) return <Page>{null}</Page>

  const clubNames = new Map(user.clubs.map((c) => [c.code, c.name]))
  const { view } = model
  const reminder = backupReminder(user.settings, model.today)

  const mark = async (s: Session, status: SessionStatus) => {
    await markSessions([s], status)
  }
  const allPresent = async (sessions: Session[], date: string) => {
    const undo = await markSessions(sessions, 'present')
    undoToast(`${dayLabel(date, model.today)} marked present`, undo)
  }
  const tick = async (t: Task) => {
    const undo = await setTaskDone(t.id, true)
    undoToast(`${taskTitle(t)} done`, undo)
  }

  return (
    <Page>
      <p className="pt-1 text-caption font-medium text-ink-2 tnum">{shortTime(fromMinutes(istMinutes(now)))}</p>
      <header className="mt-3">
        <h1 className="text-greeting font-bold text-balance">{model.greeting.text}</h1>
        {model.dayRead && <p className="mt-0.5 font-serif text-dayread text-ink-2 italic">{model.dayRead}</p>}
      </header>

      <div className="mt-5 grid gap-6">
        <NeedsYou today={model.today} tasks={model.needs} markGroups={model.markGroups} onTick={tick} onAllPresent={allPresent} />

        {view.tonight && (
          <section>
            <SectionLabel>Tonight</SectionLabel>
            <MealRow meal={view.tonight} open />
          </section>
        )}

        <section>
          <div className="mb-1 flex items-baseline gap-3">
            <h2 className="text-label font-semibold text-ink-3">
              {view.mode === 'tomorrow' ? `Tomorrow, ${WORD_DAY[weekday(view.date)]}` : 'Your day'}
            </h2>
            {view.mode === 'tomorrow' && (
              <button type="button" onClick={onSchedule} className="text-[12.5px] font-medium text-link">
                Schedule
              </button>
            )}
            {view.items.some((i) => i.type === 'class') && <span className="ml-auto text-caption text-ink-3">can miss</span>}
          </div>
          {model.missing.timetable && (
            <p className="py-2 text-meta text-ink-2">{model.missing.timetable} not added yet</p>
          )}
          <Timeline items={view.items} tags={model.tags} clubNames={clubNames} onMark={mark} />
          {model.markSoFar.length > 1 && (
            <div className="mt-1 flex items-center justify-between border-t border-line pt-2 text-[12.5px] text-ink-3">
              Mark everything so far present
              <Button variant="link" size="sm" className="px-0 text-[13px]" onClick={() => allPresent(model.markSoFar, model.today)}>
                All present
              </Button>
            </div>
          )}
        </section>

        <ComingUp today={model.today} items={model.comingUp} onTick={tick} />
        {reminder && (
          <button type="button" data-testid="backup-reminder" onClick={onBackup} className="-mt-3 text-left text-meta text-ink-2">
            {reminder}
          </button>
        )}
      </div>
    </Page>
  )
}
