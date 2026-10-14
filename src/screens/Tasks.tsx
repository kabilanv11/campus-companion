import { useMemo, useState } from 'react'
import { setTaskDone } from '@/db/actions'
import { useUserData } from '@/db/hooks'
import type { Task } from '@/db/schema'
import { TYPE_LABEL } from '@/domain/parse'
import { groupTasks, isOverdue, showsFrom } from '@/domain/tasks'
import { istDate } from '@/domain/time'
import { dayLabel, dayNum, dayShort, dueLabel } from '@/lib/format'
import { undoToast } from '@/lib/toast'
import { useNow } from '@/lib/useNow'
import { cn } from '@/lib/utils'
import { Checkbox, CourseDot, UrgentPill } from '@/ui/marks'
import { Page, PageTitle, SectionLabel } from '@/ui/Page'
import { taskTitle } from '@/ui/today/NeedsYou'

export function Tasks({ onEdit }: { onEdit: (t: Task) => void }) {
  const now = useNow()
  const user = useUserData()
  const today = istDate(now)
  const groups = useMemo(() => user && groupTasks(user.tasks, today), [user, today])
  const [showDone, setShowDone] = useState(false)
  if (!groups) return <Page>{null}</Page>

  const tick = async (t: Task) => {
    const undo = await setTaskDone(t.id, !t.doneAt)
    if (!t.doneAt) undoToast(`${taskTitle(t)} done`, undo)
  }
  const sections: [string, Task[], boolean][] = [
    ['Overdue', groups.overdue, true],
    ['Today', groups.today, false],
    ['This week', groups.thisWeek, false],
    ['Later', groups.later, false],
  ]
  const empty = sections.every(([, list]) => list.length === 0)

  return (
    <Page>
      <PageTitle>Tasks</PageTitle>
      <div className="mt-5 grid gap-6">
        {empty && <p className="text-body text-ink-2">Nothing to do. Add one with +.</p>}
        {sections.map(([label, list, red]) =>
          list.length === 0 ? null : (
            <section key={label} aria-label={label}>
              <SectionLabel className={cn(red && 'text-urgent')}>{label}</SectionLabel>
              {list.map((t, i) => (
                <TaskRow key={t.id} task={t} today={today} first={i === 0} onTick={tick} onEdit={onEdit} />
              ))}
            </section>
          ),
        )}
        {groups.doneThisWeek.length > 0 && (
          <section aria-label="Done this week">
            <button
              type="button"
              aria-expanded={showDone}
              onClick={() => setShowDone((x) => !x)}
              className="flex w-full items-center gap-2 border-t border-line py-3 text-[14px] text-ink-2"
            >
              Done this week
              <b className="ml-auto font-medium text-ink-3">{groups.doneThisWeek.length}</b>
              <span aria-hidden className="text-ink-3">{showDone ? '⌄' : '›'}</span>
            </button>
            {showDone &&
              groups.doneThisWeek.map((t, i) => <TaskRow key={t.id} task={t} today={today} first={i === 0} onTick={tick} onEdit={onEdit} />)}
          </section>
        )}
      </div>
    </Page>
  )
}

function TaskRow({ task: t, today, first, onTick, onEdit }: { task: Task; today: string; first: boolean; onTick: (t: Task) => void; onEdit: (t: Task) => void }) {
  const urgent = !t.doneAt && (isOverdue(t, today) || t.due === today)
  const from = showsFrom(t)
  const later = !t.doneAt && from && from > today && t.due && t.due > today
  const right = isOverdue(t, today) ? dayLabel(t.due!, today) : dueLabel(t, today)
  return (
    <div className={cn('grid grid-cols-[22px_1fr_auto] items-start gap-2.5 py-2.5', !first && 'border-t border-line', t.doneAt && 'opacity-40')}>
      <span className="pt-0.5">
        <Checkbox checked={!!t.doneAt} urgent={urgent} onChange={() => onTick(t)} label={`${t.doneAt ? 'Not done' : 'Done'}: ${taskTitle(t)}`} />
      </span>
      <button type="button" onClick={() => onEdit(t)} className="grid min-w-0 gap-[3px] text-left">
        <b className={cn('text-body font-medium', urgent && 'text-urgent', t.doneAt && 'line-through')}>{taskTitle(t)}</b>
        <span className="flex flex-wrap items-center gap-x-2 text-meta text-ink-2">
          {t.course && (
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <CourseDot code={t.course} />
              {t.course}
            </span>
          )}
          <span>{t.course && '· '}{TYPE_LABEL[t.type]}</span>
          {later && <span className="basis-full text-ink-3">On Today from {dayShort(from!)} {dayNum(from!)}</span>}
        </span>
      </button>
      {urgent ? <UrgentPill className="tnum">{right}</UrgentPill> : <span className="pt-px text-meta text-ink-2 tnum">{right}</span>}
    </div>
  )
}
