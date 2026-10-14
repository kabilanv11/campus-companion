// The app's single source of "now". Every screen reads time through here.
// In dev and preview builds, ?now=2026-10-14T13:00 pins the clock (IST) for tests and phone checks.

const IST_OFFSET = '+05:30'

function parseTestNow(search: string): Date | null {
  const raw = new URLSearchParams(search).get('now')
  if (!raw) return null
  const iso = /[zZ]|[+-]\d\d:\d\d$/.test(raw) ? raw : `${raw.length === 10 ? `${raw}T00:00` : raw}${IST_OFFSET}`
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Read once at startup; the test clock then advances with real time so ticks still work. */
const testStart = typeof window !== 'undefined' && __TEST_CLOCK__ ? parseTestNow(window.location.search) : null
const realStart = Date.now()

export function now(): Date {
  if (testStart) return new Date(testStart.getTime() + (Date.now() - realStart))
  return new Date()
}

export const isTestClock = testStart !== null

export { parseTestNow }
