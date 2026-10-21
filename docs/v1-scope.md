# V1 scope: clickable demo
_Last updated: 2026-10-21_

**Labels**
- **DECIDED**: agreed by Nadim. Build it.
- **VISION**: promised in `vision.md`, still to validate with the counselor. Build it, and keep it easy to change.
- **OPEN**: not decided. Ask Nadim before building. If it's needed for the demo, make it a setting.

## Phase
- **DECIDED (2026-10-21):** the first deliverable is a clickable demo with fake data. No login, no database, no real emails. See CLAUDE.md.

## Counselor side
1. **VISION:** open and close bookable slots **week by week**. There is no fixed weekly template: her workload changes from week to week.
2. **VISION:** block time for her own work ("temps protégé") in one click, with no reason required. Students can never book it.
3. **VISION:** see her bookings: student name, class, and topic if the student gave one.
4. **VISION:** cancel or move a booking. The student gets an automatic, courteous message. In the demo, show the message on screen.
5. **VISION:** approval mode (on/off switch). When on, bookings become requests that she accepts or refuses. Off by default.
6. **VISION:** cutoff. The next day's bookings lock the day before, **at an hour she chooses** (a setting).
7. **OPEN:** slot length. 30 min by default; make it a setting.

## Student side
1. **VISION:** week view. Each slot shows only « Disponible » or « Indisponible ». Never show her activities or other students' names.
2. **VISION:** book a slot in a few clicks.
3. **OPEN:** optional topic tag. Suggested list (to be validated with her): Parcoursup, études à l'étranger, choix de spécialités, métiers, autre.
4. **VISION:** cancel their own booking before the cutoff.
5. **VISION:** confirmation and a reminder. The goal is to reduce no-shows, which the counselor herself named as a problem. In the demo, show them on screen.
6. **VISION:** the app never blocks walk-ins. Coming to the office in person stays possible.

## Booking rules
- **DECIDED:** no same-day bookings.
- **DECIDED:** times are in Asia/Beirut. Bookable hours fall inside the school day, 8:00–15:30.
- **OPEN:** one upcoming booking per student.
- **OPEN:** booking horizon, i.e. how many weeks ahead students can book (e.g. 2).

## NOT in V1 (don't build, even partially)
- **Google Calendar sync** (DECIDED 2026-10-21: not in V1). Her calendar is incomplete, and the sync is the hardest part.
- Real login and database (Supabase), hosting (Netlify), real emails. These are the next phase, after her feedback.
- Matching with student timetables.
- Statistics dashboard (planned later with Bklit UI).
- Counselor announcements.
- Pronote integration.
