// Texts of the automatic messages a student receives.
// In the demo they are shown on screen; no e-mail is sent.
// Tone: polite, "vous", and never blames anyone (docs/rules.md).

import { TOPICS } from '../data/mockData.js'
import { formatLongDate, formatTime } from './dates.js'

export const topicLabel = (topicId) => TOPICS.find((t) => t.id === topicId)?.label

// "lundi 26 octobre à 9h00"
export const slotMoment = (slot) => `${formatLongDate(slot.date)} à ${formatTime(slot.start)}`

const signature = ['Bien cordialement,', 'Le CIO']

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
      `Vous pouvez l’annuler sur le site jusqu’au ${formatLongDate(lock.date)} à ${formatTime(lock.time)}.`,
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
    subject: 'Rappel : votre rendez-vous d’orientation demain',
    body: [
      `Bonjour ${student.name},`,
      `Nous vous rappelons votre rendez-vous avec la conseillère d’orientation demain, ${slotMoment(slot)}.`,
      topic && `Sujet : ${topic}.`,
      'En cas d’empêchement, merci de prévenir la conseillère d’orientation pour que le créneau profite à un autre élève.',
      ...signature,
    ].filter(Boolean),
  }
}
