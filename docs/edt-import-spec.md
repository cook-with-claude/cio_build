# Experiment: import the student's timetable (EDT) from Pronote

Status: EXPERIMENT on its own branch. Not V1. The existing demo must keep working as it is.

## Goal
A student uploads their Pronote timetable PDF. The app figures out when the student is free, and shows which of the counselor's open slots fit. Today students and the counselor find a time by trial and error; this lets the student see compatible times at a glance.

## Context
- Pronote's iCal export is not available to CPF students, so the PDF is the input.
- How a student gets it: Pronote > Vie scolaire > Mon emploi du temps > PDF icon > gear: "Année scolaire" > Valider > Voir le PDF. "Année scolaire" is the standard yearly template: no one-off tests or exceptions.
- A real sample is in `private-samples/edt-sample.pdf` (gitignored).
- CPF alternates two week types, called **Q1 and Q2** in Pronote. Some classes happen every week, some only in Q1 or only in Q2.
- Recesses and lunch are free time for the student. From Pronote's "Organisation d'une journée": the day runs 07:45-19:45, morning recess 09:35-10:05, lunch 12:50-13:35, afternoon recess 15:25-15:40.
- The counselor's slots are 30 minutes on a :00/:30 grid; school periods start at 7:45, 8:40, 10:05... The two schedules don't line up, and neither one wins.

## What a good result looks like
- The student uploads the PDF and gets their free times for Q1 and Q2, Monday to Friday.
- **Every student uploads their own PDF, in the demo too.** No timetable is built into the app or the mock data: the app reads whatever PDF is uploaded, at the moment it's uploaded. The sample in `private-samples/` is only for you to test that the reading works.
- The student can check and correct the result before it's used. Parsing will sometimes be wrong; a wrong reading must never silently turn into wrong matches. If parsing fails completely, the student can still enter their free times by hand.
- The app knows whether a given week is Q1 or Q2 (for now: ask the student which week it is now, and alternate from there).
- A counselor slot "fits" if the student is free for the whole slot that week, with one allowance: the slot may **start up to 5 minutes before the student's class ends** (`OVERLAP_MINUTES`). The student finishes class and arrives up to 5 minutes late to the meeting; they never leave class early. Example: 9:30–10:00 fits a student free at the 9:35–10:05 recess. The slot must still **end** inside the student's free time. Fitting slots are visible in the student's view. _(Decided by Nadim, 2026-10-30.)_

## Rules
- No names anywhere in the repo or the app: not the student's, not teachers'. Keep only times.
- The PDF itself is never committed. A nameless version of the sample timetable (just times and Q1/Q2) is fine as test data.
- Experiment on its own branch, never on main.
