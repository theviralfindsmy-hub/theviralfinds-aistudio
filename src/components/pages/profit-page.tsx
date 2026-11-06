'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, Target, Zap, Loader2, Calculator } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

interface ScoreResult {
  score: number; level: string; emoji: string; color: string
  breakdown: Record<string, number>; recommendation: string
  projectedEarnings: { daily: number; monthly: number; yearly: number; perConversion: number; assumptions: Record<string, any> }
}
interface XtraProduct {
  name: string; baseCommission: number; xtraCommission: number; totalRate: number; category: string; source?: string
}
interface CalcResult {
  product: any; inputs: any; daily: any; monthly: any; yearly: any; perConversion: number; breakEven: any; goalTracker: any[]
}

const CATEGORIES = ['general', 'beauty', 'fashion', 'electronics', 'home_living', 'health', 'food_beverage', 'pet', 'sports', 'automotive']

const scoreColor = (s: number) => s >= 80 ? 'text-green-600' : s >= 60 ? 'text-yellow-600' : s >= 40 ? 'text-orange-500' : 'text-red-600'
const scoreBg = (s: number) => s >= 80 ? 'bg-green-500' : s >= 60 ? 'bg-yellow-500' : s >= 40 ? 'bg-orange-500' : 'bg-red-500'

export function ProfitPage() {
  const [tab, setTab] = useState('scorer')
  // Scorer state
  const [sName, setSName] = useState('')
  const [sPrice, setSPrice] = useState('')
  const [sComm, setSComm] = useState('')
  const [sCat, setSCat] = useState('general')
  const [sSales, setSSales] = useState('')
  const [sRating, setSRating] = useState('4.0')
  const [scoring, setScoring] = useState(false)
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null)
  // XTRA state
  const [xtraProducts, setXtraProducts] = useState<XtraProduct[]>([])
  const [xtraCat, setXtraCat] = useState('all')
  // Calculator state
  const [cName, setCName] = useState('')
  const [cPrice, setCPrice] = useState('')
  const [cComm, setCComm] = useState('')
  const [cViews, setCViews] = useState('500')
  const [cClickRate, setCClickRate] = useState('5')
  const [cConvRate, setCConvRate] = useState('3')
  const [cDiffShop, setCDiffShop] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [calcResult, setCalcResult] = useState<CalcResult | null>(null)

  useEffect(() => {
    if (tab !== 'xtra') return
    let active = true
    ;(async () => {
      try {
        const res = await fetch(`/api/profit/xtra?category=${xtraCat}`)
        if (res.ok && active) { const d = await res.json(); setXtraProducts(d.products || []) }
      } catch {}
    })()
    return () => { active = false }
  }, [tab, xtraCat])

  const handleScore = async () => {
    if (!sName || !sPrice || !sComm) return toast.error('Fill product name, price & commission')
    setScoring(true)
    try {
      const res = await fetch('/api/profit/score', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: { name: sName, price: parseFloat(sPrice), commissionRate: parseFloat(sComm), category: sCat, sales: parseInt(sSales) || 0, rating: parseFloat(sRating) } }),
      })
      if (res.ok) { const d = await res.json(); setScoreResult(d); toast.success('Product scored!') }
      else { const e = await res.json(); toast.error(e.error || 'Failed') }
    } catch { toast.error('Network error') }
    setScoring(false)
  }

  const handleCalc = async () => {
    if (!cPrice || !cComm) return toast.error('Fill price & commission')
    setCalculating(true)
    try {
      const res = await fetch('/api/profit/calculator', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: { name: cName || 'Product', price: parseFloat(cPrice), commissionRate: parseFloat(cComm) }, dailyViews: parseInt(cViews), clickRate: parseFloat(cClickRate), conversionRate: parseFloat(cConvRate), commissionType: cDiffShop ? 'different-shop' : 'same-shop' }),
      })
      if (res.ok) { const d = await res.json(); setCalcResult(d); toast.success('Calculated!') }
      else { const e = await res.json(); toast.error(e.error || 'Failed') }
    } catch { toast.error('Network error') }
    setCalculating(false)
  }

  const breakdownLabels: Record<string, string> = { commission: 'Commission', conversion: 'Conversion', aov: 'AOV', competition: 'Competition', sales: 'Sales', trend: 'Trend' }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><DollarSign className="h-6 w-6 text-rose-600" /> Profit Center</h1>
        <p className="text-muted-foreground">Score products & calculate earnings</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="scorer"><Target className="h-4 w-4 mr-1" />Scorer</TabsTrigger>
          <TabsTrigger value="xtra"><Zap className="h-4 w-4 mr-1" />XTRA Finder</TabsTrigger>
          <TabsTrigger value="calculator"><Calculator className="h-4 w-4 mr-1" />Calculator</TabsTrigger>
        </TabsList>

        <TabsContent value="scorer">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Product Scorer</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><Label>Product Name</Label><Input value={sName} onChange={e => setSName(e.target.value)} placeholder="e.g. Serum Vitamin C" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Price (RM)</Label><Input type="number" value={sPrice} onChange={e => setSPrice(e.target.value)} placeholder="49.90" /></div>
                  <div><Label>Commission %</Label><Input type="number" value={sComm} onChange={e => setSComm(e.target.value)} placeholder="8.5" /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Category</Label>
                    <Select value={sCat} onValueChange={setSCat}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Monthly Sales</Label><Input type="number" value={sSales} onChange={e => setSSales(e.target.value)} placeholder="500" /></div>
                  <div><Label>Rating</Label><Input type="number" step="0.1" value={sRating} onChange={e => setSRating(e.target.value)} /></div>
                </div>
                <Button onClick={handleScore} disabled={scoring} className="w-full bg-rose-600 hover:bg-rose-700">
                  {scoring ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Scoring...</> : <><Target className="h-4 w-4 mr-2" />Score Product</>}
                </Button>
              </CardContent>
            </Card>

            {scoreResult && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2">Score: <span className={`text-3xl ${scoreColor(scoreResult.score)}`}>{scoreResult.emoji} {scoreResult.score}</span></CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Badge className="text-sm" style={{ backgroundColor: scoreResult.color, color: '#fff' }}>{scoreResult.level}</Badge>
                  <div className="space-y-2">
                    {Object.entries(scoreResult.breakdown).map(([k, v]) => (
                      <div key={k} className="flex items-center gap-2">
                        <span className="text-xs w-24">{breakdownLabels[k] || k}</span>
                        <Progress value={v as number} className="flex-1 h-2" />
                        <span className="text-xs w-8 text-right">{v as number}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">{scoreResult.recommendation}</p>
                  {scoreResult.projectedEarnings && (
                    <div className="grid grid-cols-3 gap-2 p-3 bg-muted/50 rounded">
                      <div className="text-center"><p className="text-xs text-muted-foreground">Daily</p><p className="font-bold">RM{scoreResult.projectedEarnings.daily}</p></div>
                      <div className="text-center"><p className="text-xs text-muted-foreground">Monthly</p><p className="font-bold">RM{scoreResult.projectedEarnings.monthly}</p></div>
                      <div className="text-center"><p className="text-xs text-muted-foreground">Yearly</p><p className="font-bold">RM{scoreResult.projectedEarnings.yearly}</p></div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="xtra">
          <div className="mb-3">
            <Select value={xtraCat} onValueChange={setXtraCat}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Categories</SelectItem>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {xtraProducts.length === 0 ? <p className="text-muted-foreground text-center py-8">Loading XTRA products...</p> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {xtraProducts.map((p, i) => (
                <Card key={i} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm">{p.name}</h3>
                    <div className="flex gap-1 mt-1"><Badge variant="outline" className="text-xs">{p.category}</Badge></div>
                    <div className="mt-3 grid grid-cols-3 gap-1 text-center text-xs">
                      <div><p className="text-muted-foreground">Base</p><p className="font-bold">{p.baseCommission}%</p></div>
                      <div><p className="text-muted-foreground">XTRA</p><p className="font-bold text-rose-600">+{p.xtraCommission}%</p></div>
                      <div><p className="text-muted-foreground">Total</p><p className="font-bold text-green-600">{p.totalRate}%</p></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calculator">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Earnings Calculator</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><Label>Product Name</Label><Input value={cName} onChange={e => setCName(e.target.value)} placeholder="Optional" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Price (RM)</Label><Input type="number" value={cPrice} onChange={e => setCPrice(e.target.value)} placeholder="49.90" /></div>
                  <div><Label>Commission %</Label><Input type="number" value={cComm} onChange={e => setCComm(e.target.value)} placeholder="8.5" /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Daily Views</Label><Input type="number" value={cViews} onChange={e => setCViews(e.target.value)} /></div>
                  <div><Label>Click Rate %</Label><Input type="number" value={cClickRate} onChange={e => setCClickRate(e.target.value)} /></div>
                  <div><Label>Conv. Rate %</Label><Input type="number" value={cConvRate} onChange={e => setCConvRate(e.target.value)} /></div>
                </div>
                <div className="flex items-center gap-2"><Switch checked={cDiffShop} onCheckedChange={setCDiffShop} /><Label className="text-sm">Different-shop (50% commission)</Label></div>
                <Button onClick={handleCalc} disabled={calculating} className="w-full bg-rose-600 hover:bg-rose-700">
                  {calculating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Calculating...</> : <><Calculator className="h-4 w-4 mr-2" />Calculate</>}
                </Button>
              </CardContent>
            </Card>

            {calcResult && (
              <Card>
                <CardHeader><CardTitle>Projection Results</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-muted/50 rounded text-center">
                      <p className="text-xs text-muted-foreground">Daily</p>
                      <p className="text-xl font-bold text-rose-600">RM{calcResult.daily.earnings}</p>
                      <p className="text-xs text-muted-foreground">{calcResult.daily.clicks} clicks, {calcResult.daily.conversions} conv</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded text-center">
                      <p className="text-xs text-muted-foreground">Monthly</p>
                      <p className="text-xl font-bold text-rose-600">RM{calcResult.monthly.earnings}</p>
                      <p className="text-xs text-muted-foreground">{calcResult.monthly.conversions} conv</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded text-center">
                      <p className="text-xs text-muted-foreground">Yearly</p>
                      <p className="text-xl font-bold text-rose-600">RM{calcResult.yearly.earnings}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded">
                    <p className="text-sm"><strong>Per conversion:</strong> RM{calcResult.perConversion}</p>
                    {calcResult.breakEven && <p className="text-sm text-muted-foreground">Break even in {calcResult.breakEven.days} days</p>}
                  </div>
                  {calcResult.goalTracker && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Goal Tracker</p>
                      {calcResult.goalTracker.map((g: any) => (
                        <div key={g.target} className="flex items-center gap-2 text-sm">
                          <span className="w-20">RM{g.target}/mo</span>
                          <Progress value={Math.min(100, (500 / Math.max(1, g.viewsNeeded)) * 100)} className="flex-1 h-2" />
                          <span className="text-xs text-muted-foreground">{g.feasible ? `${g.viewsNeeded.toLocaleString()} views` : 'Not feasible'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
