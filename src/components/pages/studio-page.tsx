'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Film, Mic, LayoutGrid, Sparkles, Copy, Loader2, Play, Volume2, Clock, Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'

const TEMPLATES = [
  { id: 'before_after', name: 'Before/After', icon: '✨', desc: 'Show transformation - great for beauty, skincare, home', duration: '30-45s' },
  { id: 'unboxing', name: 'Unboxing', icon: '📦', desc: 'First impressions & authentic reactions', duration: '30-60s' },
  { id: 'demo', name: 'Product Demo', icon: '🎯', desc: 'Show the product in action step by step', duration: '45-60s' },
  { id: 'price_reveal', name: 'Price Reveal', icon: '💰', desc: 'Build suspense then reveal the amazing price', duration: '20-30s' },
  { id: 'comparison', name: 'Comparison', icon: '⚖️', desc: 'Compare products side-by-side for trust', duration: '45-60s' },
  { id: 'problem_solution', name: 'Problem-Solution', icon: '💡', desc: 'Start with relatable problem, show the fix', duration: '30-45s' },
  { id: 'testimonial', name: 'Testimonial', icon: '💬', desc: 'Personal experience story format', duration: '30-45s' },
  { id: 'top5', name: 'Top 5 List', icon: '🏆', desc: 'Countdown format - builds anticipation', duration: '45-60s' },
]

const LANGUAGES = [
  { value: 'manglish', label: 'Manglish' }, { value: 'english', label: 'English' }, { value: 'bahasa', label: 'Bahasa' },
]
const TONES = [
  { value: 'casual', label: 'Casual' }, { value: 'excited', label: 'Excited' },
  { value: 'professional', label: 'Professional' }, { value: 'funny', label: 'Funny' },
]
const VOICES = [
  { value: 'alloy', label: 'Alloy' }, { value: 'echo', label: 'Echo' },
  { value: 'fable', label: 'Fable' }, { value: 'onyx', label: 'Onyx' }, { value: 'nova', label: 'Nova' },
]

