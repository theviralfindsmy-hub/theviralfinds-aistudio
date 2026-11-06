'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Flame, Search, RefreshCw, Users, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

interface TrendingProduct {
  id: string; name: string; category: string; estimatedCommissionRate: number
  trendIndicator: string; whyTrending: string; priceRange: string; searchVolume: string
}
interface TrendingKeyword {
  id: string; keyword: string; searchVolumeEstimate: number; category: string
  competitionLevel: string; trendDirection: string; relatedTerms: string[]; seasonalEvent?: string
}
interface CompetitorProfile {
  id: string; name: string; niche: string; platforms: string[]
  estimatedFollowers: string; contentStrategy: string; strengths: string[]; tipsForYou: string
}

const CATEGORIES = ['All', 'Beauty', 'Fashion', 'Electronics', 'Home & Living', 'Pet', 'Food & Beverages', 'Automotive']

const compColor: Record<string, string> = { Low: 'text-green-600', Medium: 'text-yellow-600', High: 'text-red-600' }
const dirIcon: Record<string, string> = { up: '📈', stable: '➡️', down: '📉' }

export function TrendsPage() {
  const [tab, setTab] = useState('trending')
  const [products, setProducts] = useState<TrendingProduct[]>([])
  const [keywords, setKeywords] = useState<TrendingKeyword[]>([])
  const [competitors, setCompetitors] = useState<CompetitorProfile[]>([])
  const [tips, setTips] = useState<{ id: string; category: string; tip: string; source: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      try {
        if (tab === 'trending') {
          const res = await fetch(`/api/trends/discover?category=${category}`)
          if (res.ok && active) { const d = await res.json(); setProducts(d.products || []) }
        } else if (tab === 'keywords') {
          const res = await fetch(`/api/trends/keywords?category=${category}`)
          if (res.ok && active) { const d = await res.json(); setKeywords(d.keywords || []) }
        } else {
          const res = await fetch('/api/trends/competitor')
          if (res.ok && active) { const d = await res.json(); setCompetitors(d.competitors || []); setTips(d.tips || []) }
        }
      } catch {}
      if (active) setLoading(false)
    })()
    return () => { active = false }
  }, [tab, category])

  const handleRefresh = () => {
    setLoading(true)
    ;(async () => {
      try {
        if (tab === 'trending') {
          const res = await fetch(`/api/trends/discover?category=${category}`)
          if (res.ok) { const d = await res.json(); setProducts(d.products || []) }
        } else if (tab === 'keywords') {
          const res = await fetch(`/api/trends/keywords?category=${category}`)
          if (res.ok) { const d = await res.json(); setKeywords(d.keywords || []) }
        } else {
          const res = await fetch('/api/trends/competitor')
          if (res.ok) { const d = await res.json(); setCompetitors(d.competitors || []); setTips(d.tips || []) }
        }
      } catch {}
      setLoading(false)
    })()
    toast.success('Refreshing data...')
  }
  const handleCategoryChange = (cat: string) => { setCategory(cat) }

  const filteredProducts = search
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : products

  const filteredKeywords = search
    ? keywords.filter(k => k.keyword.toLowerCase().includes(search.toLowerCase()))
    : keywords

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="h-6 w-6 text-amber-600" /> Trends</h1>
          <p className="text-muted-foreground">Discover trending products & keywords</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="trending"><Flame className="h-4 w-4 mr-1" />Trending</TabsTrigger>
          <TabsTrigger value="keywords"><Search className="h-4 w-4 mr-1" />Keywords</TabsTrigger>
          <TabsTrigger value="competitors"><Users className="h-4 w-4 mr-1" />Competitors</TabsTrigger>
        </TabsList>

        <div className="flex flex-wrap gap-2 mb-4">
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="w-48" />
        </div>

        {loading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-amber-600" /></div>}

        <TabsContent value="trending">
          {!loading && filteredProducts.length === 0 ? <p className="text-muted-foreground text-center py-8">No trending products found</p> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredProducts.map(p => (
                <Card key={p.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-sm flex-1">{p.name}</h3>
                      <span className="text-lg">{p.trendIndicator.split(' ')[0]}</span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      <Badge variant="secondary" className="text-xs">{p.category}</Badge>
                      <Badge variant="outline" className="text-xs">{p.estimatedCommissionRate}% comm</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.whyTrending}</p>
                    <div className="flex justify-between mt-3 text-xs text-muted-foreground">
                      <span>{p.priceRange}</span><span>{p.searchVolume} searches</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="keywords">
          {!loading && filteredKeywords.length === 0 ? <p className="text-muted-foreground text-center py-8">No keywords found</p> : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredKeywords.map(k => (
                <Card key={k.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{dirIcon[k.trendDirection] || '➡️'} {k.keyword}</span>
                        {k.seasonalEvent && <Badge className="text-xs bg-amber-100 text-amber-800">{k.seasonalEvent}</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-muted-foreground">{(k.searchVolumeEstimate / 1000).toFixed(0)}K/mo</span>
                        <span className={compColor[k.competitionLevel] || ''}>{k.competitionLevel}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">{k.category}</Badge>
                      {k.relatedTerms.slice(0, 3).map(t => <span key={t} className="text-xs text-muted-foreground">#{t}</span>)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="competitors">
          {!loading && competitors.length === 0 ? <p className="text-muted-foreground text-center py-8">No data</p> : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {competitors.map(c => (
                  <Card key={c.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{c.name}</h3>
                        <Badge variant="outline" className="text-xs">{c.estimatedFollowers}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{c.niche}</p>
                      <div className="flex gap-1 mb-2">{c.platforms.map(p => <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>)}</div>
                      <p className="text-xs line-clamp-2">{c.contentStrategy}</p>
                      <div className="mt-2 p-2 bg-amber-50 rounded text-xs"><strong>Tip:</strong> {c.tipsForYou}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {tips.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Strategy Tips</CardTitle></CardHeader>
                  <CardContent className="space-y-2 max-h-48 overflow-y-auto">
                    {tips.map(t => (
                      <div key={t.id} className="flex items-start gap-2 text-sm">
                        <Badge variant="outline" className="text-xs shrink-0">{t.category}</Badge>
                        <span>{t.tip}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
