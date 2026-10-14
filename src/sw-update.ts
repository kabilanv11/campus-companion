import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

const HOUR = 60 * 60 * 1000

/**
 * Registers the service worker and reports when a new deploy is waiting.
 * Checks for updates every hour and whenever the app comes back to the foreground.
 */
export function useAppUpdate() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      const check = () => {
        if (registration.installing || !navigator.onLine) return
        registration.update().catch(() => {})
      }
      setInterval(check, HOUR)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check()
      })
    },
  })

  return { needRefresh, reload: () => updateServiceWorker(true) }
}

/** Requests persistent storage once, so Android doesn't clear data under storage pressure. */
export function usePersistentStorage() {
  useEffect(() => {
    navigator.storage?.persisted?.().then((already) => {
      if (!already) navigator.storage.persist?.().catch(() => {})
    })
  }, [])
}
