import { expect, test } from '@playwright/test'

test('tabs switch screens and the + sheet opens', async ({ page }) => {
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Main' })
  await expect(nav.getByRole('button', { name: 'Today' })).toHaveAttribute('aria-current', 'page')

  await nav.getByRole('button', { name: 'Tasks' }).click()
  await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible()
  await expect(page).toHaveURL(/\/tasks$/)

  await page.getByRole('button', { name: 'Add' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
})

test('Settings opens from More and back returns there', async ({ page }) => {
  await page.goto('/more')
  await page.getByRole('button', { name: 'Settings' }).click()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('heading', { name: 'More' })).toBeVisible()
})

test('theme follows the phone and Settings overrides it', async ({ page }, info) => {
  await page.goto('/settings')
  const html = page.locator('html')
  const systemDark = info.project.name === 'dark'
  await expect(html).toHaveClass(systemDark ? /dark/ : /^(?!.*dark).*$/)

  await page.getByRole('radio', { name: systemDark ? 'Light' : 'Dark' }).click()
  await expect(html).toHaveClass(systemDark ? /^(?!.*dark).*$/ : /dark/)

  // The choice survives a reload with no flash, via the saved setting.
  await page.reload()
  await expect(html).toHaveClass(systemDark ? /^(?!.*dark).*$/ : /dark/)
})

test('no horizontal scroll at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 })
  for (const path of ['/', '/tasks', '/attendance', '/more', '/schedule', '/calendar', '/settings']) {
    await page.goto(path)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow, path).toBeLessThanOrEqual(0)
  }
})
