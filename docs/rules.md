# Hard rules
_Last updated: 2026-10-21. Ask Nadim before changing or bending any of these._

1. **Golden rule.** The app must add zero work or friction for the counselor or the administration. Her side must take seconds, not minutes. If a feature adds work for her, say so before building it.
2. **Privacy: the users are minors.**
   - Store the minimum: name, class, school email, bookings, and the optional topic.
   - Never store session notes.
   - Students only ever see « Disponible » / « Indisponible ». Only the counselor sees who booked.
   - Collecting anything beyond this list needs Nadim's approval.
3. **Pronote.** Never use unofficial Pronote APIs, scraping, or reverse engineering. There is a legal risk, and it would kill the school's approval.
4. **Time.** Use the Asia/Beirut timezone. The school day runs 8:00–15:30. No same-day bookings.
5. **Zero maintenance.** Nothing that needs manual upkeep, personal paid accounts, or paid plans. Free tiers only. Ask before anything that could cost money.
6. **Public repo.** No secrets and no real student or staff data, mock data included.
7. **Wording.**
   - The interface is in French and polite, and uses « vous » toward the counselor.
   - "CIO" is the name of the office. In the interface, call her « la conseillère d'orientation ».
   - Frame the problem around the booking method, never as the counselor's fault.