export function StudioPage() {
  const [tab, setTab] = useState('script')
  // Script state
  const [template, setTemplate] = useState('before_after')
  const [product, setProduct] = useState('')
  const [scriptLang, setScriptLang] = useState('manglish')
  const [scriptTone, setScriptTone] = useState('excited')
  const [scriptDuration, setScriptDuration] = useState('30')
  const [generating, setGenerating] = useState(false)
  const [scriptResult, setScriptResult] = useState('')
  // TTS state
  const [ttsText, setTtsText] = useState('')
  const [ttsVoice, setTtsVoice] = useState('alloy')
  const [ttsSpeed, setTtsSpeed] = useState(1.0)
  const [ttsLoading, setTtsLoading] = useState(false)
  const [ttsResult, setTtsResult] = useState<any>(null)

  const handleGenerateScript = async () => {
    if (!product) return toast.error('Enter a product name')
    setGenerating(true); setScriptResult('')
    try {
      const res = await fetch('/api/studio/script', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template, product, language: scriptLang, tone: scriptTone, duration: parseInt(scriptDuration) }),
      })
      if (res.ok) { const d = await res.json(); setScriptResult(d.script || d.content || ''); toast.success('Script generated!') }
      else { const e = await res.json(); toast.error(e.error || 'Failed') }
    } catch { toast.error('Network error') }
    setGenerating(false)
  }

  const handleTTS = async () => {
    if (!ttsText) return toast.error('Enter text for voiceover')
    setTtsLoading(true); setTtsResult(null)
    try {
      const res = await fetch('/api/studio/tts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ttsText, voice: ttsVoice, speed: ttsSpeed }),
      })
      if (res.ok) {
        const d = await res.json()
        setTtsResult(d)
        if (d.mockAudio) toast.info('TTS is in development - mock preview generated')
        else toast.success('Voiceover generated!')
      } else { const e = await res.json(); toast.error(e.error || 'Failed') }
    } catch { toast.error('Network error') }
    setTtsLoading(false)
  }

  const copyText = (text: string) => { navigator.clipboard.writeText(text); toast.success('Copied!') }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Film className="h-6 w-6 text-sky-600" /> Content Studio</h1>
        <p className="text-muted-foreground">Generate scripts & voiceovers for your content</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="script"><Sparkles className="h-4 w-4 mr-1" />Script</TabsTrigger>
          <TabsTrigger value="voiceover"><Mic className="h-4 w-4 mr-1" />Voiceover</TabsTrigger>
          <TabsTrigger value="templates"><LayoutGrid className="h-4 w-4 mr-1" />Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="script">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Script Generator</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><Label>Template</Label>
                  <Select value={template} onValueChange={setTemplate}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TEMPLATES.map(t => <SelectItem key={t.id} value={t.id}>{t.icon} {t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Product Name</Label><Input value={product} onChange={e => setProduct(e.target.value)} placeholder="e.g. Serum Vitamin C Brightening" /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Language</Label>
                    <Select value={scriptLang} onValueChange={setScriptLang}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Tone</Label>
                    <Select value={scriptTone} onValueChange={setScriptTone}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TONES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Duration (s)</Label>
                    <Select value={scriptDuration} onValueChange={setScriptDuration}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15s</SelectItem><SelectItem value="30">30s</SelectItem>
                        <SelectItem value="45">45s</SelectItem><SelectItem value="60">60s</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleGenerateScript} disabled={generating} className="w-full bg-sky-600 hover:bg-sky-700">
                  {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Script</>}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center justify-between">Result
                {scriptResult && <Button size="sm" variant="outline" onClick={() => copyText(scriptResult)}><Copy className="h-3 w-3 mr-1" />Copy</Button>}
              </CardTitle></CardHeader>
              <CardContent>
                {scriptResult ? (
                  <div className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-lg max-h-96 overflow-y-auto">{scriptResult}</div>
                ) : <p className="text-muted-foreground text-center py-12">Generated script will appear here</p>}
                {scriptResult && (
                  <Button variant="outline" className="w-full mt-3" onClick={() => { setTtsText(scriptResult); setTab('voiceover'); toast.info('Script sent to voiceover') }}>
                    <Mic className="h-4 w-4 mr-2" />Send to Voiceover
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="voiceover">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Voiceover Generator</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><Label>Text</Label>
                  <Textarea value={ttsText} onChange={e => setTtsText(e.target.value)} placeholder="Enter text for voiceover..." rows={6} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Voice</Label>
                    <Select value={ttsVoice} onValueChange={setTtsVoice}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{VOICES.map(v => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Speed ({ttsSpeed.toFixed(1)}x)</Label>
                    <Slider value={[ttsSpeed]} onValueChange={([v]) => setTtsSpeed(v)} min={0.5} max={2} step={0.1} className="mt-3" />
                  </div>
                </div>
                <Button onClick={handleTTS} disabled={ttsLoading} className="w-full bg-sky-600 hover:bg-sky-700">
                  {ttsLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : <><Volume2 className="h-4 w-4 mr-2" />Generate Voiceover</>}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
              <CardContent>
                {ttsResult ? (
                  <div className="space-y-3">
                    {ttsResult.audio && ttsResult.format === 'base64' && (
                      <audio controls className="w-full">
                        <source src={`data:audio/mpeg;base64,${ttsResult.audio}`} type="audio/mpeg" />
                      </audio>
                    )}
                    <div className="p-3 bg-muted/50 rounded space-y-1">
                      <p className="text-sm"><strong>Duration:</strong> {ttsResult.duration}s</p>
                      <p className="text-sm"><strong>Voice:</strong> {ttsResult.voice}</p>
                      <p className="text-sm"><strong>Speed:</strong> {ttsResult.speed}x</p>
                      {ttsResult.mockAudio && <Badge variant="outline" className="text-xs">Preview Mode</Badge>}
                    </div>
                  </div>
                ) : <p className="text-muted-foreground text-center py-12">Voiceover preview will appear here</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {TEMPLATES.map(t => (
              <Card key={t.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setTemplate(t.id); setTab('script'); toast.info(`${t.name} template selected`) }}>
                <CardContent className="p-4 text-center">
                  <span className="text-3xl">{t.icon}</span>
                  <h3 className="font-semibold mt-2">{t.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Clock className="h-3 w-3" /><span className="text-xs">{t.duration}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
