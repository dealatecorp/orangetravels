import { createRoot } from 'react-dom/client'
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom'
import { lazy, Suspense, useState } from 'react'
import { ArrowRight, MapPin, PackageSearch, Search } from 'lucide-react'
import '@fontsource-variable/inter'
import './styles.css'
import { Shell } from './shell'
import { Booking } from './booking'
import { Shipments } from './shipments'
import { ShipmentDetail, Timeline } from './shipment-detail'
import {
  Accounts,
  Administration,
  Directory,
  Notifications,
} from './management'
import { Badge, Brand, Empty, Field, PanelTitle, RouteLabel } from './ui'
import { useWorkspace, WorkspaceProvider } from './workspace'
import { prettyDate } from './model'

const Dashboard = lazy(() =>
  import('./dashboard').then((module) => ({ default: module.Dashboard })),
)

function Tracking() {
  const { lr } = useParams()
  const { state } = useWorkspace()
  const navigate = useNavigate()
  const [search, setSearch] = useState(lr ?? '')
  const shipment = lr
    ? state.shipments.find(
        (item) => item.lr === lr.toUpperCase() && item.status !== 'Draft',
      )
    : undefined
  const city = (id: string) =>
    state.branches.find((branch) => branch.id === id)?.city ?? id
  return (
    <div className="tracking-page">
      <header>
        <Brand />
        <Link className="button secondary" to="/">
          Workspace
          <ArrowRight size={16} />
        </Link>
      </header>
      <main>
        <div className="tracking-intro">
          <span className="metric-icon blue">
            <PackageSearch size={23} />
          </span>
          <h1>Track your shipment</h1>
          <p>
            Enter the LR number from your lorry receipt to see where your cargo
            is.
          </p>
        </div>
        <form
          className="panel tracking-form"
          onSubmit={(event) => {
            event.preventDefault()
            if (search.trim())
              navigate(
                `/track/${encodeURIComponent(search.trim().toUpperCase())}`,
              )
          }}
        >
          <Field label="LR number">
            <input
              value={search}
              required
              maxLength={40}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="e.g. LR-2026-01248"
            />
          </Field>
          <button className="button primary">
            <Search size={17} />
            Track shipment
          </button>
        </form>
        {shipment ? (
          <section className="panel form-section tracking-result">
            <PanelTitle
              title={shipment.lr}
              description={`Booked on ${prettyDate(shipment.date)}`}
              actions={<Badge status={shipment.status} />}
            />
            <div className="tracking-route">
              <MapPin size={17} />
              <RouteLabel
                from={city(shipment.origin)}
                to={city(shipment.destination)}
              />
            </div>
            <Timeline
              shipment={{
                events: shipment.events.map(({ status, date }) => ({
                  status,
                  date,
                })),
              }}
            />
          </section>
        ) : (
          lr && (
            <section className="panel tracking-result">
              <Empty
                title="Shipment not found"
                message="Check the LR number on your receipt. New demo bookings are available in the browser that created them."
              />
            </section>
          )
        )}
        <p className="tracking-caption">CargoOS demo tracking</p>
      </main>
    </div>
  )
}

function App() {
  return (
    <WorkspaceProvider>
      <BrowserRouter>
        <Suspense
          fallback={
            <div className="route-loading" role="status">
              Loading workspace…
            </div>
          }
        >
          <Routes>
            <Route path="/track/:lr?" element={<Tracking />} />
            <Route element={<Shell />}>
              <Route index element={<Dashboard />} />
              <Route path="booking/:lr" element={<Booking />} />
              <Route path="shipments/:lr" element={<ShipmentDetail />} />
              <Route path="shipments" element={<Shipments />} />
              <Route path="operations" element={<Shipments />} />
              <Route path="delivery" element={<Shipments />} />
              <Route path="reports" element={<Shipments />} />
              <Route path="customers" element={<Directory />} />
              <Route path="fleet" element={<Directory />} />
              <Route path="branches" element={<Directory />} />
              <Route path="masters" element={<Directory />} />
              <Route path="accounts" element={<Accounts />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="administration" element={<Administration />} />
              <Route
                path="*"
                element={
                  <section className="panel">
                    <Empty
                      title="Page unavailable"
                      message="Use the navigation to return to the workspace."
                    />
                  </section>
                }
              />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </WorkspaceProvider>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
