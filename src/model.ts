export const statuses = [
  'Draft',
  'Booked',
  'Allocated',
  'In transit',
  'Arrived',
  'Received',
  'Out for delivery',
  'Delivered',
  'Cancelled',
] as const
export type Status = (typeof statuses)[number]
export type LRType = 'Paid' | 'To-Pay' | 'Credit'
export type Branch = {
  id: string
  name: string
  city: string
  state: string
  manager: string
}
export type Party = {
  name: string
  phone: string
  address: string
  city: string
  pin: string
  gstin: string
}
export type Item = {
  description: string
  type: string
  quantity: number
  weight: number
  length: number
  width: number
  height: number
}
export type Charges = {
  freight: number
  handling: number
  delivery: number
  other: number
  discount: number
  gst: number
}
export type Milestone = { status: Status; date: string; note?: string }
export type Payment = {
  id: string
  amount: number
  method: string
  date: string
}
export type Shipment = {
  id: string
  lr: string
  date: string
  origin: string
  destination: string
  type: LRType
  service: string
  reference: string
  sender: Party
  receiver: Party
  items: Item[]
  charges: Charges
  freightOverride?: boolean
  status: Status
  events: Milestone[]
  payments: Payment[]
  trip?: string
  received?: number
  assignee?: string
  proof?: { name: string; date: string; remarks: string }
}
export type Contact = {
  id: string
  name: string
  phone: string
  city: string
  category: string
}
export type Vehicle = {
  id: string
  registration: string
  type: string
  capacity: number
  driver: string
  status: string
}
export type Trip = {
  id: string
  code: string
  vehicle: string
  driver: string
  origin: string
  destination: string
  date: string
}
export type Expense = {
  id: string
  description: string
  category: string
  amount: number
  date: string
  branch: string
}
export type Settings = {
  company: string
  operator: string
  rate: number
  gst: number
  pod: boolean
}
export type State = {
  shipments: Shipment[]
  branches: Branch[]
  customers: Contact[]
  agents: Contact[]
  vehicles: Vehicle[]
  trips: Trip[]
  expenses: Expense[]
  settings: Settings
  masters: { id: string; category: string; name: string }[]
  readEvents: string[]
  sequence: number
}

export const branches: Branch[] = [
  {
    id: 'HYD',
    name: 'Hyderabad Central',
    city: 'Hyderabad',
    state: 'Telangana',
    manager: 'Arjun Kumar',
  },
  {
    id: 'VSK',
    name: 'Visakhapatnam',
    city: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    manager: 'Meera Reddy',
  },
  {
    id: 'VJA',
    name: 'Vijayawada',
    city: 'Vijayawada',
    state: 'Andhra Pradesh',
    manager: 'Kiran Rao',
  },
  {
    id: 'BLR',
    name: 'Bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    manager: 'Ananya Shetty',
  },
  {
    id: 'CHE',
    name: 'Chennai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    manager: 'Vikram Iyer',
  },
  {
    id: 'PUN',
    name: 'Pune',
    city: 'Pune',
    state: 'Maharashtra',
    manager: 'Neha Patil',
  },
]

export const statusTone: Record<Status, string> = {
  Draft: 'neutral',
  Booked: 'slate',
  Allocated: 'slate',
  'In transit': 'blue',
  Arrived: 'amber',
  Received: 'amber',
  'Out for delivery': 'amber',
  Delivered: 'green',
  Cancelled: 'red',
}
export const groups: { label: string; statuses: Status[] }[] = [
  { label: 'Booked / allotted', statuses: ['Booked', 'Allocated'] },
  { label: 'In transit', statuses: ['In transit'] },
  {
    label: 'Awaiting delivery',
    statuses: ['Arrived', 'Received', 'Out for delivery'],
  },
  { label: 'Delivered', statuses: ['Delivered'] },
  { label: 'Cancelled', statuses: ['Cancelled'] },
]

const localDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
export const dateKey = (date = new Date()) => localDate.format(date)
export const today = dateKey()
export function dateOffset(days: number, from = today) {
  const date = new Date(`${from}T12:00:00+05:30`)
  date.setUTCDate(date.getUTCDate() + days)
  return dateKey(date)
}
const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
})
export const money = (amount: number) => currency.format(amount)
export const number = (amount: number) =>
  new Intl.NumberFormat('en-IN').format(amount)
export const prettyDate = (
  date: string,
  options?: Intl.DateTimeFormatOptions,
) =>
  new Date(date.length === 10 ? `${date}T12:00:00+05:30` : date).toLocaleDateString('en-IN', {
    ...(options ?? { day: 'numeric', month: 'short', year: 'numeric' }),
    timeZone: 'Asia/Kolkata',
  })
export const round = (value: number) => Math.round(value * 100) / 100
export const subtotal = (c: Charges) =>
  c.freight + c.handling + c.delivery + c.other - c.discount
export const total = (c: Charges) =>
  round(Math.max(0, subtotal(c)) * (1 + c.gst / 100))
export const paid = (s: Shipment) =>
  round(s.payments.reduce((sum, p) => sum + p.amount, 0))
