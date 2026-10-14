import type { ReactNode } from 'react'

/** A main screen: 18px gutters, room under the content for the tab bar and + button. */
export function Page({ children }: { children: ReactNode }) {
  return <main className="mx-auto max-w-[480px] px-gutter pt-[max(14px,env(safe-area-inset-top))] pb-36">{children}</main>
}

export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className="mt-6 text-greeting font-bold">{children}</h1>
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="mt-6 mb-2 text-label font-semibold text-ink-3">{children}</h2>
}

/** "‹ More" on pushed screens. */
export function BackLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mt-1 text-[14px] font-medium text-link">
      ‹ {label}
    </button>
  )
}
