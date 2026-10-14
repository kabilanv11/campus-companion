import { expect, test } from '@playwright/test'

test('More links open Schedule and Calendar, and back returns to More', async ({ page }) => {
  await page.goto('/more?now=2026-10-14T08:00')
  await expect(page.getByText('Next on the calendar')).toBeVisible()
  await page.getByRole('button', { name: /Daily schedule/ }).click()
  await expect(page.getByTestId('schedule-class-MPI')).toContainText('Kishore Kumar Gangwani · G-6')
  await expect(page.getByTestId('schedule-meal-dinner')).toBeVisible()
  // Dussehra next week is struck through; picking it shows why there are no classes.
  await page.getByRole('button', { name: 'Tue 20, no classes' }).click()
  await expect(page.getByText('No classes · Dussehra')).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('heading', { name: 'More' })).toBeVisible()

  await page.getByRole('button', { name: /Academic calendar/ }).click()
  await expect(page.getByTestId('today-line')).toBeVisible()
  await page.getByRole('radio', { name: 'Month' }).click()
  await expect(page.locator('[data-date="2026-11-04"]')).toHaveAttribute('data-mark', 'exam')
  await expect(page.locator('[data-date="2026-10-20"]')).toHaveAttribute('data-mark', 'noClass')
})

test('a room set in Settings applies from today, not to past sessions', async ({ page }) => {
  const clock = '?now=2026-10-16T08:00' // Friday
  await page.goto(`/settings${clock}`)
  const msm = page.getByTestId('course-MSM')
  await msm.getByRole('button').click()
  await msm.getByLabel('Room').fill('LR-5')
  await msm.getByLabel('Room').press('Enter')
  await msm.getByRole('button').first().click()
  await expect(msm).toContainText('Joydip Mitra · LR-5')

  await page.goto(`/schedule${clock}`)
  await expect(page.getByTestId('schedule-class-MSM')).toContainText('LR-5')
  await page.getByRole('button', { name: 'Wed 21' }).click()
  await expect(page.getByTestId('schedule-class-MSM')).toContainText('LR-5')
  await page.getByRole('button', { name: 'Wed 14' }).click()
  await expect(page.getByTestId('schedule-class-MSM')).toContainText('G-6')
})

test('add a club', async ({ page }) => {
  await page.goto('/settings?now=2026-10-14T08:00')
  await page.getByRole('button', { name: '+ Add club' }).click()
  await page.getByLabel('Club').fill('Finance Club')
  await page.getByLabel('Club').press('Enter')
  await expect(page.getByText('Finance Club')).toBeVisible()
})
