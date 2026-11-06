/**
 * PDF report builder for TheViralFindsMY exports.
 *
 * Uses pdfkit to generate professional branded reports with:
 *  - Branded header (logo block + title + period)
 *  - Summary metric cards
 *  - Mini bar chart of daily earnings (drawn natively)
 *  - Data tables (recent conversions / top links / daily analytics)
 *  - Footer with generated timestamp and copyright
 */

import PDFDocument from 'pdfkit'

type IPDFDocument = InstanceType<typeof PDFDocument>

import {
  formatMYDate,
  formatMYDateTime,
  formatRM,
  formatNumber,
  todayStamp,
} from './utils'
import {
  fetchEarningsRows,
  fetchLinkRows,
  fetchAnalyticsRows,
  buildPeriodLabel,
  type EarningsRow,
  type LinkRow,
  type AnalyticsDayRow,
} from './fetchers'

// ─── Brand colours ────────────────────────────────────────────────
const BRAND_ORANGE = '#ee4d2d' // Shopee-inspired
const BRAND_ORANGE_LIGHT = '#fff3ef'
const BRAND_DARK = '#1f2937'
const BRAND_MUTED = '#6b7280'
const BRAND_BORDER = '#e5e7eb'
const BRAND_BG_ALT = '#f9fafb'
const BRAND_GREEN = '#10b981'
const BRAND_AMBER = '#f59e0b'
const BRAND_RED = '#ef4444'

// ─── Page geometry ────────────────────────────────────────────────
const PAGE_WIDTH = 595.28 // A4 portrait in points
const PAGE_HEIGHT = 841.89
const MARGIN = 40
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

export interface PdfBuildResult {
  buffer: Buffer
  filename: string
}

export type PdfReportType = 'earnings' | 'links' | 'analytics'

interface ReportContext {
  type: PdfReportType
  period: string | null
  startDate?: string | null
  endDate?: string | null
}

/** Build a PDF report and return it as a Buffer. */
export async function buildPdfReport(
  ctx: ReportContext
): Promise<PdfBuildResult> {
  switch (ctx.type) {
    case 'earnings': {
      const { rows, source } = await fetchEarningsRows(
        ctx.period,
        ctx.startDate,
        ctx.endDate
      )
      const { rows: linkRows } = await fetchLinkRows()
      const buffer = await renderEarningsPdf(rows, linkRows, ctx)
      return {
        buffer,
        filename: `earnings-report-${todayStamp()}.pdf`,
      }
    }

    case 'links': {
      const { rows } = await fetchLinkRows()
      const buffer = await renderLinksPdf(rows, ctx)
      return {
        buffer,
        filename: `links-report-${todayStamp()}.pdf`,
      }
    }

    case 'analytics': {
      const { rows } = await fetchAnalyticsRows(
        ctx.period,
        ctx.startDate,
        ctx.endDate
      )
      const buffer = await renderAnalyticsPdf(rows, ctx)
      return {
        buffer,
        filename: `analytics-report-${todayStamp()}.pdf`,
      }
    }

    default:
      throw new Error(`Unknown PDF report type: ${ctx.type as string}`)
  }
}

// ─── Generic PDF helpers ──────────────────────────────────────────

function createDoc(): IPDFDocument {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
    info: {
      Title: 'TheViralFindsMY Report',
      Author: 'TheViralFindsMY',
      Subject: 'Affiliate Performance Report',
      Producer: 'TheViralFindsMY',
    },
  }) as IPDFDocument
  return doc
}

function collectBuffer(doc: IPDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    doc.on('data', (c: Buffer) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })
}

