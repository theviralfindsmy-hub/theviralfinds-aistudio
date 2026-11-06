import { NextRequest, NextResponse } from 'next/server'

import {
  formatMYDate,
  formatRM,
  objectsToCsv,
  todayStamp,
} from '@/lib/export/utils'
import {
  fetchEarningsRows,
  fetchLinkRows,
  fetchAnalyticsRows,
} from '@/lib/export/fetchers'

/**
 * GET /api/export/csv?type=earnings|links|analytics
 *   &period=7d|30d|90d
 *   &startDate=DD/MM/YYYY or ISO
 *   &endDate=DD/MM/YYYY or ISO
 *
 * Returns a UTF-8 (BOM-prefixed) CSV file for Excel compatibility.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const period = searchParams.get('period')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // BOM (\uFEFF) ensures Excel reads UTF-8 correctly (RM symbol, special chars)
    const BOM = '\uFEFF'

    let csv = ''
    let filename = ''

    switch (type) {
      case 'earnings': {
        const { rows, source } = await fetchEarningsRows(
          period,
          startDate,
          endDate
        )

        if (rows.length === 0) {
          csv = objectsToCsv(
            [],
            [
              { key: 'date', label: 'Date' },
              { key: 'orderId', label: 'Order ID' },
              { key: 'productName', label: 'Product Name' },
              { key: 'amount', label: 'Amount (RM)' },
              { key: 'commission', label: 'Commission (RM)' },
              { key: 'status', label: 'Status' },
            ]
          )
          csv += `\nNo data found for the selected period.\n`
          csv += `\nSource: ${source}\n`
        } else {
          const csvRows = rows.map((r) => ({
            date: formatMYDate(r.date),
            orderId: r.orderId ?? '',
            productName: r.productName,
            amount: formatRM(r.amount),
            commission: formatRM(r.commission),
            status: r.status,
          }))
          csv = objectsToCsv(csvRows, [
            { key: 'date', label: 'Date' },
            { key: 'orderId', label: 'Order ID' },
            { key: 'productName', label: 'Product Name' },
            { key: 'amount', label: 'Amount (RM)' },
            { key: 'commission', label: 'Commission (RM)' },
            { key: 'status', label: 'Status' },
          ])
          csv += `\nSource: ${source}\n`
          csv += `Generated: ${formatMYDate(new Date())}\n`
        }

        filename = `earnings-${todayStamp()}.csv`
        break
      }

      case 'links': {
        const { rows, source } = await fetchLinkRows()

        if (rows.length === 0) {
          csv = objectsToCsv(
            [],
            [
              { key: 'name', label: 'Name' },
              { key: 'shortCode', label: 'Short Code' },
              { key: 'affiliateUrl', label: 'Affiliate URL' },
              { key: 'clicks', label: 'Clicks' },
              { key: 'conversions', label: 'Conversions' },
              { key: 'earnings', label: 'Earnings (RM)' },
              { key: 'ctr', label: 'CTR (%)' },
              { key: 'status', label: 'Status' },
              { key: 'createdAt', label: 'Created At' },
            ]
          )
          csv += `\nNo links found.\n`
          csv += `\nSource: ${source}\n`
        } else {
          const csvRows = rows.map((r) => ({
            name: r.name,
            shortCode: r.shortCode,
            affiliateUrl: r.affiliateUrl,
            clicks: r.clicks,
            conversions: r.conversions,
            earnings: formatRM(r.earnings),
            ctr: r.ctr !== null ? r.ctr.toFixed(2) : '0.00',
            status: r.status,
            createdAt: formatMYDate(r.createdAt),
          }))
          csv = objectsToCsv(csvRows, [
            { key: 'name', label: 'Name' },
            { key: 'shortCode', label: 'Short Code' },
            { key: 'affiliateUrl', label: 'Affiliate URL' },
            { key: 'clicks', label: 'Clicks' },
            { key: 'conversions', label: 'Conversions' },
            { key: 'earnings', label: 'Earnings (RM)' },
            { key: 'ctr', label: 'CTR (%)' },
            { key: 'status', label: 'Status' },
            { key: 'createdAt', label: 'Created At' },
          ])
          csv += `\nSource: ${source}\n`
          csv += `Generated: ${formatMYDate(new Date())}\n`
        }

        filename = `links-${todayStamp()}.csv`
        break
      }

      case 'analytics': {
        const { rows, source } = await fetchAnalyticsRows(
          period,
          startDate,
          endDate
        )

        if (rows.length === 0) {
          csv = objectsToCsv(
            [],
            [
              { key: 'date', label: 'Date' },
              { key: 'clicks', label: 'Clicks' },
              { key: 'conversions', label: 'Conversions' },
              { key: 'ctr', label: 'CTR (%)' },
              { key: 'earnings', label: 'Earnings (RM)' },
            ]
          )
          csv += `\nNo analytics data found for the selected period.\n`
          csv += `\nSource: ${source}\n`
        } else {
          const csvRows = rows.map((r) => ({
            date: formatMYDate(r.date),
            clicks: r.clicks,
            conversions: r.conversions,
            ctr: r.ctr.toFixed(2),
            earnings: formatRM(r.earnings),
          }))
          csv = objectsToCsv(csvRows, [
            { key: 'date', label: 'Date' },
            { key: 'clicks', label: 'Clicks' },
            { key: 'conversions', label: 'Conversions' },
            { key: 'ctr', label: 'CTR (%)' },
            { key: 'earnings', label: 'Earnings (RM)' },
          ])
          csv += `\nSource: ${source}\n`
          csv += `Generated: ${formatMYDate(new Date())}\n`
        }

        filename = `analytics-${todayStamp()}.csv`
        break
      }

      default:
        return NextResponse.json(
          {
            error:
              "Invalid type. Must be one of: 'earnings', 'links', 'analytics'",
          },
          { status: 400 }
        )
    }

    const csvWithBom = BOM + csv

    return new NextResponse(csvWithBom, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    console.error('CSV export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSV export' },
      { status: 500 }
    )
  }
}
