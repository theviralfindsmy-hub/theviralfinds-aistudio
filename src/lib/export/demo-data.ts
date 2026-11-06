/**
 * Demo data for exports — used as a fallback when the database is empty,
 * mirroring the behaviour of /api/earnings and /api/analytics routes.
 */

import { resolvePeriod, aggregateByDay } from './utils'

export interface EarningsRow {
  id: string
  date: string // ISO
  orderId: string | null
  productName: string
  amount: number
  commission: number
  status: string
}

export interface LinkRow {
  id: string
  name: string
  shortCode: string
  affiliateUrl: string
  productName: string | null
  clicks: number
  conversions: number
  earnings: number
  ctr: number | null
  status: string
  createdAt: string // ISO
}

export interface AnalyticsDayRow {
  date: string // ISO
  clicks: number
  conversions: number
  ctr: number
  earnings: number
}

const PRODUCTS = [
  'Wireless Earbuds Pro',
  'RGB Gaming Mouse',
  'Phone Case Ultra Slim',
  'USB-C Hub 7-in-1',
  'Fitness Tracker Band',
  'Smart Watch Series 8',
  'Mechanical Keyboard 60%',
  'Portable SSD 1TB',
  'Bluetooth Speaker Mini',
  'LED Strip 5M RGB',
  'Power Bank 20000mAh',
  'Wireless Charger Stand',
  'Laptop Stand Aluminium',
  'Webcam 1080p HD',
  'Earbuds Charging Case',
  'Tripod Phone Holder',
  'HDMI Cable 4K 2m',
  'USB-C to HDMI Adapter',
  'Mini Desktop Fan',
  'Phone Gimbal Stabilizer',
]

const STATUSES = ['confirmed', 'pending', 'paid', 'rejected'] as const

function seedRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

export function getDemoEarningsRows(
  period: string | null,
  startDate?: string | null,
  endDate?: string | null
): EarningsRow[] {
  const { start, end } = resolvePeriod(period, startDate, endDate)
  const days = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
  )
  const rand = seedRandom(42)
  const rows: EarningsRow[] = []
  const count = Math.min(days * 4, 200)

  for (let i = 0; i < count; i++) {
    const dayOffset = Math.floor(rand() * days)
    const d = new Date(start.getTime() + dayOffset * 24 * 60 * 60 * 1000)
    d.setHours(Math.floor(rand() * 24), Math.floor(rand() * 60))
    const amount = Math.round((rand() * 200 + 20) * 100) / 100
    const rate = 0.05 + rand() * 0.1 // 5%-15%
    const commission = Math.round(amount * rate * 100) / 100
    const statusRoll = rand()
    const status =
      statusRoll < 0.55
        ? 'confirmed'
        : statusRoll < 0.8
          ? 'pending'
          : statusRoll < 0.95
            ? 'paid'
            : 'rejected'

    rows.push({
      id: `demo-conv-${i}`,
      date: d.toISOString(),
      orderId: `SHP${String(Math.floor(rand() * 9_000_000_000) + 1_000_000_000)}`,
      productName: PRODUCTS[Math.floor(rand() * PRODUCTS.length)],
      amount,
      commission,
      status,
    })
  }

  return rows.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

export function getDemoLinkRows(): LinkRow[] {
  const rand = seedRandom(7)
  const rows: LinkRow[] = []
  const count = 15

  for (let i = 0; i < count; i++) {
    const product = PRODUCTS[i % PRODUCTS.length]
    const clicks = Math.floor(rand() * 4000) + 100
    const conversions = Math.floor(clicks * (0.04 + rand() * 0.05))
    const earnings =
      Math.round(conversions * (rand() * 30 + 5) * 100) / 100
    const ctr =
      clicks > 0
        ? Math.round((conversions / clicks) * 10000) / 100
        : 0
    const statusRoll = rand()
    const status =
      statusRoll < 0.7 ? 'active' : statusRoll < 0.9 ? 'paused' : 'expired'
    const daysAgo = Math.floor(rand() * 90) + 1
    const createdAt = new Date(
      Date.now() - daysAgo * 24 * 60 * 60 * 1000
    ).toISOString()
    const shortCode = Math.random().toString(16).substring(2, 10)

    rows.push({
      id: `demo-link-${i}`,
      name: product,
      shortCode,
      affiliateUrl: `https://shopee.com.my/product/${i + 1}?aff=${shortCode}`,
      productName: product,
      clicks,
      conversions,
      earnings,
      ctr,
      status,
      createdAt,
    })
  }

  return rows.sort((a, b) => b.clicks - a.clicks)
}

export function getDemoAnalyticsRows(
  period: string | null,
  startDate?: string | null,
  endDate?: string | null
): AnalyticsDayRow[] {
  const { start, end } = resolvePeriod(period, startDate, endDate)
  const rand = seedRandom(99)

  const clicksData: Array<{ date: Date; value: number }> = []
  const conversionsData: Array<{ date: Date; value: number }> = []
  const earningsData: Array<{ date: Date; value: number }> = []

  const days = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
  )

  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000)
    const clicks = Math.floor(rand() * 200) + 80
    const conversions = Math.floor(rand() * 20) + 3
    const earnings = Math.round((rand() * 200 + 50) * 100) / 100
    clicksData.push({ date: d, value: clicks })
    conversionsData.push({ date: d, value: conversions })
    earningsData.push({ date: d, value: earnings })
  }

  const clicksByDay = aggregateByDay(clicksData, start, end).map((r) => ({
    date: r.date,
    count: r.value,
  }))
  const conversionsByDay = aggregateByDay(conversionsData, start, end).map(
    (r) => ({ date: r.date, count: r.value })
  )
  const earningsByDay = aggregateByDay(earningsData, start, end).map((r) => ({
    date: r.date,
    value: r.value,
  }))

  const allDates = new Set<string>([
    ...clicksByDay.map((c) => c.date),
    ...conversionsByDay.map((c) => c.date),
  ])
  return Array.from(allDates)
    .sort()
    .map((date) => {
      const clicks = clicksByDay.find((c) => c.date === date)?.count ?? 0
      const conversions =
        conversionsByDay.find((c) => c.date === date)?.count ?? 0
      const earnings = earningsByDay.find((e) => e.date === date)?.value ?? 0
      const ctr =
        clicks > 0 ? Math.round((conversions / clicks) * 10000) / 100 : 0
      return { date, clicks, conversions, ctr, earnings }
    })
}
