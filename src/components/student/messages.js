// Texts of the automatic messages a student would receive.
// In the demo they are shown on screen; no e-mail is sent.

import { TOPICS } from '@/data/mockData'
import { formatLongDate, formatTime } from '@/lib/dates'

export const topicLabel = (topicId) => TOPICS.find((t) => t.id === topicId)?.label

// "lundi 26 octobre à 9h00"
export const slotMoment = (slot) => `${formatLongDate(slot.date)} à ${formatTime(slot.start)}`

export function confirmationMessage({ student, slot, booking, lock }) {
  const topic = topicLabel(booking.topic)
  if (booking.status === 'pending') {
    return {
      subject: 'Votre demande de rendez-vous d’orientation',
      body: [
        `Bonjour ${student.name},`,
        `Votre demande de rendez-vous avec la conseillère d’orientation pour le ${slotMoment(slot)} a bien été envoyée.`,
        topic && `Sujet : ${topic}.`,
        'Vous recevrez un message dès qu’elle aura été acceptée.',
        'Bonne journée,',
        'Le CIO',
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
      'À bientôt,',
      'Le CIO',
    ].filter(Boolean),
  }
}
