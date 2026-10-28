// The official CPF school calendar: when school runs and which days are off.
// Unlike mockData.js, this is real data (the calendar sent to every family).
//
// HOW TO UPDATE IT, EVERY YEAR
// Add the new school year at the end of SCHOOL_YEARS, from the calendar the
// school publishes. Keep past years: bookings and messages may still point
// to them. For each year:
//   firstDay  first day of classes for students (« Rentrée »)
//   lastDay   last day of the school year
//   daysOff   holidays and breaks, `from` and `to` included (`to` can be
//             left out for a single day). Weekends are already days off, so
//             a holiday on a Saturday or Sunday is listed only for the record.
//   lunar     true for dates set by the Muslim lunar calendar: they may move
//             by a day or two once officially announced. Correct them here.
//
// What counts as a school day (see isSchoolDay in lib/dates.js):
//   - Monday to Friday, not in daysOff;
//   - between two listed years (the summer), no day is a school day;
//   - before the first or after the last listed year, Monday to Friday, so
//     the app keeps working if next year's calendar has not been added yet.

export const SCHOOL_YEARS = [
  {
    name: '2026-2027',
    firstDay: '2026-09-14',
    lastDay: '2027-06-30',
    daysOff: [
      { from: '2026-10-24', to: '2026-11-01', label: 'Vacances de mi-trimestre' }, // includes la Toussaint
      { from: '2026-11-22', label: 'Fête de l’Indépendance' },
      { from: '2026-12-19', to: '2027-01-03', label: 'Vacances de Noël' }, // includes le Jour de l’an
      { from: '2027-01-06', label: 'Noël arménien' },
      { from: '2027-02-09', label: 'Saint Maron' },
      { from: '2027-02-13', to: '2027-02-21', label: 'Vacances d’hiver' }, // includes la Commémoration de Rafic Hariri
      { from: '2027-03-09', label: 'Fête des professeurs' },
      { from: '2027-03-10', label: 'Fitr', lunar: true },
      { from: '2027-03-25', label: 'Annonciation' },
      { from: '2027-03-26', label: 'Vendredi saint' },
      { from: '2027-03-29', label: 'Lundi de Pâques' },
      { from: '2027-04-10', to: '2027-04-25', label: 'Vacances de printemps' },
      { from: '2027-04-30', label: 'Vendredi saint orthodoxe' },
      { from: '2027-05-01', label: 'Fête du Travail' },
      { from: '2027-05-03', label: 'Lundi de Pâques orthodoxe' },
      { from: '2027-05-16', to: '2027-05-17', label: 'Adha', lunar: true },
      { from: '2027-05-25', label: 'Fête de la Résistance et de la Libération' },
      { from: '2027-06-06', label: 'Hégire', lunar: true },
      { from: '2027-06-15', label: 'Achoura', lunar: true },
    ],
  },
]
