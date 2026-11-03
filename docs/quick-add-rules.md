# Quick-add rules (the + capture sheet)

**Status:** defaults confirmed by Kabilan on 2026-10-14.

Extends build-spec.md section 6.5 ("Capture parser"). Where this file goes further, it fills gaps; the few places it refines 6.5 are listed at the end under "Changes to build-spec 6.5". Design source of truth: design.md, Capture Sheet. Course data: data/timetable.json (Term II, Section D).

Interface stays as in build-spec section 12: `parse(text, now, ctx) → Draft`, one pure file (`/src/domain/parse.ts`) with a table of test cases built from the examples below.

## 1. What the parser produces

```ts
type TaskType = 'assignment' | 'quiz' | 'reading' | 'exam' | 'other';
type EventType = 'extra' | 'guest' | 'club';
type DraftType = TaskType | EventType;

interface Draft {
  type: DraftType;
  course?: string;          // course code, e.g. 'MAC'
  club?: string;            // club id, e.g. 'tedx'
  title: string;            // leftover text, see section 6
  due?: { date: string; time?: string };    // tasks; no time = all-day
  when?: { date: string; start?: string; end?: string }; // events
  venue?: string;           // events only
  matched: Span[];          // which characters became which field, for tests
}
```

Fields shown per type (labels from design.md):

| Type | Rows in the sheet |
|---|---|
| Assignment, Quiz, Reading, Exam, Other | Course, Due, Shows from |
| Extra class, Guest lecture | Course, When, Venue, Attendance, Clash (only if one) |
| Club event | Club, When, Venue, Clash (only if one) |

## 2. Pipeline

1. **Normalise** a lowercase copy for matching; keep the original for the title. Split into tokens on spaces; strip `, . ; !` at token edges. Remember each token's character span.
2. **Shorthand expansion** (matching copy only): `tmrw tmr tmrow 2mrw tom` → tomorrow, `tdy` → today, `nxt` → next, `eod` / `tonight` → 11:59pm of that day, `midnight` → 11:59pm of that day (students mean end of day, not 00:00 next day).
3. **Protect numbering.** A number directly after `ch`, `chapter`, `assignment`, `asgn`, `quiz`, `case`, `module`, `unit`, `part`, `no.`, `#`, `q`, `set` is part of the title, never a date or time. Mask it before chrono runs ("ch 4 mon" keeps "4").
4. **Type keywords** (section 4). First keyword in the text wins.
5. **Course** (section 3), then **club** (section 5).
6. **Date and time** with chrono-node (section 7) on the remaining unmasked text.
7. **Venue**, events only (section 8).
8. **Title** from what is left (section 6).
9. **Defaults** for anything still empty (section 9).

Every token is consumed at most once. Steps run in this order so that a course code is never mistaken for a date ("MON" is not a course; "OM" is never a date).

## 3. Course matching

### Sources
Courses come from timetable.json for the current term, plus this alias table. Aliases live in a small data file next to the timetable (`data/aliases.json`) so a new term only needs new rows.

| Code | Name | Aliases (case-insensitive) |
|---|---|---|
| MEP | Macroeconomic Environment and Policy | macro, macroeconomics, macroeconomic, macro econ, eco, econ |
| MAC | Management Accounting and Control | accounting, accounts, mgmt accounting, cost accounting |
| MSM | Management Science Models | mgmt science, management science, models |
| MPI | Marketing Practices and Implementation | marketing, mktg, mkt |
| OM | Operations Management | ops, operations |
| ODC | Organization Design & Change | org design, organisation design, organization design |
| WEC | Written Executive Communication | writing, written comm, exec comm, business writing |

The full course name also matches (punctuation and "&"/"and" ignored).

### Rules
- **Whole tokens only.** `om` matches the token "OM", never the inside of "tomorrow" or "room".
- **Section suffix is ignored:** `MAC(D)`, `mac-d`, `macd` all match MAC.
- **Longest alias first:** "mgmt accounting" is tried before "accounting"; multi-word aliases are matched on consecutive tokens.
- **Codes and short aliases (≤4 letters): exact only, no typo tolerance.** Two-letter codes are one keystroke apart (OB vs OM), so a fuzzy match would silently file things under the wrong course.
- **Typos on longer aliases and names (≥5 letters):** allow 1 edit (Damerau-Levenshtein, so swapped letters count as one), or 2 edits at ≥9 letters. Accept only if exactly one course is within range; otherwise no match. "accountng" → MAC, "marketting" → MPI, "macroeconmics" → MEP.
- **Two courses in one line:** the first one wins; the other stays in the title ("Assignment 3 MSM"). No guessing.
- **Unknown code-looking token** (2–4 letters, typed in capitals, not a course, e.g. "OB" from Term I): no course is set and the token stays in the title. The Course row then reads "Choose" in link colour. It does not block Add.
- Courses from other terms and half-term courses after the mid-term (WEC after 31 Oct) still match: he may be logging something late. Only the course picker is limited to courses running now.

