import { expect, test } from '@playwright/test'

test('typed line becomes a task (build spec 11 acceptance)', async ({ page }) => {
  await page.goto('/tasks?now=2026-10-13T11:00')
  await page.getByRole('button', { name: 'Add' }).click()
  await page.getByLabel('What to add').fill('mac assignment 2 due fri 11pm')
  const sheet = page.getByRole('dialog')
  await expect(sheet.getByRole('radio', { name: 'Assignment' })).toHaveAttribute('aria-checked', 'true')
  await expect(sheet).toContainText('Fri 16 Oct, 11 PM')
  await expect(sheet).toContainText('Shows from')
  await sheet.getByRole('button', { name: 'Add' }).click()
  await expect(sheet).toBeHidden()

  // Shows from Tue 13 (today) → in Needs you on Today.
  const row = page.getByRole('region', { name: 'This week' })
  await expect(row).toContainText('MAC Assignment 2')
  await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'Today' }).click()
  await expect(page.getByRole('region', { name: 'Needs you' })).toContainText('MAC Assignment 2')
})

test('a guest lecture lands on the timeline and counts toward the course', async ({ page }) => {
  await page.goto('/?now=2026-10-13T09:00')
  await page.getByRole('button', { name: 'Add' }).click()
  await page.getByLabel('What to add').fill('guest lecture mep today 6pm auditorium')
  await expect(page.getByRole('dialog')).toContainText('Counts toward MEP')
  await page.getByRole('dialog').getByRole('button', { name: 'Add' }).click()
  await expect(page.getByTestId('class-MEP')).toContainText('Guest lecture, Auditorium')
})

test('a tapped pill sticks while typing, and a task can be edited', async ({ page }) => {
  await page.goto('/tasks?now=2026-10-13T11:00')
  await page.getByRole('button', { name: 'Add' }).click()
  const input = page.getByLabel('What to add')
  await input.fill('odc case')
  await page.getByRole('radio', { name: 'Assignment' }).click()
  await input.fill('odc case prep thu')
  await expect(page.getByRole('radio', { name: 'Assignment' })).toHaveAttribute('aria-checked', 'true')
  await page.getByRole('dialog').getByRole('button', { name: 'Add' }).click()

  await page.getByRole('button', { name: /ODC Case prep/ }).click()
  await expect(page.getByLabel('What to add')).toHaveValue('Case prep')
  await page.getByLabel('What to add').fill('Case prep and slides')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('ODC Case prep and slides')).toBeVisible()
})

test('an extra class without a course asks for one', async ({ page }) => {
  await page.goto('/?now=2026-10-13T09:00')
  await page.getByRole('button', { name: 'Add' }).click()
  await page.getByLabel('What to add').fill('guest lecture thu 4pm')
  await page.getByRole('dialog').getByRole('button', { name: 'Add' }).click()
  // Add opens the course list instead of saving.
  await page.getByRole('button', { name: 'MPI · Marketing Practices and Implementation' }).click()
  await expect(page.getByRole('dialog')).toContainText('Counts toward MPI')
  await page.getByRole('dialog').getByRole('button', { name: 'Add' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
})

test('a cancelled class from + shows as cancelled, with Undo', async ({ page }) => {
  await page.goto('/?now=2026-10-14T08:00')
  await page.getByRole('button', { name: 'Add' }).click()
  await page.getByLabel('What to add').fill('mpi class cancelled')
  const sheet = page.getByRole('dialog')
  await expect(sheet.getByRole('radio', { name: 'Cancelled' })).toHaveAttribute('aria-checked', 'true')
  await expect(sheet).toContainText('Wed 14 Oct, 10:15')
  await expect(sheet).toContainText('Won’t count toward MPI')
  await sheet.getByRole('button', { name: 'Add' }).click()
  await expect(page.getByTestId('class-MPI')).toContainText('Cancelled')
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.getByTestId('class-MPI')).not.toContainText('Cancelled')
})

test('a guest lecture later in the week shows under Coming up', async ({ page }) => {
  await page.goto('/?now=2026-10-14T08:00')
  await page.getByRole('button', { name: 'Add' }).click()
  await page.getByLabel('What to add').fill('guest lecture mep fri 4pm auditorium')
  await page.getByRole('dialog').getByRole('button', { name: 'Add' }).click()
  await expect(page.getByTestId('coming-guest')).toContainText('MEP guest lecture')
  await expect(page.getByTestId('coming-guest')).toContainText('Auditorium')
})
