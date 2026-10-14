import { BackLink, Page, PageTitle } from '@/ui/Page'

// Build step 6.
export function Schedule({ onBack }: { onBack: () => void }) {
  return (
    <Page>
      <BackLink label="More" onClick={onBack} />
      <PageTitle>Daily schedule</PageTitle>
    </Page>
  )
}