## 4. Type keywords and synonyms

Matched as whole tokens, case-insensitive, plurals accepted, multi-word phrases before single words. Typos allowed (1 edit) only on keywords of 6+ letters ("assignmnet", "readnig").

| Type | Keywords |
|---|---|
| Assignment | assignment, assgn, asgn, assn, hw, homework, submission, submit, deliverable, write-up, writeup, report, memo, essay, project, ppt, deck, presentation, case analysis, case writeup |
| Quiz | quiz, quizz, qz, class test, test, viva |
| Reading | reading, read, pre-read, preread, chapter, ch, article, case (alone, meaning case prep for class) |
| Exam | exam, midterm, mid-term, mid term, mt, endterm, end-term, end term, et, final, finals |
| Extra class | extra class, extra session, makeup, make-up, make up, compensatory, comp class, rescheduled class |
| Guest lecture | guest lecture, guest session, guest talk, guest, gl |
| Club event | a club name or alias (section 5); "meeting", "meet", "event" only when no course matched |
| Cancelled | cancelled, canceled, cancel, cancellation, no class, called off |
| Other | default when nothing above matches |

- **Cancelled wins over every other keyword** ("mep guest lecture cancelled" cancels that lecture). It adds nothing: it marks an existing class cancelled, with Undo. The class is the named day's (at the typed time if one matches), else the course's next class that hasn't ended. The sheet shows Course and Class (a pick list of the next two weeks) and "Won't count toward <course>". Added 2026-10-14 at Kabilan's request.
- **First keyword wins.** "read for quiz tue" → Reading; "quiz on ch 3" → Quiz. Later keywords stay in the title.
- **Course + time + "class"/"session"/"lecture"** with no other keyword → Extra class ("MSM class sat 4pm").
- **"case" with a deliverable word** (writeup, analysis, report, memo, deck) is an Assignment; "case" alone is Reading. This is a guess about MDI usage; one tap changes it.
- **Course matched, no keyword** → Other (build-spec 6.5 default). The course is still filled.

## 5. Clubs

From Settings → Clubs. Built in: Samaritans (aliases: samaritan, sams, sam), TEDx (aliases: ted, tedxmdi). A user-added club matches its name and its name with spaces removed. A club match makes the type Club event unless a task keyword came earlier ("TEDx report fri" is an Assignment with the club ignored and "TEDx" left in the title).

## 6. Leftover text becomes the title

1. Remove every consumed span: course, club, date/time, venue (events only).
2. Keep the type keyword and any protected numbering: "assignment 2", "case writeup", "ch 4".
3. Remove connector words that only served the date or venue, when they sit next to a removed span or at either end: `due, by, on, before, till, until, for, at, @, in, the, -, :`.
4. Collapse spaces; keep his casing for every word; capitalise only the first letter.
5. **Empty title:** use the type label ("Reading", "Quiz", "Guest lecture"). For a club event with no words left, use the club name.
6. **Course is not stored in the title.** The Tasks row already shows the dot and code. Needs you shows only the title, so it renders "CODE title" (design.md example "MAC case write-up"). This keeps the title correct when the course is changed later.

## 7. Dates and times

chrono-node `en.GB.casual` (day-first, so 16/10 is 16 October), `forwardDate: true`, reference = now in IST (build-spec section 5).

- **Reject** chrono results that are only a bare number with no date or time word ("2", "4"). A bare hour is accepted only with a date word next to it ("wed 4", "fri 11").
- **Bare hours** (no am/pm): 1–7 → pm, 8–11 → am, 12 → noon. Campus hours run 08:30–21:30.
- **Weekday that is today:** today if the resulting due time (after section 9 defaults) is still ahead, otherwise the same weekday next week.
- **"next fri":** the Friday of next week (Monday-start weeks). On Tue 13 Oct, "fri" is 16 Oct and "next fri" is 23 Oct. The sheet shows the date, so a wrong reading is visible.
- **"this fri"** = the coming Friday.
- **Time only** ("11pm"): today if still ahead, else tomorrow.
- **Ranges** ("4-6pm", "4 to 6") set start and end for events.
- **"midterm" / "endterm" with no date** (Exam): due = first day of that exam window from calendar.json (2 Nov / 20 Dec for Term II), all-day. The paper's real date replaces it when known.
- **Past dates are allowed** and show as overdue, in red, as soon as they're added.

