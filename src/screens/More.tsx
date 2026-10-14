import type { Pushed } from '@/lib/router'
import { Page, PageTitle } from '@/ui/Page'

const LINKS: { id: Pushed; label: string }[] = [
  { id: 'schedule', label: 'Daily schedule' },
  { id: 'calendar', label: 'Academic calendar' },
  { id: 'settings', label: 'Settings' },
]

export function More({ onOpen }: { onOpen: (screen: Pushed) => void }) {
  return (
    <Page>
      <PageTitle>More</PageTitle>
      <ul className="mt-5">
        {LINKS.map((l) => (
          <li key={l.id} className="border-b border-line">
            <button
              type="button"
              onClick={() => onOpen(l.id)}
              className="flex w-full items-center justify-between py-3 text-left text-[14px] font-medium"
            >
              {l.label}
              <span aria-hidden className="text-ink-3">›</span>
            </button>
          </li>
        ))}
      </ul>
    </Page>
  )
}
