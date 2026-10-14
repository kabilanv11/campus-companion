# Campus Companion — Style Reference
> a calm campus day, with one island for right now

**Theme:** light and dark (both first-class, follow the phone by default)

Values are taken from the v7 mockups (https://claude.ai/artifact/KB1htV4Kyd4aGiqmWkQtq6), which are the source of truth. Roles and rules come from Kabilan's design decisions. HTML examples are reconstructions, not production components.

Campus Companion is a time-aware college companion for one MDI Gurgaon PGDM student (Section D), used on a phone many times a day. It reads like a quiet printed day-planner: a cool off-white page (#f2f5f4) or near-black page (#0b0a0f), hairline rows instead of cards, and colour used only where it carries meaning. The one thing that is loud is **right now**: the class happening now or next is an inverted island (deep teal-green #0c4243 on the light page, pale teal #dcefed on the dark one), and the next meal floats directly beneath it as a soft tinted card. Everything already done fades back; everything later stays flat. Red appears only for urgency. Type is Inter with a bold, tightly tracked greeting and one serif italic line that reads the day back in plain words. Buttons are pills, corners are small, and nothing on screen states what the student already knows without the app.

## Tokens — Colors

### Light mode

| Name | Value | Token | Role |
|------|-------|-------|------|
| Spotlight Teal | `#0c4243` | `--brand` | Primary buttons, active tab pill, + button, selected segment, today marker, and the inverted "right now" island. The single chromatic commitment |
| Teal Link | `#0c6b6d` | `--link` | Text links ("‹ More", "All present" as text), venue and moved-room text |
| Canvas | `#f2f5f4` | `--canvas` | Page background. Cool off-white with a faint teal cast, so white cards read as lifted |
| Card | `#ffffff` | `--card` | Needs you card, settings fields, sheets, pop-ups |
| Ink | `#18201f` | `--ink` | Primary text, headings, course codes |
| Ink 2 | `#56605e` | `--ink-2` | Secondary text: course names, professors, rooms, field labels |
| Ink 3 | `#8e9896` | `--ink-3` | Tertiary text: section labels, times on faded rows, chevrons, column hints |
| Line | `#e0e6e5` | `--line` | 1px hairline row dividers and dashed menu dividers |
| Fill | `#e9eeed` | `--fill` | Keyboard area, quiet backgrounds |
| Sand | `#e2e9e8` | `--sand` | Secondary pill fill (unselected segments, type chips, action chips) |
| Next-meal Tint | `#d5ebe8` | `--peach` | Background of the floating next-meal card |
| Next-meal Ink | `#0b3a3b` | `--peach-ink` | Meal name and dish text on the next-meal card |
| Urgent Red | `#d23a2b` | `--urg` | Overdue, due-today, quiz tags, "Can't miss", "Short by N", clash warnings. Never decorative |
| Urgent on Island | `#ffb4ab` | `--inv-urg` | Urgent text when it sits on the teal island |
| Island Ink | `#ffffff` | `--inv-ink` | Text on the island (secondary at 74%, tertiary at 52%, dividers at 16% white) |
| No-class Amber | `#c4820f` | `--hol` | Holidays and no-class days on the calendar only |

### Dark mode

| Name | Value | Token | Role |
|------|-------|-------|------|
| Aqua | `#7fd4d0` | `--brand` / `--link` | Primary buttons, active tab, + button, selected segment, today marker, links |
| Button Ink | `#062221` | `--btn-ink` | Text on aqua buttons |
| Canvas | `#0b0a0f` | `--canvas` | Near-black with a faint violet undertone (from Midnight and Ember) |
| Card | `#17151d` | `--card` | One step above the canvas: sheets, pop-ups, fields |
| Needs Card | `#15131b` | `--needs-bg` | Needs you card, ringed with `#2a2731` |
| Ink | `#f4f2f7` | `--ink` | Primary text |
| Ink 2 | `#b4b0bd` | `--ink-2` | Secondary text |
| Ink 3 | `#75717f` | `--ink-3` | Tertiary text |
| Line | `#25222c` | `--line` | Hairlines |
| Fill | `#1b1922` | `--fill` | Quiet backgrounds |
| Sand | `#221f29` | `--sand` | Secondary pill fill |
| Island | `#dcefed` | `--inv` | The inverted "right now" class: pale teal on black |
| Island Ink | `#0b1514` | `--inv-ink` | Text on the island (72% / 50% / 12% for secondary, tertiary, dividers) |
| Urgent on Island | `#c0262d` | `--inv-urg` | Urgent text on the pale island |
| Next-meal Card | `#0f2e2e` | `--peach` | Deep teal card for the next meal |
| Next-meal Name | `#7fd4d0` | `--peach-ink` | Meal name on the dark card. Dishes stay in Ink |
| Urgent Red | `#ff6b6b` | `--urg` | Same role as light |
| Tab Pill (idle) | `#0f2e2e` | `--tab-pill` | Reserved; the active tab uses Aqua |
| No-class Amber | `#f0b44c` | `--hol` | Calendar no-class days |

### Course and club colours (fixed, not user-editable)

Used only as a 8–9px dot before a course code, a square before a club name, and the event marker on the calendar. Never as a fill behind content.

| Course | Light | Dark |
|--------|-------|------|
| OM — Operations Management | `#2f9a57` | `#4cc27a` |
| MEP — Macroeconomic Environment & Policy | `#2f6be0` | `#6a98ff` |
| ODC — Organization Design & Change | `#1394b5` | `#3dbbd9` |
| WEC — Written Executive Communication | `#b1489b` | `#db72c3` |
| MAC — Management Accounting & Control | `#0f9688` | `#36c2b1` |
| MPI — Marketing Practices & Implementation | `#d6860c` | `#f0a63a` |
| MSM — Management Science Models | `#7957d6` | `#a189ff` |
| Samaritans (club, square) | `#5f7a3a` | `#93b363` |
| TEDx (club, square) | `#e4572e` | `#ff7a55` |

Veg and non-veg marks on the menu use the Indian food-label convention: a green square with a dot (veg) and a brown-orange square with a triangle (non-veg). Sweet items take the MPI amber.

## Tokens — Typography

### Inter — Primary sans for everything except one line. Weight 400 for body, 500 for UI and buttons, 600 for emphasis and section labels, 700 for the greeting and course codes. The greeting is tracked tight (-0.035em) so it reads compact and confident. Notion's type, chosen by Kabilan from a ten-way comparison. · `--body-font`
- **Substitute:** system-ui, -apple-system, Roboto
- **Weights:** 400, 500, 600, 700
- **Sizes:** 11px, 12px, 12.5px, 13px, 13.5px, 14px, 16px, 17px, 20px, 22px, 27px
- **Line height:** 1.1 (greeting, numbers), 1.45 (body)
- **Letter spacing:** -0.035em at 27px, -0.005em on section labels, normal elsewhere
- **OpenType features:** `"tnum"` on every time, date and count
- **Role:** All UI text, headings, labels, numbers and buttons.

### Source Serif 4 Italic — The day-read line under the greeting only ("Two classes to go", "Packed Wednesday: four classes and a quiz"). A single literary voice, like Notion's sparing Lyon Text. Never used for labels or navigation. · `--serif`
- **Substitute:** Georgia italic
- **Weights:** 400 italic
- **Sizes:** 15px
- **Line height:** 1.4
- **Role:** The one-line day summary, shown only when it is true.

### Type Scale

| Role | Family | Weight | Size | Line Height | Letter Spacing | Token |
|------|--------|--------|------|-------------|----------------|-------|
| greeting | Inter | 700 | 27px | 1.1 | -0.035em | `--text-greeting` |
| page-title | Inter | 700 | 27px | 1.1 | -0.035em | `--text-title` |
| day-read | Source Serif 4 italic | 400 | 15px | 1.4 | — | `--text-dayread` |
| can-miss number | Inter | 700 | 20px | 1.1 | — | `--text-num` |
| next-meal name | Inter | 600 | 17px | 1.3 | — | `--text-meal` |
| section label | Inter | 600 | 13.5px | 1.3 | -0.005em | `--text-label` |
| body | Inter | 400 | 14px | 1.45 | — | `--text-body` |
| course code | Inter | 700 | 13.5px | 1.3 | 0.01em | `--text-code` |
| course name | Inter | 400 | 13px | 1.35 | — | `--text-name` |
| meta (professor · room) | Inter | 400 | 12.5px | 1.4 | — | `--text-meta` |
| time | Inter | 400 | 13px | 1.3 | tnum | `--text-time` |
| button / chip | Inter | 500 | 12–13px | 1 | — | `--text-button` |
| tab label | Inter | 500 | 12px | 1 | — | `--text-tab` |
| caption / hint | Inter | 400 | 12px | 1.4 | — | `--text-caption` |

## Tokens — Spacing & Shapes

**Base unit:** 4px

**Density:** compact. It's a phone app read in a corridor; rows are tight and there is no decorative padding.

### Spacing Scale

| Name | Value | Token |
|------|-------|-------|
| 4 | 4px | `--spacing-4` |
| 6 | 6px | `--spacing-6` |
| 8 | 8px | `--spacing-8` |
| 10 | 10px | `--spacing-10` |
| 12 | 12px | `--spacing-12` |
| 14 | 14px | `--spacing-14` |
| 18 | 18px | `--spacing-18` |
| 20 | 20px | `--spacing-20` |
| 22 | 22px | `--spacing-22` |
| 24 | 24px | `--spacing-24` |

### Border Radius

| Element | Value |
|---------|-------|
| island, next-meal card, Needs you card, sheets' inner fields | 12px (fields 10px) |
| pop-up list | 12px |
| bottom sheet top corners | 18px |
| buttons, chips, segments, tabs, toasts, today marker | 9999px |
| checkbox | 4px |
| phone frame (mockup only) | 24px |

### Layout

- **Screen padding:** 18px left and right
- **Section gap:** 20–24px
- **Row padding:** 10px vertical (class and meal rows), 9px (task rows)
- **Class row grid:** 42px time column · flexible content · 28px can-miss column, 8px gaps
- **Bottom bar:** 4 tabs, 8px top / 14px bottom padding, frosted with 16px blur
- **+ button:** 48px circle, 18px from the right edge, 74px from the bottom

## Components

### Greeting Header
**Role:** Replaces a plain "Today" title.

Clock in the status row (12px, Ink 2, weight 500). Greeting at 27px Inter 700, -0.035em, Ink, always the full form: "Good morning, Kabilan", never "Morning". Picked at random from a large pool for the time of day, and context lines win (festival, exam week, Friday, late night). Under it, the day-read line in 15px Source Serif 4 italic, Ink 2, shown only when it says something true ("Two classes to go"). No date, because he knows the date.

### Needs You Card
**Role:** Everything due today or overdue, at the top of Today.

Background Card (`#ffffff` / `#15131b`), inset 1px ring (`#dbe3e2` / `#2a2731`), radius 12px, padding 12px 14px. Label "Needs you" in Urgent Red at 13.5px 600. Each row: 16px checkbox (radius 4px, 1.5px border in red when urgent), task name at 14px 500, and a right-side pill (`Overdue`, `2:15`) with red text on 13% red tint, radius 9999px, padding 3px 9px, 12px 600. An "All present" row for yesterday's unmarked classes can sit at the bottom with a filled primary pill. The only card on Today besides the island and meal.

### Class Row
**Role:** One class in the day's timeline.

Grid of 42px time · content · 28px number. Time at 13px Ink 2 tabular. Content: course dot (9px, course colour) + code (13.5px 700) + course name (13px Ink 2), then a meta line "Professor full name · Room" at 12.5px Ink 2. The room is always shown; a room other than the usual G-6 is in Link colour and weight 600 so a change catches the eye. Tags like `Reading`, `Quiz` or `Guest lecture, Auditorium` join the meta line. The right column is the can-miss count at 20px 700, red at 1 or 0, replaced by "Can't miss" or "Short by N" when needed. After a class starts, Present / Absent / Cancelled pills appear under it; they disappear after one tap.

### Right-now Island (inverted class row)
**Role:** The class happening now, or the next one. Only ever one on screen.

Background `--inv` (teal `#0c4243` / pale teal `#dcefed`), text re-mapped to island ink, radius 12px, shadow `0 14px 26px -10px rgba(12,66,67,.55)` in light, a deeper black shadow plus a faint aqua glow in dark. It breaks out 10px past the column on both sides. No "Now" or "Next" label; the inversion says it. Venues on the island are underlined in island ink instead of link colour. Mark buttons on the island use 12% white (light) or 7% ink (dark) pills.

### Next-meal Card
**Role:** The only expanded meal. Tells him what's in the mess next.

Background `#d5ebe8` / `#0f2e2e`, soft lift shadow, radius 12px, joined flush under the island when they are adjacent. Bowl icon in the time column. Meal name at 17px 600 in Next-meal Ink (light) or Aqua (dark). Dishes as a single-column list, 14px, each with a veg or non-veg mark, separated by 1px dashed lines. No timings, because he knows the mess hours. Breakfast 8–10, lunch 1–2:30, snacks 5–6, dinner 8–9:30 decide which meal is "next"; after 9:30 PM it is tomorrow's breakfast.

### Collapsed Meal Row
**Role:** Meals that are not next.

Bowl icon, meal name at 14px 500 in Ink 2, chevron right. Past meals fade to 40% opacity with the rest of the past.

### Club Event Row
**Role:** Samaritans, TEDx and other clubs' events, added from +.

Same grid as a class row, with a square club marker instead of a dot and no can-miss number. If it overlaps a class, the meta line shows a red pill: "Clashes with MEP · can miss 2".

### Primary Button
**Role:** The one filled action in a view (All present, Add).

Background Spotlight Teal / Aqua, text white / `#062221`, 13px 500, radius 9999px, padding 8px 16px (sheet Add: 11px 28px).

### Secondary Pill
**Role:** Unselected segments, mark buttons, type chips, action chips.

Background Sand (`#e2e9e8` / `#221f29`), text Ink, no border, radius 9999px. Selected state takes the primary fill. Segments are separate pills with a 6px gap, never a joined bar.

### Status Value + Pop-up
**Role:** Editing a past session's attendance.

The session shows only its current value (Present / Absent / Cancelled; Absent in red). Tapping opens a small pop-up list in place: Card background, radius 12px, lift shadow, the current option marked. No edit button.

### Bottom Bar
**Role:** Today · Tasks · Attendance · More.

Frosted Canvas at 92% with 16px blur, hairline top. Labels 12px 500 in Ink 3. The active tab is a filled pill in the same colour as the + button (teal with white text in light, aqua with dark text in dark).

### + Button
**Role:** Capture from anywhere.

48px circle, Spotlight Teal / Aqua, "+" at 26px 400, soft coloured shadow. Sits above the bottom bar on every main screen.

### Capture Sheet
**Role:** Add a task, guest lecture, extra class or club event by typing one line.

Bottom sheet on a dimmed page, Card background, top radius 18px, padding 12px 20px, 22px gaps. A 16px input with a 2px teal underline. Parsed details below as label/value rows (92px label column, 13px Ink 2 labels, 13.5px 400 Ink values, 14px between rows, no dividers): Course, Due, Shows from, When, Venue, Attendance, Club, Clash. All eight types (Assignment, Quiz, Reading, Exam, Extra class, Guest lecture, Club event, Other) are small wrapping pills (12px, 5px 9px padding), each one tap away, with the detected type first and filled. Cancel (text, Ink) and Add (primary) at the bottom. Nothing in the sheet is greyed out.

### Toast with Undo
**Role:** After a bulk action (All present, ticking a task).

Ink pill floating above the bottom bar, radius 9999px, 18px side padding. Message in Canvas colour, "Undo" in bold.

### Settings Course Row
**Role:** Edit each course's professor and room.

Course dot + code + name, then "Professor · Room" in Ink 2, chevron. Tapping opens two fields in place (Card background, 1px Line ring, radius 10px, 84px label column); the active field gets a 1.5px teal ring. A 12.5px note under them: "Changes apply from today. Past sessions keep their old room." No colour pickers anywhere in Settings.

### Calendar
**Role:** Full academic calendar, List and Month views.

List: term headers (Term name 700, date range right, 2px rule under the current term), month labels in Ink 3 capitals, rows with a 3px left marker: amber for no-class days, red for exams, WEC pink for course dates. A "TODAY" line in teal marks where today falls. Past entries fade. Month: 7-column grid, weekends in Ink 3, no-class days filled with 20% amber, exam days with red tint, today a filled teal circle. A legend above: No classes (amber), Exams (red), Course (pink). Green is not used for any calendar meaning.

## Do's and Don'ts

### Do
- Keep one inverted island on screen at a time, for the class happening now or next, with the next meal floating under it
- Show every class's room; colour a room only when it differs from G-6
- Show the course code with the course name, and professors by full name, on every class row
- Use Urgent Red only for things that need action today (overdue, due, quiz, can't miss, short, clash)
- Fade what's done (past meals and classes at 40% opacity) and keep what's later flat on the canvas
- Use pills for every tappable control and 12px corners for the few cards
- Keep the active tab, + button and primary buttons in the same colour per mode
- Use amber, red and pink on the calendar; keep the app's teal only for navigation there
- Let the greeting and day-read line carry personality; keep everything else plain

### Don't
- Don't add "Now", "Next" or "Last class" labels; the island says it
- Don't use coloured left borders as highlights in the timeline
- Don't state what he knows without the app: the date, mess timings, class end times, minutes left, free gaps
- Don't add colour editing; course and club colours are fixed
- Don't grey out content in sheets or forms; only labels are a step lighter
- Don't stack cards; Today has at most three surfaces (Needs you, the island, the next meal)
- Don't use corners larger than 12px on content (18px only on the sheet's top edge)
- Don't use green for calendar meanings, and don't use red decoratively
- Don't use favourite dishes, a personal can-miss buffer, streaks, badges or quotes (all rejected)

## Surfaces

| Level | Name | Light | Dark | Purpose |
|-------|------|-------|------|---------|
| 0 | Canvas | `#f2f5f4` | `#0b0a0f` | Page. Most rows sit directly on it with hairline dividers |
| 1 | Card | `#ffffff` | `#17151d` | Needs you, sheet, fields, pop-ups |
| 1 | Next-meal | `#d5ebe8` | `#0f2e2e` | The one tinted card, floating on a soft shadow |
| 2 | Island | `#0c4243` | `#dcefed` | Inverted surface for right now; highest contrast on screen |
| — | Scrim | 40% ink | 60% black | Behind the capture sheet |

## Elevation

- **Island (light):** `0 14px 26px -10px rgba(12,66,67,.55)`
- **Island (dark):** `0 14px 28px -10px rgba(0,0,0,.8), 0 0 24px -6px rgba(127,212,208,.16)`
- **Next-meal card / pop-up (light):** `0 0 0 1px rgba(12,66,67,.05), 0 14px 22px -10px rgba(12,66,67,.22)`
- **Next-meal card / pop-up (dark):** `0 0 0 1px rgba(255,255,255,.06), 0 14px 26px -10px rgba(0,0,0,.75)`
- **+ button:** `0 8px 18px -6px rgba(12,66,67,.5)` (light), `0 8px 20px -6px rgba(127,212,208,.4)` (dark)
- **Needs you:** inset 1px ring only, no drop shadow

## Imagery

None. No photos, illustrations, mascots or gradients. The only drawn marks are small functional glyphs: course dots, club squares, a bowl outline for meals, veg / non-veg squares, checkboxes and chevrons. Colour and the island do the visual work.

## Layout

Single column, phone first (Android PWA), 18px gutters. Every main screen opens with the status clock and a large title or greeting, then sections separated by 20–24px with small sentence-case labels. Lists are hairline rows, not cards. A frosted four-tab bar is fixed at the bottom with the + button floating above it on the right. Sheets rise from the bottom over a dimmed page.

## Screens and Behaviour

### Today (one timeline)
- **Order:** greeting and day-read → Needs you → "Your day" timeline → a line to mark everything so far present → Coming up (tasks due in the next few days, upcoming holidays).
- **Timeline:** classes and meals in time order (breakfast, classes, lunch after the 12:00 class, snacks, dinner), with club events slotted in. A 1px vertical line joins the time column.
- **States:** past rows fade to 40%; the class now or next is the island; the next meal is the floating card; everything later is flat.
- **Marking:** each started class shows Present / Absent / Cancelled pills in place, gone after a tap. "All present" marks every class so far, with Undo.
- **Can miss:** shown for every class in the right column.
- **Evening:** from 6 PM (after snacks) Today switches to tomorrow, with tonight's dinner open first. After 9:30 PM the open meal is tomorrow's breakfast.
- **No-class day:** "No classes · Dussehra" style greeting, meals only, plus Coming up.

### Tasks
Title "Tasks", then sections by due date: Overdue (label in red), Today, This week, Later, and a collapsed "Done this week" row with a count. Each task row: 16px checkbox, title at 14px 500, a meta line with course dot + code (12.5px 600) and type, and the due time or day on the right (12.5px Ink 2, tabular). Overdue and today's tasks are red, with the due value as a red pill. Later tasks carry a third line in Ink 3, "On Today from Mon 26", saying when they move into Needs you. Lead times (confirmed 2026-10-12): reading 1 day before the deadline, quiz 2, assignment 3, exam 7. Ticking finishes a task with Undo; tapping opens it in the same sheet as +.

### Attendance
Opens with an Unmarked section offering All present per day and Mark all present. Then one row per course with code, name, held / attended and can miss. Each session shows only its status; tapping opens the pop-up. Counting rule: every session held counts (regular, makeup, guest lecture, extra); only cancelled ones are excluded. Totals are fixed at 20 (full term) or 10 (half term); can miss = floor(20% of total) − absences.

### More
Links to Daily schedule (classes with professors and rooms plus the full mess menu, day by day), Academic calendar (all terms, List and Month), and Settings.

### Settings
Appearance (System / Light / Dark), You (name in greetings, section), Courses (professor and room per course, editable), Clubs (Samaritans, TEDx, + Add club).

## Agent Prompt Guide

## Quick Color Reference
- text: #18201f light / #f4f2f7 dark, with Ink 2 and Ink 3 for hierarchy
- background: #f2f5f4 light / #0b0a0f dark
- card surface: #ffffff light / #17151d dark
- border: #e0e6e5 light / #25222c dark (1px hairlines)
- primary action: #0c4243 light / #7fd4d0 dark
- right-now island: #0c4243 with white text (light) / #dcefed with #0b1514 text (dark)
- next meal: #d5ebe8 (light) / #0f2e2e (dark)
- urgent: #d23a2b light / #ff6b6b dark
- calendar no-class: #c4820f light / #f0b44c dark

## Example Component Prompts

1. **Greeting header:** On #f2f5f4, a 12px "1:00" clock in #56605e, then "Good afternoon, Kabilan" at 27px Inter 700, letter-spacing -0.035em, #18201f. Below, "Two classes to go" at 15px Source Serif 4 italic, #56605e. No date.

2. **Right-now island:** A class row breaking 10px past the column on both sides. Background #0c4243, radius 12px, shadow 0 14px 26px -10px rgba(12,66,67,.55). Left column "12:00" at 13px white 74%. Content: green 9px dot, "OM" 13.5px Inter 700 white, "Operations Management" 13px white 74%; meta "Rajesh K Singh · Tagore Hall" 12.5px. Right: "3" at 20px 700 white. Under the meta, three pills (Present, Absent, Cancelled) on 12% white, 12px 500 white text, radius 9999px.

3. **Next-meal card:** Directly under the island, flush. Background #d5ebe8, radius 12px, soft lift shadow. Bowl outline in the time column. "Lunch" at 17px Inter 600 #0b3a3b. Dishes at 14px, each with a veg mark, 1px dashed #e0e6e5 dividers between them. No times.

4. **Needs you card:** Background #ffffff, inset 1px #dbe3e2 ring, radius 12px, padding 12px 14px. "Needs you" at 13.5px 600 in #d23a2b. Row: 16px red-bordered checkbox, "MAC case write-up" 14px 500 red, right pill "Overdue" in red on 13% red tint, radius 9999px.

5. **Capture sheet:** Bottom sheet, #ffffff, top radius 18px, padding 12px 20px, 22px gaps, over a 40% dim. Input "mac assignment 2 due fri 11pm" at 16px with a 2px #0c4243 underline. Rows "Course / Due / Shows from" with 92px labels at 13px #56605e and 13.5px #18201f values. Eight 12px type pills on #e2e9e8, the detected one first and filled #0c4243 with white text. Footer: "Cancel" text and an "Add" teal pill.

6. **Dark variant of any of the above:** Swap to canvas #0b0a0f, card #17151d, ink #f4f2f7, brand #7fd4d0 with #062221 button text, island #dcefed with #0b1514 text, next meal #0f2e2e with the meal name in #7fd4d0.

## Similar Brands

- **Notion** — The type: Inter with a bold, tightly tracked headline and one sparing serif voice
- **Spotlight (gallery theme)** — The inverted island for right now and the exact teal-green
- **Paper and Editorial (gallery themes)** — The off-white canvas with white cards, and the floating tinted card with soft depth
- **Storybook (gallery theme)** — The ringed Needs you card with pill-shaped urgent tags
- **Midnight and Ember (gallery themes)** — The near-black dark canvas
- **Parchment (gallery theme)** — One filled button colour per mode

## Quick Start

### CSS Custom Properties

```css
:root {
  /* Course and club colours (light) */
  --OM: #2f9a57; --MEP: #2f6be0; --ODC: #1394b5; --WEC: #b1489b;
  --MAC: #0f9688; --MPI: #d6860c; --MSM: #7957d6; --SAM: #5f7a3a; --TEDx: #e4572e;

  /* Light mode */
  --canvas: #f2f5f4;
  --card: #ffffff;
  --ink: #18201f;
  --ink-2: #56605e;
  --ink-3: #8e9896;
  --line: #e0e6e5;
  --fill: #e9eeed;
  --sand: #e2e9e8;
  --brand: #0c4243;
  --btn-ink: #ffffff;
  --link: #0c6b6d;
  --urg: #d23a2b;
  --hol: #c4820f;
  --inv: #0c4243;
  --inv-ink: #ffffff;
  --inv-ink2: rgba(255,255,255,.74);
  --inv-ink3: rgba(255,255,255,.52);
  --inv-line: rgba(255,255,255,.16);
  --inv-urg: #ffb4ab;
  --meal-bg: #d5ebe8;
  --meal-ink: #0b3a3b;
  --needs-bg: #ffffff;
  --needs-ring: #dbe3e2;
  --lift: 0 0 0 1px rgba(12,66,67,.05), 0 14px 22px -10px rgba(12,66,67,.22);
  --inv-lift: 0 14px 26px -10px rgba(12,66,67,.55);
  --fab-shadow: 0 8px 18px -6px rgba(12,66,67,.5);

  /* Typography */
  --font-sans: "Inter", system-ui, -apple-system, Roboto, sans-serif;
  --font-serif: "Source Serif 4", Georgia, serif;
  --text-greeting: 27px; --tracking-greeting: -0.035em; --weight-greeting: 700;
  --text-dayread: 15px;
  --text-num: 20px;
  --text-meal: 17px;
  --text-label: 13.5px;
  --text-body: 14px;
  --text-code: 13.5px;
  --text-name: 13px;
  --text-meta: 12.5px;
  --text-caption: 12px;

  /* Spacing and shape */
  --spacing-unit: 4px;
  --gutter: 18px;
  --section-gap: 24px;
  --row-pad: 10px;
  --radius-card: 12px;
  --radius-field: 10px;
  --radius-sheet: 18px;
  --radius-pill: 9999px;
  --radius-check: 4px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --OM: #4cc27a; --MEP: #6a98ff; --ODC: #3dbbd9; --WEC: #db72c3;
    --MAC: #36c2b1; --MPI: #f0a63a; --MSM: #a189ff; --SAM: #93b363; --TEDx: #ff7a55;
    --canvas: #0b0a0f;
    --card: #17151d;
    --ink: #f4f2f7;
    --ink-2: #b4b0bd;
    --ink-3: #75717f;
    --line: #25222c;
    --fill: #1b1922;
    --sand: #221f29;
    --brand: #7fd4d0;
    --btn-ink: #062221;
    --link: #7fd4d0;
    --urg: #ff6b6b;
    --hol: #f0b44c;
    --inv: #dcefed;
    --inv-ink: #0b1514;
    --inv-ink2: rgba(11,21,20,.72);
    --inv-ink3: rgba(11,21,20,.5);
    --inv-line: rgba(11,21,20,.12);
    --inv-urg: #c0262d;
    --meal-bg: #0f2e2e;
    --meal-ink: #7fd4d0;
    --needs-bg: #15131b;
    --needs-ring: #2a2731;
    --lift: 0 0 0 1px rgba(255,255,255,.06), 0 14px 26px -10px rgba(0,0,0,.75);
    --inv-lift: 0 14px 28px -10px rgba(0,0,0,.8), 0 0 24px -6px rgba(127,212,208,.16);
    --fab-shadow: 0 8px 20px -6px rgba(127,212,208,.4);
  }
}
```

### Tailwind v4

```css
@theme {
  --color-canvas: #f2f5f4;
  --color-card: #ffffff;
  --color-ink: #18201f;
  --color-ink-2: #56605e;
  --color-ink-3: #8e9896;
  --color-line: #e0e6e5;
  --color-sand: #e2e9e8;
  --color-brand: #0c4243;
  --color-link: #0c6b6d;
  --color-urgent: #d23a2b;
  --color-amber: #c4820f;
  --color-island: #0c4243;
  --color-meal: #d5ebe8;
  --color-meal-ink: #0b3a3b;

  --color-canvas-dark: #0b0a0f;
  --color-card-dark: #17151d;
  --color-ink-dark: #f4f2f7;
  --color-brand-dark: #7fd4d0;
  --color-island-dark: #dcefed;
  --color-meal-dark: #0f2e2e;
  --color-urgent-dark: #ff6b6b;

  --font-sans: "Inter", system-ui, sans-serif;
  --font-serif: "Source Serif 4", Georgia, serif;

  --text-greeting: 27px;
  --text-num: 20px;
  --text-meal: 17px;
  --text-label: 13.5px;
  --text-body: 14px;
  --text-meta: 12.5px;
  --text-caption: 12px;

  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-18: 18px;
  --spacing-24: 24px;

  --radius-card: 12px;
  --radius-field: 10px;
  --radius-sheet: 18px;
  --radius-full: 9999px;
}
```
