import { useState, type FormEvent } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { ArrowRight, Bell, CheckCheck, Pencil, Plus, Save } from 'lucide-react'
import {
  active,
  balance,
  branchMatches,
  money,
  number,
  prettyDate,
  today,
  total,
  type State,
} from './model'
import {
  Badge,
  downloadCSV,
  Empty,
  ExportButton,
  Field,
  FilterSearch,
  Modal,
  PageHeading,
  Pagination,
  PanelTitle,
  RouteLabel,
  Tabs,
} from './ui'
import { ShipmentTable } from './shipment-table'
import { useWorkspace } from './workspace'

type DirectoryKey =
  'branches' | 'customers' | 'agents' | 'vehicles' | 'trips' | 'masters'
type DirectoryRecord = State[DirectoryKey][number]
type Column = {
  key: string
  label: string
  type?: 'number' | 'date' | 'tel'
  options?: { label: string; value: string }[]
  optional?: boolean
}
const option = (label: string) => ({ label, value: label })
const contactFields: Column[] = [
  { key: 'name', label: 'Name' },
  { key: 'city', label: 'City' },
  { key: 'phone', label: 'Phone', type: 'tel', optional: true },
]

export function Directory() {
  const { state, branch, update, notify } = useWorkspace()
  const location = useLocation()
  const [params] = useSearchParams()
  const view = params.get('view')
  const [query, setQuery] = useState('')
  const [editor, setEditor] = useState<DirectoryRecord | 'new' | null>(null)
  const [manifest, setManifest] = useState<State['trips'][number] | null>(null)
  const [error, setError] = useState('')
  const customerPage = location.pathname === '/customers'
  const fleetPage = location.pathname === '/fleet'
  const branchPage = location.pathname === '/branches'
  const key: DirectoryKey = customerPage
    ? view === 'agents'
      ? 'agents'
      : 'customers'
    : fleetPage
      ? view === 'trips'
        ? 'trips'
        : 'vehicles'
      : branchPage
        ? 'branches'
        : 'masters'
  const title = customerPage
    ? 'Customers & agents'
    : fleetPage
      ? 'Fleet management'
      : branchPage
        ? 'Branch management'
        : 'Masters'
  const descriptions = {
    branches: 'Manage branches and review activity across your network.',
    customers:
      'Manage shipper profiles, corporate accounts, and booking agents.',
    agents: 'Manage shipper profiles, corporate accounts, and booking agents.',
    vehicles: 'Manage vehicles, drivers, and trips used for cargo allotment.',
    trips: 'Manage vehicles, drivers, and trips used for cargo allotment.',
    masters: 'Manage the reference data used across bookings and operations.',
  }
  const nouns = {
    branches: 'branch',
    customers: 'customer',
    agents: 'agent',
    vehicles: 'vehicle',
    trips: 'trip',
    masters: 'master record',
  }
  const noun = nouns[key]
  const branchOptions = state.branches.map((item) => ({
    label: item.name,
    value: item.id,
  }))
  const fields: Record<DirectoryKey, Column[]> = {
    branches: [
      { key: 'id', label: 'Branch code' },
      { key: 'name', label: 'Branch name' },
      { key: 'city', label: 'City' },
      { key: 'state', label: 'State' },
      { key: 'manager', label: 'Manager' },
    ],
    customers: [
      ...contactFields,
      {
        key: 'category',
        label: 'Category',
        options: ['Individual', 'Business', 'Corporate', 'Credit customer'].map(
          option,
        ),
      },
    ],
    agents: [
      ...contactFields,
      {
        key: 'category',
        label: 'Category',
        options: ['Branch agent', 'Independent agent'].map(option),
      },
    ],
    vehicles: [
      { key: 'registration', label: 'Registration' },
      { key: 'type', label: 'Vehicle type' },
      { key: 'capacity', label: 'Capacity (kg)', type: 'number' },
      { key: 'driver', label: 'Assigned driver' },
      {
        key: 'status',
        label: 'Status',
        options: ['Available', 'Maintenance', 'Inactive'].map(option),
      },
    ],
    trips: [
      { key: 'code', label: 'Trip code' },
      {
        key: 'vehicle',
        label: 'Vehicle',
        options: state.vehicles
          .filter((vehicle) => vehicle.status === 'Available')
          .map((item) => ({ value: item.id, label: item.registration })),
      },
      { key: 'driver', label: 'Driver' },
      { key: 'origin', label: 'Origin', options: branchOptions },
      { key: 'destination', label: 'Destination', options: branchOptions },
      { key: 'date', label: 'Departure date', type: 'date' },
    ],
    masters: [
      {
        key: 'category',
        label: 'Category',
        options: [
          'Package type',
          'Item category',
          'Service type',
          'Transport mode',
          'Delivery reason',
          'Cancellation reason',
          'Charge type',
          'Payment method',
          'Vehicle type',
          'City',
          'State',
          'PIN code',
          'GST rate',
        ].map(option),
      },
      { key: 'name', label: 'Name' },
    ],
  }
  const columns = fields[key]
  const rows = (state[key] as DirectoryRecord[]).filter(
    (row) =>
      (view !== 'corporate' ||
        ('category' in row && row.category === 'Corporate')) &&
      (view !== 'drivers' || ('driver' in row && !!row.driver)) &&
      (view !== 'maintenance' ||
        ('status' in row && row.status === 'Maintenance')) &&
      (!branch ||
        key !== 'trips' ||
        ('origin' in row &&
          (row.origin === branch || row.destination === branch))) &&
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(query.trim().toLowerCase()),
      ),
  )
  const tabs = customerPage
    ? [
        { label: 'Customers', to: '/customers' },
        { label: 'Corporate customers', to: '/customers?view=corporate' },
        { label: 'Agents', to: '/customers?view=agents' },
      ]
    : fleetPage
      ? [
          { label: 'Vehicles', to: '/fleet' },
          { label: 'Drivers', to: '/fleet?view=drivers' },
          { label: 'Trips', to: '/fleet?view=trips' },
          { label: 'Maintenance', to: '/fleet?view=maintenance' },
        ]
      : branchPage
        ? [
            { label: 'Branches', to: '/branches' },
            { label: 'Branch performance', to: '/branches?view=performance' },
          ]
        : null
  const read = (record: DirectoryRecord, property: string) =>
    (record as unknown as Record<string, string | number>)[property]
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const record: Record<string, string | number> = {}
    for (const field of columns) {
      const value = String(
        data.get(field.key) ??
          (editor && editor !== 'new' ? read(editor, field.key) : ''),
      ).trim()
      if (!field.optional && !value)
        return setError(`Enter ${field.label.toLowerCase()}.`)
      record[field.key] = field.type === 'number' ? Number(value) : value
    }
    if (key === 'trips' && record.origin === record.destination)
      return setError('Choose different origin and destination branches.')
    if (
      key === 'trips' &&
      editor &&
      editor !== 'new' &&
      state.shipments.some((shipment) => shipment.trip === editor.id)
    )
      return setError('This trip already has assigned shipments.')
    if (key === 'branches') record.id = String(record.id).toUpperCase()
    const id =
      editor && editor !== 'new'
        ? editor.id
        : String(record.id ?? crypto.randomUUID())
    const unique =
      key === 'branches'
        ? 'id'
        : key === 'trips'
          ? 'code'
          : key === 'vehicles'
            ? 'registration'
            : null
    if (
      unique &&
      state[key].some(
        (row) =>
          row.id !== (editor !== 'new' ? editor?.id : undefined) &&
          String(read(row, unique)).toLowerCase() ===
            String(record[unique]).toLowerCase(),
      )
    )
      return setError(
        `${columns.find((item) => item.key === unique)?.label} already exists.`,
      )
    const updated = { ...record, id } as DirectoryRecord
    update((current) => ({
      ...current,
      [key]:
        editor === 'new'
          ? [...current[key], updated]
          : current[key].map((item) => (item.id === id ? updated : item)),
    }))
    setEditor(null)
    notify(`${noun[0].toUpperCase() + noun.slice(1)} saved`)
  }

  const visibleColumns =
    view === 'drivers'
      ? columns.filter((column) =>
          ['driver', 'registration', 'status'].includes(column.key),
        )
      : columns
  return (
    <>
      <PageHeading
        title={title}
        description={descriptions[key]}
        actions={
          view !== 'performance' && (
            <button
              className="button primary"
              onClick={() => {
                setError('')
                setEditor('new')
              }}
            >
              <Plus size={17} />
              Add {noun}
            </button>
          )
        }
      />
      {tabs && <Tabs items={tabs} />}
      {view === 'performance' ? (
        <BranchPerformance />
      ) : (
        <section className="panel list-panel">
          <div className="filter-bar">
            <FilterSearch
              label={`Search ${key}`}
              value={query}
              onChange={setQuery}
            />
          </div>
          {rows.length ? (
            <div className="table-scroll">
              <table className="data-table directory-table">
                <thead>
                  <tr>
                    {visibleColumns.map((field) => (
                      <th key={field.key}>{field.label}</th>
                    ))}
                    <th>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      {visibleColumns.map((field) => (
                        <td key={field.key}>
                          {field.key === 'status' ? (
                            <Badge
                              status={String(read(row, field.key))}
                              tone={
                                read(row, field.key) === 'Available'
                                  ? 'green'
                                  : 'amber'
                              }
                            />
                          ) : (
                            (field.options?.find(
                              (item) => item.value === read(row, field.key),
                            )?.label ??
                              read(row, field.key)) ||
                            '—'
                          )}
                        </td>
                      ))}
                      <td className="actions-cell">
                        {key === 'trips' && (
                          <button
                            className="text-button"
                            onClick={() =>
                              setManifest(row as State['trips'][number])
                            }
                          >
                            Manifest
                          </button>
                        )}
                        <button
                          className="icon-button"
                          aria-label={`Edit ${noun} ${String(read(row, visibleColumns[0].key))}`}
                          onClick={() => {
                            setError('')
                            setEditor(row)
                          }}
                        >
                          <Pencil size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty />
          )}
        </section>
      )}
      {editor && (
        <Modal
          title={`${editor === 'new' ? 'Add' : 'Edit'} ${noun}`}
          onClose={() => setEditor(null)}
        >
          <form className="dialog-form" onSubmit={save}>
            <div className="field-grid">
              {columns.map((field) => (
                <Field label={field.label} key={field.key}>
                  {field.options ? (
                    <select
                      name={field.key}
                      required={!field.optional}
                      defaultValue={
                        editor === 'new'
                          ? field.key === 'category' && view === 'corporate'
                            ? 'Corporate'
                            : ''
                          : read(editor, field.key)
                      }
                    >
                      <option value="">
                        Select {field.label.toLowerCase()}
                      </option>
                      {field.options.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name={field.key}
                      required={!field.optional}
                      maxLength={120}
                      min={field.type === 'number' ? 1 : undefined}
                      type={field.type ?? 'text'}
                      disabled={field.key === 'id' && editor !== 'new'}
                      defaultValue={
                        editor === 'new'
                          ? field.type === 'date'
                            ? today
                            : ''
                          : read(editor, field.key)
                      }
                    />
                  )}
                </Field>
              ))}
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="dialog-actions">
              <button
                className="button secondary"
                type="button"
                onClick={() => setEditor(null)}
              >
                Cancel
              </button>
              <button className="button primary">Save {noun}</button>
            </div>
          </form>
        </Modal>
      )}
      {manifest && (
        <Modal
          title={`${manifest.code} manifest`}
          onClose={() => setManifest(null)}
        >
          <div className="dialog-form">
            <RouteLabel
              from={
                state.branches.find((item) => item.id === manifest.origin)
                  ?.city ?? manifest.origin
              }
              to={
                state.branches.find((item) => item.id === manifest.destination)
                  ?.city ?? manifest.destination
              }
            />
            <div className="manifest-list">
              {state.shipments
                .filter((item) => item.trip === manifest.id)
                .map((item) => (
                  <Link key={item.id} to={`/shipments/${item.lr}`}>
                    {item.lr}
                    <Badge status={item.status} />
                  </Link>
                ))}
            </div>
            {!state.shipments.some((item) => item.trip === manifest.id) && (
              <p className="muted">
                No shipments have been allotted to this trip.
              </p>
            )}
          </div>
        </Modal>
      )}
    </>
  )
}

