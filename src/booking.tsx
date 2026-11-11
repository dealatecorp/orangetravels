import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Box,
  ClipboardList,
  Plus,
  Trash2,
  UserRound,
  Wallet,
} from 'lucide-react'
import {
  book,
  chargeable,
  emptyParty,
  money,
  newItem,
  round,
  subtotal,
  today,
  total,
  type Charges,
  type Item,
  type LRType,
  type Party,
} from './model'
import { Empty, Field, PageHeading, PanelTitle } from './ui'
import { useWorkspace } from './workspace'

const methods = ['Cash', 'UPI', 'Bank transfer', 'Card', 'Cheque']
const extraCharges = [
  { key: 'handling', label: 'Handling' },
  { key: 'delivery', label: 'Door delivery' },
  { key: 'other', label: 'Other charges' },
  { key: 'discount', label: 'Discount' },
  { key: 'gst', label: 'GST (%)' },
] as const

function PartyFields({
  value,
  onChange,
  sender = false,
}: {
  value: Party
  onChange: (party: Party) => void
  sender?: boolean
}) {
  const { state } = useWorkspace()
  return (
    <div className="field-grid">
      {sender && (
        <Field label="Existing customer" wide>
          <select
            defaultValue=""
            onChange={(event) => {
              const customer = state.customers.find(
                (item) => item.id === event.target.value,
              )
              if (customer)
                onChange({
                  ...value,
                  name: customer.name,
                  phone: customer.phone,
                  city: customer.city,
                })
            }}
          >
            <option value="">Select a customer</option>
            {state.customers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label="Full name" wide>
        <input
          value={value.name}
          required
          maxLength={120}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          placeholder={
            sender ? 'Sender or company name' : 'Receiver or company name'
          }
        />
      </Field>
      <Field label="Mobile">
        <input
          value={value.phone}
          type="tel"
          required
          pattern="[+]?[0-9][0-9 ]{6,16}"
          onChange={(event) =>
            onChange({ ...value, phone: event.target.value })
          }
          placeholder="Mobile number"
        />
      </Field>
      <Field label="City">
        <input
          value={value.city}
          maxLength={80}
          onChange={(event) => onChange({ ...value, city: event.target.value })}
          placeholder="City"
        />
      </Field>
      <Field label="Address" wide>
        <input
          value={value.address}
          maxLength={220}
          onChange={(event) =>
            onChange({ ...value, address: event.target.value })
          }
          placeholder="Street and locality"
        />
      </Field>
      <Field label="PIN code">
        <input
          value={value.pin}
          inputMode="numeric"
          pattern="[0-9]{6}"
          onChange={(event) => onChange({ ...value, pin: event.target.value })}
          placeholder="6-digit PIN"
        />
      </Field>
      <Field label="GSTIN">
        <input
          value={value.gstin}
          maxLength={15}
          onChange={(event) =>
            onChange({ ...value, gstin: event.target.value.toUpperCase() })
          }
          placeholder="Optional"
        />
      </Field>
    </div>
  )
}

export function Booking() {
  const { state, branch, update, notify } = useWorkspace()
  const { lr: routeLR } = useParams()
  const lr = routeLR === 'new' ? undefined : routeLR
  const navigate = useNavigate()
  const draft = state.shipments.find(
    (shipment) => shipment.lr === lr && shipment.status === 'Draft',
  )
  const [origin, setOrigin] = useState(
    draft?.origin ?? (branch || state.branches[0]?.id || ''),
  )
  const [destination, setDestination] = useState(draft?.destination ?? '')
  const [date, setDate] = useState(draft?.date ?? today)
  const [type, setType] = useState<LRType>(draft?.type ?? 'Paid')
  const [service, setService] = useState(draft?.service ?? 'Standard road')
  const [reference, setReference] = useState(draft?.reference ?? '')
  const [sender, setSender] = useState(draft?.sender ?? emptyParty)
  const [receiver, setReceiver] = useState(draft?.receiver ?? emptyParty)
  const [items, setItems] = useState<Item[]>(draft?.items ?? [{ ...newItem }])
  const [freight, setFreight] = useState(
    draft?.freightOverride === false ? '' : (draft?.charges.freight.toString() ?? ''),
  )
  const [charges, setCharges] = useState<Charges>(
    draft?.charges ?? {
      freight: 0,
      handling: 0,
      delivery: 0,
      other: 0,
      discount: 0,
      gst: state.settings.gst,
    },
  )
  const [method, setMethod] = useState(methods[0])
  const [error, setError] = useState('')

  const calcWeight = items.reduce((sum, item) => sum + chargeable(item), 0)
  const computed = {
    ...charges,
    freight:
      freight === ''
        ? round(calcWeight * state.settings.rate)
        : Number(freight),
  }
  const amount = total(computed)
  const setItem = (index: number, patch: Partial<Item>) =>
    setItems((current) =>
      current.map((item, i) => (index === i ? { ...item, ...patch } : item)),
    )
  const packageTypes = [
    ...new Set([
      ...state.masters
        .filter((master) => master.category === 'Package type')
        .map((master) => master.name),
      ...items.map((item) => item.type),
    ]),
  ]

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const button = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null
    const isDraft = button?.value === 'draft'
    const fail = (message: string) => {
      setError(message)
      window.requestAnimationFrame(() =>
        document.getElementById('booking-error')?.focus(),
      )
    }
    if (!isDraft && origin === destination)
      return fail('Choose a destination different from the origin branch.')
    if (
      !isDraft &&
      (!sender.name.trim() ||
        !receiver.name.trim() ||
        items.some((item) => !item.description.trim()))
    )
      return fail(
        'Enter a sender name, receiver name, and description for every cargo item.',
      )
    if (!isDraft && amount <= 0)
      return fail(
        'The booking total must be greater than zero. Review the freight and discount.',
      )
    const shipment = book(
      state,
      {
        date: date || today,
        origin,
        destination,
        type,
        service,
        reference: reference.trim(),
        sender: { ...sender, name: sender.name.trim() },
        receiver: { ...receiver, name: receiver.name.trim() },
        items,
        charges: computed,
        freightOverride: freight !== '',
        status: isDraft ? 'Draft' : 'Booked',
        payments:
          !isDraft && type === 'Paid'
            ? [{ id: crypto.randomUUID(), amount, method, date: today }]
            : [],
      },
      draft?.id,
    )
    update((current) => ({
      ...current,
      sequence: draft ? current.sequence : current.sequence + 1,
      shipments: [
        shipment,
        ...current.shipments.filter((item) => item.id !== shipment.id),
      ],
    }))
    notify(
      isDraft
        ? `Draft ${shipment.lr} saved`
        : `${shipment.lr} booked successfully`,
    )
    navigate(`/shipments/${shipment.lr}`)
  }

  if (lr && !draft)
    return (
      <div className="panel">
        <Empty
          title="Draft unavailable"
          message="Open a draft from the shipments register to edit it."
        />
      </div>
    )

  return (
    <>
      <Link
        className="back-link"
        to={draft ? `/shipments/${draft.lr}` : '/shipments'}
      >
        <ArrowLeft size={15} />
        {draft ? draft.lr : 'Bookings'}
      </Link>
      <PageHeading
        title={draft ? 'Edit draft booking' : 'New booking'}
        description="Enter the consignment details to create a lorry receipt."
      />
      <form className="booking-layout" onSubmit={save}>
        <div className="booking-main">
          <section className="panel form-section">
            <PanelTitle
              title="Booking information"
              actions={<ClipboardList size={19} className="muted" />}
            />
            <div className="field-grid">
              <Field label="Origin branch">
                <select
                  value={origin}
                  onChange={(event) => setOrigin(event.target.value)}
                  required
                >
                  {state.branches.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Destination branch">
                <select
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  required
                >
                  <option value="">Select destination</option>
                  {state.branches.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Booking date">
                <input
                  type="date"
                  value={date}
                  max={today}
                  onChange={(event) => setDate(event.target.value)}
                  required
                />
              </Field>
              <Field label="LR type">
                <select
                  value={type}
                  onChange={(event) => setType(event.target.value as LRType)}
                >
                  <option>Paid</option>
                  <option>To-Pay</option>
                  <option>Credit</option>
                </select>
              </Field>
              <Field label="Service">
                <select
                  value={service}
                  onChange={(event) => setService(event.target.value)}
                >
                  <option>Standard road</option>
                  <option>Express road</option>
                  <option>Door to door</option>
                </select>
              </Field>
              <Field label="Waybill reference">
                <input
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  maxLength={70}
                  placeholder="Optional"
                />
              </Field>
            </div>
          </section>
          <div className="party-grid">
            <section className="panel form-section">
              <PanelTitle
                title="Sender"
                actions={<UserRound size={18} className="muted" />}
              />
              <PartyFields value={sender} onChange={setSender} sender />
            </section>
            <section className="panel form-section">
              <PanelTitle
                title="Receiver"
                actions={
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setReceiver({ ...sender })}
                  >
                    Copy sender details
                  </button>
                }
              />
              <PartyFields value={receiver} onChange={setReceiver} />
            </section>
          </div>
          <section className="panel form-section">
            <PanelTitle
              title="Cargo items"
              actions={<Box size={19} className="muted" />}
            />
            {items.map((item, index) => (
              <div className="item-form" key={index}>
                <div className="item-title">
                  <h3>Item {index + 1}</h3>
                  {items.length > 1 && (
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Remove item ${index + 1}`}
                      onClick={() =>
                        setItems((current) =>
                          current.filter((_, i) => i !== index),
                        )
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="field-grid">
                  <Field label="Description" wide>
                    <input
                      value={item.description}
                      onChange={(event) =>
                        setItem(index, { description: event.target.value })
                      }
                      required
                      maxLength={160}
                      placeholder="Goods or contents"
                    />
                  </Field>
                  <Field label="Package type">
                    <select
                      value={item.type}
                      onChange={(event) =>
                        setItem(index, { type: event.target.value })
                      }
                    >
                      {packageTypes.map((packageType) => (
                        <option key={packageType}>{packageType}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Package quantity">
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={item.quantity || ''}
                      onChange={(event) =>
                        setItem(index, { quantity: Number(event.target.value) })
                      }
                      required
                    />
                  </Field>
                  <Field label="Weight per package (kg)">
                    <input
                      type="number"
                      min="0.01"
                      max="50000"
                      step="0.01"
                      value={item.weight || ''}
                      onChange={(event) =>
                        setItem(index, { weight: Number(event.target.value) })
                      }
                      required
                    />
                  </Field>
                  <Field label="Chargeable weight">
                    <output>{round(chargeable(item))} kg</output>
                  </Field>
                  {(
                    [
                      { key: 'length', label: 'Length (cm)' },
                      { key: 'width', label: 'Width (cm)' },
                      { key: 'height', label: 'Height (cm)' },
                    ] as const
                  ).map(({ key, label }) => (
                    <Field label={label} key={key}>
                      <input
                        type="number"
                        min="0"
                        max="10000"
                        step="0.1"
                        value={item[key] || ''}
                        onChange={(event) =>
                          setItem(index, { [key]: Number(event.target.value) })
                        }
                        placeholder="Optional"
                      />
                    </Field>
                  ))}
                </div>
              </div>
            ))}
            <button
              className="button secondary"
              type="button"
              onClick={() => setItems([...items, { ...newItem }])}
            >
              <Plus size={16} />
              Add cargo item
            </button>
          </section>
        </div>
        <aside className="panel form-section booking-summary">
          <PanelTitle
            title="Pricing & payment"
            description={`${round(calcWeight)} kg chargeable weight`}
            actions={<Wallet size={18} className="muted" />}
          />
          <div className="field-grid">
            <Field label="Freight (₹)" wide>
              <input
                type="number"
                min={0}
                max={10000000}
                step="0.01"
                value={freight}
                onChange={(event) => setFreight(event.target.value)}
                placeholder={money(computed.freight)}
              />
            </Field>
            {extraCharges.map(({ key, label }) => (
              <Field label={label} key={key}>
                <input
                  type="number"
                  min={0}
                  max={key === 'gst' ? 100 : 1000000}
                  step="0.01"
                  value={charges[key]}
                  onChange={(event) =>
                    setCharges({
                      ...charges,
                      [key]: Number(event.target.value),
                    })
                  }
                />
              </Field>
            ))}
          </div>
          <dl className="amounts">
            <div>
              <dt>Subtotal</dt>
              <dd>{money(subtotal(computed))}</dd>
            </div>
            <div>
              <dt>GST</dt>
              <dd>
                {money(
                  round((Math.max(0, subtotal(computed)) * charges.gst) / 100),
                )}
              </dd>
            </div>
            <div className="amount-total">
              <dt>Total amount</dt>
              <dd>{money(amount)}</dd>
            </div>
          </dl>
          {type === 'Paid' ? (
            <Field label="Payment method">
              <select
                value={method}
                onChange={(event) => setMethod(event.target.value)}
              >
                {methods.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
          ) : (
            <p className="muted">
              {type === 'Credit'
                ? 'This booking will be billed on account.'
                : 'Collect payment at delivery.'}
            </p>
          )}
          {error && (
            <p
              className="form-error"
              id="booking-error"
              role="alert"
              tabIndex={-1}
            >
              {error}
            </p>
          )}
          <div className="booking-actions">
            <button type="submit" value="confirm" className="button primary">
              Confirm booking
              <ArrowRight size={16} />
            </button>
            <button
              type="submit"
              value="draft"
              formNoValidate
              className="button secondary"
            >
              Save draft
 