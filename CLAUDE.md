# CIO Booking — briefing for Claude Code

## What this is
A web app that lets students at Collège Protestant Français (CPF, Beirut) book orientation sessions with the school counselor ("la conseillère d'orientation") online. Today, students walk into her office to ask for a slot. This interrupts the student who is in session, and some students are not comfortable asking in person.

Read these before starting any feature:
- `docs/session-log.md`: where we left off, open questions, next steps. Read it at the start of every session; add an entry at the end.
- `docs/vision.md`: the product vision (in French, as presented to the counselor)
- `docs/v1-scope.md`: what to build now, and what NOT to build
- `docs/rules.md`: hard rules (privacy, golden rule, time, Pronote)

## Who you're working with
- **Nadim** (project lead) and **Khaled**, two Terminale students.
- **Nadim is not a developer.** Explain every technical choice in plain language, with a short analogy and the technical term in brackets.
- **Terminal commands: one per code block. Never chain them.** Say what each command does and what a successful result looks like.
- Nadim often dictates by voice. Common mis-transcriptions: "CEO" = CIO, "Prenote"/"Preneur" = Pronote, "Khalid" = Khaled, "BK Lit UI" = Bklit UI.

## Current phase: clickable demo with fake data
- **Goal:** a demo to show the counselor and collect her feedback. It is not production.
- **None of these:** login, database, backend, Google APIs, real emails.
- **Fake data:** all of it lives in ONE mock-data file, so it can later be swapped for a real database. In-memory state that resets on reload is fine.
- **Both sides of the app:** the student view and the counselor view. Use a visible switch ("Voir en tant que : élève / conseillère") instead of a login.
- **Keep it easy to change.** Her feedback will reshape it, so keep screens and data shapes simple. Don't over-engineer.

## Stack
- **Vite + React + shadcn/ui + Tailwind** (shadcn/ui and Tailwind approved by Nadim, 2026-10-21). Ask Nadim before adding any other library (UI kit, CSS framework, date library, etc.), and explain the trade-off.
- **Tests:** `npm test` runs Node's built-in test runner (no extra library). Test files sit next to the code (`*.test.js`). Run them after every change.
- **Later phases, not now:** Supabase (database + Google sign-in restricted to the CPF school domain) and Netlify (hosting).
- Don't rely on memory for library versions or compatibility. Check the current docs.
- **The folder already contains `CLAUDE.md` and `docs/`.** When you scaffold the Vite app, never delete or overwrite them. If a tool asks to "remove existing files", choose the option that keeps them.

## How to work
- **Small steps,** each one testable in the browser. After each step, tell Nadim exactly what to open and click to check that it worked.
- **Ask first** before you add a dependency, change anything in `docs/rules.md`, or build anything not listed in `docs/v1-scope.md`.
- **Mark your own ideas as proposals,** labelled "[PROPOSAL]", instead of just building them.
- **Push back** if a request breaks a rule or adds work for the counselor. Say why.
- If the code and the docs disagree, flag it. Don't edit `docs/` unless Nadim asks.
- **Language:** the interface is in French. Code, comments and commit messages are in English.

## This repo is PUBLIC
- **No real people in the code.** No real student names, emails, classes or school data, mock data included. Use obviously fake names (e.g. "Élève Test 1").
- **No secrets.** No keys or tokens in the code. `.env` files must be gitignored. Commit only `.env.example`.
