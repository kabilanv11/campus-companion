import { useCallback, useEffect, useState } from 'react'

// A small History API router: four tabs plus screens pushed from More.
// Android's back button pops a pushed screen; on a tab it leaves the app as usual.

export type Tab = 'today' | 'tasks' | 'attendance' | 'more'
export type Pushed = 'schedule' | 'calendar' | 'settings'
export type Route = { tab: Tab; screen?: Pushed }

const TABS: Tab[] = ['today', 'tasks', 'attendance', 'more']
const PUSHED: Pushed[] = ['schedule', 'calendar', 'settings']

export function parsePath(pathname: string): Route {
  const [first, second] = pathname.split('/').filter(Boolean)
  if (first && (PUSHED as string[]).includes(first)) return { tab: 'more', screen: first as Pushed }
  if (first && (TABS as string[]).includes(first)) {
    const screen = second && (PUSHED as string[]).includes(second) ? (second as Pushed) : undefined
    return { tab: first as Tab, screen }
  }
  return { tab: 'today' }
}

export function toPath(route: Route): string {
  if (route.screen) return `/${route.screen}`
  return route.tab === 'today' ? '/' : `/${route.tab}`
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(() => parsePath(window.location.pathname))

  useEffect(() => {
    const onPop = () => setRoute(parsePath(window.location.pathname))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const go = useCallback((next: Route) => {
    const path = toPath(next) + window.location.search
    if (next.screen) window.history.pushState({ pushed: true }, '', path)
    else window.history.replaceState(null, '', path)
    setRoute(next)
    window.scrollTo(0, 0)
  }, [])

  const back = useCallback(() => {
    // Opened from inside the app: pop the entry so the next back press doesn't return here.
    if (window.history.state?.pushed) window.history.back()
    else go({ tab: route.tab })
  }, [go, route.tab])

  return { route, go, back }
}
