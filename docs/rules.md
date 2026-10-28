# Hard rules
_Last updated: 2026-10-28. Ask Nadim before changing or bending any of these._

1. **Golden rule.** The app must add zero work or friction for the counselor or the administration. Her side must take seconds, not minutes. If a feature adds work for her, say so before building it.
2. **Privacy: the users are minors.**
   - Store the minimum: name, class, school email, bookings, and the optional topic. When a student cancels after the cutoff, also the reason they picked from a fixed list (« Malade », « Contrôle ou examen », « Conflit avec un cours », « Autre »). Never free text. _(Decided by Nadim, 2026-10-24/26.)_
   - Never store session notes.
   - Students only see the slots they can book (« Disponible ») and their own booking. They never see her activities, her protected time, or who else booked. Only the counselor sees who booked. _(Reworded 2026-10-28, Nadim: the student view changed in session 2.)_
   - Collecting anything beyond this list needs Nadim's approval.
3. **Pronote.** Never use unofficial Pronote APIs, scraping, or reverse engineering. There is a legal risk, and it would kill the school's approval.
4. **Time.** Use the Asia/Beirut timezone. No same-day bookings. _(Hours and cutoff decided by Nadim, 2026-10-24/26, from the official 2026-27 timetable.)_
   - The counselor is present Mon/Tue/Wed/Fri 7:30–15:15 and Thu 7:30–15:00, with lunch 12:00–12:30.
   - Bookable windows are the same every day: **7:30–12:00 and 12:30–15:00**. Lunch is never bookable. No slot crosses lunch or runs past 15:00.
   - Cutoff: a day's bookings lock on the **previous school day** at the cutoff hour (default 15:00). Monday locks on Friday.
   - **School days follow the official CPF calendar** (`src/data/schoolCalendar.js`): no bookings on holidays or during breaks, and the cutoff falls on the last school day before them. The calendar changes every year: Nadim sends the new one, and it is added as a new school year in that file. _(Decided by Nadim, 2026-10-28.)_
5. **Zero maintenance.** Nothing that needs manual upkeep, personal paid accounts, or paid plans. Free tiers only. Ask before anything that could cost money.
6. **Public repo.** No secrets and no real student or staff data, mock data included.
7. **Wording.**
   - The interface is in French and polite, and uses « vous » toward the counselor.
   - "CIO" is the name of the office. In the interface, call her « la conseillère d'orientation ».
   - Frame the problem around the booking method, never as the counselor's fault.
