// Texts of the automatic messages: those a student receives, and those the
// counselor receives (late cancellations, « Liste définitive »).
// In the demo they are shown on screen; no e-mail is sent.
// Tone: polite, "vous", and never blames anyone (docs/rules.md).

import { formatLongDate, formatTime } from './dates.js'
import { firstVisibleDate, lockMoment, openToAllLevelsFrom } from './rules.js'
import { bookingTopic } from './topics.js'

// Reasons a student picks from when cancelling after the cutoff. A fixed
// list, never free text (docs/rules.md, privacy).
export const LATE_CANCEL_REASONS = [
  { id: 'malade', label: 'Malade' },
  { id: 'controle', label: 'Contrôle ou examen' },
  { id: 'cours', label: 'Conflit avec un cours' },
  { id: 'autre', label: 'Autre' },
]

export const reasonLabel = (reasonId) => LATE_CANCEL_REASONS.find((r) => r.id === reasonId)?.label

// "lundi 26 octobre à 9h00"
export const slotMoment = (slot) => `${formatLongDate(slot.date)} à ${formatTime(slot.start)}`

const signature = ['Bien cordialement,', 'La conseillère d’orientation']

export function confirmationMessage({ student, slot, booking, lock }) {
  const topic = bookingTopic(booking)
  if (booking.status === 'pending') {
    return {
      subject: 'Votre demande de rendez-vous d’orientation',
      body: [
        `Bonjour ${student.name},`,
        `Votre demande de rendez-vous avec la conseillère d’orientation pour le ${slotMoment(slot)} a bien été envoyée.`,
        topic && `Sujet : ${topic}.`,
        'Vous recevrez un message dès qu’elle aura été traitée.',
        ...signature,
      ].filter(Boolean),
    }
  }
  return {
    subject: 'Confirmation de votre rendez-vous d’orientation',
    body: [
      `Bonjour ${student.name},`,
      `Votre rendez-vous avec la conseillère d’orientation est confirmé : ${slotMoment(slot)}.`,
      topic && `Sujet : ${topic}.`,
      `Vous pouvez l’annuler sur le site jusqu’au ${formatLongDate(lock.date)} à ${formatTime(lock.time)} ; après cette heure, en indiquant un motif.`,
      ...signature,
    ].filter(Boolean),
  }
}

export function acceptedMessage({ student, slot }) {
  return {
    subject: 'Votre rendez-vous d’orientation est confirmé',
    body: [
      `Bonjour ${student.name},`,
      `Bonne nouvelle : votre demande de rendez-vous du ${slotMoment(slot)} a été acceptée par la conseillère d’orientation.`,
      'À bientôt au CIO.',
      ...signature,
    ],
  }
}

export function refusedMessage({ student, slot }) {
  return {
    subject: 'Votre demande de rendez-vous d’orientation',
    body: [
      `Bonjour ${student.name},`,
      `La conseillère d’orientation ne peut malheureusement pas vous recevoir le ${slotMoment(slot)}.`,
      'Nous vous invitons à choisir un autre créneau sur le site. Vous pouvez aussi passer au bureau du CIO.',
      'Merci de votre compréhension.',
      ...signature,
    ],
  }
}

// A request still waiting for her answer when its day locks. Worded around
// the booking process, not as her refusal (docs/rules.md, wording).
export function autoDeclinedMessage({ student, slot }) {
  return {
    subject: 'Votre demande de rendez-vous d’orientation',
    body: [
      `Bonjour ${student.name},`,
      `Votre demande de rendez-vous du ${slotMoment(slot)} n’a pas pu être validée à temps : les réservations pour ce jour sont maintenant closes.`,
      'Nous vous invitons à choisir un autre créneau sur le site. Vous pouvez aussi passer au bureau du CIO.',
      'Merci de votre compréhension.',
      ...signature,
    ],
  }
}

export function cancelledByCounselorMessage({ student, slot }) {
  return {
    subject: 'Annulation de votre rendez-vous d’orientation',
    body: [
      `Bonjour ${student.name},`,
      `Nous sommes désolés : votre rendez-vous du ${slotMoment(slot)} avec la conseillère d’orientation a dû être annulé.`,
      'Vous pouvez choisir un nouveau créneau sur le site, ou passer au bureau du CIO.',
      'Merci de votre compréhension.',
      ...signature,
    ],
  }
}

