import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { ArrowDownToLine, ArrowLeft, ArrowRight, Plus } from 'lucide-react'
import {
  balance,
  branchMatches,
  groups,
  money,
  prettyDate,
  shipmentMatches,
  statuses,
  total,
  type Shipment,
  type Status,
} from './model'
import { downloadCSV, FilterSearch, PageHeading, Pagination, Tabs } from './ui'
import { useWorkspace } from './workspace'
import { ShipmentTable } from './shipment-table'

const operations: { key: string; label: string; statuses: Status[] }[] = [
  { key: '', label: 'Service allotment', statuses: ['Booked', 'Allocated'] },
  {
    key: 'dispatch',
    label: 'Dispatch management',
    statuses: ['Allocated', 'In transit'],
  },
  {
    key: 'acceptance',
    label: 'Cargo acceptance',
    statuses: ['Arrived', 'Received'],
  },
  {
    key: 'transfers',
    label: 'Branch transfers',
    statuses: ['Allocated', 'In transit', 'Arrived'],
  },
  { key: 'unassigned', label: 'Unassigned cargo', statuses: ['Booked'] },
  {
    key: 'discrepancies',
    label: 'Discrepancies',
    statuses: ['Arrived', 'Received'],
  },
]
const delivery: { key: string; label: string; statuses: Status[] }[] = [
  {
    key: '',
    label: 'Pending delivery',
    statuses: ['Arrived', 'Received', 'Out for delivery'],
  },
  {
    key: 'assignment',
    label: 'Delivery assignment',
    statuses: ['Received', 'Out for delivery'],
  },
  { key: 'completed', label: 'Completed deliveries', statuses: ['Delivered'] },
  { key: 'proof', label: 'Proof of delivery', statuses: ['Delivered'] },
]
const bookingViews = [
  { label: 'All shipments', to: '/shipments' },
  { label: 'Drafts', to: '/shipments?status=Draft' },
  { label: 'LR history', to: '/shipments?view=history' },
  { label: 'Cancelled', to: '/shipments?status=Cancelled' },
]
const reportViews = [
  { label: 'LR booking report', status: '' },
  { label: 'Dispatch report', status: 'In transit' },
  { label: 'Cargo acceptance', status: 'Received' },
  { label: 'Pending delivery', status: 'Out for delivery' },
  { label: 'Delivered cargo', status: 'Delivered' },
  { label: 'Cancellation report', status: 'Cancelled' },
  { label: 'To-Pay report', status: 'To-Pay' },
  { label: 'Customer outstanding', status: 'Outstanding' },
]

