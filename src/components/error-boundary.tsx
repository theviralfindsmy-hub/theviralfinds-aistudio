'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: React.ReactNode
  /** Optional fallback render. If provided, used instead of the default UI. */
  fallback?: (error: Error, reset: () => void) => React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * React error boundary — catches rendering errors anywhere in its subtree and
 * shows a friendly "Something went wrong" card with a retry button.
 *
 * Use to wrap page components so a single broken page doesn't crash the whole
 * SPA.
 *
 * @example
 *   <ErrorBoundary>
 *     <DashboardPage />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console (could be replaced with a remote error reporter)
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset)
      }
      return <DefaultErrorFallback error={this.state.error} onReset={this.reset} />
    }
    return this.props.children
  }
}

function DefaultErrorFallback({
  error,
  onReset,
}: {
  error: Error
  onReset: () => void
}) {
  return (
    <div className="flex items-center justify-center p-6">
      <Card className="border-destructive/40 max-w-md w-full">
        <CardContent className="p-6 sm:p-8 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="text-sm text-muted-foreground break-words">
              {error.message || 'An unexpected error occurred while rendering this page.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={onReset} size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
