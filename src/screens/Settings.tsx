import type { ThemeSetting } from '@/lib/theme'
import { Button } from '@/components/ui/button'
import { BackLink, Page, PageTitle, SectionLabel } from '@/ui/Page'

const THEMES: { id: ThemeSetting; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
]

// Appearance now; You, Courses, Clubs and Backup arrive in build steps 6 and 7.
export function Settings({
  theme,
  onTheme,
  onBack,
}: {
  theme: ThemeSetting
  onTheme: (t: ThemeSetting) => void
  onBack: () => void
}) {
  return (
    <Page>
      <BackLink label="More" onClick={onBack} />
      <PageTitle>Settings</PageTitle>
      <SectionLabel>Appearance</SectionLabel>
      {/* design.md: segments are separate pills with a 6px gap, never a joined bar. */}
      <div role="radiogroup" aria-label="Appearance" className="flex gap-1.5">
        {THEMES.map((t) => (
          <Button
            key={t.id}
            role="radio"
            aria-checked={theme === t.id}
            variant={theme === t.id ? 'primary' : 'secondary'}
            onClick={() => onTheme(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>
    </Page>
  )
}
