import type { Session } from '@/domain/sessions'
import type { Task } from '@/db/schema'
import { isOverdue } from '@/domain/tasks'
import { shortTime } from '@/domain/time'
import { Button } from '@/components/ui/button'
import { clockLabel, dayLabel } from '@/lib/format'
import { Checkbox, CourseCode, UrgentPill } from '@/ui/marks'

export function taskTitle(t: Task) {
  return t.course ? `${t.course} ${t.title}` : t.title
}

/** design.md Needs You card: tasks due or overdue, then unmarked classes from earlier with All present. */
export function NeedsYou({
  today,
  tasks,
  markGroups,
  onTick,
  onAllPresent,
}: {
  today: string
  tasks: Task[]
  markGroups: { date: string; sessions: Session[] }[]
  onTick: (t: Task) => void
  onAllPresent: (sessions: Session[], date: string) => void
}) {
  if (tasks.length === 0 && markGroups.length === 0) return null
  return (
    <section aria-label="Needs you" className="rounded-card bg-needs px-3.5 py-3 shadow-[inset_0_0_0_1px_var(--needs-ring)]">
      <h2 className="pb-1 text-label font-semibold text-urgent">Needs you</h2>
      {tasks.map((t, i) => {
        const urgent = isOverdue(t, today) || t.due === today
        const pill = isOverdue(t, today) ? 'Overdue' : t.due === today ? (t.dueTime ? shortTime(t.dueTime) : 'Today') : `${dayLabel(t.due, today)}${t.dueTime ? `, ${clockLabel(t.dueTime)}` : ''}`
        return (
          <div key={t.id} className={`flex items-center gap-2.5 py-2.5 ${i > 0 ? 'border-t border-line' : ''}`}>
            <Checkbox urgent={urgent} onChange={() => onTick(t)} label={`Done: ${taskTitle(t)}`} />
            <b className={`min-w-0 flex-1 text-body font-semibold ${urgent ? 'text-urgent' : ''}`}>{taskTitle(t)}</b>
            {urgent ? <UrgentPill className="tnum">{pill}</UrgentPill> : <span className="text-meta text-ink-2 tnum">{pill}</span>}
          </div>
        )
      })}
      {markGroups.map((g, i) => (
        <div key={g.date} className={`flex flex-wrap items-center gap-2.5 py-2.5 ${tasks.length > 0 || i > 0 ? 'border-t border-line' : ''}`}>
          <span className="min-w-16 text-[13px] text-ink-2">{dayLabel(g.date, today)}</span>
          <span className="flex flex-1 flex-wrap gap-x-2.5 gap-y-1">
            {g.sessions.map((s) => (
              <CourseCode key={s.id} code={s.course} />
            ))}
          </span>
          <Button size="sm" className="ml-auto px-3 py-1.5 text-[12.5px]" onClick={() => onAllPresent(g.sessions, g.date)}>
            All present
          </Button>
        </div>
      ))}
    </section>
  )
}
