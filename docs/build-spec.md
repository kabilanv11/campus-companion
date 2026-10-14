# Campus Companion — Build Spec (v1)

**For:** Claude Code, building in a fresh GitHub repo.
**Read with:** `design.md` (visual system, every token and component) and the v7 mockups (https://claude.ai/artifact/KB1htV4Kyd4aGiqmWkQtq6). Where this spec and design.md overlap, design.md wins on looks and this spec wins on behaviour.
**Parser rules:** `spec/quick-add-rules.md`.
**Data:** `data/timetable.json`, `data/mess_menu.json`, `data/calendar.json` (copy them into the repo as-is; see 4.1 for how new terms and menus are added).
**Status:** design fixed by Kabilan on 2026-10-13. Technical decisions are his, from 2026-10-13. Quick-add defaults accepted 2026-10-14. GitHub is connected to Claude; Vercel gets set up once the app is built. No open items.

---

## 1. What we're building

A personal, time-aware college companion for one MDI Gurgaon PGDM student (Section D, Term II). It opens to one screen that answers "what's happening now, what's next, what do I owe, can I skip, and what's in the mess", so he stops searching the gallery and WhatsApp. One user, one phone, no accounts.

**v1 scope:** Today, Tasks, Attendance, More (Daily schedule, Academic calendar, Settings), the + capture sheet, export/import, self-update.
**v2, not now:** Android share-sheet capture of WhatsApp messages with AI parsing. Section 12 lists what v1 must leave room for.

## 2. Hard constraints

| Constraint | What it means for the build |
|---|---|
| Zero cost | GitHub (free) for code, Vercel Hobby (free) on a `*.vercel.app` address. No paid services, no card on file, no custom domain, no paid APIs in v1. |
| PWA on Android | Installable from Chrome on Android. Manifest, service worker, icons, offline-first. |
| Local-only data | Everything lives in the phone's browser storage (IndexedDB). Call `navigator.storage.persist()` on first run. No login, no backend, no cloud database. |
| Backup | Export all data to one JSON file and import it back (replace or merge). |
| Fresh versions | The app detects a new deploy and shows "Update available" with a tap to reload. Old cached versions must never linger. |
| Deploys | Push to `main` auto-deploys production. Branches get Vercel preview URLs for testing on the phone before merging. |
| Accepted trade-offs | No home-screen widget, no laptop sync. If sync is ever added: one-time sign-in per device, never a login on every open. |

## 3. Stack

Kabilan's stack (2026-10-13). Claude Code (web or desktop) writes the code, GitHub stores it, Vercel Hobby hosts it.

- **Vite + React 18 + TypeScript** (strict mode). Vite rather than Next.js, because there is no server.
- **vite-plugin-pwa** (Workbox) with `registerType: 'prompt'`. The update toast is driven by `onNeedRefresh`.
- **Dexie** over IndexedDB for user data.
- **date-fns** (and `date-fns-tz` if needed) for dates. All logic runs in `Asia/Kolkata`.
- **Tailwind CSS v4 + shadcn/ui.** Put design.md's tokens into Tailwind's `@theme` (start from design.md's Tailwind block, with dark values under a `.dark` class or `prefers-color-scheme`). Use shadcn/ui for base components: Sheet (capture), Popover (status pop-up), Toast/Sonner (Undo and Update available), Tabs, Input, Checkbox. Restyle them to design.md: pills, 12px cards, no extra borders or shadows.
- **chrono-node** for dates and times in typed quick-add ("ob reading fri", "16 oct 4pm"). Use it with `forwardDate: true` and the IST reference date.
- **Motion (Framer Motion)**, optional and sparing: the sheet rising, a ticked task leaving its list, the toast. Respect `prefers-reduced-motion`. No decorative animation.
- **Fonts:** Inter and Source Serif 4, self-hosted as woff2 under `/public/fonts` so they work offline. Subset to Latin.
- **Vitest** for the logic in section 6 (attendance, timeline, meals, lead times, greeting choice). **Playwright** for a smoke test that loads Today at a fixed clock in both themes.
- **No router library is needed.** Four tabs plus a few pushed screens; use a small state-based router with the History API so Android's back button works.

Repo layout:

```
/data                 timetables/, menus/, calendar.json (bundled, read-only; new files are drop-ins)
/public               icons, fonts, manifest assets
/src
  /domain             pure functions: time, timeline, attendance, meals, tasks, greeting, parse
  /db                 Dexie schema, export/import
  /ui                 components (one per design.md component)
  /screens            Today, Tasks, Attendance, More, Schedule, Calendar, Settings
  /styles             globals.css (Tailwind @theme from design.md)
  /components/ui      shadcn/ui components, restyled
  app.tsx, main.tsx, sw-update.ts
/tests                vitest + playwright
```

## 4. Data

### 4.1 Bundled reference data (read-only, ships with the app)

- **Timetable** (`data/timetables/term-II.json`, from today's `timetable.json`): 5 slots of 90 minutes, 7 courses with credits, length (`full` = 20 sessions, `half` = 10 sessions, pre-midterm only), faculty with `applies` (`all`, `pre_midterm`, `post_midterm`), 14 weekly entries `{day, slot, course}`, and a default room of G-6 in Gurukula. Monday, Wednesday and Friday slot I is Office Hours and is not a class. There are no Saturday classes.
- **Menu** (`data/menus/2026-10.json`, from today's `mess_menu.json`): weekly repeat, valid 2026-10-01 to 2026-10-31. Holds meal times (breakfast 08:00–10:00, lunch 13:00–14:30, snacks 17:00–18:00, dinner 20:00–21:30), `always_included` items per meal, and `days.{mon..sun}.{meal}` item lists.
- **calendar.json:** Terms II and III with start, end, last class day, mid-term and end-term exam ranges, `classes_resume`, `no_class_days[]` (from, to, label), `events[]`, and breaks.

**New terms and menus are data drops, not code changes.** The Term III timetable and each month's menu (November first) will be pushed as they arrive.
- One file per term in `data/timetables/` and one per month in `data/menus/`, each in the same schema, carrying its own `term` or `valid_from`/`valid_to`.
- A single loader (`src/data/index.ts`) picks every file in those folders up with `import.meta.glob`, so adding a file needs no edit anywhere else. It selects the timetable whose term (from `calendar.json`) contains the date, and the menu whose `valid_from`–`valid_to` contains the date.
- The loader checks each file against its TypeScript schema in a unit test, so a bad conversion fails CI instead of the app.
- Workflow: Kabilan shares the PDF or image, Claude Code converts it into a new file in the same schema and pushes, and the auto-update ships it.
- If no file covers the date, Today shows "Menu for <month> not added yet" in place of the meal card, or "Timetable for <term> not added yet" in place of classes.
- Office Hours (Monday, Wednesday and Friday slot I) stay off the timeline.

**Veg / non-veg.** The menu has no veg flag. Mark an item non-veg if it matches a keyword list (`chicken, mutton, egg, eggs, omelette, fish, keema, prawn`), case-insensitive. Mark it sweet (amber) if it matches `halwa, kheer, gulab jamun, jalebi, ice cream, custard, rasgulla, sweet`. Everything else is veg. Keep the lists in one file so they're easy to extend.

### 4.2 User data (IndexedDB via Dexie)

```ts
// All ids are crypto.randomUUID(). All dates are 'YYYY-MM-DD' (IST); times are 'HH:mm'.
settings   { key: 'app', theme: 'system'|'light'|'dark', name: 'Kabilan', section: 'D',
             createdAt, lastExportAt? }
courseOverrides { course: 'MEP', professor?: string, room?: string, effectiveFrom: date }
             // history kept: the newest row with effectiveFrom <= session date wins
sessions   { id, date, start, course, kind: 'regular'|'makeup'|'extra'|'guest',
             venue?: string, status?: 'present'|'absent'|'cancelled', markedAt? }
             // Regular sessions are generated from the timetable on demand and only
             // stored once they have a status or a change. Key: `${date}_${slot}_${course}`
tasks      { id, title, course?: string, type: 'assignment'|'quiz'|'reading'|'exam'|'other',
             due: date, dueTime?: 'HH:mm', doneAt?: ISO, createdAt }
clubEvents { id, club: 'SAM'|'TEDx'|string, title, date, start, end, venue? }
clubs      { code, name }   // seeded: Samaritans (SAM), TEDx
undo       (in memory only, not persisted)
```

### 4.3 Export / import

- **Export:** one file `campus-companion-backup-YYYY-MM-DD.json` holding `{app:'campus-companion', schema: 1, exportedAt, data: {settings, courseOverrides, sessions, tasks, clubEvents, clubs}}`. Use the Web Share API on Android (`navigator.share({files})`) with a download fallback.
- **Import:** pick a file, validate the schema and version, and show what's in it ("42 sessions, 9 tasks, 3 club events") before applying. Two choices: **Replace** (wipe, then load) or **Merge** (upsert by id; for sessions, the newer `markedAt` wins).
- **Reminder:** Settings shows "Last backup: 6 days ago". From 14 days without a backup, add a quiet line under Coming up on Today: "Back up your data (last: 21 days ago)". It isn't a modal.
- These belong in Settings under a "Backup" section. This is the one addition to the mockups, and it's required by the technical decisions.

## 5. Time model

- **Now** is the device clock in IST. Every screen recomputes on a 30-second tick and whenever the app becomes visible again (`visibilitychange`).
- **Day mode:**
  - from 00:00 to 18:00, Today shows today;
  - from 18:00 (after snacks), Today switches to **Tomorrow**: tonight's dinner first, then tomorrow's timeline;
  - after 21:30, the open meal is tomorrow's breakfast.
- **Test clock:** a `?now=2026-10-14T13:00` query parameter overrides the clock, in dev and preview builds only. It's used by the tests and for checking states on the phone.

## 6. Core logic (pure functions in `/src/domain`, all unit-tested)

### 6.1 Sessions for a date
1. Return nothing on a no-class day (`no_class_days`), during exam ranges, after `last_class_day`, between the mid-term exams and `classes_resume`, or on breaks.
2. Otherwise take the weekly entries for that weekday. Drop `half` courses after the mid-term (WEC is pre-midterm only and ends 2026-10-31).
3. Add stored makeup, extra and guest sessions for that date.
4. Apply stored status and venue.
5. The professor comes from faculty `applies` by date (before or after the mid-term start), unless a course override says otherwise. The room comes from the override in force on that date, falling back to G-6.

### 6.2 Attendance per course
- `held` = sessions with status present or absent, across regular, makeup, extra and guest. **Cancelled sessions are excluded.**
- `absences` = sessions with status absent.
- `total` = 20 for a full-term course, 10 for a half-term one (fixed, from the timetable).
- `allowed` = floor(0.2 × total), so 4 or 2.
- `canMiss` = allowed − absences.
- **Display:**
  - `canMiss ≥ 2`: the number in Ink;
  - `canMiss = 1`: the number in red;
  - `canMiss = 0`: "Can't miss" in red;
  - `canMiss < 0`: "Short by N" in red.
- **Unmarked** = sessions whose start time has passed and that have no status.

### 6.3 Today timeline
- Merge the day's sessions, club events and the four meals by start time. Meals go at their start times, so lunch sits after the 12:00 class.
- **State per item:**
  - `past`: it ended before now and it isn't the island (shown at 40% opacity);
  - `island`: the single class whose start ≤ now < end, or else the next class to start today;
  - `nextMeal`: the meal whose window contains now, or else the next one to start;
  - everything else is `later`.
- Only `nextMeal` is expanded. The island and the meal render flush when they are adjacent.
- Marking buttons show on any class that has started and has no status. Tapping one stores the status and the buttons disappear.
- **All present:**
  - marks every unmarked class so far today;
  - when yesterday has unmarked classes, Needs you gets a "Yesterday · MAC · All present" row;
  - an Undo toast follows for 5 seconds.
- **Clash:** a club event that overlaps a class shows "Clashes with <code> · can miss N" in red.

### 6.4 Tasks
- **Lead days:** reading 1, quiz 2, assignment 3, exam 7, other 1 (confirmed 2026-10-12).
- **In Needs you** when `due − lead ≤ today` and not done, or when overdue. Sort by overdue first, then by due date and time.
- **Tasks screen groups:**
  - Overdue (due < today);
  - Today (due = today);
  - This week (due ≤ the coming Sunday);
  - Later, where each row shows "On Today from <date>" (due − lead);
  - Done this week (collapsed, with a count).
- Ticking a task sets `doneAt` and shows an Undo toast. Tapping a task opens the capture sheet prefilled.

### 6.5 Capture parser (+), rule-based, no AI in v1
**Full rules and 22 test cases:** `/spec/quick-add-rules.md` (copy into the repo as `docs/quick-add-rules.md`). That file is the source of truth for the parser; this section is the summary.

Turns one typed line into a typed record. Parse, in order:
1. **Type keywords:** assignment, quiz, reading, exam, "extra class", "makeup", "guest lecture", or a club name (club event). "meeting" counts as a club event only when no course is in the line ("MPI group meeting" is Other). The default is a task of type `other`.
2. **Course:** a course code, exact and case-insensitive (`mac`, `MEP`). Course aliases and names also match, with typo tolerance on words of 5+ letters.
3. **Club:** Samaritans, TEDx or a user-added club.
4. **Date and time:** chrono-node on the remaining text (today, tomorrow, weekday names as the next occurrence, `16 oct`, `16/10`, `11pm`, `16:00`).
5. **Venue (event types only):** text after `in`, `at` or `@`, or a trailing room-like token (`lr-3`, `auditorium`, `g-6`, `tagore hall`).
6. **Missing due time:** all-day, except Reading and Quiz, which take that course's class start time that day. A Reading or Quiz with no date takes the next class of that course.

The sheet shows the parsed fields live as label/value rows (design.md, Capture Sheet). Every field is tappable to correct. The type pills are all visible, each one tap away. A guest lecture or extra class creates a session (90 minutes) that counts toward attendance. A club event defaults to 1 hour. Keep the parser in one file with the test table from the rules file; it's the part most likely to need tuning.

### 6.6 Greeting and day-read
- **Pools:** morning (05:00–11:59), afternoon (12:00–16:59), evening (17:00–20:59) and night (21:00–04:59), at least 15 lines each. The full form is always used ("Good morning, Kabilan"); a bare "Morning" is never allowed.
- **Context lines win** over the time-of-day pool: a festival or no-class day (from the calendar label), exam week, the first day after a break, Friday evening, and late night after 23:30.
- **Random pick:** seeded by the date plus the time-of-day bucket, so the line stays the same across reopens within a bucket.
- **Day-read line:** generated from facts, shown only when true. Examples: "Two classes to go", "Packed Wednesday: four classes and a quiz", "Nothing due today". Hidden when nothing is worth saying.

## 7. Screens (build to the v7 mockups; numbers are v7 screen numbers)

| # | Screen | Notes |
|---|---|---|
| 01–03 | Today (morning, midday, evening) | Greeting, Needs you, Your day timeline, a "Mark everything so far present" line, Coming up. Evening mode is from 18:00. |
| 04 | Today on a no-class day | "No classes · <label>", meals only, Coming up. |
| 05 | Tasks | Section 6.4. |
| 06–08 | Capture sheet | Section 6.5. Opened by + from every main screen. |
| 09 | Attendance | Unmarked first (All present per day, Mark all present), then per course: code, name, held, can miss, and the session list with tap-to-change status pop-ups. |
| 10 | More | Daily schedule, Academic calendar, Settings. |
| 11 | Settings | Appearance (System / Light / Dark); You (name, section); Courses (professor and room per course, effective from today); Clubs (list and + Add club); **Backup** (Export, Import, last backup). No colour editing. |
| 12 | Daily schedule | Day picker (week strip); that day's classes with professor and room, and the full menu for all four meals. |
| 13–14 | Academic calendar | List (terms, months, TODAY line) and Month grid. No-class days are amber, exams red, course dates pink. |

**Navigation:** the bottom bar has 4 tabs. Pushed screens (Schedule, Calendar, Settings) show "‹ More" and respond to the Android back button. The + button floats on Today, Tasks, Attendance and More.

## 8. PWA, offline and updates

- **Manifest:**
  - name "Campus Companion", short_name "Campus", `display: standalone`, portrait;
  - `theme_color` #0c4243 (light) and `background_color` #f2f5f4;
  - maskable icons at 192 and 512.
- **Offline first:** Workbox precaches the app shell, fonts and the three data files. The app must work fully in airplane mode.
- **Updates:** `registerType: 'prompt'`. When a new service worker is waiting, show a toast pill above the tab bar, "Update available · Reload". Reload calls `updateSW(true)`. Also check for updates on `visibilitychange` (visible) and every 60 minutes.
- **Persistence:** call `navigator.storage.persist()` on first run. If it's refused, Settings shows one line: "Android may clear data if storage runs low. Back up regularly."
- **Theme:** follow `prefers-color-scheme` unless Settings overrides it. Set `<meta name="theme-color">` per mode.

## 9. Deploy and workflow

- A GitHub repo (private is fine). GitHub is already connected to Claude, so the repo can be created and built there first.
- Vercel Hobby is connected after the app is built (Kabilan sets it up then). Framework preset: Vite. Build `npm run build`, output `dist`.
- `main` goes to production at `campus-companion.vercel.app` (or the next free name). Every branch and PR gets a preview URL; test those on the phone before merging.
- CI is a GitHub Actions workflow, free for this usage: `npm ci && npm run typecheck && npm test && npm run build`. Playwright runs on PRs.
- No environment variables and no secrets in v1.

## 10. Build order (each step is a PR; preview URLs once Vercel is connected, local `npm run dev` until then)

1. **Skeleton:**
   - Vite, React, TypeScript and the PWA plugin;
   - Tailwind with design.md's tokens, shadcn/ui set up, and the self-hosted fonts;
   - the tab bar, + button, theme switching and the update toast;
   - CI on GitHub Actions. Vercel comes later.
2. **Domain logic and tests:** sessions-for-date, attendance, timeline states, meals, lead days and the greeting picker, all against the real JSON at fixed clocks.
3. **Today**, all states, including evening mode and the no-class day.
4. **Dexie, marking and Attendance:** marking in place, All present with Undo, status pop-ups.
5. **Capture sheet and Tasks:** parser, tasks, club events, makeup, extra and guest sessions.
6. **More:** Daily schedule, Calendar (List and Month) and Settings, including course overrides.
7. **Backup:** export, import, persistence and the backup reminder.
8. **Polish:** the offline check, the Playwright smoke tests in both themes, Lighthouse PWA pass, and an install test on the Android phone.

## 11. Acceptance checks

**Timeline at fixed clocks** (`?now=`):
- 2026-10-14 08:00: breakfast open, MPI is the island, three Needs you items.
- 2026-10-14 13:00: OM is the island with marking buttons, lunch is open below it, breakfast is faded.
- 2026-10-14 19:30: Tomorrow (Thursday) with tonight's dinner first.
- 2026-10-20: "No classes · Dussehra".

**Attendance:** a cancelled session doesn't change `held`. With 4 absences in a full course, the screen shows "Can't miss". With 5 absences, it shows "Short by 1".

**Room override:** setting MSM's room to LR-5 from today changes today's and future MSM rows, but not past sessions.

**Capture parser:** "mac assignment 2 due fri 11pm" becomes an assignment for MAC due Friday at 23:00 that shows from Tuesday.

**Backup:** export, clear site data, import with Replace, and everything is restored.

**Updates:** after deploying a new version, the open app shows "Update available" within a reopen.

**Offline:** in airplane mode, every screen loads.

**Looks:** light and dark both match the v7 mockups, and there's no horizontal scroll at 360px width.

## 12. Leave room for v2 (don't build)

- **Web Share Target:** add the `share_target` entry to the manifest in v2, not now. Keep the capture parser behind one interface, `parse(text) → Draft`, so an AI parser can replace it.
- **AI parsing:** v2 adds one Vercel serverless function (`/api/parse`) holding the API key as an environment variable. The app works without it.
- **Sync, if it ever comes:** one-time sign-in per device. Keep record ids as UUIDs and keep `markedAt`/`createdAt`, so merging is possible.
