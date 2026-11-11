import { useEffect, useRef, useState } from 'react'
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  BookOpen,
  Building2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  LayoutDashboard,
  MapPin,
  Menu,
  PackageCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings2,
  Truck,
  UsersRound,
  Wallet,
  BarChart3,
  SlidersHorizontal,
  Layers3,
  X,
} from 'lucide-react'
import { branchMatches, prettyDate, shipmentMatches } from './model'
import { Badge, Brand, Modal } from './ui'
import { useWorkspace } from './workspace'

const nav = [
  {
    title: 'WORKSPACE',
    items: [{ to: '/', title: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'OPERATIONS',
    items: [
      { to: '/shipments', title: 'Bookings', icon: ClipboardList },
      { to: '/operations', title: 'Cargo Operations', icon: Layers3 },
      { to: '/delivery', title: 'Delivery', icon: PackageCheck },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { to: '/customers', title: 'Customers & Agents', icon: UsersRound },
      { to: '/fleet', title: 'Fleet Management', icon: Truck },
      { to: '/branches', title: 'Branch Management', icon: Building2 },
      { to: '/accounts', title: 'Accounts', icon: Wallet },
      { to: '/reports', title: 'Reports', icon: BarChart3 },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { to: '/masters', title: 'Masters', icon: BookOpen },
      { to: '/notifications', title: 'Notifications', icon: Bell },
      {
        to: '/administration',
        title: 'Administration',
        icon: SlidersHorizontal,
      },
    ],
  },
]

export function Shell() {
  const { state, branch, setBranch, notice } = useWorkspace()
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('cargoos.sidebar') === 'collapsed',
  )
  const [mobileOpen, setMobileOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [menu, setMenu] = useState<'branch' | 'profile' | null>(null)
  const [help, setHelp] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const section =
    nav
      .flatMap((group) => group.items)
      .find((item) => item.to !== '/' && location.pathname.startsWith(item.to))
      ?.title ??
    (location.pathname.startsWith('/booking') ? 'Bookings' : 'Dashboard')
  const scoped = state.shipments.filter((shipment) =>
    branchMatches(shipment, branch),
  )
  const results = search.trim()
    ? scoped
        .filter((shipment) => shipmentMatches(shipment, search, state.branches))
        .slice(0, 6)
    : []
  const unseen = scoped.some((shipment) =>
    shipment.events.some(
      (event) =>
        new Date(event.date).getTime() > Date.now() - 86400000 &&
        !state.readEvents.includes(`${shipment.id}-${event.date}`),
    ),
  )
  const initials = state.settings.operator
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const editing =
        event.target instanceof HTMLElement &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) ||
          event.target.isContentEditable)
      if (
        (!editing && event.key === '/') ||
        ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k')
      ) {
        event.preventDefault()
        searchRef.current?.focus()
      }
      if (event.key === 'Escape') {
        setSearchOpen(false)
        setMenu(null)
        setMobileOpen(false)
      }
    }
    const handleOutside = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        setMenu(null)
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    window.addEventListener('pointerdown', handleOutside)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('pointerdown', handleOutside)
    }
  }, [])

  function closeMenus() {
    setMenu(null)
    setSearchOpen(false)
    setMobileOpen(false)
  }

  return (
    <div className={`workspace ${collapsed ? 'is-collapsed' : ''}`}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      {mobileOpen && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <Brand />
          <button
            className="mobile-only icon-button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          >
            <X size={19} />
          </button>
        </div>
        <nav className="side-nav" aria-label="Workspace navigation">
          {nav.map((group) => (
            <div className="nav-group" key={group.title}>
              <div className="nav-group-title">{group.title}</div>
              {group.items.map(({ to, title, icon: Icon }) => (
                <NavLink
                  key={to}
                  end={to === '/'}
                  to={to}
                  title={title}
                  onClick={closeMenus}
                  className={({ isActive }) =>
                    isActive ||
                    (to === '/shipments' &&
                      location.pathname.startsWith('/booking'))
                      ? 'nav-link selected'
                      : 'nav-link'
                  }
                >
                  <Icon size={17} />
                  <span>{title}</span>
                  {[
                    '/shipments',
                    '/operations',
                    '/delivery',
                    '/accounts',
                  ].includes(to) && (
                    <ChevronRight size={13} className="nav-chevron" />
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button
            type="button"
            className="nav-link"
            title="Help & shortcuts"
            onClick={() => setHelp(true)}
          >
            <CircleHelp size={17} />
            <span>Help & shortcuts</span>
          </button>
          <button
            className="nav-link collapse"
            type="button"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => {
              localStorage.setItem(
                'cargoos.sidebar',
                collapsed ? 'expanded' : 'collapsed',
              )
              setCollapsed(!collapsed)
            }}
          >
            {collapsed ? (
              <PanelLeftOpen size={17} />
            ) : (
              <PanelLeftClose size={17} />
            )}
            <span>Collapse sidebar</span>
          </button>
          <div className="demo-indicator" title="Demo workspace">
            <span /> <small>Demo workspace</small>
          </div>
        </div>
      </aside>

      <div className="content-shell">
        <header ref={headerRef} className="topbar">
          <button
            className="icon-button mobile-only"
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Menu size={22} />
          </button>
          <div className="top-crumb">
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{section}</strong>
          </div>
          <div className="top-actions">
            <div className="global-search-wrap">
              <form
                className="global-search"
                role="search"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (!search.trim()) return
                  navigate(`/shipments?q=${encodeURIComponent(search.trim())}`)
                  closeMenus()
                  searchRef.current?.blur()
                }}
              >
                <Search size={17} />
                <input
                  ref={searchRef}
                  aria-label="Search by LR number or customer"
                  value={search}
                  placeholder="Search LR or customer…"
                  onChange={(event) => {
                    setSearch(event.target.value)
                    setSearchOpen(true)
                    setMenu(null)
                  }}
                  onFocus={() => {
                    setSearchOpen(true)
                    setMenu(null)
                  }}
                />
                <kbd aria-hidden="true">/</kbd>
              </form>
              {searchOpen && search.trim() && (
                <div className="popover search-results">
                  <div className="popover-heading">Shipment matches</div>
                  {results.length ? (
                    results.map((shipment) => (
                      <Link
                        key={shipment.id}
                        className="search-result"
                        to={`/shipments/${shipment.lr}`}
                        onClick={() => {
                          setSearch('')
                          closeMenus()
                        }}
                      >
                        <div>
                          <strong>{shipment.lr}</strong>
                          <small>{shipment.sender.name}</small>
                        </div>
                        <Badge status={shipment.status} />
                      </Link>
                    ))
                  ) : (
                    <p className="search-empty">
                      No matching shipments in this branch.
                    </p>
                  )}
                  <Link
                    className="search-all"
                    to={`/shipments?q=${encodeURIComponent(search.trim())}`}
                    onClick={closeMenus}
                  >
                    Open search results <ArrowUpRight size={14} />
                  </Link>
                </div>
              )}
            </div>
            <div className="menu-wrap">
              <button
                type="button"
                className="branch-button"
                aria-label={`Branch scope: ${state.branches.find((item) => item.id === branch)?.name ?? 'All branches'}`}
                aria-expanded={menu === 'branch'}
                onClick={() => {
                  setMenu(menu === 'branch' ? null : 'branch')
                  setSearchOpen(false)
                }}
              >
                <MapPin size={16} />
                <span>
                  {state.branches.find((item) => item.id === branch)?.name ??
                    'All branches'}
                </span>
                <ChevronDown size={13} />
              </button>
              {menu === 'branch' && (
                <div className="popover menu">
                  <div className="popover-heading">Branch scope</div>
                  {[{ id: '', name: 'All branches' }, ...state.branches].map(
                    (item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={branch === item.id ? 'current' : ''}
                        onClick={() => {
                          setBranch(item.id)
                          setMenu(null)
                        }}
                      >
                        {item.name}
                        {item.id && <small>{item.id}</small>}
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>
            <Link
              className="icon-button notification-button"
              to="/notifications"
              aria-label="Notifications"
              onClick={closeMenus}
            >
              <Bell size={19} />
              {unseen && <i />}
            </Link>
            <span className="top-divider" />
            <div className="menu-wrap">
              <button
                type="button"
                className="profile"
                aria-label={`${initials} ${state.settings.operator} Workspace admin, profile and settings`}
                aria-expanded={menu === 'profile'}
                onClick={() => {
                  setMenu(menu === 'profile' ? null : 'profile')
                  setSearchOpen(false)
                }}
              >
                <span className="avatar" aria-hidden="true">
                  {initials}
                </span>
                <span className="profile-label">
                  <strong>{state.settings.operator}</strong>
                  <small>Workspace admin</small>
                </span>
                <ChevronDown size={12} />
              </button>
              {menu === 'profile' && (
                <div className="popover menu profile-menu">
                  <Link to="/administration" onClick={closeMenus}>
                    <Settings2 size={15} />
                    Workspace settings
                  </Link>
                  <Link to="/track" onClick={closeMenus}>
                    <ArrowUpRight size={15} />
                    Customer tracking
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="workspace-demo">
          <span />
          Demo workspace · Changes saved in this browser
        </div>
        <main
          id="main-content"
          className="main-content"
          onClick={() => {
            if (menu || searchOpen) {
              setMenu(null)
              setSearchOpen(false)
            }
          }}
        >
          <Outlet key={location.pathname + location.search} />
        </main>
      </div>
      {notice && (
        <div className="toast" role="status">
          <PackageCheck size={19} />
          {notice}
        </div>
      )}
      {help && (
        <Modal title="Help & shortcuts" onClose={() => setHelp(false)}>
          <div className="help-rows">
            <div>
              <Search size={17} />
              <span>Focus shipment search</span>
              <kbd>/</kbd>
            </div>
            <div>
              <Plus size={17} />
              <span>Create a shipment</span>
              <Link to="/booking/new" onClick={() => setHelp(false)}>
                New booking <ArrowUpRight size={14} />
              </Link>
            </div>
            <div>
              <ArrowDownLeft size={17} />
              <span>Track a consignment</span>
              <Link to="/track" onClick={() => setHelp(false)}>
                Open tracking <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
          <p className="muted">
            Demo records use India Standard Time. Today is{' '}
            {prettyDate(
              new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Asia/Kolkata',
              }).format(new Date()),
            )}
            .
          </p>
        </Modal>
      )}
    </div>
  )
}
