import { expect, test } from '@playwright/test'

// Build spec 11: Today at fixed clocks (dev/preview builds honour ?now=).

test('Wed 14 Oct 13:00: OM is the island with marking, lunch open, breakfast faded', async ({ page }) => {
  await page.goto('/?now=2026-10-14T13:00')
  await expect(page.getByTestId('class-OM')).toHaveAttribute('data-state', 'island')
  await expect(page.getByTestId('meal-lunch')).toHaveAttribute('data-state', 'nextMeal')
  await expect(page.getByTestId('meal-breakfast')).toHaveAttribute('data-state', 'past')
  await expect(page.getByText('Aloo Beans')).toBeVisible()

  const om = page.getByRole('group', { name: 'Mark OM' })
  await om.getByRole('button', { name: 'Present' }).click()
  await expect(om).toBeHidden()
})

test('Wed 14 Oct 08:00: breakfast open, MPI is the island', async ({ page }) => {
  await page.goto('/?now=2026-10-14T08:00')
  await expect(page.getByTestId('meal-breakfast')).toHaveAttribute('data-state', 'nextMeal')
  await expect(page.getByTestId('class-MPI')).toHaveAttribute('data-state', 'island')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Kabilan')
})

test('Wed 14 Oct 19:30: tomorrow (Thursday) with tonight\'s dinner first', async ({ page }) => {
  await page.goto('/?now=2026-10-14T19:30')
  await expect(page.getByRole('heading', { name: 'Tonight' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Tomorrow, Thursday' })).toBeVisible()
  await expect(page.getByTestId('class-ODC')).toHaveAttribute('data-state', 'island')
})

test('Tue 20 Oct: no classes, Dussehra', async ({ page }) => {
  await page.goto('/?now=2026-10-20T09:00')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Happy Dussehra, Kabilan')
  await expect(page.getByText('No classes today')).toBeVisible()
  await expect(page.locator('[data-testid^="class-"]')).toHaveCount(0)
})

test('ticking a task in Needs you offers Undo', async ({ page }) => {
  await page.goto('/?now=2026-10-14T13:00&demo=1')
  const box = page.getByRole('checkbox', { name: 'Done: MSM quiz' })
  await box.click()
  await expect(box).toBeHidden()
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.getByRole('checkbox', { name: 'Done: MSM quiz' })).toBeVisible()
})
