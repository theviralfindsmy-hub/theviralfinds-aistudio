/**
 * Shared utilities for CSV/PDF export routes.
 *
 * All monetary values are formatted in Malaysian Ringgit (RM) with 2 decimals.
 * All dates are formatted as DD/MM/YYYY (Malaysian format).
 */

/** Format a number as Malaysian Ringgit with 2 decimals, e.g. 1234.5 -> "1,234.50" */
export function formatRM(value: number): string {
  return value.toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Format a number with thousands separator (en-MY). */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-MY')
}

/** Format a Date (or ISO string) as DD/MM/YYYY (Malaysian). Returns "" for null. */
export function formatMYDate(input: Date | string | null | undefined): string {
  if (!input) return ''
  const d = typeof input === 'string' ? new Date(input) : input
  if (isNaN(d.getTime())) return ''
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

/** Format a Date (or ISO string) as DD/MM/YYYY HH:mm (Malaysian). */
export function formatMYDateTime(input: Date | string | null | undefined): string {
  if (!input) return ''
  const d = typeof input === 'string' ? new Date(input) : input
  if (isNaN(d.getTime())) return ''
  const date = formatMYDate(d)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${date} ${hh}:${mm}`
}

/**
 * Escape a CSV field per RFC 4180:
 * - If the field contains a comma, double-quote, newline, or carriage return,
 *   wrap it in double quotes and double any internal quotes.
 */
export function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/** Convert an array of objects to CSV using the given column definitions. */
export function objectsToCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: Array<{ key: keyof T; label: string }>
): string {
  const header = columns.map((c) => escapeCsvField(c.label)).join(',')
  const body = rows
    .map((row) =>
      columns
        .map((c) => escapeCsvField(row[c.key] ?? ''))
        .join(',')
    )
    .join('\n')
  return `${header}\n${body}`
}

/** Get today's date as YYYY-MM-DD for filename generation. */
export function todayStamp(): string {
  return new Date().toISOString().split('T')[0]
}

/** Parse DD/MM/YYYY string to Date. Returns undefined if invalid. */
export function parseMYDate(input: string): Date | undefined {
  const m = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return undefined
  const day = parseInt(m[1], 10)
  const month = parseInt(m[2], 10) - 1
  const year = parseInt(m[3], 10)
  const d = new Date(year, month, day)
  if (isNaN(d.getTime())) return undefined
  return d
}

/**
 * Parse a startDate/endDate query string pair (DD/MM/YYYY or ISO).
 * Returns undefined if not parseable.
 */
export function parseDateRange(
  startDate?: string | null,
  endDate?: string | null
): { start?: Date; end?: Date } {
  const result: { start?: Date; end?: Date } = {}
  if (startDate) {
    const d = parseMYDate(startDate) ?? new Date(startDate)
    if (!isNaN(d.getTime())) result.start = d
  }
  if (endDate) {
    const d = parseMYDate(endDate) ?? new Date(endDate)
    if (!isNaN(d.getTime())) {
      // Set end date to end of day
      d.setHours(23, 59, 59, 999)
      result.end = d
    }
  }
  return result
}

/**
 * Compute date range from a period shortcut (7d, 30d, 90d) or
 * explicit startDate/endDate query params.
 */
export function resolvePeriod(
  period: string | null,
  startDate?: string | null,
  endDate?: string | null
): { start: Date; end: Date } {
  if (startDate || endDate) {
    const parsed = parseDateRange(startDate, endDate)
    const now = new Date()
    return {
      start: parsed.start ?? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      end: parsed.end ?? now,
    }
  }

  const now = new Date()
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
  return {
    start: new Date(now.getTime() - days * 24 * 60 * 60 * 1000),
    end: now,
  }
}

/** Aggregate items by day, filling empty days with zero. */
export function aggregateByDay(
  data: Array<{ date: Date | string; value: number }>,
  startDate: Date,
  endDate: Date
): Array<{ date: string; value: number }> {
  const dayMap = new Map<string, number>()
  const current = new Date(startDate)
  current.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)

  while (current <= end) {
    const key = current.toISOString().split('T')[0]
    dayMap.set(key, 0)
    current.setDate(current.getDate() + 1)
  }

  for (const item of data) {
    const d = typeof item.date === 'string' ? new Date(item.date) : item.date
    if (isNaN(d.getTime())) continue
    const key = d.toISOString().split('T')[0]
    if (dayMap.has(key)) {
      dayMap.set(key, (dayMap.get(key) || 0) + item.value)
    }
  }

  return Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }))
}

/** Combine clicks-by-day, conversions-by-day, earnings-by-day into a unified analytics row. */
export function mergeDailyAnalytics(
  clicks: Array<{ date: string; count: number }>,
  conversions: Array<{ date: string; count: number }>,
  earningsByDay: Array<{ date: string; value: number }>
): Array<{
  date: string
  clicks: number
  conversions: number
  ctr: number
  earnings: number
}> {
  const map = new Map<
    string,
    { clicks: number; conversions: number; earnings: number }
  >()
  const allDates = new Set<string>()

  for (const c of clicks) {
    allDates.add(c.date)
    const row = map.get(c.date) ?? { clicks: 0, conversions: 0, earnings: 0 }
    row.clicks = c.count
    map.set(c.date, row)
  }
  for (const c of conversions) {
    allDates.add(c.date)
    const row = map.get(c.date) ?? { clicks: 0, conversions: 0, earnings: 0 }
    row.conversions = c.count
    map.set(c.date, row)
  }
  for (const e of earningsByDay) {
    allDates.add(e.date)
    const row = map.get(e.date) ?? { clicks: 0, conversions: 0, earnings: 0 }
    row.earnings = e.value
    map.set(e.date, row)
  }

  return Array.from(allDates)
    .sort((a, b) => a.localeCompare(b))
    .map((date) => {
      const row = map.get(date) ?? { clicks: 0, conversions: 0, earnings: 0 }
      const ctr =
        row.clicks > 0
          ? Math.round((row.conversions / row.clicks) * 10000) / 100
          : 0
      return { date, ...row, ctr }
    })
}
