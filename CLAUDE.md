# Campus Companion

A personal, time-aware college companion PWA for one MDI Gurgaon PGDM student (Section D). Android first, local-only data, zero cost.

## Read first
- `docs/build-spec.md`: behaviour, data model, build order (section 10). Wins on behaviour.
- `docs/design.md`: every visual token and component. Wins on looks. Never use shadcn/ui's default look.
- `docs/quick-add-rules.md`: the + line parser rules and test table.
- Mockups v7: https://claude.ai/artifact/KB1htV4Kyd4aGiqmWkQtq6

## Commands
- `npm run dev` (open `/?now=2026-10-14T13:00` to pin the clock in IST)
- `npm run typecheck`, `npm test` (Vitest), `npm run build`
- `npm run test:e2e` (Playwright against the production build; set `PW_CHROMIUM_PATH` to use a preinstalled Chromium)

## Rules
- Zero cost: no paid services, APIs or secrets. No backend in v1.
- All time logic runs in Asia/Kolkata and reads the clock through `src/lib/clock.ts`.
- Design tokens live in `src/styles/globals.css` (light on `:root`, dark on `.dark`). Use the Tailwind names (`bg-canvas`, `text-ink-2`, `bg-island`), never raw hex in components.
- New terms and menus are data drops: add `data/timetables/<term>.json` or `data/menus/<yyyy-mm>.json` in the existing schema. No code changes.
- One PR per build step.
