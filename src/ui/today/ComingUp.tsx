import type { ComingUpItem } from '@/domain/today'
import type { Task } from '@/db/schema'
import { clockLabel, dayLabel, dayNum, dayShort } from '@/lib/format'
import { Checkbox } from '@/ui/marks'
import { SectionLabel } from '@/ui/Page'
import { taskTitle } from './NeedsYou'

export function ComingUp({ today, items, onTick }: { today: string; items: ComingUpItem[]; onTick: (t: Task) => void }) {
  if (items.length === 0) return null
  return (
    <section>
      <SectionLabel>Coming up</SectionLabel>
      {items.map((item, i) => (
        <div key={item.type === 'task' ? item.task.id : `${item.label}-${item.date}`} className={`flex items-center gap-2.5 py-2.5 ${i > 0 ? 'border-t border-line' : ''}`}>
          {item.type === 'task' ? (
            <>
              <Checkbox onChange={() => onTick(item.task)} label={`Done: ${taskTitle(item.task)}`} />
              <b className="min-w-0 flex-1 text-body font-semibold">{taskTitle(item.task)}</b>
              <span className="text-meta text-ink-2 tnum">
                {dayLabel(item.date, today)}
                {item.task.dueTime && `, ${clockLabel(item.task.dueTime)}`}
              </span>
            </>
          ) : (
            <>
              <i aria-hidden className="block h-0.5 w-4 shrink-0 bg-ink-3" />
              <b className="min-w-0 flex-1 text-body font-semibold">
                {item.label}
                {!/exam|break/i.test(item.label) && ', no classes'}
              </b>
              <span className="text-meta text-ink-2 tnum">{`${dayShort(item.date)} ${dayNum(item.date)}`}</span>
            </>
          )}
        </div>
      ))}
    </section>
  )
}
