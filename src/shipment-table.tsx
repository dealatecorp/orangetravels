import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { money, prettyDate, total, type Branch, type Shipment } from './model'
import { Badge, Empty, RouteLabel } from './ui'

export function ShipmentTable({
  shipments,
  branches,
  caption = 'Shipments',
}: {
  shipments: Shipment[]
  branches: Branch[]
  caption?: string
}) {
  if (!shipments.length)
    return (
      <Empty
        title="No shipments found"
        message="Shipments appear here when they match the current filters."
      />
    )
  const city = (id: string) =>
    branches.find((branch) => branch.id === id)?.city ?? id
  return (
    <div className="table-scroll">
      <table className="data-table shipment-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th>LR number</th>
            <th>Sender</th>
            <th>Route</th>
            <th>Booked on</th>
            <th>Status</th>
            <th className="number-cell">Amount</th>
            <th>
              <span className="sr-only">Open shipment</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((shipment) => (
            <tr key={shipment.id}>
              <td>
                <Link className="lr-link" to={`/shipments/${shipment.lr}`}>
                  {shipment.lr}
                </Link>
              </td>
              <td className="sender-cell">{shipment.sender.name}</td>
              <td>
                <RouteLabel
                  from={city(shipment.origin)}
                  to={city(shipment.destination)}
                />
              </td>
              <td className="muted nowrap">
                {prettyDate(shipment.date, { day: 'numeric', month: 'short' })}
              </td>
              <td>
                <Badge status={shipment.status} />
              </td>
              <td className="number-cell">{money(total(shipment.charges))}</td>
              <td>
                <Link
                  className="row-link"
                  to={`/shipments/${shipment.lr}`}
                  aria-label={`Open ${shipment.lr}`}
                >
                  <ChevronRight size={16} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
