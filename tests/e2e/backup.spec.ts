import { expect, test } from '@playwright/test'

test('export, start fresh, import with Replace: everything is restored', async ({ page, browser }, info) => {
  await page.goto('/attendance?now=2026-10-14T19:00')
  const unmarked = page.getByRole('region', { name: 'Unmarked' })
  await unmarked.locator('div', { hasText: /^Today/ }).first().getByRole('button', { name: 'All present' }).click()
  await expect(page.getByTestId('course-MPI')).toContainText('1/1 attended')

  await page.goto('/settings?now=2026-10-14T19:00')
  await expect(page.getByText('Last backup: none yet')).toBeVisible()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export' }).click()
  const file = await download
  expect(file.suggestedFilename()).toBe('campus-companion-backup-2026-10-14.json')
  const path = info.outputPath('backup.json')
  await file.saveAs(path)
  await expect(page.getByText('Last backup: today')).toBeVisible()

  // A fresh browser profile stands in for cleared site data.
  const fresh = await browser.newContext({ ...info.project.use, baseURL: info.project.use.baseURL })
  const p2 = await fresh.newPage()
  await p2.goto('/settings?now=2026-10-14T19:30')
  await p2.getByLabel('Backup file').setInputFiles(path)
  await expect(p2.getByTestId('import-preview')).toContainText('4 sessions, 0 tasks, 0 club events')
  await p2.getByRole('button', { name: 'Replace' }).click()
  await expect(p2.getByText('Backup restored')).toBeVisible()
  await p2.goto('/attendance?now=2026-10-14T19:30')
  await expect(p2.getByTestId('course-MPI')).toContainText('1/1 attended')
  await fresh.close()
})

test('a bad file shows an error and changes nothing', async ({ page }) => {
  await page.goto('/settings?now=2026-10-14T19:00')
  await page.getByLabel('Backup file').setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') })
  await expect(page.getByText('This file isn’t a Campus Companion backup.')).toBeVisible()
  await expect(page.getByTestId('import-preview')).toBeHidden()
})

test('Today reminds to back up after 14 days and links to Settings', async ({ page }) => {
  await page.goto('/settings?now=2026-10-14T08:00')
  await expect(page.getByText('Name in greetings')).toBeVisible() // first run recorded on 14 Oct
  await page.goto('/?now=2026-10-27T08:00')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByTestId('backup-reminder')).toBeHidden()
  await page.goto('/?now=2026-11-20T08:00')
  // First run was 14 Oct in this profile's clock, more than 14 days ago.
  await expect(page.getByTestId('backup-reminder')).toHaveText(/Back up your data/)
  await page.getByTestId('backup-reminder').click()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
})