## 8. Venue (events only)

For Extra class, Guest lecture and Club event:
- Text after `in`, `at` or `@` that chrono did not take, up to the end or the next date span ("@ main gate", "in tagore hall").
- Or a room-like token anywhere: `^[a-z]{1,3}-?\d{1,3}$` (G-6, LR-3, lt2), or a known place: aud/auditorium → Auditorium, tagore (hall), mdp centre, library, mess, sac. Known places live in `data/aliases.json`.
- Title-case the result ("main gate" → "Main gate"; codes upper-case: "lr-3" → "LR-3").
- For tasks, venue words stay in the title.

## 9. Defaults when something is missing

| Missing | Rule |
|---|---|
| Type | Other |
| Course (task) | None. Row shows "Choose"; Add still works |
| Course (Extra class, Guest lecture) | Required, since it decides whose attendance counts. Row shows "Choose" in red; tapping Add focuses it |
| Due date, Reading or Quiz with a course | The next session of that course after now (regular, makeup, extra or guest; skipping cancelled, no-class days and exam weeks, via build-spec 6.1), due at its start time |
| Due date, any other task | None. The task sits in Later with no date and never enters Needs you until a date is set |
| Due time, date given, Reading or Quiz | That course's session start on that date if it meets then; otherwise all-day |
| Due time, any other task | All-day. Shown with no time; overdue from the next day |
| When, date but no time (events) | Time row shows "Choose" in red; Add focuses it, because the event needs a place on the timeline |
| When, time but no date | Today if ahead, else tomorrow |
| End time | Extra class and Guest lecture: start + 90 min. Club event: start + 60 min (build-spec 6.5) |
| Venue | Extra class and Guest lecture: the course's current room (G-6 unless overridden). Club event: empty |
| Shows from | due date − lead days (reading 1, quiz 2, assignment 3, exam 7, other 1). Shown as "Today" when that is today or earlier |

Nothing in the sheet is greyed out (design.md). "Choose" values are links, not disabled fields.

## 10. Live behaviour in the sheet

- Parse on every keystroke; it's cheap and keeps the rows live.
- **His edits stick.** Once he taps a type pill or edits a row, that field is locked and later typing never overwrites it. Typing still updates unlocked fields and the title.
- Type pills: the detected type first and filled, then the rest in fixed order: Assignment, Quiz, Reading, Exam, Extra class, Guest lecture, Club event, Other. Changing type re-applies section 9 defaults to unlocked fields.
- **Editing a saved task:** the input holds the title, every saved field starts locked, and re-parsing only fills fields that are empty.
- Clash (events): compare start–end with that day's sessions (build-spec 6.1); show "Clashes with MEP · can miss 2" in red, using that course's live can-miss.

## 11. Components

Built from shadcn/ui pieces, **restyled to design.md tokens, never left in shadcn's default look** (confirmed by Kabilan, 2026-10-13):
- **Sheet** (bottom): Card background, 18px top radius, 12px 20px padding, 22px gaps, 40% / 60% scrim.
- **Input:** 16px, no box; a 2px Spotlight Teal / Aqua underline. No default ring.
- **Type pills:** ToggleGroup items styled as Secondary Pills (Sand fill, 12px, 5px 9px, radius 9999px); selected takes the primary fill.
- **Rows:** plain label/value rows (92px label column), not shadcn Form fields. Tapping a value opens a Popover (Card, 12px radius, lift shadow) with a list (course, club, type) or a date/time picker restyled the same way.
- **Buttons:** Cancel as text in Ink; Add as the Primary Button.
- Remove shadcn's zinc greys, default borders, focus rings and shadows; use the design.md tokens in Tailwind `@theme` instead.

## 12. Worked examples

Reference now: **Tue 13 Oct 2026, 11:00 IST**. MAC meets Tue V and Fri III; MSM Wed IV and Fri IV; MPI Wed II and Fri II; ODC Tue II and Thu II; OM Mon III and Wed III; MEP Mon V and Wed V; WEC Tue III and Thu III.