export function movedMessage({ student, from, to }) {
  return {
    subject: 'Changement d’horaire de votre rendez-vous d’orientation',
    body: [
      `Bonjour ${student.name},`,
      `Votre rendez-vous avec la conseillère d’orientation, prévu le ${slotMoment(from)}, a été déplacé au ${slotMoment(to)}.`,
      'Si ce nouvel horaire ne vous convient pas, vous pouvez l’annuler sur le site et choisir un autre créneau.',
      'Merci de votre compréhension.',
      ...signature,
    ],
  }
}

export function reminderMessage({ student, slot, booking }) {
  const topic = bookingTopic(booking)
  return {
    subject: 'Rappel : votre rendez-vous d’orientation aujourd’hui',
    body: [
      `Bonjour ${student.name},`,
      `Nous vous rappelons votre rendez-vous avec la conseillère d’orientation aujourd’hui, ${slotMoment(slot)}.`,
      topic && `Sujet : ${topic}.`,
      'En cas d’empêchement, merci d’annuler sur le site en indiquant le motif.',
      ...signature,
    ].filter(Boolean),
  }
}

// --- Messages to the counselor ---------------------------------------------

const who = (student) => `${student.name} (${student.className})`

// Sent to her as soon as a student cancels after the cutoff.
export function lateCancellationNotice({ student, slot, reason }) {
  return {
    subject: `Annulation tardive : ${who(student)}`,
    body: [
      `${who(student)} a annulé son rendez-vous du ${slotMoment(slot)}.`,
      `Motif : ${reasonLabel(reason)}.`,
      'Le créneau reste fermé : il n’est pas proposé à un autre élève.',
    ],
  }
}

// "lundi 9 novembre et mardi 10 novembre"
const dateList = (dates) => {
  const labels = dates.map(formatLongDate)
  return labels.length > 1 ? `${labels.slice(0, -1).join(', ')} et ${labels.at(-1)}` : labels[0]
}

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1)

// « Liste définitive », sent to her just after the cutoff, for every day that
// has just locked (on a Friday: Monday and Tuesday).
// days: [{ date, confirmed, declined, lateCancellations }] (see cutoffSummary
// in useDemoStore.js); confirmed/declined: [{ slot, student, booking }],
// lateCancellations: [{ slot, student, reason }], each sorted by time.
export function summaryMessage({ days }) {
  // `none` agrees with the title: « aucun » / « aucune ».
  const section = (title, none, items, line) =>
    items.length ? [`${title} (${items.length}) :`, ...items.map(line)] : [`${title} : ${none}.`]
  const bookingLine = ({ slot, student, booking }) => {
    const topic = bookingTopic(booking)
    return `• ${formatTime(slot.start)} · ${student.name} · ${student.className}${topic ? ` · ${topic}` : ''}`
  }
  return {
    subject: `Liste définitive des rendez-vous du ${dateList(days.map((d) => d.date))}`,
    body: days.flatMap(({ date, confirmed, declined, lateCancellations }) => [
      // A heading per day, only when the summary covers several days.
      ...(days.length > 1 ? [capitalize(formatLongDate(date))] : []),
      ...section('Rendez-vous confirmés', 'aucun', confirmed, bookingLine),
      ...section('Demandes refusées automatiquement', 'aucune', declined, bookingLine),
      ...section('Annulations tardives', 'aucune', lateCancellations, ({ slot, student, reason }) =>
        `• ${formatTime(slot.start)} · ${student.name} · ${student.className} · ${reasonLabel(reason)}`,
      ),
    ]),
  }
}

// --- Who can book --------------------------------------------------------------

// For a Première or Seconde student before the end of the Toussaint break
// (levelBookingBlock in rules.js).
export function terminaleOnlyNotice(now) {
  return {
    title: 'Réservé aux élèves de Terminale pour le moment',
    body: `Jusqu’aux vacances de la Toussaint, les rendez-vous sont réservés aux élèves de Terminale. Vous pourrez réserver à partir du ${formatLongDate(openToAllLevelsFrom(now))}. D’ici là, vous pouvez toujours passer au bureau du CIO.`,
  }
}

// Tooltip on her side for an open slot that students can't book right now.
// block: "closed" | "too-far" (see studentBookingBlock in rules.js).
export function bookingBlockHint(block, date, settings) {
  if (block === 'closed') {
    const lock = lockMoment(date, settings)
    return `Les élèves ne peuvent plus réserver ce créneau : les réservations pour ce jour sont closes depuis le ${formatLongDate(lock.date)} à ${formatTime(lock.time)}.`
  }
  return `Pas encore visible par les élèves : ils peuvent réserver au plus ${settings.bookingHorizonWeeks} semaines à l’avance, donc à partir du ${formatLongDate(firstVisibleDate(date, settings))}.`
}
