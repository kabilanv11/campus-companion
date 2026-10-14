import { describe, expect, it } from 'vitest'
import { parsePath, toPath } from '@/lib/router'
import { resolveTheme } from '@/lib/theme'
import { parseTestNow } from '@/lib/clock'


describe('router', () => {
  it('maps paths to tabs and pushed screens', () => {
    expect(parsePath('/')).toEqual({ tab: 'today' })
    expect(parsePath('/tasks')).toEqual({ tab: 'tasks', screen: undefined })
    expect(parsePath('/settings')).toEqual({ tab: 'more', screen: 'settings' })
    expect(parsePath('/nonsense')).toEqual({ tab: 'today' })
  })

  it('round-trips routes', () => {
    for (const path of ['/', '/tasks', '/attendance', '/more', '/schedule', '/calendar', '/settings']) {
      expect(toPath(parsePath(path))).toBe(path)
    }
  })
})

describe('theme', () => {
  it('follows the phone only on System', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })
})

describe('test clock', () => {
  it('reads ?now= as IST', () => {
    expect(parseTestNow('?now=2026-10-14T13:00')?.toISOString()).toBe('2026-10-14T07:30:00.000Z')
    expect(parseTestNow('?now=2026-10-20')?.toISOString()).toBe('2026-10-19T18:30:00.000Z')
    expect(parseTestNow('?now=garbage')).toBeNull()
    expect(parseTestNow('')).toBeNull()
  })
})
