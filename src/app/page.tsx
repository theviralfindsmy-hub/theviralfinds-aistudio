'use client'

import { Providers } from '@/components/providers'
import { AppShell } from '@/components/layout/app-shell'

export default function Home() {
  return (
    <Providers>
      <AppShell />
    </Providers>
  )
}