export function Shipments() {
  const { state, branch } = useWorkspace()
  const location = useLocation()
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [status, setStatus] = useState(params.get('status') ?? '')
  const [from, setFrom] = useState(params.get('from') ?? '')
  const [until, setUntil] = useState(params.get('until') ?? '')
  const [report, setReport] = useState('')
  const [page, setPage] = useState(1)
  const [oldest, setOldest] = useState(false)
  const isOps = location.pathname === '/operations'
  const isDelivery = location.pathname === '/delivery'
  const isReport = location.pathname === '/reports'
  const isHistory = params.get('view') === 'history'
  const queueList = isOps ? operations : isDelivery ? delivery : null
  const queue =
    queueList?.find((item) => item.key === (params.get('queue') ?? '')) ??
    queueList?.[0]
  const group = groups.find((item) => item.label === params.get('group'))
  const confirmed = params.get('view') === 'confirmed'
  const allowed =
    queue?.statuses ??
    group?.statuses ??
    (confirmed ? statuses.filter((item) => item !== 'Draft') : statuses)
  const title = isOps
    ? 'Cargo operations'
    : isDelivery
      ? 'Delivery'
      : isReport
        ? 'Reports'
        : 'Bookings'
  const description = isOps
    ? 'Allot consignments, dispatch trips, and receive incoming cargo.'
    : isDelivery
      ? 'Assign consignments and review proof of delivery.'
      : isReport
        ? 'Filter booking and movement records for analysis or export.'
        : 'Search, filter, and manage your lorry receipts.'
  const tabs = queueList
    ? queueList.map((item) => ({
        label: item.label,
        to: `${location.pathname}${item.key ? `?queue=${item.key}` : ''}`,
      }))
    : bookingViews
  const data = state.shipments
    .filter((shipment) => {
      const filterReport =
        !report ||
        (report === 'Outstanding'
          ? balance(shipment) > 0
          : report === 'To-Pay'
            ? shipment.type === report
            : shipment.status === report)
      const queueMatch =
        queue?.key === 'discrepancies'
          ? shipment.events.some((event) =>
              event.note?.startsWith('Discrepancy:'),
            )
          : queue?.key === 'proof'
            ? !!shipment.proof
            : queue?.key === 'transfers'
              ? !!shipment.trip
              : true
      return (
        branchMatches(shipment, branch) &&
        allowed.includes(shipment.status) &&
        (!status || status === shipment.status) &&
        (!from || shipment.date >= from) &&
        (!until || shipment.date <= until) &&
        shipmentMatches(shipment, query, state.branches) &&
        queueMatch &&
        filterReport
      )
    })
    .sort(
      (a, b) =>
        (oldest ? 1 : -1) *
        (a.date.localeCompare(b.date) || a.lr.localeCompare(b.lr)),
    )
  const size = 12
  const pages = Math.max(1, Math.ceil(data.length / size))
  const current = Math.min(page, pages)
  const visible = data.slice((current - 1) * size, current * size)
  const csv = () =>
    downloadCSV('cargoos-shipments.csv', [
      [
        'LR number',
        'Booking date',
        'Sender',
        'Origin',
        'Destination',
        'Status',
        'LR type',
        'Amount INR',
        'Outstanding INR',
      ],
      ...data.map((shipment) => [
        shipment.lr,
        shipment.date,
        shipment.sender.name,
        shipment.origin,
        shipment.destination,
        shipment.status,
        shipment.type,
        total(shipment.charges),
        balance(shipment),
      ]),
    ])
  const clear = () => {
    setQuery('')
    setStatus('')
    setFrom('')
    setUntil('')
    setReport('')
    setPage(1)
  }

  return (
    <>
      <PageHeading
        title={title}
        description={description}
        actions={
          isReport ? (
            <button className="button primary" onClick={csv}>
              <ArrowDownToLine size={16} />
              Export CSV
            </button>
          ) : (
            !queue && (
              <Link to="/booking/new" className="button primary">
                <Plus size={18} />
                New booking
              </Link>
            )
          )
        }
      />
      {!isReport && <Tabs items={tabs} />}
      <section className="panel list-panel">
        <div className="filter-bar">
          <FilterSearch
            label="Search LR, sender or route"
            value={query}
            onChange={(value) => {
              setQuery(value)
              setPage(1)
            }}
          />
          {isReport && (
            <select
              aria-label="Report type"
              value={report}
              onChange={(event) => {
                setReport(event.target.value)
                setPage(1)
              }}
            >
              {reportViews.map((item) => (
                <option key={item.label} value={item.status}>
                  {item.label}
                </option>
              ))}
            </select>
          )}
          <select
            aria-label="Shipment status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setPage(1)
            }}
          >
            <option value="">All statuses</option>
            {allowed.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          {(isReport || from || until) && (
            <>
              <label className="inline-date">
                From{' '}
                <input
                  aria-label="From date"
                  type="date"
                  value={from}
                  max={until || undefined}
                  onChange={(event) => {
                    setFrom(event.target.value)
                    setPage(1)
                  }}
                />
              </label>
              <label className="inline-date">
                To{' '}
                <input
                  aria-label="To date"
                  type="date"
                  value={until}
                  min={from || undefined}
                  onChange={(event) => {
                    setUntil(event.target.value)
                    setPage(1)
                  }}
                />
              </label>
            </>
          )}
          <button
            className="button secondary small"
            onClick={() => {
              setOldest(!oldest)
              setPage(1)
            }}
          >
            {oldest ? 'Oldest first' : 'Newest first'}
          </button>
          {(query || status || from || until || report || group) &&
            (group ? (
              <Link className="text-button" to="/shipments">
                Clear filters
              </Link>
            ) : (
              <button className="text-button" onClick={clear}>
                Clear filters
              </button>
            ))}
        </div>
        {(queue || group || confirmed) && (
          <div className="queue-title">
            <strong>
              {queue?.label ?? group?.label ?? 'Confirmed bookings'}
            </strong>
            <span>{data.length} consignments</span>
          </div>
        )}
        {isHistory ? (
          <History shipments={visible} />
        ) : (
          <ShipmentTable
            shipments={visible}
            branches={state.branches}
            caption={queue?.label ?? title}
          />
        )}
        <Pagination
          total={data.length}
          page={current}
          size={size}
          onPage={setPage}
        />
      </section>
      {group && (
        <Link className="back-link list-back" to="/">
          <ArrowLeft size={15} />
          Back to dashboard
        </Link>
      )}
    </>
  )
}

function History({ shipments }: { shipments: Shipment[] }) {
  return (
    <div className="history-list">
      {shipments.map((shipment) => (
        <div key={shipment.id}>
          <Link className="lr-link" to={`/shipments/${shipment.lr}`}>
            {shipment.lr}
          </Link>
          <span>{shipment.sender.name}</span>
          <span>{shipment.events.length} events</span>
          <span>{prettyDate(shipment.date)}</span>
          <Link
            to={`/shipments/${shipment.lr}`}
            aria-label={`View history for ${shipment.lr}`}
          >
            <ArrowRight size={16} />
          </Link>
        </div>
      ))}
      {!shipments.length && (
        <p className="muted">No shipment history matches your filters.</p>
      )}
    </div>
  )
}
