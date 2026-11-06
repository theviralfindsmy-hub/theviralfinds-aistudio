'use client'

import { useState, useCallback } from 'react'
import { Download, FileText, Loader2, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type ExportType = 'earnings' | 'links' | 'analytics'

export interface ExportButtonsProps {
  type: ExportType
  /** DD/MM/YYYY or ISO. Optional. */
  startDate?: string
  /** DD/MM/YYYY or ISO. Optional. */
  endDate?: string
  /** Optional period shortcut, e.g. '7d' | '30d' | '90d'. */
  period?: string
  /** Visual variant. Defaults to 'outline'. */
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  /** Button size. Defaults to 'sm'. */
  size?: 'default' | 'sm' | 'lg' | 'icon'
  /** Optional className for the wrapping container. */
  className?: string
}

/**
 * Build the export URL with all optional query params.
 * Uses relative path so it routes through the Next.js dev server
 * (and the Caddy gateway in production).
 */
function buildExportUrl(
  format: 'csv' | 'pdf',
  type: ExportType,
  opts: { startDate?: string; endDate?: string; period?: string }
): string {
  const params = new URLSearchParams({ type })
  if (opts.startDate) params.set('startDate', opts.startDate)
  if (opts.endDate) params.set('endDate', opts.endDate)
  if (opts.period) params.set('period', opts.period)
  return `/api/export/${format}?${params.toString()}`
}

/**
 * Two-button export group (CSV + PDF).
 * Used in page headers where space allows.
 */
export function ExportButtons({
  type,
  startDate,
  endDate,
  period,
  variant = 'outline',
  size = 'sm',
  className,
}: ExportButtonsProps) {
  const [downloading, setDownloading] = useState<'csv' | 'pdf' | null>(null)

  const handleExport = useCallback(
    async (format: 'csv' | 'pdf') => {
      try {
        setDownloading(format)
        const url = buildExportUrl(format, type, { startDate, endDate, period })
        // Open in a new tab so the browser triggers the file download
        // while keeping the current page state intact.
        window.open(url, '_blank', 'noopener,noreferrer')
        toast.success(
          `${format.toUpperCase()} export started`,
          { description: 'Your file will download in a new tab.' }
        )
      } catch (err) {
        console.error('Export error:', err)
        toast.error('Export failed', {
          description: 'Please try again or check your connection.',
        })
      } finally {
        // Brief delay so the spinner is visible even on fast networks
        setTimeout(() => setDownloading(null), 600)
      }
    },
    [type, startDate, endDate, period]
  )

  return (
    <div className={className ?? 'flex items-center gap-2'}>
      <Button
        variant={variant}
        size={size}
        onClick={() => handleExport('csv')}
        disabled={downloading !== null}
        aria-label={`Export ${type} as CSV`}
      >
        {downloading === 'csv' ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Download className="size-4" />
        )}
        CSV
      </Button>
      <Button
        variant={variant}
        size={size}
        onClick={() => handleExport('pdf')}
        disabled={downloading !== null}
        aria-label={`Export ${type} as PDF`}
      >
        {downloading === 'pdf' ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <FileText className="size-4" />
        )}
        PDF
      </Button>
    </div>
  )
}

/**
 * Compact dropdown variant — single button that opens a menu
 * with CSV / PDF options. Used in tight layouts (mobile, dense toolbars).
 */
export function ExportDropdown({
  type,
  startDate,
  endDate,
  period,
  variant = 'outline',
  size = 'sm',
  className,
  label = 'Export',
}: ExportButtonsProps & { label?: string }) {
  const [downloading, setDownloading] = useState<'csv' | 'pdf' | null>(null)

  const handleExport = useCallback(
    async (format: 'csv' | 'pdf') => {
      try {
        setDownloading(format)
        const url = buildExportUrl(format, type, { startDate, endDate, period })
        window.open(url, '_blank', 'noopener,noreferrer')
        toast.success(`${format.toUpperCase()} export started`, {
          description: 'Your file will download in a new tab.',
        })
      } catch (err) {
        console.error('Export error:', err)
        toast.error('Export failed', {
          description: 'Please try again or check your connection.',
        })
      } finally {
        setTimeout(() => setDownloading(null), 600)
      }
    },
    [type, startDate, endDate, period]
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          disabled={downloading !== null}
          aria-label={`Export ${type}`}
        >
          {downloading !== null ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          {label}
          <ChevronDown className="size-4 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Choose format
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleExport('csv')}
          className="cursor-pointer gap-2"
        >
          <Download className="size-4 text-emerald-500" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">CSV</span>
            <span className="text-xs text-muted-foreground">
              Excel / Sheets
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('pdf')}
          className="cursor-pointer gap-2"
        >
          <FileText className="size-4 text-rose-500" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">PDF Report</span>
            <span className="text-xs text-muted-foreground">
              Branded summary
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
