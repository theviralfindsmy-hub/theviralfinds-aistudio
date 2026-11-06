'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

/**
 * Next.js root error boundary. Catches errors that escape the page tree,
 * including errors thrown during server component rendering.
 *
 * Must be a client component. Must call reset() to recover.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to console — could be sent to a monitoring service
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="border-destructive/40 max-w-md w-full">
        <CardContent className="p-6 sm:p-8 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold">Application Error</h1>
            <p className="text-sm text-muted-foreground">
              The app hit an unexpected error. Your data is safe — try reloading.
            </p>
          </div>

          {error?.message && (
            <details className="text-left bg-muted/50 rounded-md p-2 text-xs">
              <summary className="cursor-pointer text-muted-foreground">
                Error details
              </summary>
              <pre className="mt-2 whitespace-pre-wrap break-all">
                {error.message}
                {error.digest ? `\n\nDigest: ${error.digest}` : ''}
              </pre>
            </details>
          )}

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={reset} size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => (window.location.href = '/')}
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
