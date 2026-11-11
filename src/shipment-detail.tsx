import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  FileText,
  MapPin,
  Package,
  Printer,
  QrCode,
  Truck,
} from 'lucide-react'
import {
  balance,
  money,
  paid,
  pieces,
  prettyDate,
  statusTone,
  today,
  total,
  transition,
  weight,
  type Shipment,
} from './model'
import {
  Badge,
  Empty,
  Field,
  Modal,
  PageHeading,
  PanelTitle,
  RouteLabel,
} from './ui'
import { useWorkspace } from './workspace'

type Action =
  | 'allocate'
  | 'unallocate'
  | 'dispatch'
  | 'arrive'
  | 'accept'
  | 'assign'
  | 'deliver'
  | 'failed'
  | 'payment'
  | 'cancel'
const actionNames: Record<Action, string> = {
  allocate: 'Allot to trip',
  unallocate: 'Unallot cargo',
  dispatch: 'Confirm dispatch',
  arrive: 'Mark arrived',
  accept: 'Accept cargo',
  assign: 'Assign delivery',
  deliver: 'Record delivery',
  failed: 'Record failed delivery',
  payment: 'Record payment',
  cancel: 'Cancel shipment',
}
const primaryActions: Partial<Record<Shipment['status'], Action>> = {
  Booked: 'allocate',
  Allocated: 'dispatch',
  'In transit': 'arrive',
  Arrived: 'accept',
  Received: 'assign',
  'Out for delivery': 'deliver',
}

export function Timeline({ shipment }: { shipment: Pick<Shipment, 'events'> }) {
  return (
    <ol className="timeline">
      {[...shipment.events].reverse().map((event, index) => (
        <li key={`${event.status}-${event.date}-${index}`}>
          <span
            className={`timeline-dot ${index === 0 ? 'latest' : ''}`}
            style={{
              backgroundColor: `var(--status-${statusTone[event.status]}, #a0aec0)`,
            }}
          />
          <div>
            <strong>{event.status}</strong>
            {event.note && <p>{event.note}</p>}
          </div>
          <time dateTime={event.date}>
            {prettyDate(event.date, { day: 'numeric', month: 'short' })}
          </time>
        </li>
      ))}
    </ol>
  )
}

