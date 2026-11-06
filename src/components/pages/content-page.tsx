'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FileText, Sparkles, Copy, Save, Loader2, BookOpen, Library, AlertCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { QUERY_STALE_TIME } from '@/lib/query-config'

interface ContentTemplate {
  id: string; name: string; description: string; category: string
  type: string; platform: string; icon: string; template: string; language: string; tone: string
}
interface LibraryItem {
  id: string; type: string; platform: string; niche: string | null
  product: string | null; content: string; language: string; tone: string; isFavorite: boolean; createdAt: string
}

const TYPE_OPTIONS = [
  { value: 'caption', label: 'Caption' }, { value: 'script', label: 'Video Script' },
  { value: 'hashtags', label: 'Hashtags' }, { value: 'live_script', label: 'Live Script' },
  { value: 'review', label: 'Review' }, { value: 'comparison', label: 'Comparison' },
]
const PLATFORM_OPTIONS = [
  { value: 'tiktok', label: 'TikTok' }, { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' }, { value: 'youtube', label: 'YouTube' },
  { value: 'shopee_live', label: 'Shopee Live' },
]
const LANG_OPTIONS = [
  { value: 'manglish', label: 'Manglish' }, { value: 'english', label: 'English' }, { value: 'bahasa', label: 'Bahasa' },
]
const TONE_OPTIONS = [
  { value: 'casual', label: 'Casual' }, { value: 'professional', label: 'Professional' },
  { value: 'excited', label: 'Excited' }, { value: 'funny', label: 'Funny' },
]

export function ContentPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('generator')
  const [product, setProduct] = useState('')
  const [niche, setNiche] = useState('')
  const [type, setType] = useState('caption')
  const [platform, setPlatform] = useState('tiktok')
  const [language, setLanguage] = useState('manglish')
  const [tone, setTone] = useState('casual')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState('')

  // Fetch templates from API
  const { data: templatesData, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['content-templates'],
    queryFn: async () => {
      const res = await fetch('/api/content/templates')
      if (!res.ok) throw new Error('Failed to fetch templates')
      return res.json()
    },
    staleTime: QUERY_STALE_TIME.trends,
  })
  const templates = templatesData?.templates || []

  // Fetch library from API
  const { data: libraryData, isLoading: isLoadingLibrary } = useQuery({
    queryKey: ['content-library'],
    queryFn: async () => {
      const res = await fetch('/api/content/library')
      if (!res.ok) throw new Error('Failed to fetch library')
      return res.json()
    },
    staleTime: QUERY_STALE_TIME.products,
  })
  const library = libraryData?.items || []

  const handleGenerate = async () => {
    if (!product) return toast.error('Enter a product name')
    setGenerating(true); setResult('')
    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, product, niche: niche || undefined, platform, language, tone }),
      })
      if (res.ok) { const d = await res.json(); setResult(d.content); toast.success('Content generated!') }
      else { const e = await res.json(); toast.error(e.error || 'Failed') }
    } catch { toast.error('Network error') }
    setGenerating(false)
  }

  const copyResult = () => { navigator.clipboard.writeText(result); toast.success('Copied!') }

  const saveToLibrary = async () => {
    if (!result) return
    try {
      const res = await fetch('/api/content/library', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, platform, niche: niche || undefined, product, content: result, language, tone }),
      })
      if (res.ok) {
        toast.success('Saved to library!')
        queryClient.invalidateQueries({ queryKey: ['content-library'] })
      }
    } catch {}
  }

  const deleteFromLibrary = async (id: string) => {
    try {
      const res = await fetch(`/api/content/library?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Deleted')
        queryClient.invalidateQueries({ queryKey: ['content-library'] })
      }
    } catch {}
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6 text-violet-600" /> Content Studio</h1>
        <p className="text-muted-foreground">Generate AI-powered content for Malaysian market</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="generator"><Sparkles className="h-4 w-4 mr-1" />Generator</TabsTrigger>
          <TabsTrigger value="templates"><BookOpen className="h-4 w-4 mr-1" />Templates</TabsTrigger>
          <TabsTrigger value="library"><Library className="h-4 w-4 mr-1" />Library</TabsTrigger>
        </TabsList>

        <TabsContent value="generator">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Generate Content</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><Label>Product Name</Label><Input value={product} onChange={e => setProduct(e.target.value)} placeholder="e.g. Serum Vitamin C" /></div>
                <div><Label>Niche</Label><Input value={niche} onChange={e => setNiche(e.target.value)} placeholder="e.g. Beauty" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Type</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Platform</Label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PLATFORM_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{LANG_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Tone</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TONE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleGenerate} disabled={generating} className="w-full bg-violet-600 hover:bg-violet-700">
                  {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate</>}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center justify-between">Result
                {result && <div className="flex gap-1"><Button size="sm" variant="outline" onClick={copyResult}><Copy className="h-3 w-3" /></Button><Button size="sm" variant="outline" onClick={saveToLibrary}><Save className="h-3 w-3" /></Button></div>}
              </CardTitle></CardHeader>
              <CardContent>
                {result ? <div className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-lg max-h-96 overflow-y-auto">{result}</div>
                  : <p className="text-muted-foreground text-center py-12">Generated content will appear here</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          {isLoadingTemplates ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-8 w-8 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <BookOpen className="h-12 mb-3 opacity-40" />
              <p className="text-sm font-medium">No templates available</p>
              <p className="text-xs mt-1">Templates will appear here when available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {templates.map(t => (
                <Card key={t.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setProduct(''); setType(t.type); setPlatform(t.platform); setLanguage(t.language); setTone(t.tone); setTab('generator'); toast.info('Template applied') }}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{t.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{t.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                        <div className="flex gap-1 mt-2">
                          <Badge variant="secondary" className="text-xs">{t.category}</Badge>
                          <Badge variant="outline" className="text-xs">{t.type}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="library">
          {isLoadingLibrary ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : library.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Library className="h-12 mb-3 opacity-40" />
              <p className="text-sm font-medium">No saved content yet</p>
              <p className="text-xs mt-1">Generate content and save it here for easy reuse</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {library.map(item => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex gap-1 mb-1">
                          <Badge variant="secondary" className="text-xs">{item.type}</Badge>
                          <Badge variant="outline" className="text-xs">{item.platform}</Badge>
                          {item.product && <span className="text-xs text-muted-foreground">{item.product}</span>}
                        </div>
                        <p className="text-sm line-clamp-3">{item.content}</p>
                        <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(item.content); toast.success('Copied!') }}><Copy className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteFromLibrary(item.id)}>🗑️</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
