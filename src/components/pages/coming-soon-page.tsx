'use client'

import { motion } from 'framer-motion'
import { Construction, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ComingSoonPageProps {
  title: string
  description: string
  fasa: string
  features?: string[]
  icon?: React.ElementType
}

export function ComingSoonPage({ title, description, fasa, features = [], icon: Icon = Construction }: ComingSoonPageProps) {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        <div className="flex items-start gap-4">
          <div className="p-4 rounded-2xl bg-shopee/10 text-shopee flex-shrink-0">
            <Icon className="w-8 h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h1>
              <Badge className="bg-shopee/10 text-shopee border-shopee/20">{fasa}</Badge>
              <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
                <Sparkles className="w-3 h-3 mr-1" /> In Development
              </Badge>
            </div>
            <p className="text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>

        <Card className="border-dashed border-2 border-shopee/20 bg-shopee/5">
          <CardContent className="p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <Construction className="w-16 h-16 text-shopee/60" />
                <motion.div
                  className="absolute -top-2 -right-2"
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                >
                  <Sparkles className="w-6 h-6 text-amber-500" />
                </motion.div>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Sedang Dibangunkan! 🚧</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Ciri ini sedang dalam pembangunan aktif oleh pasukan AI kami. Anda akan dapat menggunakannya tidak lama lagi.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sub-agent sedang bekerja sekarang — sila refresh sebentar lagi</span>
            </div>
          </CardContent>
        </Card>

        {features.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-shopee" />
                Ciri-ciri yang akan datang
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-shopee mt-0.5">→</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh untuk semak status
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
