// Texts of the automatic messages: those a student receives, and those the
// counselor receives (late cancellations, « Résumé de demain »).
// In the demo they are shown on screen; no e-mail is sent.
// Tone: polite, "vous", and never blames anyone (docs/rules.md).

import { TOPICS } from '../data/mockData.js'
import { formatLongDate, formatTime } from './dates.js'
import { firstVisibleDate, lockMoment } from './rules.js'

export const topicLabel = (topicId) => TOPICS.find((t) => t.id === topicId)?.label

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
  const topic = topicLabel(booking.topic)
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
  const topic = topicLabel(booking.topic)
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

// « Résumé de demain », sent to her at the cutoff.
// confirmed: [{ slot, student, booking }], declined: [{ slot, student }],
// lateCancellations: [{ slot, student, reason }], each sorted by time.
export function tomorrowSummaryMessage({ date, confirmed, declined, lateCancellations }) {
  // `none` agrees with the title: « aucun » / « aucune ».
  const section = (title, none, items, line) =>
    items.length ? [`${title} (${items.length}) :`, ...items.map(line)] : [`${title} : ${none}.`]
  return {
    subject: `Résumé de demain : ${formatLongDate(date)}`,
    body: [
      ...section('Rendez-vous confirmés', 'aucun', confirmed, ({ slot, student, booking }) => {
        const topic = topicLabel(booking.topic)
        return `• ${formatTime(slot.start)} · ${student.name} · ${student.className}${topic ? ` · ${topic}` : ''}`
      }),
      ...section('Demandes refusées automatiquement', 'aucune', declined, ({ slot, student }) =>
        `• ${formatTime(slot.start)} · ${student.name} · ${student.className}`,
      ),
      ...section('Annulations tardives', 'aucune', lateCancellations, ({ slot, student, reason }) =>
        `• ${formatTime(slot.start)} · ${student.name} · ${student.className} · ${reasonLabel(reason)}`,
      ),
    ],
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
