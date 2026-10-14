import { BackLink, Page, PageTitle } from '@/ui/Page'

// Build step 6.
export function Calendar({ onBack }: { onBack: () => void }) {
  return (
    <Page>
      <BackLink label="More" onClick={onBack} />
      <PageTitle>Academic calendar</PageTitle>
    </Page>
  )
}
