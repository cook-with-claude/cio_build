# Session log

**How to use it:** read this file at the **start** of every session. At the **end**, add a new entry at the top (newest first) and update "Current state" and "Next steps".

---

## Current state (updated 2026-10-21)

- **The clickable demo with fake data is done** (V1 scope, steps 1–4). It is ready to show to the conseillère.
- **Run it:** `npm install` (first time only), then `npm run dev`, then open http://localhost:5173
- **Repo:** https://github.com/cook-with-claude/cio_build (public). Khaled (`smoky0y`) has been invited with write access, but has not accepted yet.

## Next steps

1. Decide: present from a laptop, or put the demo online (Netlify, free) and share a link?
2. Show the demo to the conseillère and write down her feedback (here or in `docs/`).
3. Answer the open questions below.
4. Then the next phase: Supabase (database + CPF Google sign-in) and Netlify. Not before her feedback.

## Open questions

- [PROPOSAL] « Copier la semaine précédente » button (whole week in 1 click)?
- [PROPOSAL] « Ouvrir toute la journée » button on each day?
- [PROPOSAL] Switch to the Poppins font (used on the CPF website)?
- Update `CLAUDE.md`: the stack is now Vite + React + **shadcn/ui + Tailwind** (approved by Nadim).
- Ask her: should Monday's slots lock on **Friday** instead of Sunday? (Kept Sunday for now, as in the docs.)
- Ask her: keep « Fermer aussi ce créneau » (ticked by default) when she cancels a booking?
- Student data beyond the minimum (for a future analytics platform): parked. To discuss with her and the administration before the database phase.

---

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
- **Tested in Chrome** (computer and phone sizes): Lighthouse accessibility 100, best practices 100; 15 rule tests pass (`src/lib/rules.js`).

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
