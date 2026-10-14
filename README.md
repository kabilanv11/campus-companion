# Campus Companion

Your day at MDI in one place: classes, the mess menu, tasks, attendance and tomorrow's briefing. An installable PWA for Android that works offline and keeps all data on the phone.

```
npm install
npm run dev
```

See `CLAUDE.md` for how the project is organised and `docs/` for the spec and design.

## Deploy (Vercel Hobby, free)

1. On vercel.com, sign in with GitHub, choose **Add New › Project** and import `campus-companion`.
2. Framework preset **Vite**, build `npm run build`, output `dist`. No environment variables.
3. `main` deploys to production; every branch and PR gets a preview URL.

## Install on the phone

1. Open the production URL in Chrome on Android and choose **Add to Home screen › Install**.
2. Open it once with data on, then turn on airplane mode: every screen should still load.
3. In **More › Settings › Backup**, tap **Export** and save the file somewhere safe.
4. After the next deploy, reopen the app: it should show "Update available · Reload".

Preview builds accept `?now=2026-10-14T13:00` to pin the clock and `?demo=1` for sample data. Production ignores both.
