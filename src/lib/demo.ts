import { db } from '@/db/schema'

// ?demo=1 (dev and preview builds only) loads the mockups' sample data for Wed 14 Oct,
// so every state can be checked on the phone with ?now=. It never runs in production.

export async function loadDemoData() {
  if (!__TEST_CLOCK__ || !new URLSearchParams(location.search).has('demo')) return
  if (await db.tasks.get('demo-mac-case')) return
  const created = '2026-10-10T09:00:00.000Z'
  await db.transaction('rw', [db.tasks, db.sessions, db.clubEvents, db.courseOverrides], async () => {
    await db.tasks.bulkPut([
      { id: 'demo-mac-case', title: 'case write-up', course: 'MAC', type: 'assignment', due: '2026-10-12', createdAt: created },
      { id: 'demo-mpi-reading', title: 'case reading', course: 'MPI', type: 'reading', due: '2026-10-14', dueTime: '10:15', createdAt: created },
      { id: 'demo-msm-quiz', title: 'quiz', course: 'MSM', type: 'quiz', due: '2026-10-14', dueTime: '14:15', createdAt: created },
      { id: 'demo-odc-reading', title: 'reading, ch. 4', course: 'ODC', type: 'reading', due: '2026-10-15', dueTime: '10:15', createdAt: created },
      { id: 'demo-mac-a2', title: 'assignment 2', course: 'MAC', type: 'assignment', due: '2026-10-16', dueTime: '23:00', createdAt: created },
      { id: 'demo-wec-memo', title: 'memo draft', course: 'WEC', type: 'assignment', due: '2026-10-21', createdAt: created },
      { id: 'demo-om-mid', title: 'mid-term', course: 'OM', type: 'exam', due: '2026-11-02', createdAt: created },
    ])
    await db.sessions.bulkPut([
      { id: '2026-10-13_II_ODC', date: '2026-10-13', start: '10:15', course: 'ODC', kind: 'regular', status: 'present', markedAt: created },
      { id: '2026-10-13_III_WEC', date: '2026-10-13', start: '12:00', course: 'WEC', kind: 'regular', status: 'present', markedAt: created },
      { id: '2026-10-14_III_OM', date: '2026-10-14', start: '12:00', course: 'OM', kind: 'regular', venue: 'Tagore Hall' },
      { id: '2026-10-14_V_MEP', date: '2026-10-14', start: '16:00', course: 'MEP', kind: 'regular', venue: 'Auditorium' },
    ])
    await db.clubEvents.bulkPut([
      { id: 'demo-sam', club: 'SAM', title: 'Weekly meeting', date: '2026-10-14', start: '16:00', end: '17:00', venue: 'LR-3' },
      { id: 'demo-tedx', club: 'TEDx', title: 'Speaker outreach', date: '2026-10-15', start: '18:00', end: '19:00', venue: 'Seminar Hall' },
    ])
    await db.courseOverrides.bulkPut([{ id: 'demo-msm-room', course: 'MSM', room: 'LR-5', effectiveFrom: '2026-10-14' }])
  })
}
