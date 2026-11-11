import {
  cloneElement,
  useEffect,
  useId,
  useRef,
  type ReactElement,
  type ReactNode,
} from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ArrowDownToLine,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Package,
  Search,
  X,
} from 'lucide-react'
import { statusTone, type Status } from './model'

export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="CargoOS dashboard">
      <span className="brand-icon">
        <Package size={22} strokeWidth={2} />
      </span>
      <span>
        Cargo<span className="brand-os">OS</span>
      </span>
    </Link>
  )
}

export function PageHeading({
  title,
  description,
  actions,
}: {
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="heading-actions">{actions}</div>}
    </div>
  )
}

export function PanelTitle({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="panel-title">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {actions}
    </div>
  )
}

export function Badge({ status, tone }: { status: string; tone?: string }) {
  return (
    <span
      className={`badge ${tone ?? statusTone[status as Status] ?? 'neutral'}`}
    >
      <span aria-hidden="true" />
      {status}
    </span>
  )
}

export function Empty({
  title = 'No records found',
  message = 'Try another search or clear your filters.',
}: {
  title?: string
  message?: string
}) {
  return (
    <div className="empty">
      <Package size={26} />
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  )
}

export function FilterSearch({
  value,
  onChange,
  label = 'Search records',
}: {
  value: string
  onChange: (value: string) => void
  label?: string
}) {
  return (
    <label className="filter-search">
      <Search size={16} />
      <input
        aria-label={label}
        placeholder={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

export function Breadcrumb({
  items,
}: {
  items: { label: string; to?: string }[]
}) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={item.label}>
          {index > 0 && <ChevronRight size={13} />}
          {item.to ? (
            <Link to={item.to}>{item.label}</Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

export function Tabs({ items }: { items: { label: string; to: string }[] }) {
  const location = useLocation()
  return (
    <nav className="tabs" aria-label="Page sections">
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          aria-current={
            item.to === location.pathname + location.search ? 'page' : undefined
          }
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    ref.current?.showModal()
  }, [])
  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="dialog-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="dialog-inner">
        <div className="dialog-heading">
          <h2 id="dialog-title">{title}</h2>
          <button
            type="button"
            aria-label="Close dialog"
            className="icon-button"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}

export function Field({
  label,
  children,
  wide,
}: {
  label: string
  children: ReactElement<{ id?: string }>
  wide?: boolean
}) {
  const id = useId()
  return (
    <div className={`field ${wide ? 'wide' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {cloneElement(children, { id })}
    </div>
  )
}

export function RouteLabel({ from, to }: { from: string; to: string }) {
  return (
    <span className="route-label">
      {from}
      <ArrowRight size={12} aria-label="to" />
      {to}
    </span>
  )
}

export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((value) => {
          const safe =
            typeof value === 'string' && /^[\s]*[=+@-]/.test(value)
              ? `'${value}`
              : String(value)
          return `"${safe.replaceAll('"', '""')}"`
        })
        .join(','),
    )
    .join('\r\n')
  const url = URL.createObjectURL(
    new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8;' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function ExportButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="button secondary" onClick={onClick}>
      <ArrowDownToLine size={16} />
      Export CSV
    </button>
  )
}

export function Pagination({
  total,
  page,
  size,
  onPage,
}: {
  total: number
  page: number
  size: number
  onPage: (page: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / size))
  return (
    <div className="pagination">
      <span>
        {total
          ? `Showing ${(page - 1) * size + 1}–${Math.min(page * size, total)} of ${total.toLocaleString('en-IN')}`
          : '0 results'}
      </span>
      <div>
        <button
          className="button secondary small"
          aria-label="Previous page"
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <span>
          Page {page} of {pages}
        </span>
        <button
          className="button secondary small"
          aria-label="Next page"
          disabled={page === pages}
          onClick={() => onPage(page + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
