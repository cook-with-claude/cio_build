# V1 scope: clickable demo
_Last updated: 2026-10-26_

**Labels**
- **DECIDED**: agreed by Nadim. Build it.
- **VISION**: promised in `vision.md`, still to validate with the counselor. Build it, and keep it easy to change.
- **OPEN**: not decided. Ask Nadim before building. If it's needed for the demo, make it a setting.

## Phase
- **DECIDED (2026-10-21):** the first deliverable is a clickable demo with fake data. No login, no database, no real emails. See CLAUDE.md.

## Counselor side
1. **VISION:** open and close bookable slots **week by week**. **DECIDED (2026-10-24/26): there is no weekly template**, because her workload changes every week. « Copier la semaine précédente » replaces it: a one-off copy of last week into the empty times of the week on screen, which she can undo.
2. **VISION:** block time for her own work ("temps protégé") in one click, with no reason required. Students can never book it.
3. **VISION:** see her bookings: student name, class, and topic if the student gave one.
4. **VISION:** cancel or move a booking. The student gets an automatic, courteous message. In the demo, show the message on screen.
5. **VISION:** approval mode (on/off switch). When on, bookings become requests that she accepts or refuses. Off by default. **DECIDED (2026-10-24/26):** when the cutoff passes, any request still pending for that day is declined automatically. The student gets the usual polite refusal message, which invites them to choose another slot.
6. **VISION:** cutoff. **DECIDED (2026-10-24/26):** a day's bookings lock on the **previous school day** at an hour she chooses (setting « Heure limite la veille », default 15:00). Monday locks on Friday.
7. **DECIDED (2026-10-24/26):** slot length stays a setting (« Durée d'un créneau »), default 30 min.
   - Slots are generated inside each bookable window separately. Leftover time at the end of a window, when the length doesn't divide it evenly, is not a slot.
   - A new length only applies to weeks she hasn't prepared yet. A week that already has slots or bookings keeps its length. The setting says so: « S'applique aux semaines pas encore préparées. »
8. **DECIDED (2026-10-24/26):** her hours. The grid shows 7:30–12:00 and 12:30–15:00 every day. Lunch (12:00–12:30) shows as « Pause déjeuner » on her side: not clickable, never bookable.
9. **DECIDED (2026-10-24/26):** « Vos notifications »: she is told immediately when a student cancels after the cutoff, with the reason.
10. **DECIDED (2026-10-24/26):** « Résumé de demain »: a preview of the summary she receives at the cutoff. It lists tomorrow's confirmed bookings (time, name, class, topic), requests declined automatically, and late cancellations. In the demo, show it on screen.
11. **DECIDED (2026-10-24/26):** open slots that students can't book right now (past the cutoff, or beyond the booking horizon) show a small lock icon and a tooltip saying why.

## Student side
1. **VISION:** week view. Each day lists only the slots the student can book (« Disponible ») and their own booking; times that can't be booked are simply not listed. A short note explains empty days (« Réservations closes » / « Aucun créneau disponible ») and empty weeks, with a button to the next available slot. Never show her activities or other students' names. _(Changed 2026-10-26, approved by Nadim: previously every slot showed « Disponible » or « Indisponible ».)_
2. **VISION:** book a slot in a few clicks.
3. **OPEN:** optional topic tag. Suggested list (to be validated with her): Parcoursup, études à l'étranger, choix de spécialités, métiers, autre.
4. **VISION:** cancel their own booking before the cutoff. **DECIDED (2026-10-24/26), late cancellation:** after the cutoff and until the session starts, the student can still cancel, but must pick a reason from a dropdown with no free text: « Malade », « Contrôle ou examen », « Conflit avec un cours », « Autre ». The slot is not reopened; it becomes closed (her free time). The counselor is notified immediately with the reason.
5. **VISION:** confirmation and a reminder. The goal is to reduce no-shows, which the counselor herself named as a problem. In the demo, show them on screen. **DECIDED (2026-10-24/26):** the reminder is sent on the morning of the session at 7:00.
6. **VISION:** the app never blocks walk-ins. Coming to the office in person stays possible.

## Booking rules
- **DECIDED:** no same-day bookings.
- **DECIDED:** times are in Asia/Beirut. **(Updated 2026-10-24/26)** Bookable windows are 7:30–12:00 and 12:30–15:00, every school day (Monday–Friday). See `rules.md` for her full hours.
- **DECIDED (2026-10-24/26):** automatic messages are signed « La conseillère d'orientation ». « le bureau du CIO » stays when referring to the office.
- **OPEN:** one upcoming booking per student.
- **OPEN:** booking horizon, i.e. how many weeks ahead students can book (e.g. 2).

## NOT in V1 (don't build, even partially)
- **Google Calendar sync** (DECIDED 2026-10-21: not in V1). Her calendar is incomplete, and the sync is the hardest part.
- Real login and database (Supabase), hosting (Netlify), real emails. These are the next phase, after her feedback.
- Matching with student timetables.
- Statistics dashboard (planned later with Bklit UI).
- Counselor announcements.
- Pronote integration.