export const balance = (s: Shipment) =>
  ['Draft', 'Cancelled'].includes(s.status)
    ? 0
    : round(total(s.charges) - paid(s))
export const pieces = (s: Shipment) =>
  s.items.reduce((sum, item) => sum + item.quantity, 0)
export const chargeable = (i: Item) =>
  Math.max(i.weight, (i.length * i.width * i.height) / 5000) * i.quantity
export const weight = (s: Shipment) =>
  round(s.items.reduce((sum, item) => sum + item.weight * item.quantity, 0))
export const active = (s: Shipment) =>
  s.status !== 'Draft' && s.status !== 'Cancelled'
export const branchMatches = (s: Shipment, branch: string) =>
  !branch || s.origin === branch || s.destination === branch
export const emptyParty: Party = {
  name: '',
  phone: '',
  address: '',
  city: '',
  pin: '',
  gstin: '',
}
export const newItem: Item = {
  description: '',
  type: 'Carton',
  quantity: 1,
  weight: 0,
  length: 0,
  width: 0,
  height: 0,
}

const customerNames = [
  'Vardhan Industries',
  'BluePeak Retail',
  'Sree Lakshmi Traders',
  'Mitra Electronics',
  'Deccan Textiles',
  'Coastal Pharma',
  'Apex Auto Parts',
  'Nava Homeware',
  'Orion Printworks',
  'Godavari Foods',
  'Pioneer Tools',
  'Cedar Office Supply',
]
const cargoNames = [
  'Machine components',
  'Retail merchandise',
  'Cotton textiles',
  'Electronic accessories',
  'Packaging materials',
  'Medical supplies',
  'Auto spares',
  'Home furnishings',
]
const demoVehicles: Vehicle[] = [
  {
    id: 'V1',
    registration: 'TS 09 UA 4821',
    type: 'Container truck',
    capacity: 7500,
    driver: 'Ravi Prasad',
    status: 'Available',
  },
  {
    id: 'V2',
    registration: 'AP 31 TH 2076',
    type: 'Light goods vehicle',
    capacity: 2500,
    driver: 'Suresh Naidu',
    status: 'Available',
  },
  {
    id: 'V3',
    registration: 'KA 01 AJ 6312',
    type: 'Container truck',
    capacity: 9000,
    driver: 'Manoj Reddy',
    status: 'Available',
  },
  {
    id: 'V4',
    registration: 'TN 22 CX 1740',
    type: 'Delivery van',
    capacity: 1200,
    driver: 'Priya Anand',
    status: 'Maintenance',
  },
]
const demoTrips: Trip[] = [
  {
    id: 'T1',
    code: 'TRP-0816',
    vehicle: 'V1',
    driver: 'Ravi Prasad',
    origin: 'HYD',
    destination: 'VSK',
    date: today,
  },
  {
    id: 'T2',
    code: 'TRP-0815',
    vehicle: 'V2',
    driver: 'Suresh Naidu',
    origin: 'VJA',
    destination: 'CHE',
    date: today,
  },
]
const sequenceStart = 1248

function seedShipment(index: number, date: string): Shipment {
  const recent: [string, string, Status, number][] = [
    ['HYD', 'VSK', 'In transit', 4850],
    ['VJA', 'CHE', 'Delivered', 2620],
    ['BLR', 'HYD', 'Booked', 3180],
    ['VSK', 'VJA', 'Out for delivery', 1750],
    ['CHE', 'BLR', 'Arrived', 5400],
    ['PUN', 'HYD', 'Allocated', 3920],
  ]
  const demoStatuses: Status[] = [
    'Delivered',
    'In transit',
    'Delivered',
    'Booked',
    'In transit',
    'Delivered',
    'Allocated',
    'Out for delivery',
    'Received',
    'Delivered',
    'Arrived',
    'In transit',
    'Cancelled',
    'Delivered',
    'Booked',
    'In transit',
  ]
  const first = branches[index % branches.length]
  const last =
    branches[(index + 1 + (index % (branches.length - 1))) % branches.length]
  const [origin, destination, status, amount] = recent[index] ?? [
    first.id,
    last.id,
    demoStatuses[(index * 7 + Math.floor(index / 19)) % demoStatuses.length],
    1200 + ((index * 173) % 8100),
  ]
  const lr = `LR-${today.slice(0, 4)}-${String(sequenceStart - index).padStart(5, '0')}`
  const originBranch = branches.find((b) => b.id === origin)!
  const destinationBranch = branches.find((b) => b.id === destination)!
  const type: LRType =
    index % 5 === 1 ? 'Credit' : index % 4 === 2 ? 'To-Pay' : 'Paid'
  const events = [
    'Booked',
    'Allocated',
    'In transit',
    'Arrived',
    'Received',
    'Out for delivery',
    'Delivered',
  ] as Status[]
  const history =
    status === 'Cancelled'
      ? (['Booked', status] as Status[])
      : events.slice(0, events.indexOf(status) + 1)
  return {
    id: `demo-${index}`,
    lr,
    date,
    origin,
    destination,
    type,
    service: 'Standard road',
    reference: '',
    sender: {
      ...emptyParty,
      name: customerNames[index % customerNames.length],
      city: originBranch.city,
    },
    receiver: {
      ...emptyParty,
      name: `${destinationBranch.city} Receiving`,
      city: destinationBranch.city,
    },
    items: [
      {
        ...newItem,
        description: cargoNames[index % cargoNames.length],
        quantity: 2 + (index % 14),
        weight: 4 + (index % 23),
      },
    ],
    charges: {
      freight: amount,
      handling: 0,
      delivery: 0,
      other: 0,
      discount: 0,
      gst: 0,
    },
    status,
    events: history.map((step, i) => ({
      status: step,
      date: `${date}T${String(9 + i).padStart(2, '0')}:15:00+05:30`,
    })),
    payments:
      type === 'Paid' && status !== 'Cancelled'
        ? [
            {
              id: `demo-pay-${index}`,
              amount,
              method: index % 2 === 0 ? 'UPI' : 'Cash',
              date,
            },
          ]
        : [],
    trip: index === 0 ? 'T1' : undefined,
    proof:
      status === 'Delivered'
        ? {
            name: `${destinationBranch.city} Receiving`,
            date,
            remarks: 'Received in good condition.',
          }
        : undefined,
  }
}

