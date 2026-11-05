// The topic a student must pick when booking (Nadim, 2026-11-05: mandatory).
// With « Autre », they add a few words of their own (max 25 characters).

// Every topic, with its label. Which ones a student sees depends on their
// level: see TOPICS_BY_LEVEL.
export const TOPICS = [
  { id: 'parcoursup', label: 'Parcoursup' },
  { id: 'ucas', label: 'UCAS' },
  { id: 'common-app', label: 'Common App' },
  { id: 'aub', label: 'AUB' },
  { id: 'aub-early', label: 'AUB early admission' },
  { id: 'sat', label: 'SAT' },
  { id: 'orientation-univ', label: 'Orientation universitaire' },
  { id: 'etranger', label: 'Études à l’étranger' },
  { id: 'specialites', label: 'Choix de spécialités' },
  { id: 'metiers', label: 'Métiers' },
  { id: 'autre', label: 'Autre' },
]

// The topics each level can pick, in the order shown (Nadim, 2026-11-05):
// - Terminale applies to universities, and has already chosen its
//   spécialités: the application topics, no « Choix de spécialités ».
// - Première and Seconde don't apply yet: no application topics, but
//   « Orientation universitaire » to talk about universities, majors and
//   careers, and « Choix de spécialités ».
// - SAT: Terminale and Première, when most students take it (Nadim).
export const TOPICS_BY_LEVEL = {
  terminale: ['parcoursup', 'ucas', 'common-app', 'aub', 'aub-early', 'sat', 'etranger', 'metiers', 'autre'],
  premiere: ['orientation-univ', 'sat', 'etranger', 'specialites', 'metiers', 'autre'],
  seconde: ['orientation-univ', 'etranger', 'specialites', 'metiers', 'autre'],
}

// The topics a student of `level` sees, in order: [{ id, label }].
export const topicsFor = (level) =>
  (TOPICS_BY_LEVEL[level] ?? []).map((id) => TOPICS.find((t) => t.id === id))

export const OTHER_TOPIC = 'autre'
export const OTHER_TOPIC_MAX_LENGTH = 25

// Why this choice can't be booked by a student of `level`, as a French
// message for the student, or null.
export function topicError(topic, otherText, level) {
  if (!TOPICS_BY_LEVEL[level]?.includes(topic)) return 'Choisissez un sujet pour réserver ce créneau.'
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