function BranchPerformance() {
  const { state } = useWorkspace()
  return (
    <section className="panel list-panel">
      <PanelTitle
        title="Branch performance"
        description="Booking and delivery activity by origin branch"
      />
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Branch</th>
              <th>Bookings</th>
              <th>Delivered</th>
              <th>Booked value</th>
              <th>Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {state.branches.map((branch) => {
              const bookings = state.shipments.filter(
                (item) => item.origin === branch.id && active(item),
              )
              return (
                <tr key={branch.id}>
                  <td>{branch.name}</td>
                  <td>{number(bookings.length)}</td>
                  <td>
                    {number(
                      bookings.filter((item) => item.status === 'Delivered')
                        .length,
                    )}
                  </td>
                  <td>
                    {money(
                      bookings.reduce(
                        (sum, item) => sum + total(item.charges),
                        0,
                      ),
                    )}
                  </td>
                  <td>
                    {money(
                      bookings.reduce((sum, item) => sum + balance(item), 0),
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function Accounts() {
  const { state, branch, update, notify } = useWorkspace()
  const [params] = useSearchParams()
  const view = params.get('view') ?? ''
  const [expense, setExpense] = useState(false)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const scope = state.shipments.filter((item) => branchMatches(item, branch))
  const payments = scope
    .flatMap((item) =>
      item.payments.map((payment) => ({
        ...payment,
        lr: item.lr,
        sender: item.sender.name,
      })),
    )
    .sort((a, b) => b.date.localeCompare(a.date) || b.lr.localeCompare(a.lr))
  const outstanding = scope.filter((item) => balance(item) > 0)
  const expenses = state.expenses.filter(
    (item) => !branch || branch === item.branch,
  )
  const tabs = [
    { label: 'Payments', to: '/accounts' },
    { label: 'Outstanding', to: '/accounts?view=outstanding' },
    { label: 'Customer ledger', to: '/accounts?view=ledger' },
    { label: 'Expenses', to: '/accounts?view=expenses' },
  ]
  const includes = (...values: string[]) =>
    values.some((value) =>
      value.toLowerCase().includes(query.trim().toLowerCase()),
    )
  const matchingPayments = payments.filter((item) =>
    includes(item.lr, item.sender, item.method),
  )
  const matchingOutstanding = outstanding.filter((item) =>
    includes(item.lr, item.sender.name),
  )
  const matchingExpenses = expenses.filter((item) =>
    includes(item.description, item.category),
  )
  const exportData = () => {
    if (view === 'expenses')
      downloadCSV('cargoos-expenses.csv', [
        ['Date', 'Description', 'Category', 'Amount'],
        ...matchingExpenses.map((item) => [
          item.date,
          item.description,
          item.category,
          item.amount,
        ]),
      ])
    else if (view === 'outstanding')
      downloadCSV('cargoos-outstanding.csv', [
        ['LR', 'Customer', 'Date', 'Outstanding'],
        ...matchingOutstanding.map((item) => [
          item.lr,
          item.sender.name,
          item.date,
          balance(item),
        ]),
      ])
    else if (view === 'ledger')
      downloadCSV('cargoos-customer-ledger.csv', [
        ['Customer', 'Open LRs', 'Outstanding'],
        ...ledger.map(([name, items]) => [
          name,
          items.length,
          items.reduce((sum, item) => sum + balance(item), 0),
        ]),
      ])
    else
      downloadCSV('cargoos-payments.csv', [
        ['Date', 'LR', 'Customer', 'Method', 'Amount'],
        ...matchingPayments.map((item) => [
          item.date,
          item.lr,
          item.sender,
          item.method,
          item.amount,
        ]),
      ])
  }
  function saveExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const item = {
      id: crypto.randomUUID(),
      description: String(form.get('description')).trim(),
      category: String(form.get('category')),
      amount: Number(form.get('amount')),
      date: String(form.get('date')),
      branch: String(form.get('branch')),
    }
    if (!item.description) return
    update((current) => ({ ...current, expenses: [item, ...current.expenses] }))
    setExpense(false)
    notify('Expense recorded')
  }
  const ledger = [
    ...outstanding.reduce(
      (groups, item) =>
        groups.set(item.sender.name, [
          ...(groups.get(item.sender.name) ?? []),
          item,
        ]),
      new Map<string, typeof outstanding>(),
    ),
  ].filter(([name]) => includes(name))
  const totalRows =
    view === 'expenses'
      ? matchingExpenses.length
      : view === 'ledger'
        ? ledger.length
        : view === 'outstanding'
          ? matchingOutstanding.length
          : matchingPayments.length
  const size = 15
  const current = Math.min(page, Math.max(1, Math.ceil(totalRows / size)))
  const visible = <T,>(rows: T[]) =>
    rows.slice((current - 1) * size, current * size)
  return (
    <>
      <PageHeading
        title="Accounts"
        description="Review collections, outstanding amounts, and branch expenses."
        actions={
          <>
            <ExportButton onClick={exportData} />
            {view === 'expenses' && (
              <button
                className="button primary"
                onClick={() => setExpense(true)}
              >
                <Plus size={17} />
                Record expense
              </button>
            )}
          </>
        }
      />
      <div className="account-totals">
        <div className="panel">
          <span>Net collections</span>
          <strong>
            {money(payments.reduce((sum, item) => sum + item.amount, 0))}
          </strong>
        </div>
        <div className="panel">
          <span>Outstanding payments</span>
          <strong>
            {money(outstanding.reduce((sum, item) => sum + balance(item), 0))}
          </strong>
        </div>
        <div className="panel">
          <span>Expenses</span>
          <strong>
            {money(expenses.reduce((sum, item) => sum + item.amount, 0))}
          </strong>
        </div>
      </div>
      <Tabs items={tabs} />
      <section className="panel list-panel">
        <div className="filter-bar">
          <FilterSearch
            value={query}
            onChange={(value) => {
              setQuery(value)
              setPage(1)
            }}
          />
        </div>
        {!totalRows ? (
          <Empty />
        ) : view === 'outstanding' ? (
          <ShipmentTable
            shipments={visible(matchingOutstanding)}
            branches={state.branches}
            caption="Outstanding shipments"
          />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  {(view === 'expenses'
                    ? ['Description', 'Category', 'Date', 'Amount']
                    : view === 'ledger'
                      ? ['Customer', 'Open LRs', 'Outstanding']
                      : ['LR number', 'Customer', 'Method', 'Date', 'Amount']
                  ).map((label) => (
                    <th key={label}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {view === 'expenses'
                  ? visible(matchingExpenses).map((item) => (
                      <tr key={item.id}>
                        <td>{item.description}</td>
                        <td>{item.category}</td>
                        <td>{prettyDate(item.date)}</td>
                        <td>{money(item.amount)}</td>
                      </tr>
                    ))
                  : view === 'ledger'
                    ? visible(ledger).map(([name, items]) => (
                        <tr key={name}>
                          <td>{name}</td>
                          <td>{items.length}</td>
                          <td>
                            {money(
                              items.reduce(
                                (sum, item) => sum + balance(item),
                                0,
                              ),
                            )}
                          </td>
                        </tr>
                      ))
                    : visible(matchingPayments).map((item) => (
                        <tr key={item.id}>
                          <td>
                            <Link
                              to={`/shipments/${item.lr}`}
                              className="lr-link"
                            >
                              {item.lr}
                            </Link>
                          </td>
                          <td>{item.sender}</td>
                          <td>{item.method}</td>
                          <td>{prettyDate(item.date)}</td>
                          <td>{money(item.amount)}</td>
                        </tr>
                      ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          total={totalRows}
          page={current}
          size={size}
          onPage={setPage}
        />
      </section>
      {expense && (
        <Modal title="Record expense" onClose={() => setExpense(false)}>
          <form className="dialog-form" onSubmit={saveExpense}>
            <Field label="Description">
              <input name="description" required maxLength={160} />
            </Field>
            <div className="field-grid">
              <Field label="Category">
                <select name="category">
                  <option>Fuel</option>
                  <option>Maintenance</option>
                  <option>Loading</option>
                  <option>Office</option>
                  <option>Other</option>
                </select>
              </Field>
              <Field label="Amount (₹)">
                <input
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                />
              </Field>
              <Field label="Branch">
                <select name="branch" defaultValue={branch}>
                  {state.branches.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Date">
                <input
                  name="date"
                  type="date"
                  defaultValue={today}
                  max={today}
                  required
                />
              </Field>
            </div>
            <div className="dialog-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setExpense(false)}
              >
                Cancel
              </button>
              <button className="button primary">Record expense</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

export function Administration() {
  const { state, update, notify } = useWorkspace()
  const [settings, setSettings] = useState(state.settings)
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!settings.company.trim() || !settings.operator.trim()) return
    update((current) => ({
      ...current,
      settings: {
        ...settings,
        company: settings.company.trim(),
        operator: settings.operator.trim(),
      },
    }))
    notify('Workspace settings saved')
  }
  return (
    <>
      <PageHeading
        title="Administration"
        description="Manage company details, booking defaults, and delivery verification."
      />
      <form className="settings-layout" onSubmit={save}>
        <section className="panel form-section">
          <PanelTitle title="Workspace settings" />
          <div className="field-grid">
            <Field label="Company name">
              <input
                required
                maxLength={100}
                value={settings.company}
                onChange={(event) =>
                  setSettings({ ...settings, company: event.target.value })
                }
              />
            </Field>
            <Field label="Operator name">
              <input
                required
                maxLength={60}
                value={settings.operator}
                onChange={(event) =>
                  setSettings({ ...settings, operator: event.target.value })
                }
              />
            </Field>
          </div>
        </section>
        <section className="panel form-section">
          <PanelTitle
            title="Pricing defaults"
            description="Applied to new bookings"
          />
          <div className="field-grid">
            <Field label="Freight rate per kg (₹)">
              <input
                required
                type="number"
                min={1}
                max={10000}
                step="0.01"
                value={settings.rate}
                onChange={(event) =>
                  setSettings({ ...settings, rate: Number(event.target.value) })
                }
              />
            </Field>
            <Field label="GST (%)">
              <input
                required
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={settings.gst}
                onChange={(event) =>
                  setSettings({ ...settings, gst: Number(event.target.value) })
                }
              />
            </Field>
          </div>
        </section>
        <section className="panel form-section">
          <PanelTitle title="Delivery verification" />
          <label className="check-label">
            <input
              type="checkbox"
              checked={settings.pod}
              onChange={(event) =>
                setSettings({ ...settings, pod: event.target.checked })
              }
            />
            Require the recipient’s name when recording delivery
          </label>
        </section>
        <div>
          <button className="button primary">
            <Save size={16} />
            Save settings
          </button>
        </div>
      </form>
    </>
  )
}

export function Notifications() {
  const { state, branch, update, notify } = useWorkspace()
  const [onlyUnread, setOnlyUnread] = useState(false)
  const events = state.shipments
    .filter((item) => branchMatches(item, branch))
    .flatMap((shipment) =>
      shipment.events.map((event) => ({
        ...event,
        id: `${shipment.id}-${event.date}`,
        lr: shipment.lr,
        origin: shipment.origin,
        destination: shipment.destination,
      })),
    )
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, 40)
  const visible = events.filter(
    (event) => !onlyUnread || !state.readEvents.includes(event.id),
  )
  function mark(ids: string[]) {
    update((current) => ({
      ...current,
      readEvents: [...new Set([...current.readEvents, ...ids])],
    }))
  }
  return (
    <>
      <PageHeading
        title="Notifications"
        description="Recent shipment activity in your selected branch scope."
        actions={
          <button
            className="button secondary"
            onClick={() => {
              mark(events.map((item) => item.id))
              notify('Notifications marked as read')
            }}
            disabled={events.every((item) =>
              state.readEvents.includes(item.id),
            )}
          >
            <CheckCheck size={17} />
            Mark all as read
          </button>
        }
      />
      <section className="panel list-panel">
        <div className="filter-bar">
          <label className="check-label">
            <input
              type="checkbox"
              checked={onlyUnread}
              onChange={(event) => setOnlyUnread(event.target.checked)}
            />
            Unread only
          </label>
        </div>
        {visible.length ? (
          <div className="notifications-list">
            {visible.map((event) => (
              <Link
                key={event.id}
                to={`/shipments/${event.lr}`}
                onClick={() => mark([event.id])}
              >
                <span className="notification-icon">
                  <Bell size={16} />
                </span>
                <div>
                  <strong>
                    {event.lr} · {event.status}
                  </strong>
                  <small>
                    {event.note ?? `${event.origin} to ${event.destination}`}
                  </small>
                </div>
                <time>{prettyDate(event.date)}</time>
                {!state.readEvents.includes(event.id) && <i />}
                <ArrowRight size={16} />
              </Link>
            ))}
          </div>
        ) : (
          <Empty
            title="No notifications"
            message="New shipment events appear here."
          />
        )}
      </section>
    </>
  )
}
