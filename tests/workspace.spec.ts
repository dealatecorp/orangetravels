import { expect, test } from '@playwright/test'

test('dashboard filters, shipment search, and mobile navigation work', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Operations Dashboard' }),
  ).toBeVisible()
  await expect(
    page.getByRole('table', { name: 'Recent bookings' }),
  ).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({
    path: '.impeccable/review/desktop.png',
    fullPage: true,
  })
  await page.getByRole('button', { name: 'Collapse sidebar' }).click()
  await expect(
    page.getByText('Demo workspace · Changes saved in this browser'),
  ).toBeVisible()
  await page.getByTitle('Expand sidebar').click()
  const total = page
    .getByRole('link', { name: /Total bookings/ })
    .locator('strong')
  const original = await total.textContent()
  await page.getByLabel('Dashboard date range').selectOption('30')
  await expect(total).not.toHaveText(original ?? '')
  await page.getByRole('link', { name: /In transit.*On the road/ }).click()
  await expect(page).toHaveURL(/group=In%20transit&from=\d{4}-\d{2}-\d{2}/)
  await expect(
    page.getByRole('table', { name: 'Bookings' }).getByRole('row').nth(1),
  ).toContainText('In transit')
  await page.goto('/')
  await page.getByRole('button', { name: 'Branch scope: All branches' }).click()
  await page.getByRole('button', { name: 'Hyderabad Central HYD' }).click()
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Branch scope: Hyderabad Central' }),
  ).toBeVisible()
  await page.keyboard.press('/')
  await expect(
    page.getByRole('textbox', { name: 'Search by LR number or customer' }),
  ).toBeFocused()
  await page
    .getByRole('textbox', { name: 'Search by LR number or customer' })
    .fill('01248')
  await page.locator('.search-result').first().click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/01248/)
  await page.goto('/')
  await page
    .getByRole('button', { name: 'Branch scope: Hyderabad Central' })
    .click()
  await page.getByRole('button', { name: 'All branches' }).click()
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(
    page.getByText('Demo workspace · Changes saved in this browser'),
  ).toBeVisible()
  await page.screenshot({
    path: '.impeccable/review/mobile.png',
    fullPage: true,
  })
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  )
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await page
    .getByRole('link', { name: 'Cargo Operations', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Cargo operations' }),
  ).toBeVisible()
  expect(errors).toEqual([])
})

test('booking, allotment, partial acceptance, payment and delivery persist end to end', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'New booking' }).click()
  await page.getByLabel('Destination branch').selectOption('VSK')
  await page.getByLabel('LR type').selectOption('To-Pay')
  await page.getByLabel('Full name').nth(0).fill('Test Cargo Sender')
  await page.getByLabel('Mobile').nth(0).fill('9999999999')
  await page.getByLabel('Full name').nth(1).fill('Test Cargo Receiver')
  await page.getByLabel('Mobile').nth(1).fill('9999999988')
  await page
    .getByLabel('Description', { exact: true })
    .fill('Warehouse samples')
  await page.getByLabel('Package quantity').fill('2')
  await page.getByLabel('Weight per package (kg)').fill('10')
  await page.getByRole('button', { name: 'Save draft' }).click()
  await expect(page.getByRole('link', { name: 'Edit draft' })).toBeVisible()
  const draftUrl = page.url()
  await page.getByRole('link', { name: 'Edit draft' }).click()
  await page.getByRole('button', { name: 'Confirm booking' }).click()
  await expect(
    page.getByRole('button', { name: 'Allot to trip' }),
  ).toBeVisible()
  expect(page.url()).toBe(draftUrl)
  await page.goto('/fleet?view=trips')
  await page.getByRole('button', { name: 'Add trip' }).click()
  await page.getByLabel('Trip code').fill('TRP-E2E')
  await page.getByLabel('Vehicle', { exact: true }).selectOption('V3')
  await page.getByLabel('Driver', { exact: true }).fill('Test Driver')
  await page.getByLabel('Origin', { exact: true }).selectOption('HYD')
  await page.getByLabel('Destination', { exact: true }).selectOption('VSK')
  await page.getByRole('button', { name: 'Save trip' }).click()
  await expect(
    page.getByRole('cell', { name: 'TRP-E2E', exact: true }),
  ).toBeVisible()
  await page.goto(draftUrl)
  const dialog = page.getByRole('dialog')
  const open = (name: string) =>
    page.getByRole('button', { name, exact: true }).click()
  const confirm = (name: string) =>
    dialog.getByRole('button', { name, exact: true }).click()
  await open('Allot to trip')
  await dialog
    .getByLabel('Trip', { exact: true })
    .selectOption({ label: 'TRP-E2E · Test Driver' })
  await confirm('Allot to trip')
  await open('Confirm dispatch')
  await confirm('Confirm dispatch')
  await open('Mark arrived')
  await confirm('Mark arrived')
  await open('Accept cargo')
  await dialog.getByLabel('Packages received now').fill('1')
  await confirm('Accept cargo')
  await expect(dialog.getByRole('alert')).toContainText(
    'Add a discrepancy note',
  )
  await dialog
    .getByLabel('Damage or missing package notes')
    .fill('Second carton pending')
  await confirm('Accept cargo')
  await open('Accept cargo')
  await confirm('Accept cargo')
  await open('Assign delivery')
  await dialog.getByLabel('Delivery employee').fill('Test Delivery Operator')
  await confirm('Assign delivery')
  await open('Record delivery')
  await dialog.getByLabel('Received by').fill('Test Recipient')
  await confirm('Record delivery')
  await expect(dialog.getByRole('alert')).toContainText('To-Pay amount')
  await dialog.getByRole('button', { name: 'Back' }).click()
  await open('Record payment')
  await confirm('Record payment')
  await open('Record delivery')
  await dialog.getByLabel('Received by').fill('Test Recipient')
  await confirm('Record delivery')
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Proof of delivery' }),
  ).toBeVisible()
  await expect(page.getByText('Test Recipient')).toBeVisible()
  await page.getByRole('link', { name: 'Open tracking view' }).click()
  await expect(
    page.getByRole('heading', { name: 'Track your shipment' }),
  ).toBeVisible()
  await expect(
    page.getByText('Delivered', { exact: true }).first(),
  ).toBeVisible()
  await expect(page.getByText('Test Cargo Sender')).toHaveCount(0)
  await expect(page.getByText('Test Recipient')).toHaveCount(0)
})