export function ShipmentDetail() {
  const { lr } = useParams()
  const { state } = useWorkspace()
  const shipment = state.shipments.find((item) => item.lr === lr)
  const [action, setAction] = useState<Action | null>(null)
  const [showQr, setShowQr] = useState(false)
  const [qr, setQr] = useState('')
  const trackingPath = `/track/${lr}`
  useEffect(() => {
    let cancelled = false
    import('qrcode')
      .then((module) =>
        module.default.toDataURL(
          new URL(trackingPath, window.location.origin).href,
          { margin: 1, width: 150 },
        ),
      )
      .then((url) => {
        if (!cancelled) setQr(url)
      })
      .catch(() => {
        if (!cancelled) setQr('')
      })
    return () => {
      cancelled = true
    }
  }, [trackingPath])

  if (!shipment)
    return (
      <>
        <Link className="back-link" to="/shipments">
          <ArrowLeft size={15} />
          Bookings
        </Link>
        <section className="panel">
          <Empty
            title="Shipment unavailable"
            message="Check the LR number or open the shipment from Bookings."
          />
        </section>
      </>
    )
  const origin =
    state.branches.find((item) => item.id === shipment.origin)?.name ??
    (shipment.origin || 'Not set')
  const destination =
    state.branches.find((item) => item.id === shipment.destination)?.name ??
    (shipment.destination || 'Not set')
  const primary = primaryActions[shipment.status]
  const amount = total(shipment.charges)
  const outstanding = balance(shipment)
  const linkedTrip = state.trips.find((item) => item.id === shipment.trip)

  return (
    <>
      <Link className="back-link" to="/shipments">
        <ArrowLeft size={15} />
        Bookings
      </Link>
      <PageHeading
        title={shipment.lr}
        description={`Booked ${prettyDate(shipment.date)} · ${shipment.service}`}
        actions={
          <>
            {shipment.status === 'Draft' ? (
              <Link className="button primary" to={`/booking/${shipment.lr}`}>
                Edit draft <ArrowRight size={16} />
              </Link>
            ) : (
              <button
                className="button secondary"
                onClick={() => window.print()}
              >
                <Printer size={17} />
                Print LR
              </button>
            )}
            {primary && (
              <button
                className="button primary"
                onClick={() => setAction(primary)}
              >
                {actionNames[primary]}
                <ArrowRight size={16} />
              </button>
            )}
          </>
        }
      />
      <div className="panel detail-banner">
        <span className="detail-banner-icon">
          <Truck size={23} />
        </span>
        <div>
          <RouteLabel from={origin} to={destination} />
          <p>
            {pieces(shipment)} packages · {weight(shipment)} kg
            {linkedTrip && ` · ${linkedTrip.code}`}
          </p>
        </div>
        <Badge status={shipment.status} />
      </div>
      <div className="detail-grid">
        <div className="booking-main">
          <section className="panel form-section">
            <PanelTitle
              title="Consignment details"
              actions={<Package size={19} className="muted" />}
            />
            <div className="party-detail-grid">
              {[
                { title: 'Sender', party: shipment.sender },
                { title: 'Receiver', party: shipment.receiver },
              ].map(({ title, party }) => (
                <div key={title}>
                  <p>{title}</p>
                  <strong>{party.name || 'Not entered'}</strong>
                  <small>
                    {[party.address, party.city, party.pin]
                      .filter(Boolean)
                      .join(', ')}
                  </small>
                  <small>{party.phone}</small>
                  {party.gstin && <small>GSTIN {party.gstin}</small>}
                </div>
              ))}
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Package</th>
                    <th className="number-cell">Quantity</th>
                    <th className="number-cell">Total kg</th>
                  </tr>
                </thead>
                <tbody>
                  {shipment.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.description || 'Unspecified cargo'}</td>
                      <td>{item.type}</td>
                      <td className="number-cell">{item.quantity}</td>
                      <td className="number-cell">
                        {weight({ ...shipment, items: [item] })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="panel form-section">
            <PanelTitle
              title="Shipment history"
              description="Movement and handover events"
            />
            <Timeline shipment={shipment} />
          </section>
          {shipment.proof && (
            <section className="panel form-section">
              <PanelTitle title="Proof of delivery" />
              <div className="party-detail-grid">
                <div>
                  <p>Received by</p>
                  <strong>{shipment.proof.name}</strong>
                </div>
                <div>
                  <p>Date</p>
                  <strong>{prettyDate(shipment.proof.date)}</strong>
                </div>
              </div>
              <p>{shipment.proof.remarks}</p>
            </section>
          )}
        </div>
        <div className="booking-main">
          <section className="panel form-section">
            <PanelTitle
              title="Payment summary"
              actions={<Badge status={shipment.type} />}
            />
            <dl className="amounts compact">
              <div>
                <dt>Booking total</dt>
                <dd>{money(amount)}</dd>
              </div>
              <div>
                <dt>Received</dt>
                <dd>{money(paid(shipment))}</dd>
              </div>
              <div className="amount-total">
                <dt>Outstanding</dt>
                <dd>{money(outstanding)}</dd>
              </div>
            </dl>
            {shipment.payments.length > 0 && (
              <ul className="payment-list">
                {shipment.payments.map((payment) => (
                  <li key={payment.id}>
                    <span>
                      {payment.method} <small>{prettyDate(payment.date)}</small>
                    </span>
                    <strong>{money(payment.amount)}</strong>
                  </li>
                ))}
              </ul>
            )}
            {outstanding > 0 && (
              <button
                className="button secondary full"
                onClick={() => setAction('payment')}
              >
                {actionNames.payment}
              </button>
            )}
          </section>
          <section className="panel form-section">
            <PanelTitle
              title="Shipment tools"
              actions={<FileText size={17} className="muted" />}
            />
            <div className="detail-tools">
              {shipment.status !== 'Draft' && (
                <>
                  <Link to={trackingPath}>
                    <MapPin size={16} />
                    Open tracking view
                    <ExternalLink size={14} />
                  </Link>
                  <button onClick={() => setShowQr(true)}>
                    <QrCode size={16} />
                    View tracking QR
                    <ArrowRight size={14} />
                  </button>
                </>
              )}
              {shipment.status === 'Allocated' && (
                <button onClick={() => setAction('unallocate')}>
                  <Truck size={16} />
                  Unallot cargo
                  <ArrowRight size={14} />
                </button>
              )}
              {shipment.status === 'Out for delivery' && (
                <button onClick={() => setAction('failed')}>
                  <Package size={16} />
                  Record failed delivery
                  <ArrowRight size={14} />
                </button>
              )}
              {['Draft', 'Booked', 'Allocated'].includes(shipment.status) && (
                <button
                  className="danger-text"
                  onClick={() => setAction('cancel')}
                >
                  <FileText size={16} />
                  Cancel shipment
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
      {action && (
        <ActionDialog
          key={action}
          shipment={shipment}
          action={action}
          onClose={() => setAction(null)}
        />
      )}
      {showQr && (
        <Modal title="Tracking QR code" onClose={() => setShowQr(false)}>
          <div className="qr-view">
            {qr ? (
              <img
                src={qr}
                alt={`QR code for ${shipment.lr}`}
                width="150"
                height="150"
              />
            ) : (
              <p>QR code unavailable.</p>
            )}
            <strong>{shipment.lr}</strong>
            <p className="muted">
              New demo bookings can be tracked in this browser.
            </p>
            {qr && (
              <a
                className="button secondary"
                href={qr}
                download={`${shipment.lr}-qr.png`}
              >
                Download QR
              </a>
            )}
          </div>
        </Modal>
      )}
      <div className="print-only">
        <header>
          <h1>{state.settings.company}</h1>
          <p>Lorry receipt · {shipment.lr}</p>
          <p>
            {prettyDate(shipment.date)} · {shipment.service}
          </p>
        </header>
        <div className="party-detail-grid">
          <div>
            <h3>Sender</h3>
            <p>{shipment.sender.name}</p>
            <p>{shipment.sender.phone}</p>
            <p>
              {shipment.sender.address} {shipment.sender.city}{' '}
              {shipment.sender.pin}
            </p>
          </div>
          <div>
            <h3>Receiver</h3>
            <p>{shipment.receiver.name}</p>
            <p>{shipment.receiver.phone}</p>
            <p>
              {shipment.receiver.address} {shipment.receiver.city}{' '}
              {shipment.receiver.pin}
            </p>
          </div>
        </div>
        <h3>
          {origin} to {destination}
        </h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Cargo</th>
              <th>Package</th>
              <th>Quantity</th>
              <th>kg per package</th>
            </tr>
          </thead>
          <tbody>
            {shipment.items.map((item, index) => (
              <tr key={index}>
                <td>{item.description}</td>
                <td>{item.type}</td>
                <td>{item.quantity}</td>
                <td>{item.weight}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          GST rate {shipment.charges.gst}% · {shipment.type}
        </p>
        <h2>Total {money(amount)}</h2>
        <p>Recorded by {state.settings.operator}</p>
        {qr && (
          <img src={qr} width="110" height="110" alt="Shipment tracking QR" />
        )}
        <p>Keep this receipt for cargo collection and tracking.</p>
      </div>
    </>
  )
}

function ActionDialog({
  shipment,
  action,
  onClose,
}: {
  shipment: Shipment
  action: Action
  onClose: () => void
}) {
  const { state, update, notify } = useWorkspace()
  const [error, setError] = useState('')
  const matchingTrips = state.trips.filter(
    (trip) =>
      trip.origin === shipment.origin &&
      trip.destination === shipment.destination &&
      state.vehicles.find((vehicle) => vehicle.id === trip.vehicle)?.status ===
        'Available' &&
      !state.shipments.some(
        (item) =>
          item.trip === trip.id &&
          !['Allocated', 'Cancelled'].includes(item.status),
      ),
  )
  const due = balance(shipment)
  const remaining = pieces(shipment) - (shipment.received ?? 0)
  const requiresNote = ['unallocate', 'failed', 'cancel'].includes(action)
  const needsNote = requiresNote || action === 'accept' || action === 'deliver'
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const value = (key: string) => String(form.get(key) ?? '').trim()
    const note = value('note')
    const fail = (message: string) => setError(message)
    if (requiresNote && !note) return fail('Enter a reason before continuing.')
    let result = shipment
    let dispatchTrip = false
    if (action === 'allocate') {
      const trip = matchingTrips.find((item) => item.id === value('trip'))
      if (!trip) return fail('Choose an available trip for this route.')
      const vehicle = state.vehicles.find((item) => item.id === trip.vehicle)!
      const loaded = state.shipments
        .filter((item) => item.trip === trip.id && item.status === 'Allocated')
        .reduce((sum, item) => sum + weight(item), 0)
      if (loaded + weight(shipment) > vehicle.capacity)
        return fail(
          `The vehicle has ${vehicle.capacity - loaded} kg capacity remaining.`,
        )
      result = {
        ...transition(shipment, 'Allocated', `Allotted to ${trip.code}`),
        trip: trip.id,
      }
    } else if (action === 'unallocate')
      result = { ...transition(shipment, 'Booked', note), trip: undefined }
    else if (action === 'dispatch') {
      result = transition(shipment, 'In transit', 'Loaded and dispatched')
      dispatchTrip = !!shipment.trip
    } else if (action === 'arrive')
      result = transition(
        shipment,
        'Arrived',
        'Arrived at the destination branch',
      )
    else if (action === 'accept') {
      const received = Number(value('pieces'))
      if (!Number.isInteger(received) || received < 1 || received > remaining)
        return fail(`Enter a quantity between 1 and ${remaining}.`)
      if (received < remaining && !note)
        return fail('Add a discrepancy note for a partial receipt.')
      const message = note ? `Discrepancy: ${note}` : 'All packages received'
      result =
        received === remaining
          ? transition(shipment, 'Received', message)
          : {
              ...shipment,
              events: [
                ...shipment.events,
                {
                  status: 'Arrived',
                  date: new Date().toISOString(),
                  note: `Discrepancy: Received ${received} of ${remaining} remaining packages. ${note}`,
                },
              ],
            }
      result.received = (shipment.received ?? 0) + received
    } else if (action === 'assign') {
      const name = value('name')
      if (!name) return fail('Enter the name of the delivery employee.')
      result = {
        ...transition(shipment, 'Out for delivery', `Assigned to ${name}`),
        assignee: name,
      }
    } else if (action === 'deliver') {
      const name = value('name')
      if (state.settings.pod && !name)
        return fail('Enter the name of the person who accepted the cargo.')
      if (shipment.type === 'To-Pay' && due > 0)
        return fail(
          'Record the outstanding To-Pay amount before completing delivery.',
        )
      result = {
        ...transition(shipment, 'Delivered'),
        proof: name ? { name, date: today, remarks: note } : undefined,
      }
    } else if (action === 'failed')
      result = {
        ...transition(shipment, 'Received', `Delivery failed: ${note}`),
        assignee: undefined,
      }
    else if (action === 'payment') {
      const amount = Math.round(Number(value('amount')) * 100) / 100
      if (!Number.isFinite(amount) || amount <= 0 || amount > due)
        return fail(
          `Enter a payment greater than zero and no more than ${money(due)}.`,
        )
      result = {
        ...shipment,
        payments: [
          ...shipment.payments,
          {
            id: crypto.randomUUID(),
            date: today,
            amount,
            method: value('method'),
          },
        ],
      }
    } else if (action === 'cancel') {
      result = { ...transition(shipment, 'Cancelled', note), trip: undefined }
      const received = paid(shipment)
      if (received > 0)
        result.payments = [
          ...shipment.payments,
          {
            id: crypto.randomUUID(),
            date: today,
            amount: -received,
            method: 'Cancellation refund',
          },
        ]
    }
    update((current) => ({
      ...current,
      shipments: current.shipments.map((item) =>
        item.id === shipment.id
          ? result
          : dispatchTrip &&
              item.trip === shipment.trip &&
              item.status === 'Allocated'
            ? transition(item, 'In transit', 'Loaded and dispatched with trip')
            : item,
      ),
    }))
    notify(
      action === 'payment'
        ? `Payment recorded for ${shipment.lr}`
        : `${shipment.lr} · ${result.status}`,
    )
    onClose()
  }

  return (
    <Modal title={actionNames[action]} onClose={onClose}>
      <form className="dialog-form" onSubmit={submit}>
        <p className="muted">
          {shipment.lr} · {shipment.sender.name || 'Draft consignment'}
        </p>
        {action === 'allocate' &&
          (matchingTrips.length ? (
            <Field label="Trip">
              <select name="trip" required defaultValue="">
                <option value="">Choose a trip</option>
                {matchingTrips.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} · {item.driver}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <p className="form-error">
              No available trip matches this route.{' '}
              <Link to="/fleet?view=trips" onClick={onClose}>
                Create a trip in Fleet Management.
              </Link>
            </p>
          ))}
        {action === 'dispatch' && (
          <p>
            Confirm departure after verifying the cargo has been loaded.
            {shipment.trip &&
              ' All allotted shipments on this trip will move to In transit.'}
          </p>
        )}
        {action === 'arrive' && (
          <p>
            Confirm the consignment has reached its destination branch. The
            receiving team can then accept the cargo.
          </p>
        )}
        {action === 'accept' && (
          <Field label="Packages received now">
            <input
              type="number"
              name="pieces"
              min={1}
              max={remaining}
              step={1}
              defaultValue={remaining}
              required
            />
          </Field>
        )}
        {(action === 'assign' || action === 'deliver') && (
          <Field
            label={action === 'assign' ? 'Delivery employee' : 'Received by'}
          >
            <input
              name="name"
              maxLength={100}
              required={action === 'assign' || state.settings.pod}
            />
          </Field>
        )}
        {action === 'payment' && (
          <>
            <Field label={`Amount (up to ${money(due)})`}>
              <input
                type="number"
                name="amount"
                min="0.01"
                max={due}
                step="0.01"
                defaultValue={due}
                required
              />
            </Field>
            <Field label="Payment method">
              <select name="method">
                <option>Cash</option>
                <option>UPI</option>
                <option>Bank transfer</option>
                <option>Card</option>
                <option>Cheque</option>
              </select>
            </Field>
          </>
        )}
        {action === 'cancel' && paid(shipment) > 0 && (
          <p>
            The demo ledger will record a {money(paid(shipment))} refund against
            the original payment.
          </p>
        )}
        {needsNote && (
          <Field
            label={
              requiresNote
                ? 'Reason'
                : action === 'accept'
                  ? 'Damage or missing package notes'
                  : 'Delivery remarks'
            }
          >
            <textarea
              name="note"
              maxLength={300}
              required={requiresNote}
              rows={3}
            />
          </Field>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Back
          </button>
          <button
            className={`button ${action === 'cancel' ? 'danger' : 'primary'}`}
            disabled={action === 'allocate' && !matchingTrips.length}
          >
            {actionNames[action]}
          </button>
        </div>
      </form>
    </Modal>
  )
}
