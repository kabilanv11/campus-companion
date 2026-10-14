import { cn } from '@/lib/utils'
import type { Tab } from '@/lib/router'

const TABS: { id: Tab; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'more', label: 'More' },
]

// design.md Bottom Bar: frosted canvas at 92% with 16px blur, hairline top, active tab a filled pill.
export function TabBar({ active, onSelect }: { active: Tab; onSelect: (tab: Tab) => void }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/92 pt-2 pb-[max(14px,env(safe-area-inset-bottom))] backdrop-blur-[16px]"
    >
      <ul className="mx-auto flex max-w-[480px] items-center justify-around px-2">
        {TABS.map((t) => {
          const isActive = t.id === active
          return (
            <li key={t.id}>
              <button
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onSelect(t.id)}
                className={cn(
                  'rounded-full px-3.5 py-[7px] text-tab font-medium',
                  isActive ? 'bg-brand text-btn-ink' : 'text-ink-3',
                )}
              >
                {t.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
