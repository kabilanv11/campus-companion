import { useEffect, useState } from 'react'
import { now } from './clock'

/** The current time, refreshed every 30 seconds and whenever the app comes back to the foreground. */
export function useNow(intervalMs = 30_000): Date {
  const [t, setT] = useState(now)
  useEffect(() => {
    const tick = () => setT(now())
    const id = setInterval(tick, intervalMs)
    const onVisible = () => document.visibilityState === 'visible' && tick()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [intervalMs])
  return t
}
