# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Students** of Collège Protestant Français (Beirut), Seconde to Terminale. Almost all of them use the app on their phone, one-handed, often between classes. Their job: find a free slot with the school counselor and book it in a few taps, without walking into her office.
- **The counselor** (« la conseillère d’orientation »). She uses it on a laptop all day to open slots and manage bookings.

## Product Purpose
Let students book 25-minute orientation sessions online. Today they ask in person, which interrupts the student in session and puts off students who are not comfortable asking. Success: a student opens the app, sees free slots almost immediately and books in a few taps; the counselor gets no extra work.

## Operating Context
- Current phase: clickable demo with fake data (no login, no database), shown to the counselor for feedback. Live at https://cio-cpf.vercel.app.
- Demo-only controls (Élève/Conseillère switch, demo date, student level) exist for the presentation and are not part of the real app.
- Bookings follow fixed rules: school bell grid, cutoff 15h00 two days before, one upcoming booking, a required topic, Terminale first until the Toussaint break (`docs/rules.md`).

## Capabilities and Constraints
- Interface in French; code in English.
- Students only ever see « Disponible » / « Indisponible » plus their own booking (privacy, `docs/rules.md`).
- Stack: Vite + React + shadcn/ui + Tailwind; no new library without Nadim's approval.
- Public repo: no real people or school data, no secrets.

## Brand Commitments
- CPF school colours (blue, orange, green, yellow) and the four-colour bar under the header; Geist font; the existing calm, Apple-influenced motion (springs, bottom sheets on phones).

## Product Principles
1. The student's next step is always obvious: their booking first, then the day, then the slots.
2. Never add work for the counselor.
3. Privacy by default: show students only what they need.
4. Desktop (the counselor's tool) and phone (the students' tool) each feel native to their device.

## Accessibility & Inclusion
- Touch targets at least 44×44 px, inputs at least 16 px, respect reduced motion and the iPhone safe areas; contrast at least 4.5:1 for text.
