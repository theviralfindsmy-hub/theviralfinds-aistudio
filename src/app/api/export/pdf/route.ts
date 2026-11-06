import { NextRequest, NextResponse } from 'next/server'

import { buildPdfReport, type PdfReportType } from '@/lib/export/pdf-builder'

/**
 * GET /api/export/pdf?type=earnings|links|analytics
 *   &period=7d|30d|90d
 *   &startDate=DD/MM/YYYY or ISO
 *   &endDate=DD/MM/YYYY or ISO
 *
 * Returns a professionally branded PDF report.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as PdfReportType | null
    const period = searchParams.get('period')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (type !== 'earnings' && type !== 'links' && type !== 'analytics') {
      return NextResponse.json(
        {
          error:
            "Invalid type. Must be one of: 'earnings', 'links', 'analytics'",
        },
        { status: 400 }
      )
    }

    const { buffer, filename } = await buildPdfReport({
      type,
      period,
      startDate,
      endDate,
    })

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    console.error('PDF export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF report' },
      { status: 500 }
    )
  }
}
