# Session log

**How to use it:** read this file at the **start** of every session. At the **end**, add a new entry at the top (newest first) and update "Current state" and "Next steps".

---

## Current state (updated 2026-11-13)

- **The clickable demo with fake data is done** and has had a first round of Nadim's own feedback (session 2). It is ready to show to the conseillère.
- **Look and feel polished** (session 4): hover/press effects, soft fades, CPF-coloured logo and favicon. The "feel" settings live at the top of `src/index.css`.
- **Run it:** `npm install` (first time only), then `npm run dev`, then open http://localhost:5173
- **Tests:** `npm test` (179 tests, Node's built-in test runner).
- **Phone layout for students** (session 14): slim header with a « Démo » sheet, booking → week → day → slots first, rules folded, browser pull-to-refresh back. Computers and tablets unchanged. Live since 13 November (branch `mobile-student-view`, merged).
- **School calendar:** `src/data/schoolCalendar.js` holds 2026-2027. **Every summer, Nadim sends the new CPF calendar and it is added there** (instructions at the top of the file).
- **Apple-style feel** (session 13): springy motion, sliding selections, week changes with direction, phone bottom sheets you can pull down, day swipe on phones, glass header. Details: `docs/apple-design-experiment.md`. On `main` (live site).
- **Dark mode** (session 10): « Thème » in the counselor's Réglages (Système / Clair / Sombre), applies to both sides for the demo. On `main` (live site).
- **Online demo:** https://cio-cpf.vercel.app (Vercel, free plan, public link). **Connected to GitHub** (session 6): every push to `main` updates the site by itself. `vercel deploy --prod` still works for a manual redeploy.
- **Repo:** https://github.com/cook-with-claude/cio_build (public). Khaled (`smoky0y`) has been invited with write access, but has not accepted yet.
- **Slots follow the school bells** (session 9), 25 minutes by default, lunch 11:55–12:25. **Confirmed by the conseillère** and merged into `main` (session 11).
- **Timetable (EDT) import** (sessions 7–8), « Bêta »: a student imports the PDF from Pronote's own export button and sees which slots fit their free time. Moved into V1 and merged into `main` (session 11).
- **Branches:** only `main` (plus Dependabot's Vite update, not reviewed yet). The experiment branches and `dark-mode` were deleted once merged.

## Next steps

1. ~~Put the demo online~~ Done: https://cio-cpf.vercel.app, updated on every push to `main` (session 6).
2. Show the demo to the conseillère and write down her feedback (here or in `docs/`).
3. Answer the open questions below.
4. Then the next phase: Supabase (database + CPF Google sign-in), hosted on Vercel. Not before her feedback.
5. EDT import: try it with a few classmates' PDFs (other classes may use another layout) and show it to the conseillère.
6. [PROPOSAL] The bell times now live in two places (`BOOKING_WINDOWS` in `src/lib/rules.js`, `PERIODS` in `src/lib/timetable.js`). Make one use the other.

## Open questions

- [PROPOSAL] Switch to the Poppins font (used on the CPF website)?
- Ask her: keep « Fermer aussi ce créneau aux autres élèves » (ticked by default) when she cancels a booking?
- Check against the paper calendar: last day of school assumed 30 June 2027; Mon 23 Nov 2026 is a normal school day (Independence Day falls on Sunday 22); the winter break starts Sat 13 Feb 2027.
- Lunar holidays (Fitr, Adha, Hégire, Achoura) may move by a day once announced: correct them in `schoolCalendar.js` when that happens.
- Student data beyond the minimum (for a future analytics platform): parked. To discuss with her and the administration before the database phase.
- For the Supabase phase: the time rules (cutoff, horizon, no same-day, holidays) and the Terminale-only rule are only checked by the screens today. The database must enforce them too.
- ~~Session 12: name of the summary? Terminale rule by booking date or session date?~~ **Answered (2026-11-05, Nadim):** « Liste définitive »; by the day the student books.
- [PROPOSAL] Keep the session 12 Playwright walkthrough as a permanent test (`npm run e2e`); adds Playwright as a dev tool (needs Nadim's OK).
- ~~Bell grid: slots on the bells? 25 minutes? Lunch 11:55–12:25?~~ **Answered (2026-11-03): yes to all three.** Still open: the pause méridienne slot at 12h50 (students eat after, today) or 13h10 (students eat first)?
- ~~EDT experiment: ask the school if reading a PDF exported with Pronote's own button is fine (rule 3)~~ **Answered (2026-10-30): the school agreed, no issue.** Still open: how Q1/Q2 behave across holidays (today: they alternate every calendar week).
- EDT experiment: should 7:30–7:45 count as free when the first period is free? (Today: no, so a 7:30 slot is never « Compatible ».)
- EDT experiment: tell her a « Compatible » slot may start up to 5 minutes before the student's class ends (e.g. 9:30–10:00 and the 9:35–10:05 recess): the student arrives up to 5 minutes late, never leaves class early. Check she's fine with it.
- ~~EDT experiment: a timetable is data beyond the `rules.md` list~~ **Answered (2026-10-30): the school sees no privacy issue** (read in the browser, never uploaded), and **it may be stored with the student's account** in the database phase, so they don't import the PDF again at each login. Added to `rules.md` (rule 2).

---

## 2026-11-13 · Session 14: student view on phones

**Who:** Nadim + Claude Code

**Goal of the session:** make the student side feel like a real phone app (375–430px): slots visible almost at once, booking with one thumb. Desktop and the counselor's view unchanged.

**Done**
- **Audit first** with `playwright-cli` emulating an iPhone 13 (390px) and 13 mini (375px): every student flow, screenshots of each state. First slot was 1.45 screens down; header 131px; an edge swipe changed the day; pull-to-refresh blocked.
- **Pull-to-refresh:** the cause was our own `overscroll-behavior-y: none` (session 12). Now only on mouse/trackpad computers (`@media (pointer: fine)`); phones get the browser's own pull-to-refresh (and, on iPhone, the page bounce that goes with it). Nadim chose this knowing a pull resets the demo's clicks.
- **Safe areas:** `viewport-fit=cover`, `px-safe` / `pt-safe` utilities (`index.css`), toasts above the home bar.
- **Day swipe:** never starts within 24px of the screen edges (iPhone back/forward), `src/lib/gestures.js` (+3 tests).
- **Phone header (both sides, 2A):** logo, title, « Démo » button (64px instead of 131px). The sheet holds Élève/Conseillère, the demo date and the level (`DemoSheet.jsx`).
- **Student order on phones:** booking (or a notice) → week on one line (« 16 – 20 novembre », `formatWeekRangeShort`, +1 test) → day strip → slots → « Comment réserver ? » folded (`BookingRulesDisclosure.jsx`) → timetable → messages. Empty week: « Prochain créneau » full width under the week.
- **Consistency:** same outlined buttons in the timetable and booking cards; the « compatibles » switch row is one 44px target; 44px ✕ on student dialogs (`largeClose` on `DialogContent`, the counselor's dialogs keep theirs).
- **`web-design-guidelines` review** of the student files; fixed: touch-action on touch screens, scroll-padding under the sticky header, `name` on the « Autre » input, overscroll contained inside phone sheets, focus ring on the fold-out.
- **Result:** first slot at 0.41 screens (390px) / 0.43 (375px); no tap target under 44px; no sideways scroll. Desktop (1280px), tablet (800px) and the counselor side compared pixel by pixel with the old code after each step: identical (see notes).
- `PRODUCT.md` added (Impeccable's design-context file, approved by Nadim). Tests: 175 → 179. Lint now runs on this PC: 0 errors.
- **Tested on Nadim's phone** via a Vercel test site for the branch (opened with a temporary secret bypass link, deleted after the merge). Before merging, the live site and the test site were compared, both as built by Vercel: 19 desktop/tablet screens pixel-identical (only the known logo noise and the 1/255 row) and the same results for every action (booking, « Autre », cancelling, the « déjà un rendez-vous » block, keyboard, Échap, counselor view). Phone flows re-checked at 375 and 390px with taps. Merged into `main` at Nadim's request.

**Decisions**
- The phone layout switches at 768px, like the day strip (`src/lib/useIsPhone.js`). Tablets keep the desktop layout.
- No bottom navigation bar: the student side is one screen with one task.
- Kept the default iPhone tap flash: the only press feedback for selects, message rows and the fold-out.

**Known issues / notes**
- Tried on Nadim's phone (liked it). Still worth a check on an Android and a second iPhone: pull-to-refresh, the edge swipe and safe areas can't be emulated.
- Pixel comparisons have two known noise spots: the logo on a browser's first render, and the striped « Temps protégé » cell (two random renderings). One unexplained 1/255 shade difference on one 26px row of the timetable dialog's button edge (desktop); invisible.
- Not fixed from the review (would change desktop): placeholder ending with « … », focus on the topic error, the segmented thumb animating width/height.
- The edge-swipe rule, pull-to-refresh and touch-action also apply to the counselor's view on phones (same gesture code, whole page).
- [PROPOSAL] A dot on « Démo » when the demo date is simulated (now hidden in the sheet on phones).

---

## 2026-11-13 · Session 13: Apple-style feel (experiment, then merged)

**Who:** Nadim + Claude Code

**Goal of the session:** try the `apple-design` skill (Apple's WWDC design talks, for the web) on the demo's look and feel, in a separate branch so the live demo stays safe; then decide.

**Done**
- Built in a separate folder and branch (`experiment/apple-design`), checked in Chrome (computer and phone sizes, light/dark, reduce motion, every gesture), then **merged into `main` and pushed at Nadim's request**. Branch and folder deleted.
- **No new library:** the springs are our own small file, `src/lib/spring.js` (+7 tests). Tests: 167 → 174 passing (plus 1 skipped).
- **Changes:** presses react instantly and settle on a spring; Élève/Conseillère, the counselor's tool picker and the phone day picker have a selection that slides; week arrows bring the new week in from the side pressed; dialogs grow out of the button that opened them; on phones, dialogs are bottom sheets you can pull down to close (a quick flick is enough); on phones, swipe left/right to change day (stretches at Monday/Friday); counselor slots give a small bounce when changed; booking confirmation check pops in; frosted-glass header; slightly softer corners and tighter big titles. No rule, text or data changed.
- Full plan, review and file map: `docs/apple-design-experiment.md`.

**Decisions**
- Kept inside the "no new library" rule: no Motion/Framer Motion.
- Sound effects not added; vibration only when a booking is made or a swipe lands on a new day (Android phones; iPhones ignore it).

**Known issues / notes**
- The phone gestures (sheet drag, day swipe) were tested with simulated touches in Chrome: **check them on a real phone** before the presentation.
- The week-change slide uses View Transitions: Chrome, Edge and Safari 18+ show it; other browsers just switch weeks.

---

## 2026-11-05 · Session 12: new cutoff, mandatory topic, Terminale first

**Who:** Nadim + Claude Code

**Goal of the session:** three changes from Nadim: bookings close 2 days before; the topic becomes mandatory (new list, « Autre » with 25 characters); Terminale only until the end of the Toussaint break.

**Done**
- **Cutoff:** a day closes at 15h00 two calendar days before; if that day is not a school day, the last school day before it (Mon/Tue → Fri, Wed → Mon, Thu → Tue, Fri → Wed; after a break, the last day before it). One function (`lockDay` in `src/lib/rules.js`) feeds the booking lock, late cancellation, auto-decline and the lock tooltips. Setting renamed « Heure limite de réservation », with the new rule in its hint; student info text updated.
- **Summary:** « Résumé de demain » became « Liste définitive » (name chosen by Nadim): sent at cutoff + 5 min, it covers every day that has just locked (Friday: Monday + Tuesday, one heading per day). Thursday has none, so the preview shows Friday's. Topics shown on each line.
- **Topic:** required, in this order: Parcoursup, UCAS, Common App, AUB, AUB early admission, Études à l’étranger, Choix de spécialités, Métiers, Autre. « Autre » opens a text box (required, 25 characters max, live counter). French error if they confirm without one. The list and checks moved to `src/lib/topics.js`; bookings get a `topicOther` field. The counselor sees « Année de césure (autre) » in the grid, booking details, requests, upcoming list and summary.
- **Terminale only until the Toussaint:** uses the break marked `toussaint: true` in `schoolCalendar.js` (no new date setting). Première/Seconde still see the slots; a message explains, and clicking a slot shows it again. Demo: « Niveau de l’élève (démo) » next to the demo date (student side only); each level acts as its own fake student (Élève Test 1, 5, 6) with no booking.
- **shadcn `input`** added with shadcn's installer (plain styled `<input>`, no new library).
- Tests: 136 → 160 (the 5 weekdays + holiday cases Nadim asked for are in `rules.test.js`). Build works. Checked in Chrome (Thursday real time, then demo dates 23 Oct, 30 Oct, 2 Nov, 6 Nov; counselor side; phone width). No console errors. Lint not run (blocked on this PC, see session 11).

**Then, after Nadim's phone test and a full review**
- **Thursday column cut off** (counselor, computer): the long « Autre » line widened the day's column past its card. Fixed in `WeekView.jsx` (`md:grid-cols-1` on each card).
- **Full review**: 16 flows clicked through with Playwright (`playwright-cli`, installed globally on Nadim's PC, not in the project), all pass, no console errors; Chrome DevTools screenshots (light, dark, phone); Lighthouse accessibility 96, best practices 100; `npm audit --omit=dev` 0.
- **Done from the review (Nadim):** `docs/rules.md` and `docs/v1-scope.md` updated (new cutoff, required topic with the 25-character « Autre » exception to « never free text », level in the stored data, Terminale rule, the summary renamed « Liste définitive »); her grid's rows now line up across the week (every cell 44 px, like a booked cell); « Autre » shows as « Année de césure (autre) »; no more bounce at the top/bottom of the page on phones (`overscroll-behavior-y: none`, which also stops pull-to-refresh) and more room under the last row.
- **Topics by level** (Nadim): Terminale sees the application topics (Parcoursup, UCAS, Common App, AUB, AUB early admission) but no « Choix de spécialités »; Première and Seconde see « Orientation universitaire » (name chosen by Nadim), Études à l’étranger (kept, Nadim), Choix de spécialités, Métiers, Autre. « SAT » added for Terminale and Première (Nadim: what most students take; IELTS/TOEFL, Lebanese universities, scholarships not added). The counselor should review the lists at the demo. One list per level in `TOPICS_BY_LEVEL` (`src/lib/topics.js`); the store refuses a topic outside the student's level. Tests: 160 → 167 (`src/lib/topics.test.js`).
- **Not done (Nadim):** shorter « Vos messages » on phones (messages will be e-mails in the real app); renaming « Annuler » in her booking window; the low-priority list.

**Decisions**
- The Terminale rule is checked **when the student books** (not on the session date): on 30 October a Première student can't book 9 November; on 2 November they can.
- In the real app, students get their messages by **e-mail** (Gmail); « Vos messages » is demo-only (the app keeps no copy, rules.md rule 2).

**Known issues / notes**
- The real clock is past the Toussaint break, so to show the Terminale rule, set the demo date back (e.g. Friday 30 October: 7 clicks on ◀).
- The page bounce can't be reproduced on a computer: check it on a phone.
- Review items left for later: « Réservations closes » on past days is too faint (contrast 2.8:1, needs 4.5:1, because the whole past-day card is faded); the real clock doesn't tick by itself (a live demo crossing 15h00 updates on the next click); « Prochain créneau » ignores the one-booking limit; the demo levels share one timetable; no "noindex" on the public demo; small dependency updates; the database must enforce the Terminale rule too.

---

## 2026-11-03 · Session 11: both experiments merged into `main`

**Who:** Nadim + Claude Code

**Done**
- The conseillère agreed to the bell grid, 25-minute sessions and lunch 11:55–12:25. The school had already approved the EDT import (2026-10-30).
- Merged `experiment/bell-grid`, then `experiment/edt-import`, into `main` (only clash: this log). 136 tests pass (1 skipped without `private-samples/`), the build works. Pushed: the live site now has both.
- Docs: « to confirm with her » removed from `rules.md` and `v1-scope.md`; timetable matching moved into V1 as « Bêta » (Nadim). Pronote integration (API, sync) stays out of V1.
- Deleted the merged branches: `dark-mode`, `experiment/bell-grid`, `experiment/edt-import` (on the computer and GitHub).
- Merged Dependabot's Vite 8.3.4 → 8.3.5 (patch, bug fixes only) and deleted its branch.
- **Counselor week view, one link per day:** « Fermer toute la journée » if the day has a free open slot, otherwise « Ouvrir toute la journée » (same actions as before). With the new `alignRows` option of `WeekView` (CSS subgrid, no library), the five day headers share one height on a computer, so the time rows line up across the week (past days, holidays and « Aujourd’hui » included). Student side unchanged. Checked in Chrome: light, dark, 1280 px, 800 px, phone.
- **Lint can't run on this computer:** Windows' Application Control blocks oxlint's native file (`@oxlint/binding-win32-arm64-msvc`, ARM64 PC). Not a code problem; `main` has the same error. To fix outside the app (Windows security setting, or run lint on another computer).
- Week-view fix pushed to `main` (live site), approved by Nadim after the screenshots; lint skipped (see above).
- Leftovers: two empty folders, `.git\worktrees\cio-trial` and `.git\worktrees\vite-trial`, that Windows wouldn't let us delete (OneDrive lock). Harmless; delete by hand.

**Next time:** get `npm run lint` working (or have Khaled run it); ask her about the pause méridienne slot (12h50 or 13h10); try the EDT import with classmates' PDFs.

---

## 2026-10-30 · Session 10: dark mode (branch `dark-mode`)

**Who:** Nadim + Claude Code

**Goal of the session:** a light/dark theme choice in the counselor's Réglages: Système, Clair, Sombre (three icon buttons, like Nadim's screenshot).

**Done**
- **Réglages → « Thème »:** Système (follows the device, the default) / Clair / Sombre. Applies at once, and is remembered in the browser after a reload (`localStorage`, key `cio-theme`).
- **Demo shortcut:** her choice also changes the student view, and the hint says so (« Pour la démo, s’applique aussi à la vue élève »). Students have no settings of their own yet.
- **Dark colours:** deep CPF navy instead of shadcn's grey default (`.dark` in `src/index.css`). Text colours are lighter tints (blue, green « Disponible », orange « Aujourd’hui »); the yellow « Demande » becomes dark gold with light text; the four-colour band and the logo keep the real CPF colours. Every text/background pair contrast-checked (lowest 4.7:1, the white « Confirmé » badge, same as in light).
- `index.html` applies the saved theme before the page draws, so a dark page never flashes white.
- Tests: 103 → 108 (`src/lib/theme.test.js`). Checked in Chrome: both sides, booking window, phone size, reload, no console errors.

**Decisions**
- Built on its own branch `dark-mode`, from `main` (not on `experiment/bell-grid`): it doesn't depend on the bells. The session 9 log entry lives on `experiment/bell-grid`.
- The choice is a display preference, so it lives in the browser, not in the demo data.

**Known issues / notes**
- Later (Supabase phase): give each user their own theme setting (students too, once they have settings/privacy), and stop the counselor's choice from changing the student side. The places to change are marked in `src/lib/theme.js`.
- Merged into `main` (live site), `experiment/bell-grid` and `experiment/edt-import`, all pushed. On the EDT branch, « À vérifier » cells use the real CPF yellow ring (`ring-cpf-yellow`): the dark gold highlight was too faint for a warning.

## 2026-10-30 · Session 9: slots that follow the school bells (branch `experiment/bell-grid`)

**Who:** Nadim + Claude Code

**Goal of the session:** her :00/:30 slots don't match the school bells (7h45, 8h40, 9h35 récré…), so a student can't book the récré without missing class. Try a grid that follows the bells, keeping « Durée d'un créneau ».

**Done**
- **On `experiment/edt-import` first:** fixed `slotFits()`. The 5-minute allowance now only applies at the start of a slot (the student arrives up to 5 min late, never leaves class early). Before, 11:30–12:00 matched a student with class at 11:55. Committed with Nadim's spec and log edits (130 tests).
- **New branch `experiment/bell-grid`, from `main`:**
  - Her day is cut at the bells (`BOOKING_WINDOWS` in `src/lib/rules.js`): 7h45–8h40, 8h40–9h35, 9h35–10h05 (récré), 10h05–11h00, 11h00–11h55, 12h25–12h50, 12h50–13h35 (pause méridienne), 13h35–14h30, 14h30–15h00. Each window holds as many back-to-back slots as fit, starting at the bell; leftover minutes before the next bell are not a slot. So no slot ever crosses a bell.
  - Her lunch moved to 11h55–12h25 (Nadim's proposal, to check with her).
  - « Durée d'un créneau » kept: 15, 20, **25 (par défaut)**, 30, 45 min. 60 was removed: no window is that long. Slots a day: 23 / 15 / **14** / 8 / 6. With 25 min: 7h45, 8h10, 8h40, 9h05, 9h35, 10h05, 10h30, 11h00, 11h25, 12h25, 12h50, 13h35, 14h00, 14h30.
  - Fake data moved onto the new grid (one booking at the récré, one at the pause méridienne).
  - Tests: 103 → 104. Checked in Chrome on both sides, including 30 min in Réglages (8 rows a day). No console errors.

**Decisions**
- Default slot length 25 minutes, shown as « 25 minutes (par défaut) » (Nadim).
- `rules.md` (her lunch, bookable times) and `v1-scope.md` (items 7, 8 and the time rule) updated for the bell grid, on this branch only, marked « to confirm with her » (Nadim approved). If she keeps :00/:30, drop the branch and the docs on `main` stay right.
- Built on its own branch, so `main` and the live site keep the :00/:30 grid until she decides.

**Known issues / notes**
- The bell times now live in two places: `BOOKING_WINDOWS` here and `PERIODS` in `timetable.js` on the EDT branch. Make one use the other when the branches meet.
- 7h30–7h45 is never bookable (school starts at 7h45), even though she is in from 7h30.

---

## 2026-10-30 · Session 8: EDT experiment, recess and lunch (branch `experiment/edt-import`)

**Who:** Nadim + Claude Code

**Goal of the session:** try the EDT experiment locally, and fix what Nadim found: the 9:30–10:00 slot was never « Compatible », even when the student is free at the morning recess.

**Why it happened:** the recess runs 9:35–10:05, but her slots start on the hour and half hour. No 30-minute slot fits inside the recess: 9:30–10:00 overlaps the 8:40–9:35 class by 5 minutes.

**What was done:**
- **5-minute overlap** (chosen by Nadim, over asking her first or adding a recess slot): a slot counts as « Compatible » if it overlaps classes by 5 minutes at most (`OVERLAP_MINUTES` in `src/lib/timetable.js`). A slot overlapping by more (e.g. 8:30–9:00 against an 8:40 class) still doesn't match.
- **Check grid:** « Récréation » (9:35–10:05) and « Pause méridienne » (12:50–13:35) are fixed rows across the week, not tappable. Lunch is now always free, every day (Nadim's choice): a student with a class at lunch can't mark it, and the PDF reader ignores that row.
- **Badge** next to « Votre emploi du temps »: « Essai » became « Bêta ».
- 2 new tests (129 in all). Committed and pushed to the branch; `main` and the live site are unchanged.

**Left open:** ask her about the 5-minute overlap (see Open questions).

---

## 2026-10-29 · Session 7: EDT import experiment (branch `experiment/edt-import`)

**Who:** Nadim + Claude Code

**Goal of the session:** build the experiment in `docs/edt-import-spec.md` on its own branch: a student uploads their Pronote timetable PDF and sees which of the counselor's slots fit their free time. `main` and the live site are untouched.

**Done**
- **Branch** `experiment/edt-import` (the spec, the code, this log, then the review fixes), pushed to GitHub. Vercel built a **preview** (https://cio-fvornxc80-synforge-corp.vercel.app, needs a Vercel login: previews are protected); the live site is unchanged.
- **Reading the PDF:** the Pronote PDF is drawn (text + coloured rectangles), not a photo. pdf.js (`pdfjs-dist` 6.4, approved by Nadim) reads it **in the browser**: nothing is uploaded. It only downloads when a student picks a file. Only the times, day names and Q1/Q2 tags are kept; every other text becomes a single point, and colours only "white" or "coloured" (`src/lib/edtPdf.js`).
- **From drawing to timetable** (`src/lib/timetable.js`): rows come from the tick marks of the time axis (Pronote draws every period the same height, and recesses as a line). A class covering part of a period makes it busy. Anything odd (misaligned box, unexplained text in a cell, two Q tags) makes the cell « À vérifier », which counts as busy; an unknown layout fails the reading.
- **Screens (student side only):** card « Votre emploi du temps » (Importer / Saisir à la main / Modifier / Retirer); a check grid, Q1 then Q2, one tap per period; nothing is used until « C'est correct ». If reading fails, the same grid starts with every period « Cours ». Then « Cette semaine, c'est une semaine Q1 ou Q2 ? »; during a break it asks about the week school starts again. Matching slots still say « Disponible », with a « Compatible » mark; the « Seulement les créneaux compatibles » switch hides the others (day notes, phone dot, week title and « Prochain créneau » follow).
- **Test data:** `src/lib/edtSampleGeometry.json`, a nameless copy of the sample's geometry, made by `node scripts/edt-fixture.mjs`. A test checks it has no words other than times, days and Q1/Q2, no text lengths and no class colours.
- **Code review** (`/code-review`, then fixes approved by Nadim): the import shows a message instead of a blank page if it can't load (offline, or after a redeploy); the week title only says « Aucun créneau compatible » when the switch really hides slots; « Saisir à la main » always starts from a blank grid; read failures are logged in the console with their reason (`[EDT]`); the cell keeps « Disponible » (as `rules.md` says) with a « Compatible » mark; the fixture was shrunk (see above) and moved next to its tests; small duplicates removed. Not done: the Q1/Q2 question in summer before next year's calendar is added (edge case); speed tweaks (not needed at this size).
- **Tests:** 103 → 127. One test reads the real PDF, only on a computer that has `private-samples/` (skipped elsewhere).
- **Checked in Chrome** (computer and phone): the real PDF reads correctly for Q1 and Q2; correction, unreadable file → manual entry, week question during the break, alternation and its correction, the switch. No console errors. `main` still runs its 103 tests.

**Decisions**
- pdf.js approved (Nadim). Q1/Q2 alternate every calendar week, holidays included, until we know better (Nadim). The spec is committed on the branch only. The « Seulement les compatibles » switch: yes; example-timetable button: no.
- Before 7:45 counts as not free (the school day starts at 7:45), so a 7:30 slot is never « Compatible ». Kept as is after the review; the student is not told yet. Lunch (12:50–13:35) is free unless the student marks a class there.

**Known issues / notes**
- **Not mergeable as is:** `v1-scope.md` lists "matching with student timetables" and "Pronote integration" as NOT in V1. Merging needs a scope decision first.
- **To check with the school:** that reading a PDF exported with Pronote's own button is fine (we use no API, no scraping, no reverse engineering: rule 3), and how Q1/Q2 behave across holidays.
- **Privacy:** a timetable is data beyond the list in `rules.md`. Here it stays in the browser and disappears on reload. Storing it in the database phase would need a decision.
- Only tested on one real PDF. Other classes' PDFs (other periods, Saturday classes, two pages) may fail to read; they then fall back to manual entry.
- The main JS file is now 509.9 kB (was 496.6 kB). Vite prints its "over 500 kB" hint. Harmless; pdf.js itself is in separate files.
- pdf.js brings `@napi-rs/canvas` as an optional package for Node only; it is not part of the website.

## 2026-10-28 · Session 6: school calendar, phone dots, decisions

**Who:** Nadim + Claude Code

**Goal of the session:** connect Vercel to GitHub, fix the privacy wording in `rules.md`, settle the open questions, add school holidays and the phone day-picker dot.

**Done**
- **School calendar:** new file `src/data/schoolCalendar.js` with the official 2026-2027 CPF calendar (from Nadim's photo). Holidays and breaks are not school days: nothing can be opened or booked on them, « Copier la semaine précédente » skips them, and the cutoff falls on the last school day before (e.g. Monday 2 November locks on Friday 23 October). Both sides show the holiday's name instead of slots.
- **Phone dot:** in the student's day picker, a small green dot marks days with a slot they can book.
- **Docs:** `rules.md` privacy line reworded to match the student view; holidays added to the time rules. `v1-scope.md`: one booking per student and the 2-week horizon are now DECIDED; holidays and the dot added.
- **Tests:** 90 → 103. The older rule tests moved two weeks later (to 9 Nov–15 Dec 2026), because their dates now fall in the mid-term break.
- **Vercel ↔ GitHub:** this folder is linked to the project (`vercel link`). `vercel git connect` failed from the terminal, so Claude connected `cook-with-claude/cio_build` from the Vercel dashboard in Nadim's Chrome (Settings → Git → GitHub → Connect). The Vercel GitHub app was already installed with access to all repos; nothing was changed on GitHub. Production branch: `main`.
- Checked in Chrome: the holiday week (both sides), the dots (phone size).
- **Git:** 2 commits (`d559881` code, `0b156ff` log) pushed to `main`. The push triggered the first automatic Vercel deploy (Ready in 11 s); the live site serves the new build.

**Decisions**
- One upcoming booking per student; 2-week horizon (Nadim).
- « Résumé de demain » at 15:05 stays as is (Nadim).
- If next year's calendar hasn't been added, weekdays count as school days, so the app keeps working (only holidays go unprotected). The summer between two listed years is a holiday.
- Lunar holidays are marked `lunar: true` in the file, since their date may move.

**Known issues / notes**
- `vercel link` created `.env.local` (a Vercel token) and added `.vercel` and `.env*` to `.gitignore`. Both stay out of git; `!.env.example` was added so the example file can still be committed.
- The school calendar is real school data in a public repo. It is the calendar sent to every family, with no personal data in it.
- `docs/edt-import-spec.md` is in the folder but not committed (not written in this session; Nadim to decide if it goes in the public repo).
- The Vercel GitHub app can see all of Nadim's GitHub repos; it only needs `cio_build`. Left as is (other Vercel projects may use it). Narrow it in GitHub → Settings → Applications → Vercel if wanted.

## 2026-10-26 · Session 5: hosting moved from Netlify to Vercel

**Who:** Nadim + Claude Code

**Goal of the session:** take the demo off Netlify and put it on Vercel instead.

**Done**
- **Vercel:** created the project `cio-cpf` (team "Synforge corp", free plan) and deployed `main`. Live at https://cio-cpf.vercel.app (checked: loads, public, no login needed).
- **Netlify:** deleted the `cio-cpf` site; https://cio-cpf.netlify.app now returns "not found". Removed the leftover local `.netlify` folder.
- 90 tests pass before deploying.

**Decisions**
- Hosting is **Vercel**, not Netlify (Nadim's call).

**Known issues / notes**
- `CLAUDE.md` (Stack) and `docs/v1-scope.md` now say Vercel instead of Netlify (approved by Nadim).
- Vercel is not linked to GitHub, so a push does not update the site. Redeploy with `vercel deploy --prod`, or connect it with `vercel git connect` [PROPOSAL].
- The Netlify CLI on this PC is still linked to another project (`the-goal-zone-kits`). Harmless here.

## 2026-10-26 · Session 4: how the site feels (hover, press, motion)

**Who:** Nadim + Claude Code

**Goal of the session:** make the demo feel more alive and polished, without changing colours, font, layout or wording.

**Done**
- **Hover:** buttons grow slightly (×1.03) and their colour gets a little deeper (blue and orange darken, never fade). The week's slots grow more gently (×1.02) with a shadow and a stronger border.
- **Press:** everything clickable sinks a little (×0.97) while pressed, phones included.
- **Joined switches** (Élève / Conseillère, Ouvrir aux élèves / Temps protégé, phone day picker): colour fade and press only, no growing (they would overlap).
- **Fades:** the calendar fades in when the week or the role changes.
- **Pop-ups:** dialogs, the side panel, menus and tooltips open more softly (0.2–0.3 s) and close faster than they open.
- **Header:** a soft shadow appears once the page is scrolled.
- **New logo:** a calendar with a check mark; its top band uses the four CPF colours, the outline is CPF logo blue, the check is CPF green. Shown on a white tile in the header (`src/components/Logo.jsx`).
- **New favicon:** the same drawing without the tile, cropped tight (`public/favicon.svg`). It replaces Vite's default purple lightning bolt.
- **Checked in Chrome** (computer and phone sizes): Lighthouse accessibility 100, best practices 100. 90 tests pass; lint unchanged (the same 3 shadcn warnings).
- **Git:** 2 commits (code, then this log), pushed to `main`.

**Decisions**
- All "feel" numbers live in one place: the `press`, `lift`, `lift-sm` utilities and `--ease-snappy` in `src/index.css`.
- Hover tones are `--primary-hover` and `--cpf-orange-hover` (the same CPF colours, a bit darker).
- **Hover effects switch on when a mouse or trackpad moves** (`main.jsx` adds `has-mouse`; the `hover` variant in `index.css`). Nadim's touchscreen laptop tells Chrome it has *no* mouse, so Tailwind's usual check hid every hover effect there, old ones included. Phones never send mouse moves, so they don't get "stuck" hovers.
- People who ask their device for less motion get no growing, sliding or fading.

**Known issues / notes**
- Dialogs that the app removes as soon as they close (e.g. « Résumé de demain », « Aperçu du rappel ») close instantly, without their exit animation. This was already the case; fine for the demo.

## 2026-10-26 · Session 3: her hours, new cutoff, late cancellation

**Who:** Nadim + Claude Code

**Goal of the session:** a briefing of everything built (for Nadim's Claude Chat project), two UI fixes, then the decisions of 2026-10-24/26 (10 items).

**Done**
- **UI fixes:** « Aujourd'hui » no longer overlaps the day links. « Prochains rendez-vous » is now an orange button (where the intro sentence was) that opens the full list (full screen on phones). The two intro sentences are removed.
- **Docs:** `rules.md` (hours, cutoff, late-cancel reason in the privacy list) and `v1-scope.md` (all 10 decisions, including "no weekly template").
- **Her hours:** 7:30–12:00 and 12:30–15:00; « Pause déjeuner » row on her side only.
- **Slot length:** a prepared week keeps its length; the partial-cell bug is gone.
- **Cutoff:** 15:00 on the previous school day (Monday locks on Friday).
- **Late cancellation** with a reason; « Vos notifications » on her side.
- **Auto-decline** of unanswered requests at the cutoff; « Résumé de demain » preview; reminder at 7:00 on the morning of the session; lock icon + tooltip on open slots students can't book yet; messages signed « La conseillère d'orientation ».
- **Tests:** 63 → 89, all passing. Every flow was checked in Chrome (computer and phone sizes).
- **Lint:** `npm run lint` now runs on Nadim's PC: 0 errors, 3 warnings, all in shadcn's generated files (`badge`, `button`, `toggle`).
- **After the push (Nadim's answers):** « Résumé de demain » is sent at 15:05 (cutoff + 5 min, in `rules.js`), after the automatic declines. The automatic decline has its own message (`autoDeclinedMessage`), about the timing, not her refusal. 90 tests.

**Decisions**
- Tooltip added with shadcn's own installer (`npx shadcn add tooltip`). It is built on `radix-ui`, already installed, so no new library.
- The hour constants moved from `dates.js` to `rules.js` (all rules in one place).
- Messages to students and to her are separate functions in `messages.js`; the automatic decline never reuses her refusal text.

**Known issues / notes**
- **A blinking text cursor in plain text** is the browser's "caret browsing" mode (toggled by F7, or `chrome://settings/accessibility`), not the app or localhost: the page has no editable text. Nadim chose not to hide it from inside the app, since that would override an accessibility setting.
- **The briefing for Nadim's Claude Chat project** (everything built + where the rules were bent) is a local file outside the repo, kept up to date through the end of session 3.
- **The Windows Smart App Control note from session 1 no longer applies:** lint runs.

**Where things are (new)**
- Her hours, slot rows, per-week slot length, cancellation rule, reminder time, « Résumé de demain » timing: `src/lib/rules.js`
- Shared message list (« Vos messages » / « Vos notifications »): `src/components/MessageList.jsx`
- Top of the counselor side (orange button + « Résumé de demain »): `src/components/counselor/CounselorShortcuts.jsx`

## 2026-10-26 · Session 2: Nadim's walkthrough and feedback round 1

**Who:** Nadim + Claude Code

**Goal of the session:** Nadim clicked through the demo himself in Chrome and gave feedback; then Claude reviewed its own work and Nadim approved the whole improvement list.

**Done**
- **Investigated a suspected cutoff bug:** not a bug. Nadim had booked the Tuesday of the *following* week. The rule was right but invisible, which led to the changes below.
- **Student side:** day headers say « Réservations closes » or « Aucun créneau disponible »; the week title says « Aucun créneau disponible cette semaine » with a « Prochain créneau : … » button; each day lists only bookable slots; on phones the day picker opens on the first day with a slot; clearer wording for the cutoff and for a locked booking.
- **Counselor side:** « Ouvrir toute la journée » / « Fermer toute la journée »; « Copier la semaine précédente » (fills empty times only) with « Annuler »; « Prochains rendez-vous » list; toolbar fixed on phones.
- **Fake data:** slots on the next two school days, so the 17h00 rule can be shown without changing weeks.
- **Tests recreated:** the 15 tests mentioned in session 1 had never been committed. There are now 63 (`npm test`), covering rules, dates, the store, the student view and the fake data.
- `CLAUDE.md`: stack line now says shadcn/ui + Tailwind; added how to run the tests.
- `docs/v1-scope.md`: student item 1 updated to match the new student view (approved by Nadim).
- **Git:** 9 commits, `7b9f139` → this log update. The first 7 were pushed during the session; if `git status` says "ahead", run `git push`.

**Decisions**
- Talk with Nadim in **English** from now on (the interface stays in French).
- Privacy: day and week notes are derived only from what the cells already show, so they reveal nothing extra (a locked day says « Réservations closes » even when she opened nothing).
- « Indisponible » is not reused in headers (to avoid confusion with a slot); « Aucun créneau disponible » instead.

**Known issues / notes**
- The demo server may still be running from a previous session on port 5173; `npm run dev` then fails with "Port 5173 is already in use". Just open http://localhost:5173.

**Where things are (new)**
- What the student sees (cells, day/week notes, next slot): `src/components/student/availability.js`
- Tests: `*.test.js` next to the code; `test/setup.js` teaches Node the `@/` imports

## 2026-10-21 · Session 1: from empty folder to full demo

**Who:** Nadim + Claude Code

**Done**
- **GitHub repo:** created and made public, with docs pushed.
- **Security (GitHub):** CodeQL on every push, Dependabot alerts and fixes, secret scanning with push protection, private vulnerability reporting, and a "Protect main" rule (no deleting main, no force-push).
- **Step 1, foundation:** Vite + React + shadcn/ui (Tailwind); role switch Élève / Conseillère; week view Mon–Fri 8h00–15h30 in Beirut time; one day at a time on phones.
- **Step 2, counselor:** opens/closes slots and « Temps protégé » in 1 click; settings for slot length, cutoff time and approval mode.
- **CPF colours:** applied and contrast-checked, with a four-colour band under the header.
- **Step 3, student:** sees only Disponible / Indisponible; books with an optional topic; one upcoming booking at a time; cancels before the cutoff; sees the confirmation on screen.
- **Step 4, connected:** the counselor sees name/class/topic, accepts or refuses requests, cancels or moves bookings, and every action shows the courteous message to the student; reminder preview; « Vos messages » list for the student; « Date de la démo » control to show the rules live.
- **Tested in Chrome** (computer and phone sizes): Lighthouse accessibility 100, best practices 100; 15 rule tests pass (`src/lib/rules.js`). _(Session 2: these test files were never committed; recreated then.)_

**Decisions**
- Repo is **public** (for free CodeQL). Never put real student data or secrets in it.
- Defaults: 30-min slots, cutoff 17h00 the day before, approval mode off, 2 weeks ahead, 1 upcoming booking per student, optional topic.
- shadcn/ui + Tailwind approved for all components.
- The demo-date control was approved.

**Known issues / notes**
- The automatic code checker (`npm run lint`) is blocked on Nadim's PC by a Windows security feature (Smart App Control). It doesn't affect the app.
- Dependabot shows 1 alert. It's only in the shadcn developer tool, not in the website (`npm audit --omit=dev` = 0). Its weekly "GitHub Actions" check also fails, because there are no workflows yet. That's harmless and can be removed from `.github/dependabot.yml`.
- If you change the slot length after opening slots, a cell can hide part of a slot. It's unlikely to matter.

**Where things are**
- All fake data: `src/data/mockData.js`
- Every change to the data goes through one place: `src/state/useDemoStore.js`
- Booking rules: `src/lib/rules.js`
- Message texts: `src/lib/messages.js`
- Screens: `src/components/student/`, `src/components/counselor/`

---

<!-- Template for the next entry (copy it above the previous one):

## YYYY-MM-DD · Session N: title

**Who:**

**Goal of the session:**

**Done**
-

**Decisions**
-

**Known issues / notes**
-

-->