/** Draw the branded header block. Returns the y position after the header. */
function drawHeader(
  doc: IPDFDocument,
  title: string,
  subtitle: string,
  periodLabel: string
): number {
  let y = MARGIN

  // Logo block — orange rounded square with "TV" monogram
  const logoSize = 36
  const logoX = MARGIN
  const logoY = y
  doc.save()
  doc.roundedRect(logoX, logoY, logoSize, logoSize, 8).fill(BRAND_ORANGE)
  doc
    .fillColor('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(16)
    .text('TV', logoX, logoY + 9, {
      width: logoSize,
      align: 'center',
    })
  doc.restore()

  // Brand name + tagline
  const brandX = logoX + logoSize + 12
  doc
    .fillColor(BRAND_DARK)
    .font('Helvetica-Bold')
    .fontSize(16)
    .text('TheViralFindsMY', brandX, logoY + 2, { continued: false })
  doc
    .fillColor(BRAND_MUTED)
    .font('Helvetica')
    .fontSize(9)
    .text('AI-Powered Affiliate Manager', brandX, logoY + 22, {
      continued: false,
    })

  // Right-aligned report period
  doc
    .fillColor(BRAND_DARK)
    .font('Helvetica-Bold')
    .fontSize(10)
    .text('Report Period', PAGE_WIDTH - MARGIN - 200, logoY + 2, {
      width: 200,
      align: 'right',
    })
  doc
    .fillColor(BRAND_MUTED)
    .font('Helvetica')
    .fontSize(10)
    .text(periodLabel, PAGE_WIDTH - MARGIN - 200, logoY + 16, {
      width: 200,
      align: 'right',
    })

  y = logoY + logoSize + 16

  // Horizontal divider
  doc
    .strokeColor(BRAND_BORDER)
    .lineWidth(1)
    .moveTo(MARGIN, y)
    .lineTo(PAGE_WIDTH - MARGIN, y)
    .stroke()
  y += 14

  // Title
  doc
    .fillColor(BRAND_DARK)
    .font('Helvetica-Bold')
    .fontSize(22)
    .text(title, MARGIN, y)
  y += 28

  // Subtitle
  doc
    .fillColor(BRAND_MUTED)
    .font('Helvetica')
    .fontSize(11)
    .text(subtitle, MARGIN, y, {
      width: CONTENT_WIDTH,
    })
  y += 22

  return y
}

/** Draw the footer on every page (called via pageAdded event). */
function drawFooter(doc: IPDFDocument) {
  const pages = (doc as unknown as { bufferedPageCount: number }).bufferedPageCount
  for (let i = 0; i < pages; i++) {
    doc.switchToPage(i)
    const y = PAGE_HEIGHT - 28

    doc
      .strokeColor(BRAND_BORDER)
      .lineWidth(0.5)
      .moveTo(MARGIN, y - 6)
      .lineTo(PAGE_WIDTH - MARGIN, y - 6)
      .stroke()

    doc
      .fillColor(BRAND_MUTED)
      .font('Helvetica')
      .fontSize(8)
      .text(
        `Generated ${formatMYDateTime(new Date())} • © TheViralFindsMY`,
        MARGIN,
        y,
        { width: CONTENT_WIDTH * 0.7, align: 'left' }
      )

    doc
      .fillColor(BRAND_MUTED)
      .font('Helvetica')
      .fontSize(8)
      .text(`Page ${i + 1} of ${pages}`, PAGE_WIDTH - MARGIN - 120, y, {
        width: 120,
        align: 'right',
      })
  }
}

interface MetricCard {
  label: string
  value: string
  hint?: string
  accent?: string
}

/** Draw a row of summary metric cards. Returns the new y position. */
function drawMetricCards(
  doc: IPDFDocument,
  y: number,
  cards: MetricCard[]
): number {
  const gap = 8
  const cardWidth = (CONTENT_WIDTH - gap * (cards.length - 1)) / cards.length
  const cardHeight = 56

  cards.forEach((card, i) => {
    const x = MARGIN + i * (cardWidth + gap)
    const accent = card.accent ?? BRAND_ORANGE

    // Background
    doc.save()
    doc.roundedRect(x, y, cardWidth, cardHeight, 6).fill(BRAND_BG_ALT)
    doc.restore()

    // Accent bar on the left
    doc
      .fillColor(accent)
      .roundedRect(x, y, 4, cardHeight, 2)
      .fill()

    // Label
    doc
      .fillColor(BRAND_MUTED)
      .font('Helvetica-Bold')
      .fontSize(8)
      .text(card.label.toUpperCase(), x + 12, y + 10, {
        width: cardWidth - 18,
      })

    // Value
    doc
      .fillColor(BRAND_DARK)
      .font('Helvetica-Bold')
      .fontSize(16)
      .text(card.value, x + 12, y + 24, { width: cardWidth - 18 })

    // Hint
    if (card.hint) {
      doc
        .fillColor(BRAND_MUTED)
        .font('Helvetica')
        .fontSize(8)
        .text(card.hint, x + 12, y + 44, { width: cardWidth - 18 })
    }
  })

  return y + cardHeight + 16
}

/** Draw a section heading. Returns the new y position. */
function drawSectionHeading(
  doc: IPDFDocument,
  y: number,
  title: string,
  subtitle?: string
): number {
  // Accent square
  doc
    .fillColor(BRAND_ORANGE)
    .roundedRect(MARGIN, y + 2, 3, 14, 1)
    .fill()

  doc
    .fillColor(BRAND_DARK)
    .font('Helvetica-Bold')
    .fontSize(13)
    .text(title, MARGIN + 10, y)

  if (subtitle) {
    doc
      .fillColor(BRAND_MUTED)
      .font('Helvetica')
      .fontSize(9)
      .text(subtitle, MARGIN + 10, y + 16)
    y += 32
  } else {
    y += 22
  }

  return y
}

interface TableColumn {
  header: string
  width: number
  align?: 'left' | 'right' | 'center'
}

/** Draw a table with header row and data rows. Paginates as needed. */
function drawTable(
  doc: IPDFDocument,
  startY: number,
  columns: TableColumn[],
  rows: string[][],
  options: { maxRows?: number; emptyMessage?: string } = {}
): number {
  const { maxRows = 50, emptyMessage = 'No data available' } = options
  const headerHeight = 24
  const rowHeight = 20
  const visibleRows = rows.slice(0, maxRows)

  let y = startY

  // Check if we need a new page for at least header + 1 row
  if (y + headerHeight + rowHeight > PAGE_HEIGHT - MARGIN - 40) {
    doc.addPage()
    y = MARGIN
  }

  // Header background
  doc.save()
  doc
    .fillColor(BRAND_DARK)
    .roundedRect(MARGIN, y, CONTENT_WIDTH, headerHeight, 4)
    .fill()
  doc.restore()

  // Header text
  let x = MARGIN + 8
  columns.forEach((col) => {
    doc
      .fillColor('#ffffff')
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(col.header, x, y + 7, {
        width: col.width - 16,
        align: col.align ?? 'left',
      })
    x += col.width
  })
  y += headerHeight

  if (visibleRows.length === 0) {
    doc
      .fillColor(BRAND_MUTED)
      .font('Helvetica-Oblique')
      .fontSize(10)
      .text(emptyMessage, MARGIN, y + 8, {
        width: CONTENT_WIDTH,
        align: 'center',
      })
    return y + rowHeight + 8
  }

  // Data rows
  visibleRows.forEach((row, idx) => {
    // Paginate if needed
    if (y + rowHeight > PAGE_HEIGHT - MARGIN - 40) {
      doc.addPage()
      y = MARGIN

      // Re-draw header on new page
      doc.save()
      doc
        .fillColor(BRAND_DARK)
        .roundedRect(MARGIN, y, CONTENT_WIDTH, headerHeight, 4)
        .fill()
      doc.restore()

      x = MARGIN + 8
      columns.forEach((col) => {
        doc
          .fillColor('#ffffff')
          .font('Helvetica-Bold')
          .fontSize(9)
          .text(col.header, x, y + 7, {
            width: col.width - 16,
            align: col.align ?? 'left',
          })
        x += col.width
      })
      y += headerHeight
    }

    // Row background (alternating)
    if (idx % 2 === 1) {
      doc.save()
      doc
        .fillColor(BRAND_BG_ALT)
        .rect(MARGIN, y, CONTENT_WIDTH, rowHeight)
        .fill()
      doc.restore()
    }

    // Row text
    x = MARGIN + 8
    columns.forEach((col, ci) => {
      const cellValue = row[ci] ?? ''
      doc
        .fillColor(BRAND_DARK)
        .font('Helvetica')
        .fontSize(9)
        .text(cellValue, x, y + 5, {
          width: col.width - 16,
          align: col.align ?? 'left',
          ellipsis: true,
        })
      x += col.width
    })

    // Row border bottom
    doc
      .strokeColor(BRAND_BORDER)
      .lineWidth(0.3)
      .moveTo(MARGIN, y + rowHeight)
      .lineTo(PAGE_WIDTH - MARGIN, y + rowHeight)
      .stroke()

    y += rowHeight
  })

  // Footer note about truncation
  if (rows.length > maxRows) {
    y += 6
    doc
      .fillColor(BRAND_MUTED)
      .font('Helvetica-Oblique')
      .fontSize(8)
      .text(
        `Showing ${maxRows} of ${rows.length} rows. Export as CSV for the complete dataset.`,
        MARGIN,
        y,
        { width: CONTENT_WIDTH }
      )
    y += 14
  } else {
    y += 8
  }

  return y
}

/** Draw a simple bar chart of values over time. */
function drawBarChart(
  doc: IPDFDocument,
  y: number,
  title: string,
  data: Array<{ label: string; value: number }>,
  valueFormatter: (v: number) => string,
  accent: string = BRAND_ORANGE
): number {
  const chartHeight = 140
  const chartWidth = CONTENT_WIDTH
  const padding = { top: 20, right: 10, bottom: 24, left: 40 }
  const innerW = chartWidth - padding.left - padding.right
  const innerH = chartHeight - padding.top - padding.bottom

  // Title
  doc
    .fillColor(BRAND_DARK)
    .font('Helvetica-Bold')
    .fontSize(11)
    .text(title, MARGIN, y)
  y += 16

  // Chart background
  doc
    .save()
    .fillColor(BRAND_BG_ALT)
    .roundedRect(MARGIN, y, chartWidth, chartHeight, 6)
    .fill()
    .restore()

  // Compute scale
  const maxValue = Math.max(1, ...data.map((d) => d.value))
  const barCount = data.length
  const barGap = 2
  const barWidth = barCount > 0 ? (innerW - barGap * (barCount - 1)) / barCount : 0

  // Y-axis labels (4 grid lines)
  doc
    .strokeColor(BRAND_BORDER)
    .lineWidth(0.3)
    .fillColor(BRAND_MUTED)
    .font('Helvetica')
    .fontSize(7)

  for (let i = 0; i <= 4; i++) {
    const gy = y + padding.top + (innerH * i) / 4
    const val = maxValue * (1 - i / 4)
    doc
      .moveTo(MARGIN + padding.left, gy)
      .lineTo(MARGIN + chartWidth - padding.right, gy)
      .stroke()
    doc.text(valueFormatter(Math.round(val * 100) / 100), MARGIN, gy - 4, {
      width: padding.left - 4,
      align: 'right',
    })
  }

  // Bars
  data.forEach((d, i) => {
    const bh = (d.value / maxValue) * innerH
    const bx = MARGIN + padding.left + i * (barWidth + barGap)
    const by = y + padding.top + (innerH - bh)
    doc
      .fillColor(accent)
      .roundedRect(bx, by, Math.max(barWidth - 0.5, 0.5), Math.max(bh, 0.5), 1)
      .fill()
  })

  // X-axis labels (sparse — every Nth bar)
  const labelEvery = Math.max(1, Math.ceil(barCount / 8))
  doc.fillColor(BRAND_MUTED).font('Helvetica').fontSize(7)
  data.forEach((d, i) => {
    if (i % labelEvery !== 0 && i !== barCount - 1) return
    const bx = MARGIN + padding.left + i * (barWidth + barGap)
    doc.text(d.label, bx, y + chartHeight - 16, {
      width: Math.max(barWidth, 30),
      align: 'center',
    })
  })

  return y + chartHeight + 16
}

// ─── Per-report renderers ─────────────────────────────────────────

async function renderEarningsPdf(
  earningsRows: EarningsRow[],
  linkRows: LinkRow[],
  ctx: ReportContext
): Promise<Buffer> {
  const doc = createDoc()
  const bufferPromise = collectBuffer(doc)

  const periodLabel = buildPeriodLabel(ctx.period, ctx.startDate, ctx.endDate)

  let y = drawHeader(
    doc,
    'Earnings Report',
    'Monthly affiliate commission summary with breakdown by product and recent conversions.',
    periodLabel
  )

  // ── Summary metrics ───────────────────────────────────────────
  const totalEarnings = earningsRows.reduce((sum, r) => sum + r.commission, 0)
  const totalRevenue = earningsRows.reduce((sum, r) => sum + r.amount, 0)
  const totalConversions = earningsRows.length
  const avgCommission =
    totalConversions > 0 ? totalEarnings / totalConversions : 0
  const confirmedCount = earningsRows.filter(
    (r) => r.status === 'confirmed' || r.status === 'paid'
  ).length
  const pendingCount = earningsRows.filter(
    (r) => r.status === 'pending'
  ).length

  y = drawSectionHeading(doc, y, 'Summary', 'Key metrics for the selected period')
  y = drawMetricCards(doc, y, [
    {
      label: 'Total Earnings',
      value: `RM ${formatRM(totalEarnings)}`,
      hint: `${totalConversions} conversions`,
      accent: BRAND_ORANGE,
    },
    {
      label: 'Avg Commission',
      value: `RM ${formatRM(avgCommission)}`,
      hint: 'Per conversion',
      accent: BRAND_GREEN,
    },
    {
      label: 'Confirmed / Paid',
      value: formatNumber(confirmedCount),
      hint: 'Verified commissions',
      accent: BRAND_GREEN,
    },
    {
      label: 'Pending',
      value: formatNumber(pendingCount),
      hint: 'Awaiting confirmation',
      accent: BRAND_AMBER,
    },
  ])

  // ── Daily earnings bar chart ──────────────────────────────────
  const earningsByDay = new Map<string, number>()
  for (const r of earningsRows) {
    const key = r.date.split('T')[0]
    earningsByDay.set(key, (earningsByDay.get(key) ?? 0) + r.commission)
  }
  const chartData = Array.from(earningsByDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, value]) => ({
      label: formatMYDate(date).slice(0, 5), // DD/MM
      value,
    }))

  if (chartData.length > 0) {
    y = drawBarChart(
      doc,
      y,
      'Daily Earnings (last 30 days)',
      chartData,
      (v) => `RM ${formatRM(v)}`,
      BRAND_ORANGE
    )
  }

  // ── Recent conversions table ──────────────────────────────────
  y = drawSectionHeading(
    doc,
    y,
    'Recent Conversions',
    'Latest 20 commission entries'
  )
  const convCols: TableColumn[] = [
    { header: 'Date', width: 100, align: 'left' },
    { header: 'Order ID', width: 130, align: 'left' },
    { header: 'Product', width: 170, align: 'left' },
    { header: 'Amount (RM)', width: 80, align: 'right' },
    { header: 'Commission', width: 75, align: 'right' },
    { header: 'Status', width: 75, align: 'left' },
  ]
  // Adjust widths to fit CONTENT_WIDTH (ensure total = CONTENT_WIDTH)
  const totalConvWidth = convCols.reduce((s, c) => s + c.width, 0)
  const convScale = CONTENT_WIDTH / totalConvWidth
  const convRows = earningsRows.slice(0, 20).map((r) => [
    formatMYDate(r.date),
    r.orderId ?? '—',
    r.productName,
    formatRM(r.amount),
    `RM ${formatRM(r.commission)}`,
    r.status,
  ])
  y = drawTable(doc, y, convCols.map((c) => ({ ...c, width: c.width * convScale })), convRows, {
    maxRows: 20,
    emptyMessage: 'No conversions recorded in this period.',
  })

  // ── Top products table ────────────────────────────────────────
  if (y > PAGE_HEIGHT - MARGIN - 200) {
    doc.addPage()
    y = MARGIN
  }
  y = drawSectionHeading(
    doc,
    y,
    'Top Performing Products',
    'Top 10 products by total commission'
  )
  const productAgg = new Map<
    string,
    { clicks: number; conversions: number; earnings: number }
  >()
  for (const r of earningsRows) {
    const existing = productAgg.get(r.productName) ?? {
      clicks: 0,
      conversions: 0,
      earnings: 0,
    }
    existing.conversions += 1
    existing.earnings += r.commission
    productAgg.set(r.productName, existing)
  }
  // Augment with clicks from links if names match
  for (const link of linkRows) {
    const entry = productAgg.get(link.name) ?? productAgg.get(link.productName ?? '')
    if (entry) entry.clicks += link.clicks
  }
  const topProducts = Array.from(productAgg.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 10)

  const prodCols: TableColumn[] = [
    { header: 'Product', width: 230, align: 'left' },
    { header: 'Clicks', width: 80, align: 'right' },
    { header: 'Conversions', width: 100, align: 'right' },
    { header: 'Earnings', width: 100, align: 'right' },
  ]
  const totalProdWidth = prodCols.reduce((s, c) => s + c.width, 0)
  const prodScale = CONTENT_WIDTH / totalProdWidth
  const prodRows = topProducts.map((p) => [
    p.name,
    formatNumber(p.clicks),
    formatNumber(p.conversions),
    `RM ${formatRM(p.earnings)}`,
  ])
  y = drawTable(
    doc,
    y,
    prodCols.map((c) => ({ ...c, width: c.width * prodScale })),
    prodRows,
    { maxRows: 10, emptyMessage: 'No product-level data available.' }
  )

  // ── Total revenue footer block ────────────────────────────────
  if (y > PAGE_HEIGHT - MARGIN - 100) {
    doc.addPage()
    y = MARGIN
  }
  y += 8
  doc
    .save()
    .fillColor(BRAND_ORANGE_LIGHT)
    .roundedRect(MARGIN, y, CONTENT_WIDTH, 50, 6)
    .fill()
    .restore()
  doc
    .fillColor(BRAND_MUTED)
    .font('Helvetica-Bold')
    .fontSize(9)
    .text('TOTAL REVENUE GENERATED', MARGIN + 16, y + 10)
  doc
    .fillColor(BRAND_DARK)
    .font('Helvetica-Bold')
    .fontSize(18)
    .text(`RM ${formatRM(totalRevenue)}`, MARGIN + 16, y + 24)
  doc
    .fillColor(BRAND_MUTED)
    .font('Helvetica')
    .fontSize(8)
    .text(
      `Across ${formatNumber(totalConversions)} orders • Avg order value RM ${formatRM(
        totalConversions > 0 ? totalRevenue / totalConversions : 0
      )}`,
      MARGIN + 260,
      y + 18,
      { width: CONTENT_WIDTH - 280, align: 'right' }
    )

  drawFooter(doc)
  doc.end()

  return bufferPromise
}