| # | Typed | Type | Course / Club | Due or When | Shows from | Title | Note |
|---|---|---|---|---|---|---|---|
| 1 | OB reading fri | Reading | none ("Choose") | Fri 16 Oct, all-day | Thu 15 | OB reading | OB is a Term I code; no fuzzy match to OM |
| 2 | MAC reading fri | Reading | MAC | Fri 16 Oct 12:00 | Thu 15 | Reading | Due at Friday's MAC class |
| 3 | mac assignment 2 due fri 11pm | Assignment | MAC | Fri 16 Oct 23:00 | Today | Assignment 2 | Build-spec acceptance case |
| 4 | msm quiz | Quiz | MSM | Wed 14 Oct 14:15 | Today | Quiz | No date: next MSM class |
| 5 | ODC case writeup thu | Assignment | ODC | Thu 15 Oct, all-day | Today | Case writeup | "case" + deliverable word |
| 6 | Marketing case for wed | Reading | MPI | Wed 14 Oct 10:15 | Today | Case | Alias; "for" dropped |
| 7 | accountng quiz tmrw | Quiz | MAC | Wed 14 Oct, all-day | Today | Quiz | Typo on a long alias; MAC doesn't meet Wed |
| 8 | OM ch 4 mon | Reading | OM | Mon 19 Oct 12:00 | Sun 18 | Ch 4 | "4" protected from chrono |
| 9 | MEP quiz wed 4 | Quiz | MEP | Wed 14 Oct 16:00 | Today | Quiz | Bare hour 4 → pm |
| 10 | MSM model submission next fri | Assignment | MSM | Fri 23 Oct, all-day | Tue 20 | Model submission | "next fri" = next week |
| 11 | MEP midterm | Exam | MEP | Mon 2 Nov, all-day | Mon 26 Oct | Midterm | Window start from calendar |
| 12 | Assignment 3 MAC MSM fri | Assignment | MAC | Fri 16 Oct, all-day | Today | Assignment 3 MSM | First course wins |
| 13 | pay hostel fees by 20/10 | Other | none | Tue 20 Oct, all-day | Mon 19 | Pay hostel fees | Day-first date |
| 14 | MPI group meeting thu 6pm | Other | MPI | Thu 15 Oct 18:00 | Wed 14 | Group meeting | "meeting" with a course is not a club event |
| 15 | makeup MAC sat 2:15 | Extra class | MAC | Sat 17 Oct 14:15–15:45 | – | Extra class | Venue G-6; counts for MAC |
| 16 | guest lecture MPI thu 4pm aud | Guest lecture | MPI | Thu 15 Oct 16:00–17:30 | – | Guest lecture | Venue Auditorium; counts for MPI |
| 17 | guest lecture thu 4pm | Guest lecture | Choose (red) | Thu 15 Oct 16:00–17:30 | – | Guest lecture | Add focuses Course |
| 18 | TEDx speaker call wed 4pm | Club event | TEDx | Wed 14 Oct 16:00–17:00 | – | Speaker call | Clashes with MEP · can miss N |
| 19 | sams food drive sat 10am @ main gate | Club event | Samaritans | Sat 17 Oct 10:00–11:00 | – | Food drive | Venue Main gate |
| 20 | MSM class sat 4pm | Extra class | MSM | Sat 17 Oct 16:00–17:30 | – | Class | Course + time + "class" |
| 21 | samaritans meet | Club event | Samaritans | date and time "Choose" | – | Meet | Add focuses When |
| 22 | wec | Other | WEC | none | – | Other | Undated; sits in Later |

## 13. Sketch

```ts
export function parse(text: string, now: Date, ctx: Ctx): Draft {
  const toks = tokenize(text);                 // spans kept, lowercase copy
  expandShorthand(toks);                       // tmrw, eod, midnight…
  maskNumbering(toks);                         // "ch 4", "assignment 2"

  const type   = findType(toks);               // first keyword wins, marks span
  const course = findCourse(toks, ctx.courses, ctx.aliases); // exact codes, fuzzy ≥5
  const club   = course ? undefined : findClub(toks, ctx.clubs);

  let t = type ?? (club ? 'club' : undefined);
  if (!t && course && hasTime(toks) && hasWord(toks, ['class','session','lecture'])) t = 'extra';
  t ??= 'other';

  const dt    = findDate(toks, now);           // chrono en.GB, forwardDate, guards in §7
  const venue = isEvent(t) ? findVenue(toks, ctx.places) : undefined;
  const title = buildTitle(toks, t, club);     // §6

  return applyDefaults({ type: t, course, club, title, dt, venue }, now, ctx); // §9
}
```

## Changes to build-spec 6.5 (for the build-spec owner)

These are refinements, not contradictions; 6.5 can stay as is and point here.
1. **Course step 2:** add aliases and names with typo tolerance on 5+ letters; codes stay exact (section 3).
2. **"meeting"** counts as a club event only when no course is in the line; "MPI group meeting" is Other (section 4).
3. **Venue step 5:** also text after `in`/`at`/`@`, and only for event types (section 8).
4. **Missing due time** is all-day, except Reading and Quiz, which take the course's class start that day; Reading and Quiz with no date take the next class (section 9).
