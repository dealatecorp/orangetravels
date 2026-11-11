import assert from 'node:assert/strict'
import test from 'node:test'
import {
  balance,
  book,
  chargeable,
  newItem,
  prettyDate,
  seed,
  total,
  transition,
} from '../src/model'

test('shipment events display the calendar date in India Standard Time', () => {
  assert.equal(prettyDate('2026-11-10T21:00:00Z'), prettyDate('2026-11-11'))
})

test('pricing uses the larger of volumetric and actual package weight', () => {
  assert.equal(
    chargeable({
      ...newItem,
      quantity: 2,
      weight: 3,
      length: 50,
      width: 50,
      height: 20,
    }),
    20,
  )
  assert.equal(
    total({
      freight: 480,
      handling: 40,
      delivery: 0,
      other: 0,
      discount: 20,
      gst: 18,
    }),
    590,
  )
})

test('draft confirmation keeps its LR and rejects out-of-order shipment events', () => {
  const state = seed()
  const draft = book(state, {
    ...state.shipments[0],
    status: 'Draft',
    payments: [],
  })
  const confirmed = book(
    { ...state, shipments: [draft], sequence: state.sequence + 1 },
    { ...draft, status: 'Booked' },
    draft.id,
  )
  assert.equal(confirmed.lr, draft.lr)
  assert.deepEqual(
    confirmed.events.map((item) => item.status),
    ['Draft', 'Booked'],
  )
  assert.throws(() => transition(confirmed, 'Delivered'), /Cannot move/)
  assert.equal(
    balance(transition(confirmed, 'Cancelled', 'Customer request')),
    0,
  )
})