async function renderLinksPdf(
  linkRows: LinkRow[],
  ctx: ReportContext
): Promise<Buffer> {
  const doc = createDoc()
  const bufferPromise = collectBuffer(doc)

  const periodLabel = buildPeriodLabel(ctx.period, ctx.startDate, ctx.endDate)

  let y = drawHeader(
    doc,
    'Affiliate Links Report',
    'Complete inventory of affiliate links with performance metrics.',
    periodLabel
  )

  // ── Summary metrics ───────────────────────────────────────────
  const totalLinks = linkRows.length
  const activeLinks = linkRows.filter((l) => l.status === 'active').length
  const totalClicks = linkRows.reduce((s, l) => s + l.clicks, 0)
  const totalConversions = linkRows.reduce((s, l) => s + l.conversions, 0)
  const totalEarnings = linkRows.reduce((s, l) => s + l.earnings, 0)
  const overallCtr =
    totalClicks > 0
      ? Math.round((totalConversions / totalClicks) * 10000) / 100
      : 0

  y = drawSectionHeading(doc, y, 'Summary', 'Portfolio-wide link performance')
  y = drawMetricCards(doc, y, [
    {
      label: 'Total Links',
      value: formatNumber(totalLinks),
      hint: `${activeLinks} active`,
      accent: BRAND_ORANGE,
    },
    {
      label: 'Total Clicks',
      value: formatNumber(totalClicks),
      hint: 'All-time',
      accent: BRAND_GREEN,
    },
    {
      label: 'Conversions',
      value: formatNumber(totalConversions),
      hint: `${overallCtr}% CTR`,
      accent: BRAND_AMBER,
    },
    {
      label: 'Total Earnings',
      value: `RM ${formatRM(totalEarnings)}`,
      hint: 'Lifetime',
      accent: BRAND_ORANGE,
    },
  ])

  // ── Top links bar chart ───────────────────────────────────────
  const topChart = [...linkRows]
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 10)
    .map((l) => ({
      label:
        l.name.length > 12 ? l.name.slice(0, 10) + '…' : l.name,
      value: l.earnings,
    }))
  if (topChart.length > 0) {
    y = drawBarChart(
      doc,
      y,
      'Top 10 Links by Earnings',
      topChart,
      (v) => `RM ${formatRM(v)}`,
      BRAND_ORANGE
    )
  }

  // ── Links table ───────────────────────────────────────────────
  y = drawSectionHeading(doc, y, 'All Affiliate Links', 'Full link inventory')
  const linkCols: TableColumn[] = [
    { header: 'Name', width: 160, align: 'left' },
    { header: 'Short Code', width: 80, align: 'left' },
    { header: 'Clicks', width: 60, align: 'right' },
    { header: 'Conv.', width: 55, align: 'right' },
    { header: 'CTR %', width: 50, align: 'right' },
    { header: 'Earnings', width: 80, align: 'right' },
    { header: 'Status', width: 70, align: 'left' },
    { header: 'Created', width: 65, align: 'left' },
  ]
  const totalLinkWidth = linkCols.reduce((s, c) => s + c.width, 0)
  const linkScale = CONTENT_WIDTH / totalLinkWidth
  const linkTableRows = linkRows.map((l) => [
    l.name,
    l.shortCode,
    formatNumber(l.clicks),
    formatNumber(l.conversions),
    l.ctr !== null ? l.ctr.toFixed(2) : '0.00',
    `RM ${formatRM(l.earnings)}`,
    l.status,
    formatMYDate(l.createdAt),
  ])
  y = drawTable(
    doc,
    y,
    linkCols.map((c) => ({ ...c, width: c.width * linkScale })),
    linkTableRows,
    { maxRows: 30, emptyMessage: 'No affiliate links created yet.' }
  )

  drawFooter(doc)
  doc.end()

  return bufferPromise
}