export function seed(): State {
  const counts = [
    42, 34, 48, 29, 38, 25, 32, 23, 33, 27, 39, 21, 30, 24, 38, 26, 31, 23, 28,
    21, 29, 32, 17, 27, 23, 29, 22, 24, 20, 18, 25, 18, 20, 20, 24, 16, 21, 23,
    17, 19, 18, 23, 20, 23, 16, 19, 20, 22, 18, 17, 22, 18, 23, 20, 19, 20, 18,
    19, 22, 23,
  ]
  const shipments: Shipment[] = []
  counts.forEach((count, day) => {
    for (let i = 0; i < count && shipments.length < sequenceStart; i++)
      shipments.push(seedShipment(shipments.length, dateOffset(-day)))
  })
  return {
    shipments,
    branches,
    vehicles: demoVehicles,
    trips: demoTrips,
    customers: customerNames.map((name, i) => ({
      id: `C${i + 1}`,
      name,
      city: branches[i % branches.length].city,
      phone: '',
      category: i % 3 === 0 ? 'Corporate' : 'Business',
    })),
    agents: [
      {
        id: 'A1',
        name: 'Coastal Booking Agency',
        city: 'Visakhapatnam',
        phone: '',
        category: 'Branch agent',
      },
      {
        id: 'A2',
        name: 'Deccan Cargo Services',
        city: 'Hyderabad',
        phone: '',
        category: 'Branch agent',
      },
    ],
    expenses: [],
    settings: {
      company: 'CargoOS Logistics',
      operator: 'Arjun Kumar',
      rate: 24,
      gst: 18,
      pod: true,
    },
    masters: ['Carton', 'Crate', 'Pallet', 'Bag', 'Bundle'].map((name, i) => ({
      id: `PK${i}`,
      name,
      category: 'Package type',
    })),
    readEvents: [],
    sequence: sequenceStart,
  }
}

const next: Partial<Record<Status, Status[]>> = {
  Draft: ['Booked', 'Cancelled'],
  Booked: ['Allocated', 'Cancelled'],
  Allocated: ['Booked', 'In transit', 'Cancelled'],
  'In transit': ['Arrived'],
  Arrived: ['Received'],
  Received: ['Out for delivery'],
  'Out for delivery': ['Delivered', 'Received'],
}
export function transition(
  shipment: Shipment,
  status: Status,
  note?: string,
): Shipment {
  if (!next[shipment.status]?.includes(status))
    throw new Error(
      `Cannot move ${shipment.status.toLowerCase()} cargo to ${status.toLowerCase()}.`,
    )
  return {
    ...shipment,
    status,
    events: [
      ...shipment.events,
      { status, date: new Date().toISOString(), note },
    ],
  }
}

export function book(
  state: State,
  input: Omit<Shipment, 'id' | 'lr' | 'events'>,
  draftId?: string,
): Shipment {
  const draft = state.shipments.find(
    (shipment) => shipment.id === draftId && shipment.status === 'Draft',
  )
  const lr =
    draft?.lr ??
    `LR-${today.slice(0, 4)}-${String(state.sequence + 1).padStart(5, '0')}`
  return {
    ...input,
    id: draft?.id ?? crypto.randomUUID(),
    lr,
    events:
      draft && input.status === 'Draft'
        ? draft.events
        : [
            ...(draft?.events ?? []),
            { status: input.status, date: new Date().toISOString() },
          ],
  }
}

export function shipmentMatches(
  shipment: Shipment,
  query: string,
  allBranches: Branch[],
) {
  const origin = allBranches.find(
    (branch) => branch.id === shipment.origin,
  )?.name
  const destination = allBranches.find(
    (branch) => branch.id === shipment.destination,
  )?.name
  return [
    shipment.lr,
    shipment.sender.name,
    shipment.receiver.name,
    shipment.reference,
    origin,
    destination,
  ].some((value) => value?.toLowerCase().includes(query.trim().toLowerCase()))
}
