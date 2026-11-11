# CargoOS

CargoOS is a responsive logistics operations website. The workspace starts with synthetic shipments and stores changes in browser local storage. Use the same browser and origin to reopen saved bookings or track them. Use sample records when trying the workflows.

## Run locally

Tested on Node.js 24.

```powershell
npm ci
npm run dev
```

Open [CargoOS](http://127.0.0.1:5173/). `npm run build` creates the static site in `dist`. Configure your static host to serve `index.html` on routes such as `/shipments/:lr` and `/track/:lr`.

## Deploy on Vercel

Import the GitHub repository and build from its root. `vercel.json` selects Vite and handles direct links to bookings, shipment details, and tracking. The site uses Node.js 24 at build time and requires no environment variables. Set `CARGOOS_BASE_URL` to the deployment URL to run the same Playwright tests against the hosted site.

## Try a shipment

1. Use **New booking** to enter the route, contacts, cargo items, and payment type. Save a draft or confirm the booking to create an LR.
2. In **Fleet Management → Trips**, add a trip with the same origin and destination. Open the LR and allot it to the trip. Confirm dispatch and mark the shipment arrived.
3. Accept the packages, assign delivery, and record proof of delivery. For To-Pay cargo, record the balance before completing delivery.
4. Print the LR or save it as a PDF through the print dialog. Open **Shipment tools** for the tracking view and downloadable QR code.

Branch scope applies to shipment views, accounts, and notifications. Search by LR or sender with `/`. Reports and accounts support CSV export. The website simulates operations and collections in the current browser. It has no shared backend, sign-in, or live carrier and payment integrations.

## Verification

```powershell
npm test
$env:CARGOOS_BROWSER_CHANNEL = 'msedge'
npm run test:e2e
```

With Playwright Chromium installed, the browser channel override is optional. Tests cover pricing, shipment transitions, dashboard and branch filters, mobile navigation, draft confirmation, trip allotment, partial acceptance, payment, delivery proof, and tracking.

## References

- REA inventoried the two supplied ZIPs, which contain 41 unique screenshots after deduplication. The screenshots establish the legacy booking, service allotment, acceptance, delivery, and reporting flows. REA evidence `ev_ee9cddaba5541c3279eefe935d6f3d75bfd88d57d7167f0565c1fc1513ba9f2c` and `ev_2f5bb0023d59d1254768bc89012b610953bcb78dca67af12f78382cc4fb4836d`.
- Firecrawl retrieved public product references for freight booking, vehicle assignment, dispatch, and tracking. [Bharat Software](https://www.bharatsoftware.com/), [Fleetx Transport Management System](https://www.fleetx.ai/transporter-management-system)
