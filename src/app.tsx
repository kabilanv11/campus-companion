import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { toast } from 'sonner'
import { db, getSettings, updateSettings } from '@/db/schema'
import { loadDemoData } from '@/lib/demo'
import { useRouter, type Pushed } from '@/lib/router'
import { applyTheme, watchSystemTheme, type ThemeSetting } from '@/lib/theme'
import { useAppUpdate, usePersistentStorage } from '@/sw-update'
import { Toaster } from '@/components/ui/sonner'
import { TabBar } from '@/ui/TabBar'
import { Fab } from '@/ui/Fab'
import { ToastPill } from '@/ui/Toast'
import { CaptureSheet, type CaptureRequest } from '@/ui/CaptureSheet'
import { Today } from '@/screens/Today'
import { Tasks } from '@/screens/Tasks'
import { Attendance } from '@/screens/Attendance'
import { More } from '@/screens/More'
import { Schedule } from '@/screens/Schedule'
import { Calendar } from '@/screens/Calendar'
import { Settings } from '@/screens/Settings'

export function App() {
  const { route, go, back } = useRouter()
  const [captureOpen, setCaptureOpen] = useState(false)
  const [captureRequest, setCaptureRequest] = useState<CaptureRequest>({})
  const capture = (request: CaptureRequest = {}) => {
    setCaptureRequest(request)
    setCaptureOpen(true)
  }
  const settings = useLiveQuery(() => db.settings.get('app'))
  const theme: ThemeSetting = settings?.theme ?? 'system'

  useEffect(() => {
    getSettings().then(loadDemoData)
  }, [])

  // Theme: apply on change and follow the phone while on System.
  const themeRef = useRef(theme)
  themeRef.current = theme
  useEffect(() => applyTheme(theme), [theme])
  useEffect(() => watchSystemTheme(() => themeRef.current), [])

  usePersistentStorage()

  const { needRefresh, reload } = useAppUpdate()
  useEffect(() => {
    if (!needRefresh) return
    toast.custom(() => <ToastPill message="Update available" action="Reload" onAction={reload} />, {
      id: 'update',
      duration: Infinity,
    })
  }, [needRefresh, reload])

  const open = (screen: Pushed) => go({ tab: 'more', screen })
  const showFab = !route.screen

  return (
    <>
      {route.screen === 'schedule' ? (
        <Schedule onBack={back} />
      ) : route.screen === 'calendar' ? (
        <Calendar onBack={back} />
      ) : route.screen === 'settings' ? (
        <Settings theme={theme} onTheme={(t) => updateSettings({ theme: t })} onBack={back} />
      ) : route.tab === 'tasks' ? (
        <Tasks onEdit={(task) => capture({ task })} />
      ) : route.tab === 'attendance' ? (
        <Attendance onAdd={(text) => capture({ text })} />
      ) : route.tab === 'more' ? (
        <More onOpen={open} />
      ) : (
        <Today onSchedule={() => open('schedule')} onBackup={() => open('settings')} />
      )}

      {showFab && <Fab onClick={() => capture()} />}
      <TabBar active={route.tab} onSelect={(tab) => go({ tab })} />
      <CaptureSheet open={captureOpen} request={captureRequest} onOpenChange={setCaptureOpen} />
      <Toaster />
    </>
  )
}
