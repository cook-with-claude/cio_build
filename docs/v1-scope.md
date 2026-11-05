# V1 scope: clickable demo
_Last updated: 2026-11-05_

**Labels**
- **DECIDED**: agreed by Nadim. Build it.
- **VISION**: promised in `vision.md`, still to validate with the counselor. Build it, and keep it easy to change.
- **OPEN**: not decided. Ask Nadim before building. If it's needed for the demo, make it a setting.

## Phase
- **DECIDED (2026-10-21):** the first deliverable is a clickable demo with fake data. No login, no database, no real emails. See CLAUDE.md.

## Counselor side
1. **VISION:** open and close bookable slots **week by week**. **DECIDED (2026-10-24/26): there is no weekly template**, because her workload changes every week. « Copier la semaine précédente » replaces it: a one-off copy of last week into the empty times of the week on screen, which she can undo.
2. **VISION:** block time for her own work ("temps protégé") in one click, with no reason required. Students can never book it.
3. **VISION:** see her bookings: student name, class, and topic. **DECIDED (2026-11-05):** with « Autre », she also sees the student's few words.
4. **VISION:** cancel or move a booking. The student gets an automatic, courteous message. In the demo, show the message on screen.
5. **VISION:** approval mode (on/off switch). When on, bookings become requests that she accepts or refuses. Off by default. **DECIDED (2026-10-24/26):** when the cutoff passes, any request still pending for that day is declined automatically. The student gets a polite message worded around the timing, not as her refusal (« n'a pas pu être validée à temps : les réservations pour ce jour sont maintenant closes »), which invites them to choose another slot. _(Reworded 2026-10-26, Nadim.)_
6. **VISION:** cutoff. **DECIDED (2026-11-05):** a day's bookings close **2 calendar days before**, at an hour she chooses (setting « Heure limite de réservation », default 15:00). If that day is not a school day, they close on the last school day before it: Monday and Tuesday → Friday, Wednesday → Monday, Thursday → Tuesday, Friday → Wednesday. _(Was the previous school day, decided 2026-10-24/26.)_
7. **DECIDED (2026-10-24/26):** slot length stays a setting (« Durée d'un créneau »), default 30 min. **Updated 2026-10-30 (Nadim, bell grid; confirmed by her 2026-11-03):** 15/20/25/30/45 min, default 25 min, shown « (par défaut) ».
   - Slots are generated inside each bookable window separately. Leftover time at the end of a window, when the length doesn't divide it evenly, is not a slot.
   - A new length only applies to weeks she hasn't prepared yet. A week that already has slots or bookings keeps its length. The setting says so: « S'applique aux semaines pas encore préparées. »
8. **DECIDED (2026-10-24/26):** her hours. The grid shows 7:30–12:00 and 12:30–15:00 every day. **Updated 2026-10-30 (Nadim, bell grid; confirmed by her 2026-11-03):** the grid follows the school bells, 7:45–15:00, and lunch is 11:55–12:25. Lunch shows as « Pause déjeuner » on her side: not clickable, never bookable.
9. **DECIDED (2026-10-24/26):** « Vos notifications »: she is told immediately when a student cancels after the cutoff, with the reason.
10. **DECIDED (2026-10-24/26):** « Liste définitive » _(was « Résumé de demain »; renamed 2026-11-05 by Nadim)_: a preview of the summary she receives **5 minutes after the cutoff (15:05 by default)**, once requests are declined automatically. _(15:05 decided 2026-10-26, Nadim.)_ **DECIDED (2026-11-05):** it covers every day that has just closed (on Friday: Monday and Tuesday; on Thursday nothing closes, so no summary). For each day: confirmed bookings (time, name, class, topic), requests declined automatically, and late cancellations. In the demo, show it on screen.
11. **DECIDED (2026-10-24/26):** open slots that students can't book right now (past the cutoff, or beyond the booking horizon) show a small lock icon and a tooltip saying why.

## Student side
1. **VISION:** week view. Each day lists only the slots the student can book (« Disponible ») and their own booking; times that can't be booked are simply not listed. A short note explains empty days (« Réservations closes » / « Aucun créneau disponible ») and empty weeks, with a button to the next available slot. Never show her activities or other students' names. _(Changed 2026-10-26, approved by Nadim: previously every slot showed « Disponible » or « Indisponible ».)_ **DECIDED (2026-10-28):** on phones, a small dot under a day in the day picker marks days with a slot the student can book. Holidays show their name instead of slots.
2. **VISION:** book a slot in a few clicks.
3. **DECIDED (2026-11-05):** the topic is **required**, and the list **depends on the student's level**, in this order:
   - **Terminale** (they apply to universities, and have already chosen their spécialités): Parcoursup, UCAS, Common App, AUB, AUB early admission, SAT, Études à l’étranger, Métiers, Autre.
   - **Première** (they don't apply yet, but can talk about universities, majors and careers; many take the SAT): Orientation universitaire, SAT, Études à l’étranger, Choix de spécialités, Métiers, Autre.
   - **Seconde**: Orientation universitaire, Études à l’étranger, Choix de spécialités, Métiers, Autre.

   With « Autre », a short text is required (25 characters max, live counter). A clear French error if they try to confirm without a topic.
4. **VISION:** cancel their own booking before the cutoff. **DECIDED (2026-10-24/26), late cancellation:** after the cutoff and until the session starts, the student can still cancel, but must pick a reason from a dropdown with no free text: « Malade », « Contrôle ou examen », « Conflit avec un cours », « Autre ». The slot is not reopened; it becomes closed (her free time). The counselor is notified immediately with the reason.
5. **VISION:** confirmation and a reminder. The goal is to reduce no-shows, which the counselor herself named as a problem. In the demo, show them on screen. **DECIDED (2026-10-24/26):** the reminder is sent on the morning of the session at 7:00.
6. **VISION:** the app never blocks walk-ins. Coming to the office in person stays possible.
7. **DECIDED (2026-11-03, Nadim), « Bêta »:** timetable matching. The student imports the PDF from Pronote's own export button (or fills the grid by hand), checks it, and slots that fit their free time get a « Compatible » mark, with a « Seulement les créneaux compatibles » switch. The PDF is read in the browser, never uploaded; only class / no class per period is kept (see `rules.md`, rule 2). Approved by the school 2026-10-30.

## Booking rules
- **DECIDED:** no same-day bookings.
- **DECIDED:** times are in Asia/Beirut. **(Updated 2026-10-24/26)** Bookable windows follow the school bells, 7:45–15:00, every school day (Monday–Friday) (bell grid, 2026-10-30). See `rules.md` for her full hours.
- **DECIDED (2026-10-24/26):** automatic messages are signed « La conseillère d'orientation ». « le bureau du CIO » stays when referring to the office.
- **DECIDED (2026-10-28):** one upcoming booking per student.
- **DECIDED (2026-10-28):** booking horizon of 2 weeks ahead.
- **DECIDED (2026-11-05):** from the start of the school year until the end of the Toussaint break (from the school calendar), only Terminale students can book; then Première and Seconde too. Checked on the day the student books. Première and Seconde students still see the slots, with a kind message. The level comes from the school roster; in the demo, a « Niveau de l’élève (démo) » selector.
- **DECIDED (2026-10-28):** school holidays and breaks come from the official CPF calendar, kept in `src/data/schoolCalendar.js` and updated every year. Nothing can be opened or booked on them; she can still close a slot that was set before.

## NOT in V1 (don't build, even partially)
- **Google Calendar sync** (DECIDED 2026-10-21: not in V1). Her calendar is incomplete, and the sync is the hardest part.
- Real login and database (Supabase), hosting the real app (Vercel; the demo is already there), real emails. These are the next phase, after her feedback.
- Statistics dashboard (planned later with Bklit UI).
- Counselor announcements.
- Pronote integration (API, sync, automatic import). The PDF the student exports themselves is fine (see student side, item 7).
