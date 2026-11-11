import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  IndianRupee,
  ClipboardList,
  PackageCheck,
  Plus,
  Truck,
  Warehouse,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  balance,
  branchMatches,
  dateOffset,
  groups,
  money,
  number,
  prettyDate,
  statusTone,
  today,
} from './model'
import { PageHeading, PanelTitle } from './ui'
import { useWorkspace } from './workspace'
import { ShipmentTable } from './shipment-table'

function delta(value: number, previous: number) {
  return previous ? ((value - previous) / previous) * 100 : null
}
function Trend({ change, suffix }: { change: number | null; suffix: string }) {
  if (change === null) return <span className="metric-context">{suffix}</span>
  const Icon = change >= 0 ? ArrowUpRight : ArrowDownRight
  return (
    <span className="trend-wrap">
      <span className={`trend ${change >= 0 ? 'positive' : 'negative'}`}>
        <Icon size={13} />
        {Math.abs(change).toFixed(1)}%
      </span>
      <span className="metric-context">{suffix}</span>
    </span>
  )
}

export function Dashboard() {
  const { state, branch } = useWorkspace()
  const [days, setDays] = useState(7)
  const firstDay = dateOffset(1 - days)
  const prevFirst = dateOffset(1 - days * 2)
  const scope = useMemo(
    () => state.shipments.filter((shipment) => branchMatches(shipment, branch)),
    [state.shipments, branch],
  )
  const bookings = scope.filter(
    (shipment) =>
      shipment.date >= firstDay &&
      shipment.date <= today &&
      shipment.status !== 'Draft',
  )
  const previous = scope.filter(
    (shipment) =>
      shipment.date >= prevFirst &&
      shipment.date < firstDay &&
      shipment.status !== 'Draft',
  )
  const receipts = scope.flatMap((shipment) => shipment.payments)
  const revenueOn = (date: string) =>
    receipts.reduce(
      (sum, payment) =>
        payment.date.slice(0, 10) === date ? sum + payment.amount : sum,
      0,
    )
  const revenue = revenueOn(today)
  const transit = bookings.filter(
    (shipment) => shipment.status === 'In transit',
  ).length
  const awaiting = bookings.filter((shipment) =>
    groups[2].statuses.includes(shipment.status),
  ).length
  const delivered = bookings.filter(
    (shipment) => shipment.status === 'Delivered',
  ).length
  const series = Array.from({ length: days }, (_, index) => {
    const day = dateOffset(index, firstDay)
    return {
      label: prettyDate(day, { day: 'numeric', month: 'short' }),
      bookings: bookings.filter((shipment) => shipment.date === day).length,
    }
  })
  const groupUrl = (label: string) =>
    `/shipments?group=${encodeURIComponent(label)}&from=${firstDay}&until=${today}`
  const chartGroups = groups.map((group) => ({
    ...group,
    fill: `var(--status-${statusTone[group.statuses[0]]})`,
    value: bookings.filter((shipment) =>
      group.statuses.includes(shipment.status),
    ).length,
  }))
  const metrics = [
    {
      label: 'Total bookings',
      value: number(bookings.length),
      icon: ClipboardList,
      tone: 'blue',
      to: `/shipments?view=confirmed&from=${firstDay}&until=${today}`,
      change: delta(bookings.length, previous.length),
      context: 'vs. previous period',
    },
    {
      label: 'In transit',
      value: number(transit),
      icon: Truck,
      tone: statusTone['In transit'],
      to: groupUrl(groups[1].label),
      change: null,
      context: 'On the road',
    },
    {
      label: 'Pending delivery',
      value: number(awaiting),
      icon: PackageCheck,
      tone: statusTone.Arrived,
      to: groupUrl(groups[2].label),
      change: null,
      context: 'At destination or out for delivery',
    },
    {
      label: 'Today’s revenue',
      value: money(revenue),
      icon: IndianRupee,
      tone: 'green',
      to: '/accounts',
      change: delta(revenue, revenueOn(dateOffset(-1))),
      context: 'vs. yesterday',
    },
  ]
  const recentSorted = [...bookings]
    .sort((a, b) => b.date.localeCompare(a.date) || b.lr.localeCompare(a.lr))
    .slice(0, 6)

  return (
    <>
      <PageHeading
        title="Operations Dashboard"
        description="Monitor your shipments, branch activity, and cargo operations."
        actions={
          <>
            <label className="button secondary date-control">
              <CalendarDays size={16} />
              <select
                aria-label="Dashboard date range"
                value={days}
                onChange={(event) => setDays(Number(event.target.value))}
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
                <option value={60}>Last 60 days</option>
              </select>
              <ChevronDown size={13} />
            </label>
            <Link to="/booking/new" className="button primary">
              <Plus size={18} />
              New booking
            </Link>
          </>
        }
      />
      <div className="overview-meta">
        <span>
          <span className="live-dot" />
          Operations overview
        </span>
        <span>
          {prettyDate(firstDay, { day: 'numeric', month: 'short' })} –{' '}
          {prettyDate(today)}
        </span>
      </div>
      <section className="metric-grid" aria-label="Key performance indicators">
        {metrics.map(
          ({ label, value, icon: Icon, tone, to, change, context }) => (
            <Link className="metric panel" key={label} to={to}>
              <div className="metric-top">
                <span className={`metric-icon ${tone}`}>
                  <Icon size={19} />
                </span>
                <ArrowUpRight className="metric-arrow" size={15} />
              </div>
              <span className="metric-label">{label}</span>
              <strong>{value}</strong>
              <Trend change={change} suffix={context} />
            </Link>
          ),
        )}
      </section>
      <div className="dashboard-charts">
        <section className="panel chart-panel">
          <PanelTitle
            title="Booking activity"
            description="Daily booking volume across the selected period"
            actions={
              <span className="chart-key">
                <i />
                Bookings
              </span>
            }
          />
          <div
            className="trend-chart"
            role="img"
            aria-label={`Daily bookings: ${series.map((day) => `${day.label}: ${day.bookings}`).join(', ')}`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={series}
                margin={{ top: 9, right: 14, left: -24, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="booking-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#356ae6" stopOpacity={0.16} />
                    <stop
                      offset="100%"
                      stopColor="#356ae6"
                      stopOpacity={0.015}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="#e8edf4"
                  vertical={false}
                  strokeDasharray="3 4"
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  minTickGap={20}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickMargin={9}
                  allowDecimals={false}
                  domain={[0, 'auto']}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value) => [value, 'Bookings']}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #e5eaf0',
                    fontSize: 12,
                  }}
                />
                <Area
                  name="Bookings"
                  type="monotone"
                  dataKey="bookings"
                  stroke="#356ae6"
                  strokeWidth={2.5}
                  fill="url(#booking-fill)"
                  dot={
                    days <= 7
                      ? {
                          r: 3.5,
                          fill: '#356ae6',
                          stroke: '#fff',
                          strokeWidth: 1.5,
                        }
                      : false
                  }
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="panel chart-panel status-panel">
          <PanelTitle
            title="Shipment status"
            description="Current stage of shipments in this period"
          />
          <div className="status-overview">
            <div className="donut" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart accessibilityLayer={false}>
                  <Pie
                    data={
                      bookings.length
                        ? chartGroups.filter((group) => group.value)
                        : [{ value: 1, fill: '#e5eaf0' }]
                    }
                    dataKey="value"
                    nameKey="label"
                    innerRadius="72%"
                    outerRadius="93%"
                    stroke="none"
                    paddingAngle={bookings.length ? 3 : 0}
                    cornerRadius={3}
                    startAngle={90}
                    endAngle={-270}
                    rootTabIndex={-1}
                    isAnimationActive={false}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-label">
                <strong>{number(bookings.length)}</strong>
                <span>Shipments</span>
              </div>
            </div>
            <div className="status-legend">
              {chartGroups.map((group) => (
                <Link to={groupUrl(group.label)} key={group.label}>
                  <i style={{ background: group.fill }} />
                  <span>{group.label}</span>
                  <strong>{group.value}</strong>
                  <ChevronRight size={12} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
      <section className="panel dashboard-register">
        <PanelTitle
          title="Recent bookings"
          description="The latest consignments across your branch network"
          actions={
            <Link to="/shipments" className="button secondary small">
              View shipments <ArrowRight size={15} />
            </Link>
          }
        />
        <ShipmentTable
          shipments={recentSorted}
          branches={state.branches}
          caption="Recent bookings"
        />
      </section>
      <section className="panel followup-panel">
        <PanelTitle title="Operations at a glance" />
        <div className="followup-grid">
          <Link to="/operations?queue=unassigned">
            <Warehouse size={17} />
            <span>Unassigned cargo</span>
            <strong>
              {bookings.filter((item) => item.status === 'Booked').length}
            </strong>
            <ArrowRight size={15} />
          </Link>
          <Link to="/operations?queue=acceptance">
            <PackageCheck size={17} />
            <span>Awaiting acceptance</span>
            <strong>
              {bookings.filter((item) => item.status === 'Arrived').length}
            </strong>
            <ArrowRight size={15} />
          </Link>
          <Link to="/delivery?queue=completed">
            <ClipboardList size={17} />
            <span>Delivered shipments</span>
            <strong>{delivered}</strong>
            <ArrowRight size={15} />
          </Link>
          <Link to="/accounts?view=outstanding">
            <IndianRupee size={17} />
            <span>Outstanding payments</span>
            <strong>
              {money(
                scope.reduce((sum, shipment) => sum + balance(shipment), 0),
              )}
            </strong>
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </>
  )
}
