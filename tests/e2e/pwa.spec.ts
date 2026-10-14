import { expect, test } from '@playwright/test'

// Build spec 8 and 11: installable, and every screen loads in airplane mode.

const SCREENS: [string, string][] = [
  ['/', 'Your day'],
  ['/tasks', 'Tasks'],
  ['/attendance', 'Attendance'],
  ['/more', 'More'],
  ['/schedule', 'Daily schedule'],
  ['/calendar', 'Academic calendar'],
  ['/settings', 'Settings'],
]

test('every screen loads offline once the app has been opened', async ({ page, context }) => {
  await page.goto('/?now=2026-10-14T13:00')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload() // the service worker controls the page from the next load
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)

  await context.setOffline(true)
  for (const [path, text] of SCREENS) {
    await page.goto(`${path}?now=2026-10-14T13:00`)
    await expect(page.getByText(text, { exact: true }).first(), path).toBeVisible()
  }
  // Fonts come from the cache too.
  expect(await page.evaluate(() => document.fonts.check('600 14px Inter'))).toBe(true)
  await context.setOffline(false)
})

test('Chrome reports the app as installable', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium')
  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  // Playwright contexts are incognito, which Chrome reports on its own; every other check must pass.
  const cdp = await page.context().newCDPSession(page)
  await expect
    .poll(async () => ((await cdp.send('Page.getInstallabilityErrors')) as { installabilityErrors: { errorId: string }[] }).installabilityErrors.map((e) => e.errorId).filter((id) => id !== 'in-incognito'))
    .toEqual([])
  const manifest = await (await page.request.get('/manifest.webmanifest')).json()
  expect(manifest).toMatchObject({ name: 'Campus Companion', short_name: 'Campus', display: 'standalone', theme_color: '#0c4243', background_color: '#f2f5f4' })
  expect(manifest.icons.filter((i: { purpose: string }) => i.purpose === 'maskable').map((i: { sizes: string }) => i.sizes).sort()).toEqual(['192x192', '512x512'])
})
