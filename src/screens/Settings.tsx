import { useState, type ReactNode } from 'react'
import { courseInfo, referenceData, timetableFor, timetables } from '@/data'
import { addClub, setCourseField } from '@/db/actions'
import { useUserData } from '@/db/hooks'
import { updateSettings } from '@/db/schema'
import { courseOn } from '@/domain/sessions'
import { istDate } from '@/domain/time'
import type { ThemeSetting } from '@/lib/theme'
import { useNow } from '@/lib/useNow'
import { cn } from '@/lib/utils'
import { ClubSquare, CourseDot } from '@/ui/marks'
import { BackLink, Page, PageTitle, SectionLabel } from '@/ui/Page'
import { BackupSection } from '@/ui/BackupSection'
import { Segmented } from '@/ui/Segmented'

const THEMES: { id: ThemeSetting; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
]

const ROW = 'flex items-center justify-between gap-2.5 border-t border-line py-2.5 text-body first-of-type:border-t-0'

export function Settings({ theme, onTheme, onBack }: { theme: ThemeSetting; onTheme: (t: ThemeSetting) => void; onBack: () => void }) {
  const today = istDate(useNow())
  const user = useUserData()
  const [open, setOpen] = useState<string | null>(null)
  const [addingClub, setAddingClub] = useState(false)
  // The courses of the term in progress, or the latest timetable between terms.
  const timetable = timetableFor(today, referenceData) ?? timetables[timetables.length - 1]
  const ctx = user && { data: referenceData, stored: user.sessions, overrides: user.overrides }

  return (
    <Page>
      <BackLink label="More" onClick={onBack} />
      <PageTitle>Settings</PageTitle>

      <Section title="Appearance">
        <Segmented label="Appearance" options={THEMES} value={theme} onChange={onTheme} />
      </Section>

      {user?.settings && (
        <Section title="You">
          <div className={ROW}>
            <label htmlFor="set-name">Name in greetings</label>
            <InlineText id="set-name" value={user.settings.name} onSave={(name) => updateSettings({ name })} />
          </div>
          <div className={ROW}>
            <label htmlFor="set-section">Section</label>
            <InlineText id="set-section" value={user.settings.section} onSave={(section) => updateSettings({ section })} />
          </div>
        </Section>
      )}

      {ctx && timetable && (
        <Section title="Courses">
          {timetable.courses.map((c) => {
            const now = courseOn(c.code, today, ctx)
            if (!now) return null
            const editing = open === c.code
            const save = (field: 'professor' | 'room', value: string) => {
              if (value.trim() && value.trim() !== now[field]) void setCourseField(c.code, field, value, today)
            }
            return (
              <div key={c.code} data-testid={`course-${c.code}`} className="border-t border-line py-[11px] first-of-type:border-t-0">
                <button
                  type="button"
                  aria-expanded={editing}
                  onClick={() => setOpen(editing ? null : c.code)}
                  className="flex w-full items-center justify-between gap-2.5 text-left"
                >
                  <span className="grid min-w-0 gap-[3px]">
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <span className="inline-flex items-center gap-1.5 text-code font-bold">
                        <CourseDot code={c.code} />
                        {c.code}
                      </span>
                      <span className="text-name text-ink-2">{courseInfo(c.code)?.name}</span>
                    </span>
                    {!editing && (
                      <span className="text-[13px] text-ink-2">
                        {now.professor} · <span className={cn(now.room !== now.defaultRoom && 'font-semibold text-link')}>{now.room}</span>
                      </span>
                    )}
                  </span>
                  <span aria-hidden className="text-[18px] leading-none text-ink-3">{editing ? '⌄' : '›'}</span>
                </button>
                {editing && (
                  <div className="mt-2.5 grid gap-2.5">
                    <Field label="Professor" defaultValue={now.professor} onSave={(v) => save('professor', v)} />
                    <Field label="Room" defaultValue={now.room} onSave={(v) => save('room', v)} />
                    <p className="text-meta text-ink-2">Changes apply from today. Past sessions keep their old room.</p>
                  </div>
                )}
              </div>
            )
          })}
        </Section>
      )}

      {user && (
        <Section title="Clubs">
          {user.clubs.map((c) => (
            <div key={c.code} className={ROW}>
              <span className="inline-flex items-center gap-1.5">
                <ClubSquare code={c.code} />
                {c.name}
              </span>
            </div>
          ))}
          {addingClub ? (
            <div className="border-t border-line pt-2.5">
              <Field
                label="Club"
                defaultValue=""
                autoFocus
                onSave={(v) => {
                  void addClub(v)
                  setAddingClub(false)
                }}
                onCancel={() => setAddingClub(false)}
              />
            </div>
          ) : (
            <button type="button" onClick={() => setAddingClub(true)} className="w-full border-t border-line pt-2.5 text-left text-label font-semibold text-link">
              + Add club
            </button>
          )}
        </Section>
      )}

      {user?.settings && (
        <Section title="Backup">
          <BackupSection settings={user.settings} today={today} />
        </Section>
      )}
    </Page>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <SectionLabel className="mb-2">{title}</SectionLabel>
      {children}
    </section>
  )
}

/** A value on a settings row that edits in place; saved when focus leaves or on Enter. */
function InlineText({ id, value, onSave }: { id: string; value: string; onSave: (v: string) => void }) {
  return (
    <input
      id={id}
      key={value}
      defaultValue={value}
      enterKeyHint="done"
      onBlur={(e) => {
        const v = e.currentTarget.value.trim()
        if (v && v !== value) onSave(v)
        else e.currentTarget.value = value
      }}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      className="w-1/2 min-w-0 rounded-[4px] bg-transparent text-right font-semibold outline-none focus:shadow-[0_1.5px_0_var(--brand)]"
    />
  )
}

/** design.md: Card background, 1px Line ring, 10px radius, 84px label column; the active field gets a 1.5px teal ring. */
function Field({
  label,
  defaultValue,
  onSave,
  onCancel,
  autoFocus,
}: {
  label: string
  defaultValue: string
  onSave: (v: string) => void
  onCancel?: () => void
  autoFocus?: boolean
}) {
  return (
    <label className="grid grid-cols-[84px_1fr] items-center rounded-field bg-card px-3 py-2.5 text-body shadow-[inset_0_0_0_1px_var(--line)] focus-within:shadow-[inset_0_0_0_1.5px_var(--brand)]">
      <span className="text-[13px] text-ink-2">{label}</span>
      <input
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        enterKeyHint="done"
        onBlur={(e) => (e.currentTarget.value.trim() ? onSave(e.currentTarget.value) : onCancel?.())}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') onCancel?.()
        }}
        className="min-w-0 bg-transparent text-ink outline-none"
      />
    </label>
  )
}
