// The topic a student must pick when booking (Nadim, 2026-11-05: mandatory).
// With « Autre », they add a few words of their own (max 25 characters).

export const TOPICS = [
  { id: 'parcoursup', label: 'Parcoursup' },
  { id: 'ucas', label: 'UCAS' },
  { id: 'common-app', label: 'Common App' },
  { id: 'aub', label: 'AUB' },
  { id: 'aub-early', label: 'AUB early admission' },
  { id: 'etranger', label: 'Études à l’étranger' },
  { id: 'specialites', label: 'Choix de spécialités' },
  { id: 'metiers', label: 'Métiers' },
  { id: 'autre', label: 'Autre' },
]

export const OTHER_TOPIC = 'autre'
export const OTHER_TOPIC_MAX_LENGTH = 25

// Why this choice can't be booked, as a French message for the student, or null.
export function topicError(topic, otherText) {
  if (!TOPICS.some((t) => t.id === topic)) return 'Choisissez un sujet pour réserver ce créneau.'
  if (topic !== OTHER_TOPIC) return null
  const text = (otherText ?? '').trim()
  if (!text) return 'Précisez le sujet en quelques mots.'
  if (text.length > OTHER_TOPIC_MAX_LENGTH) return `${OTHER_TOPIC_MAX_LENGTH} caractères maximum.`
  return null
}

export const topicLabel = (topicId) => TOPICS.find((t) => t.id === topicId)?.label

// What the counselor (and the student) read for a booking's topic:
// « Parcoursup », or « Année de césure (autre) ». undefined if none (old data).
export function bookingTopic(booking) {
  const label = topicLabel(booking.topic)
  return booking.topic === OTHER_TOPIC && booking.topicOther ? `${booking.topicOther} (autre)` : label
}
