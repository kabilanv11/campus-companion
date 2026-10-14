import { expect, test } from '@playwright/test'

test('mark a day present, undo it, and change a past status in place', async ({ page }) => {
  await page.goto('/attendance?now=2026-10-14T19:00')
  const unmarked = page.getByRole('region', { name: 'Unmarked' })
  await expect(unmarked.getByText('Today')).toBeVisible()

  const todayRow = unmarked.locator('div', { hasText: /^Today/ }).first()
  await todayRow.getByRole('button', { name: 'All present' }).click()
  await expect(unmarked.getByText('Today', { exact: true })).toBeHidden()
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(unmarked.getByText('Today', { exact: true })).toBeVisible()

  const om = page.getByTestId('course-OM')
  await om.getByRole('button').first().click()
  await page.getByRole('button', { name: /OM 2026-10-12/ }).click()
  await page.getByRole('option', { name: 'Absent' }).click()
  await expect(page.getByRole('button', { name: 'OM 2026-10-12: Absent' })).toBeVisible()
  await expect(om).toContainText('0/1 attended · 19 left')
})

test('cancelled sessions do not count as held', async ({ page }) => {
  await page.goto('/attendance?now=2026-10-14T19:00')
  const mpi = page.getByTestId('course-MPI')
  await mpi.getByRole('button').first().click()
  await page.getByRole('button', { name: /MPI 2026-10-14/ }).click()
  await page.getByRole('option', { name: 'Cancelled' }).click()
  await expect(mpi).toContainText('0/0 attended · 20 left')
})
