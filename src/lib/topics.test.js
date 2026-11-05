import assert from 'node:assert/strict'
import { test } from 'node:test'
import { LEVELS } from '@/data/mockData'
import { TOPICS, TOPICS_BY_LEVEL, bookingTopic, topicError, topicsFor } from './topics.js'

const ids = (level) => topicsFor(level).map((t) => t.id)
const APPLICATIONS = ['parcoursup', 'ucas', 'common-app', 'aub', 'aub-early']

test('Terminale: the application topics and SAT, no « Choix de spécialités »', () => {
  assert.deepEqual(ids('terminale'), [...APPLICATIONS, 'sat', 'etranger', 'metiers', 'autre'])
  assert.deepEqual(topicsFor('terminale').map((t) => t.label), [
    'Parcoursup', 'UCAS', 'Common App', 'AUB', 'AUB early admission', 'SAT',
    'Études à l’étranger', 'Métiers', 'Autre',
  ])
})

test('Première and Seconde: « Orientation universitaire » instead of the application topics', () => {
  assert.deepEqual(ids('premiere'), ['orientation-univ', 'sat', 'etranger', 'specialites', 'metiers', 'autre'])
  assert.deepEqual(ids('seconde'), ['orientation-univ', 'etranger', 'specialites', 'metiers', 'autre'])
  for (const level of ['premiere', 'seconde']) {
    assert.ok(!APPLICATIONS.some((t) => ids(level).includes(t)), level)
    assert.equal(topicsFor(level)[0].label, 'Orientation universitaire')
  }
})

test('SAT: Terminale and Première, not Seconde', () => {
  assert.equal(topicError('sat', null, 'terminale'), null)
  assert.equal(topicError('sat', null, 'premiere'), null)
  assert.equal(topicError('sat', null, 'seconde'), 'Choisissez un sujet pour réserver ce créneau.')
})

test('every level has a list, and every topic in it exists', () => {
  for (const { id } of LEVELS) {
    assert.ok(TOPICS_BY_LEVEL[id]?.length, id)
    for (const topic of TOPICS_BY_LEVEL[id]) assert.ok(TOPICS.some((t) => t.id === topic), `${id}: ${topic}`)
  }
})

test('a topic outside the student’s level is refused', () => {
  assert.equal(topicError('ucas', null, 'terminale'), null)
  assert.equal(topicError('ucas', null, 'premiere'), 'Choisissez un sujet pour réserver ce créneau.')
  assert.equal(topicError('specialites', null, 'seconde'), null)
  assert.equal(topicError('specialites', null, 'terminale'), 'Choisissez un sujet pour réserver ce créneau.')
  assert.equal(topicError('parcoursup', null, undefined), 'Choisissez un sujet pour réserver ce créneau.')
})

test('« Autre » needs a few words, 25 characters at most, at every level', () => {
  for (const { id } of LEVELS) {
    assert.equal(topicError('autre', '', id), 'Précisez le sujet en quelques mots.')
    assert.equal(topicError('autre', 'x'.repeat(26), id), '25 caractères maximum.')
    assert.equal(topicError('autre', 'Année de césure', id), null)
  }
})

test('how a topic reads for the counselor', () => {
  assert.equal(bookingTopic({ topic: 'orientation-univ' }), 'Orientation universitaire')
  assert.equal(bookingTopic({ topic: 'autre', topicOther: 'Année de césure' }), 'Année de césure (autre)')
})