async function renderAnalyticsPdf(
  analyticsRows: AnalyticsDayRow[],
  ctx: ReportContext
): Promise<Buffer> {
  const doc = createDoc()
  const bufferPromise = collectBuffer(doc)

  const periodLabel = buildPeriodLabel(ctx.period, ctx.startDate, ctx.endDate)

  let y = drawHeader(
    doc,
    'Analytics Report',
    'Daily clicks, conversions, CTR, and earnings for the selected period.',
    periodLabel
  )

  // ── Summary metrics ───────────────────────────────────────────
  const totalClicks = analyticsRows.reduce((s, r) => s + r.clicks, 0)
  const totalConversions = analyticsRows.reduce((s, r) => s + r.conversions, 0)
  const totalEarnings = analyticsRows.reduce((s, r) => s + r.earnings, 0)
  const overallCtr =
    totalClicks > 0
      ? Math.round((totalConversions / totalClicks) * 10000) / 100
      : 0
  const avgDailyClicks =
    analyticsRows.length > 0 ? totalClicks / analyticsRows.length : 0

  y = drawSectionHeading(doc, y, 'Summary', 'Aggregate performance')
  y = drawMetricCards(doc, y, [
    {
      label: 'Total Clicks',
      value: formatNumber(totalClicks),
      hint: `${formatNumber(Math.round(avgDailyClicks))} avg/day`,
      accent: BRAND_ORANGE,
    },
    {
      label: 'Conversions',
      value: formatNumber(totalConversions),
      hint: 'Total purchases',
      accent: BRAND_GREEN,
    },
    {
      label: 'Conversion Rate',
      value: `${overallCtr.toFixed(2)}%`,
      hint: 'Clicks → purchases',
      accent: BRAND_AMBER,
    },
    {
      label: 'Total Earnings',
      value: `RM ${formatRM(totalEarnings)}`,
      hint: 'Commissions earned',
      accent: BRAND_ORANGE,
    },
  ])

  // ── Clicks over time bar chart ────────────────────────────────
  const clicksChart = analyticsRows.slice(-30).map((r) => ({
    label: formatMYDate(r.date).slice(0, 5),
    value: r.clicks,
  }))
  if (clicksChart.length > 0) {
    y = drawBarChart(
      doc,
      y,
      'Daily Clicks (last 30 days)',
      clicksChart,
      (v) => formatNumber(Math.round(v)),
      BRAND_ORANGE
    )
  }

  // ── Conversions over time bar chart ───────────────────────────
  const convChart = analyticsRows.slice(-30).map((r) => ({
    label: formatMYDate(r.date).slice(0, 5),
    value: r.conversions,
  }))
  if (convChart.length > 0 && y < PAGE_HEIGHT - MARGIN - 200) {
    y = drawBarChart(
      doc,
      y,
      'Daily Conversions (last 30 days)',
      convChart,
      (v) => formatNumber(Math.round(v)),
      BRAND_GREEN
    )
  }

  // ── Daily analytics table ─────────────────────────────────────
  y = drawSectionHeading(
    doc,
    y,
    'Daily Breakdown',
    'Day-by-day clicks, conversions, CTR, and earnings'
  )
  const analyticsCols: TableColumn[] = [
    { header: 'Date', width: 130, align: 'left' },
    { header: 'Clicks', width: 110, align: 'right' },
    { header: 'Conversions', width: 110, align: 'right' },
    { header: 'CTR (%)', width: 100, align: 'right' },
    { header: 'Earnings (RM)', width: 125, align: 'right' },
  ]
  const totalAnalyticsWidth = analyticsCols.reduce((s, c) => s + c.width, 0)
  const analyticsScale = CONTENT_WIDTH / totalAnalyticsWidth
  const analyticsTableRows = analyticsRows
    .slice()
    .reverse()
    .map((r) => [
      formatMYDate(r.date),
      formatNumber(r.clicks),
      formatNumber(r.conversions),
      r.ctr.toFixed(2),
      formatRM(r.earnings),
    ])
  y = drawTable(
    doc,
    y,
    analyticsCols.map((c) => ({ ...c, width: c.width * analyticsScale })),
    analyticsTableRows,
    { maxRows: 30, emptyMessage: 'No analytics data available for this period.' }
  )

  drawFooter(doc)
  doc.end()

  return bufferPromise
}
