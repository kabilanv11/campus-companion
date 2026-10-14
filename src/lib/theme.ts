export type ThemeSetting = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'cc-theme'
const META_COLOR = { light: '#f2f5f4', dark: '#0b0a0f' } as const

export function resolveTheme(setting: ThemeSetting, systemDark: boolean): 'light' | 'dark' {
  if (setting === 'system') return systemDark ? 'dark' : 'light'
  return setting
}

const media = () => window.matchMedia('(prefers-color-scheme: dark)')

export function applyTheme(setting: ThemeSetting) {
  const mode = resolveTheme(setting, media().matches)
  document.documentElement.classList.toggle('dark', mode === 'dark')
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_COLOR[mode])
  try {
    // Mirror for the inline script in index.html, which paints the right theme before React loads.
    localStorage.setItem(STORAGE_KEY, setting)
  } catch {
    /* private mode: the theme still applies for this visit */
  }
}

/** Re-applies the theme whenever the phone switches between light and dark. */
export function watchSystemTheme(getSetting: () => ThemeSetting) {
  const m = media()
  const onChange = () => applyTheme(getSetting())
  m.addEventListener('change', onChange)
  return () => m.removeEventListener('change', onChange)
}
