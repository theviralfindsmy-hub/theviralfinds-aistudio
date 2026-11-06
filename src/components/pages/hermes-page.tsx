'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { QUERY_STALE_TIME } from '@/lib/query-config'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

import {
  Bot, MessageSquare, Brain, Cpu, Zap, Clock, AlertTriangle, TrendingUp,
  Lightbulb, Target, Send, Plus, Search, Settings, Wifi, WifiOff,
  Play, Pause, Trash2, Check, X, Eye, Sparkles, RefreshCw, Copy,
  CheckCircle, ArrowRight, Database, Code2, Calendar, BarChart3,
  Star, Activity, Plug, ChevronDown, Filter, Archive, Bell
} from 'lucide-react'

// ─── Proactive Insights section (Fasa 3.5) ──────────────────────────────────
// Reusable component embedded in its own tab below. Built in a separate file
// so it can also be dropped into the Dashboard or any other page.
import { HermesInsightsSection } from '@/components/pages/hermes-insights-section'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

interface Conversation {
  id: string
  title: string
  lastMessage: string
  timestamp: Date
  messageCount: number
}

interface Skill {
  id: string
  name: string
  description: string
  category: string
  status: 'active' | 'draft' | 'learning' | 'archived'
  usageCount: number
  successRate: number
  version: string
  learnedFrom: string
}

interface MemoryEntry {
  id: string
  agentId: string
  sessionId: string
  role: string
  content: string
  timestamp: Date
  metadata: Record<string, string>
}

interface Task {
  id: string
  name: string
  description: string
  schedule: string
  status: 'scheduled' | 'running' | 'completed' | 'failed'
  lastRun: Date | null
  nextRun: Date | null
  runCount: number
  lastResult: string
}

interface Insight {
  id: string
  type: 'trend' | 'opportunity' | 'alert' | 'recommendation'
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
  read: boolean
  actioned: boolean
  timestamp: Date
}

interface ConnectionConfig {
  endpoint: string
  apiKey: string
  model: string
  status: 'connected' | 'disconnected' | 'testing'
  lastConnected: Date | null
  availableModels: string[]
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

// Conversations are now fetched from /api/hermes/conversations

// Messages are now fetched from /api/hermes/conversations/[id]/messages

// Skills are now fetched from /api/hermes/skills

// Memories are now fetched from /api/hermes/memory

// Tasks are now fetched from /api/hermes/tasks

// Insights are now fetched from /api/hermes/insights

const mockAvailableModels = [
  'hermes-3-llama-3.1-405b',
  'hermes-3-llama-3.1-70b',
  'hermes-3-llama-3.1-8b',
  'hermes-2-pro-mistral-7b',
  'hermes-2-theta-llama-3-8b',
]

// ─── Helper Components ───────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <Avatar className="h-7 w-7">
        <AvatarFallback className="bg-hermes/10 text-hermes text-xs">
          <Bot className="h-3.5 w-3.5" />
        </AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-1 bg-hermes/10 rounded-2xl px-4 py-2.5">
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-hermes" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-hermes" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-hermes" />
      </div>
    </div>
  )
}

function StatusDot({ connected }: { connected: boolean }) {
  return (
    <span className={cn(
      'inline-block h-2.5 w-2.5 rounded-full',
      connected ? 'bg-green-500' : 'bg-red-500'
    )} />
  )
}

function SkillStatusBadge({ status }: { status: Skill['status'] }) {
  const variants: Record<Skill['status'], { label: string; className: string }> = {
    active: { label: 'Active', className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' },
    draft: { label: 'Draft', className: 'bg-muted text-muted-foreground border-border' },
    learning: { label: 'Learning', className: 'bg-hermes/10 text-hermes border-hermes/20' },
    archived: { label: 'Archived', className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
  }
  const v = variants[status]
  return <Badge variant="outline" className={cn('text-xs', v.className)}>{v.label}</Badge>
}

function TaskStatusBadge({ status }: { status: Task['status'] }) {
  const variants: Record<Task['status'], { label: string; className: string }> = {
    scheduled: { label: 'Scheduled', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
    running: { label: 'Running', className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' },
    completed: { label: 'Completed', className: 'bg-muted text-muted-foreground border-border' },
    failed: { label: 'Failed', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
  }
  const v = variants[status]
  return <Badge variant="outline" className={cn('text-xs', v.className)}>{v.label}</Badge>
}

function SeverityBadge({ severity }: { severity: Insight['severity'] }) {
  const variants: Record<Insight['severity'], { label: string; className: string }> = {
    info: { label: 'Info', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
    warning: { label: 'Warning', className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20' },
    critical: { label: 'Critical', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
  }
  const v = variants[severity]
  return <Badge variant="outline" className={cn('text-xs', v.className)}>{v.label}</Badge>
}

function InsightTypeIcon({ type }: { type: Insight['type'] }) {
  const icons: Record<Insight['type'], React.ReactNode> = {
    trend: <TrendingUp className="h-4 w-4 text-blue-500" />,
    opportunity: <Lightbulb className="h-4 w-4 text-green-500" />,
    alert: <AlertTriangle className="h-4 w-4 text-red-500" />,
    recommendation: <Target className="h-4 w-4 text-hermes" />,
  }
  return <>{icons[type]}</>
}

function formatDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('en-MY', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── Chat Tab ────────────────────────────────────────────────────────────────

function ChatTab() {
  const queryClient = useQueryClient()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Fetch conversations list
  const { data: conversationsData, isLoading: isLoadingConversations } = useQuery({
    queryKey: ['hermes-conversations'],
    queryFn: async () => {
      const res = await fetch('/api/hermes/conversations?limit=20')
      if (!res.ok) throw new Error('Failed to fetch conversations')
      return res.json()
    },
    staleTime: QUERY_STALE_TIME.dashboard,
  })

  const conversations: Conversation[] = useMemo(() => {
    if (!conversationsData?.conversations) return []
    return conversationsData.conversations.map((c: Record<string, unknown>) => ({
      id: c.id as string,
      title: c.title as string,
      lastMessage: c.lastMessage as string || '',
      timestamp: new Date(c.timestamp as string),
      messageCount: c.messageCount as number || 0,
    }))
  }, [conversationsData])

  // Fetch messages for selected conversation
  const { data: messagesData } = useQuery({
    queryKey: ['hermes-messages', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return null
      const res = await fetch(`/api/hermes/conversations/${selectedConversation}/messages`)
      if (!res.ok) throw new Error('Failed to fetch messages')
      return res.json()
    },
    enabled: !!selectedConversation,
    staleTime: QUERY_STALE_TIME.dashboard,
  })

  // Update messages when API data loads
  useEffect(() => {
    if (messagesData?.messages && selectedConversation) {
      const apiMessages: ChatMessage[] = messagesData.messages.map((m: Record<string, unknown>) => ({
        id: m.id as string,
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content as string,
        timestamp: new Date(m.timestamp as string),
      }))
      setMessages(apiMessages)
    }
  }, [messagesData, selectedConversation])

  // Auto-select first conversation
  useEffect(() => {
    if (!selectedConversation && conversations.length > 0) {
      setSelectedConversation(conversations[0].id)
    }
  }, [conversations, selectedConversation])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, scrollToBottom])

  // Send message via real API
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      const res = await fetch('/api/hermes/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          conversationId: selectedConversation || undefined,
        }),
      })

      if (!res.ok) throw new Error('Chat request failed')
      const data = await res.json()

      const aiMsg: ChatMessage = {
        id: data.id || (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content || 'I apologize, but I was unable to generate a response. Please try again.',
        timestamp: new Date(data.createdAt || new Date()),
      }
      setIsTyping(false)
      setMessages(prev => [...prev, aiMsg])

      // Update conversation ID if new conversation was created
      if (data.conversationId && !selectedConversation) {
        setSelectedConversation(data.conversationId)
      }

      // Refresh conversations list
      queryClient.invalidateQueries({ queryKey: ['hermes-conversations'] })
    } catch (error) {
      console.error('Chat error:', error)
      setIsTyping(false)
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMsg])
      toast.error('Failed to get AI response')
    }
  }, [selectedConversation, queryClient])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }, [input, sendMessage])

  // New chat
  const handleNewChat = useCallback(() => {
    setSelectedConversation(null)
    setMessages([])
  }, [])

  const quickActions = [
    { label: 'Analyze my top products', icon: BarChart3 },
    { label: 'Generate content', icon: Sparkles },
    { label: 'Optimize my links', icon: Zap },
    { label: 'Market trends', icon: TrendingUp },
  ]

  return (
    <div className="flex h-[calc(100vh-12rem)] min-h-[500px] gap-0">
      {/* Sidebar - Conversations */}
      <AnimatePresence>
        {(sidebarOpen || typeof window !== 'undefined' && window.innerWidth >= 768) && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 overflow-hidden border-r border-hermes/10 bg-card"
          >
            <div className="flex h-full w-[280px] flex-col">
              <div className="flex items-center justify-between border-b border-hermes/10 p-4">
                <h3 className="text-sm font-semibold">Conversations</h3>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 md:hidden" onClick={() => setSidebarOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="space-y-1 p-2">
                  {isLoadingConversations ? (
                    <div className="space-y-2 p-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="space-y-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      ))}
                    </div>
                  ) : conversations.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No conversations yet</p>
                  ) : (
                    conversations.map(conv => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv.id)}
                        className={cn(
                          'w-full rounded-lg px-3 py-2.5 text-left transition-colors',
                          selectedConversation === conv.id
                            ? 'bg-hermes/10 text-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">{conv.title}</span>
                          <span className="text-[10px] text-muted-foreground ml-2 flex-shrink-0">{formatDate(conv.timestamp)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                        <span className="text-[10px] text-muted-foreground">{conv.messageCount} messages</span>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
              <div className="p-3 border-t border-hermes/10">
                <Button variant="outline" size="sm" className="w-full border-hermes/20 text-hermes hover:bg-hermes/10" onClick={handleNewChat}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> New Chat
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-hermes/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <MessageSquare className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-hermes text-hermes-foreground text-xs">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">Hermes Agent</span>
                  <StatusDot connected={true} />
                </div>
                <p className="text-[10px] text-muted-foreground">hermes-3-llama-3.1-405b</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-[10px] border-green-500/20 bg-green-500/10 text-green-600">
              <Wifi className="h-2.5 w-2.5 mr-1" /> Connected
            </Badge>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4 py-4">
          <div className="mx-auto max-w-3xl space-y-4">
            {/* System prompt indicator */}
            <div className="flex justify-center">
              <div className="flex items-center gap-2 rounded-full bg-hermes/5 px-4 py-1.5 border border-hermes/10">
                <Sparkles className="h-3 w-3 text-hermes" />
                <span className="text-[11px] text-hermes font-medium">Hermes is ready — Shopee Affiliate Assistant mode</span>
              </div>
            </div>

            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  'flex gap-2',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'assistant' && (
                  <Avatar className="h-7 w-7 mt-1 flex-shrink-0">
                    <AvatarFallback className="bg-hermes text-hermes-foreground text-xs">
                      <Bot className="h-3.5 w-3.5" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
                    msg.role === 'user'
                      ? 'bg-shopee/10 text-foreground rounded-br-md'
                      : msg.role === 'system'
                        ? 'bg-muted text-muted-foreground text-xs italic max-w-full rounded-bl-md'
                        : 'bg-hermes/10 text-foreground rounded-bl-md'
                  )}
                >
                  {msg.role === 'assistant' ? (
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {msg.content.split('\n').map((line, i) => {
                        // Simple markdown bold
                        const parts = line.split(/(\*\*.*?\*\*)/g)
                        return (
                          <span key={i}>
                            {i > 0 && <br />}
                            {parts.map((part, j) => {
                              if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>
                              }
                              return <span key={j}>{part}</span>
                            })}
                          </span>
                        )
                      })}
                    </div>
                  ) : (
                    msg.content
                  )}
                  <div className={cn(
                    'mt-1 text-[10px]',
                    msg.role === 'user' ? 'text-right text-muted-foreground/60' : 'text-muted-foreground/60'
                  )}>
                    {formatDate(msg.timestamp)}
                  </div>
                </div>
                {msg.role === 'user' && (
                  <Avatar className="h-7 w-7 mt-1 flex-shrink-0">
                    <AvatarFallback className="bg-shopee text-shopee-foreground text-xs">U</AvatarFallback>
                  </Avatar>
                )}
              </motion.div>
            ))}

            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        {messages.length <= 2 && (
          <div className="mx-auto flex max-w-3xl flex-wrap gap-2 px-4 pb-2">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                className="border-hermes/20 text-hermes hover:bg-hermes/10 text-xs"
                onClick={() => sendMessage(action.label)}
              >
                <action.icon className="h-3 w-3 mr-1.5" />
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-hermes/10 p-4">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-2 rounded-xl border border-hermes/20 bg-card p-2 focus-within:border-hermes/40 transition-colors">
              <Textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Hermes anything about your affiliate business..."
                className="min-h-[40px] max-h-[120px] flex-1 resize-none border-0 bg-transparent text-sm focus-visible:ring-0 p-2 placeholder:text-muted-foreground/50"
                rows={1}
              />
              <Button
                size="sm"
                className="bg-hermes hover:bg-hermes-dark text-hermes-foreground h-9 w-9 p-0 rounded-lg"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isTyping}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground/50">
              Hermes uses your affiliate data to provide personalized insights. Press Enter to send, Shift+Enter for new line.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Skills Tab ──────────────────────────────────────────────────────────────

function SkillsTab() {
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showNewSkillDialog, setShowNewSkillDialog] = useState(false)

  // Fetch skills from API
  const { data: skillsData, isLoading: isLoadingSkills } = useQuery({
    queryKey: ['hermes-skills'],
    queryFn: async () => {
      const res = await fetch('/api/hermes/skills')
      if (!res.ok) throw new Error('Failed to fetch skills')
      return res.json()
    },
    staleTime: QUERY_STALE_TIME.trends,
  })

  const skills: Skill[] = useMemo(() => {
    if (!skillsData?.skills) return []
    return skillsData.skills.map((s: Record<string, unknown>) => ({
      id: s.id as string,
      name: s.name as string,
      description: s.description as string,
      category: s.category as string,
      status: (s.status as Skill['status']) || 'draft',
      usageCount: (s.usageCount as number) || 0,
      successRate: (s.successRate as number) || 0,
      version: s.version as string || '1.0.0',
      learnedFrom: (s.learnedFrom as string) || 'Training data',
    }))
  }, [skillsData])

  const categories = ['all', ...Array.from(new Set(skills.map(s => s.category)))]
  const statuses: string[] = ['all', 'active', 'draft', 'learning', 'archived']

  const filtered = skills.filter(s => {
    if (categoryFilter !== 'all' && s.category !== categoryFilter) return false
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-hermes" />
            Skills Library
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Manage and monitor your AI agent skills</p>
        </div>
        <Dialog open={showNewSkillDialog} onOpenChange={setShowNewSkillDialog}>
          <DialogTrigger asChild>
            <Button className="bg-hermes hover:bg-hermes-dark text-hermes-foreground">
              <Plus className="h-4 w-4 mr-2" /> Create Skill
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Skill</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Skill Name</Label>
                <Input placeholder="e.g., Price Monitor" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="What does this skill do?" rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Analytics">Analytics</SelectItem>
                    <SelectItem value="Content">Content</SelectItem>
                    <SelectItem value="Optimization">Optimization</SelectItem>
                    <SelectItem value="Monitoring">Monitoring</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full bg-hermes hover:bg-hermes-dark text-hermes-foreground" onClick={() => setShowNewSkillDialog(false)}>
                Create Skill
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(c => <SelectItem key={c} value={c} className="text-xs">{c === 'all' ? 'All Categories' : c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map(s => <SelectItem key={s} value={s} className="text-xs">{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="text-xs">{filtered.length} skills</Badge>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((skill, i) => (
            <motion.div
              key={skill.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
            >
              <Card className="card-hover border-hermes/10 h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-hermes" />
                        {skill.name}
                      </CardTitle>
                      <CardDescription className="text-xs">{skill.description}</CardDescription>
                    </div>
                    <SkillStatusBadge status={skill.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Category</span>
                    <Badge variant="secondary" className="text-[10px]">{skill.category}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Usage</span>
                    <span className="font-medium">{skill.usageCount.toLocaleString()} runs</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Success Rate</span>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-hermes"
                          style={{ width: `${skill.successRate}%` }}
                        />
                      </div>
                      <span className="font-medium">{skill.successRate}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Version</span>
                    <span className="font-mono text-[10px]">v{skill.version}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Learned from</span>
                    <span className="text-[10px] text-hermes">{skill.learnedFrom}</span>
                  </div>
                  <Separator className="bg-hermes/10" />
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="flex-1 h-7 text-[11px] border-hermes/20">
                      <Settings className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    {skill.status !== 'active' ? (
                      <Button size="sm" variant="outline" className="flex-1 h-7 text-[11px] border-green-500/20 text-green-600 hover:bg-green-500/10">
                        <Play className="h-3 w-3 mr-1" /> Activate
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="flex-1 h-7 text-[11px] border-orange-500/20 text-orange-600 hover:bg-orange-500/10">
                        <Archive className="h-3 w-3 mr-1" /> Archive
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Memory Tab ──────────────────────────────────────────────────────────────

function MemoryTab() {
  const [searchQuery, setSearchQuery] = useState('')
  const [agentFilter, setAgentFilter] = useState('all')
  const [sessionFilter, setSessionFilter] = useState('all')

  // Fetch memories from API
  const { data: memoriesData, isLoading: isLoadingMemories } = useQuery({
    queryKey: ['hermes-memory'],
    queryFn: async () => {
      const res = await fetch('/api/hermes/memory')
      if (!res.ok) throw new Error('Failed to fetch memories')
      return res.json()
    },
    staleTime: QUERY_STALE_TIME.trends,
  })

  const memories: MemoryEntry[] = useMemo(() => {
    if (!memoriesData?.memories) return []
    return memoriesData.memories.map((m: Record<string, unknown>) => ({
      id: m.id as string,
      agentId: (m.agentId as string) || 'hermes-main',
      sessionId: (m.sessionId as string) || 'default',
      role: (m.role as string) || 'assistant',
      content: m.content as string,
      timestamp: new Date(m.createdAt as string || m.timestamp as string),
      metadata: (m.metadata as Record<string, string>) || {},
    }))
  }, [memoriesData])

  const agents = ['all', ...Array.from(new Set(memories.map(m => m.agentId)))]
  const sessions = ['all', ...Array.from(new Set(memories.map(m => m.sessionId)))]

  const filtered = memories.filter(m => {
    if (searchQuery && !m.content.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (agentFilter !== 'all' && m.agentId !== agentFilter) return false
    if (sessionFilter !== 'all' && m.sessionId !== sessionFilter) return false
    return true
  })

  const deleteMemory = async (id: string) => {
    try {
      await fetch(`/api/hermes/memory?id=${id}`, { method: 'DELETE' })
      // Refresh data
    } catch {}
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Database className="h-5 w-5 text-hermes" />
          Memory Browser
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Explore and manage Hermes persistent memory entries</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memories..."
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-[160px] h-9 text-xs">
            <SelectValue placeholder="Agent" />
          </SelectTrigger>
          <SelectContent>
            {agents.map(a => <SelectItem key={a} value={a} className="text-xs">{a === 'all' ? 'All Agents' : a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sessionFilter} onValueChange={setSessionFilter}>
          <SelectTrigger className="w-[160px] h-9 text-xs">
            <SelectValue placeholder="Session" />
          </SelectTrigger>
          <SelectContent>
            {sessions.map(s => <SelectItem key={s} value={s} className="text-xs">{s === 'all' ? 'All Sessions' : s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Memory Cards */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((memory, i) => (
            <motion.div
              key={memory.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
            >
              <Card className="border-hermes/10 card-hover">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-[10px] border-hermes/20 text-hermes">
                          <Code2 className="h-2.5 w-2.5 mr-1" /> {memory.agentId}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          <Clock className="h-2.5 w-2.5 mr-1" /> {memory.sessionId}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] capitalize">{memory.role}</Badge>
                        <span className="text-[10px] text-muted-foreground">{formatDate(memory.timestamp)}</span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{memory.content}</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(memory.metadata).map(([key, value]) => (
                          <span key={key} className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 flex-shrink-0"
                      onClick={() => deleteMemory(memory.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Database className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">No memories found</p>
          <p className="text-xs mt-1">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}

// ─── Tasks Tab ───────────────────────────────────────────────────────────────

function TasksTab() {
  // Fetch tasks from API
  const { data: tasksData, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['hermes-tasks'],
    queryFn: async () => {
      const res = await fetch('/api/hermes/tasks')
      if (!res.ok) throw new Error('Failed to fetch tasks')
      return res.json()
    },
    staleTime: QUERY_STALE_TIME.trends,
  })

  const tasks: Task[] = useMemo(() => {
    if (!tasksData?.tasks) return []
    return tasksData.tasks.map((t: Record<string, unknown>) => ({
      id: t.id as string,
      name: t.name as string,
      description: (t.description as string) || '',
      schedule: (t.schedule as string) || '',
      status: (t.status as Task['status']) || 'scheduled',
      lastRun: t.lastRunAt ? new Date(t.lastRunAt as string) : null,
      nextRun: t.nextRunAt ? new Date(t.nextRunAt as string) : null,
      runCount: (t.runCount as number) || 0,
      lastResult: (t.lastResult as string) || '',
    }))
  }, [tasksData])

  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false)

  const runTaskNow = (id: string) => {
    // TODO: implement via API
  }

  const pauseTask = (id: string) => {
    // TODO: implement via API
  }

  const deleteTask = (id: string) => {
    // TODO: implement via API
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-hermes" />
            Scheduled Tasks
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Automated jobs running on your behalf</p>
        </div>
        <Dialog open={showNewTaskDialog} onOpenChange={setShowNewTaskDialog}>
          <DialogTrigger asChild>
            <Button className="bg-hermes hover:bg-hermes-dark text-hermes-foreground">
              <Plus className="h-4 w-4 mr-2" /> Create Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Task Name</Label>
                <Input placeholder="e.g., Daily Revenue Report" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="What should this task do?" rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Schedule (Cron)</Label>
                <Input placeholder="0 9 * * *" />
                <p className="text-[10px] text-muted-foreground">Minute Hour Day Month Weekday</p>
              </div>
              <Button className="w-full bg-hermes hover:bg-hermes-dark text-hermes-foreground" onClick={() => setShowNewTaskDialog(false)}>
                Create Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Task Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {tasks.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
            >
              <Card className="border-hermes/10 card-hover h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Activity className="h-4 w-4 text-hermes" />
                        {task.name}
                      </CardTitle>
                      <CardDescription className="text-xs">{task.description}</CardDescription>
                    </div>
                    <TaskStatusBadge status={task.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Schedule</span>
                    <code className="font-mono text-[10px] bg-muted px-2 py-0.5 rounded">{task.schedule}</code>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Last Run</span>
                    <span className="text-[11px]">{task.lastRun ? formatDateTime(task.lastRun) : 'Never'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Next Run</span>
                    <span className="text-[11px]">{task.nextRun ? formatDateTime(task.nextRun) : '—'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Run Count</span>
                    <span className="font-medium">{task.runCount}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Last Result</span>
                    <p className={cn(
                      'text-xs rounded-md px-2.5 py-1.5 border',
                      task.status === 'failed'
                        ? 'bg-red-500/5 border-red-500/20 text-red-600 dark:text-red-400'
                        : 'bg-muted/50 border-border text-foreground'
                    )}>
                      {task.lastResult}
                    </p>
                  </div>
                  <Separator className="bg-hermes/10" />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-7 text-[11px] border-hermes/20 text-hermes hover:bg-hermes/10"
                      onClick={() => runTaskNow(task.id)}
                      disabled={task.status === 'running'}
                    >
                      <Play className="h-3 w-3 mr-1" /> Run Now
                    </Button>
                    {task.status === 'running' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-[11px] border-yellow-500/20 text-yellow-600 hover:bg-yellow-500/10"
                        onClick={() => pauseTask(task.id)}
                      >
                        <Pause className="h-3 w-3 mr-1" /> Pause
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                      onClick={() => deleteTask(task.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Insights Tab ────────────────────────────────────────────────────────────

function InsightsTab() {
  // Fetch insights from API
  const { data: insightsData, isLoading: isLoadingInsights } = useQuery({
    queryKey: ['hermes-insights'],
    queryFn: async () => {
      const res = await fetch('/api/hermes/insights')
      if (!res.ok) throw new Error('Failed to fetch insights')
      return res.json()
    },
    staleTime: QUERY_STALE_TIME.trends,
  })

  const insights: Insight[] = useMemo(() => {
    if (!insightsData?.insights) return []
    return insightsData.insights.map((i: Record<string, unknown>) => ({
      id: i.id as string,
      type: (i.type as Insight['type']) || 'trend',
      title: i.title as string,
      description: i.description as string,
      severity: (i.severity as Insight['severity']) || 'info',
      read: (i.read as boolean) || false,
      actioned: (i.actioned as boolean) || false,
      timestamp: new Date(i.createdAt as string || i.timestamp as string),
    }))
  }, [insightsData])

  const [typeFilter, setTypeFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')

  const types: string[] = ['all', 'trend', 'opportunity', 'alert', 'recommendation']
  const severities: string[] = ['all', 'info', 'warning', 'critical']

  const filtered = insights.filter(i => {
    if (typeFilter !== 'all' && i.type !== typeFilter) return false
    if (severityFilter !== 'all' && i.severity !== severityFilter) return false
    return true
  })

  const markAsRead = (id: string) => {
    // TODO: implement via API
  }

  const markAsActioned = (id: string) => {
    // TODO: implement via API
  }

  const unreadCount = insights.filter(i => !i.read).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-hermes" />
            AI Insights
            {unreadCount > 0 && (
              <Badge className="bg-hermes text-hermes-foreground text-[10px] ml-1">{unreadCount} new</Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Smart observations and recommendations from Hermes</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {types.map(t => <SelectItem key={t} value={t} className="text-xs">{t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            {severities.map(s => <SelectItem key={s} value={s} className="text-xs">{s === 'all' ? 'All Severities' : s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Insights Cards */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((insight, i) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
            >
              <Card className={cn(
                'border-hermes/10 card-hover',
                !insight.read && 'border-l-2 border-l-hermes'
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'mt-0.5 flex-shrink-0 rounded-lg p-2',
                      insight.type === 'trend' && 'bg-blue-500/10',
                      insight.type === 'opportunity' && 'bg-green-500/10',
                      insight.type === 'alert' && 'bg-red-500/10',
                      insight.type === 'recommendation' && 'bg-hermes/10',
                    )}>
                      <InsightTypeIcon type={insight.type} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            {insight.title}
                            {!insight.read && <span className="h-1.5 w-1.5 rounded-full bg-hermes" />}
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
                        </div>
                        <SeverityBadge severity={insight.severity} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">{formatDate(insight.timestamp)}</span>
                        <div className="flex items-center gap-1.5">
                          {!insight.read && (
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground" onClick={() => markAsRead(insight.id)}>
                              <Eye className="h-3 w-3 mr-1" /> Read
                            </Button>
                          )}
                          {!insight.actioned && (
                            <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] border-hermes/20 text-hermes hover:bg-hermes/10" onClick={() => markAsActioned(insight.id)}>
                              <CheckCircle className="h-3 w-3 mr-1" /> Action
                            </Button>
                          )}
                          {insight.actioned && (
                            <Badge variant="outline" className="text-[10px] border-green-500/20 bg-green-500/10 text-green-600">
                              <Check className="h-2.5 w-2.5 mr-0.5" /> Actioned
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Lightbulb className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">No insights found</p>
          <p className="text-xs mt-1">Try adjusting your filters</p>
        </div>
      )}
    </div>
  )
}

// ─── Connection Tab ──────────────────────────────────────────────────────────

function ConnectionTab() {
  // Fetch connection from API
  const { data: connectionData, isLoading: isLoadingConnection } = useQuery({
    queryKey: ['hermes-connection'],
    queryFn: async () => {
      const res = await fetch('/api/hermes/connection')
      if (!res.ok) throw new Error('Failed to fetch connection')
      return res.json()
    },
    staleTime: QUERY_STALE_TIME.dashboard,
  })

  const [localEndpoint, setLocalEndpoint] = useState('')
  const [localApiKey, setLocalApiKey] = useState('')
  const [localModel, setLocalModel] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [justConnected, setJustConnected] = useState(false)

  const isApiConnected = connectionData?.connected === true || justConnected
  const connection: ConnectionConfig = {
    endpoint: localEndpoint || connectionData?.connection?.endpoint || 'https://api.z-ai.com',
    apiKey: localApiKey,
    model: localModel || connectionData?.connection?.model || 'hermes-3',
    status: isApiConnected ? 'connected' : 'disconnected',
    lastConnected: connectionData?.connection?.lastConnected ? new Date(connectionData.connection.lastConnected) : justConnected ? new Date() : null,
    availableModels: mockAvailableModels,
  }

  const setConnectionField = (field: 'endpoint' | 'apiKey' | 'model', value: string) => {
    if (field === 'endpoint') setLocalEndpoint(value)
    else if (field === 'apiKey') setLocalApiKey(value)
    else setLocalModel(value)
  }

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/hermes/connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: connection.endpoint,
          apiKey: connection.apiKey,
          model: connection.model,
          name: 'Hermes Connection',
        }),
      })
      const data = await res.json()
      setTesting(false)
      if (data.connected) {
        setTestResult('success')
        setJustConnected(true)
      } else {
        setTestResult('error')
      }
    } catch {
      setTesting(false)
      setTestResult('error')
    }
  }

  const saveConnection = () => {
    setTestResult(null)
    // Test connection also saves it via POST
    testConnection()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Plug className="h-5 w-5 text-hermes" />
          Connection Settings
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Configure your Hermes Agent API connection</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Form */}
        <Card className="border-hermes/10">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">API Configuration</CardTitle>
            <CardDescription className="text-xs">Hermes Agent uses an OpenAI-compatible API server</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Endpoint URL</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={connection.endpoint}
                  onChange={(e) => setConnectionField('endpoint', e.target.value)}
                  placeholder="http://localhost:5001/v1"
                  className="text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">API Key</Label>
              <Input
                type="password"
                value={connection.apiKey}
                onChange={(e) => setConnectionField('apiKey', e.target.value)}
                placeholder="sk-hermes-..."
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Model</Label>
              <Select value={connection.model} onValueChange={(v) => setConnectionField('model', v)}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {connection.availableModels.map(m => (
                    <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator className="bg-hermes/10" />

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="flex-1 border-hermes/20 text-hermes hover:bg-hermes/10"
                onClick={testConnection}
                disabled={testing}
              >
                {testing ? (
                  <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Testing...</>
                ) : (
                  <><Wifi className="h-4 w-4 mr-2" /> Test Connection</>
                )}
              </Button>
              <Button
                className="flex-1 bg-hermes hover:bg-hermes-dark text-hermes-foreground"
                onClick={saveConnection}
              >
                <Check className="h-4 w-4 mr-2" /> Save Connection
              </Button>
            </div>

            {testResult && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'rounded-lg p-3 text-xs',
                  testResult === 'success'
                    ? 'bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400'
                )}
              >
                {testResult === 'success' ? (
                  <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Connection successful! Hermes Agent is reachable.</span>
                ) : (
                  <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Connection failed. Please check your settings.</span>
                )}
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Connection Status */}
        <div className="space-y-4">
          <Card className="border-hermes/10">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Connection Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'rounded-full p-3',
                  connection.status === 'connected' ? 'bg-green-500/10' : 'bg-red-500/10'
                )}>
                  {connection.status === 'connected' ? (
                    <Wifi className="h-6 w-6 text-green-500" />
                  ) : (
                    <WifiOff className="h-6 w-6 text-red-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{connection.status === 'connected' ? 'Connected' : 'Disconnected'}</p>
                  <p className="text-xs text-muted-foreground">
                    {connection.lastConnected
                      ? `Last connected: ${formatDateTime(connection.lastConnected)}`
                      : 'Never connected'
                    }
                  </p>
                </div>
              </div>

              <Separator className="bg-hermes/10" />

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Endpoint</span>
                  <code className="font-mono text-[10px] bg-muted px-2 py-0.5 rounded">{connection.endpoint}</code>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Active Model</span>
                  <code className="font-mono text-[10px] bg-muted px-2 py-0.5 rounded">{connection.model}</code>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">API Version</span>
                  <code className="font-mono text-[10px] bg-muted px-2 py-0.5 rounded">v1 (OpenAI compatible)</code>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Latency</span>
                  <span className="text-[11px] font-medium text-green-600 dark:text-green-400">42ms</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-hermes/10">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Available Models</CardTitle>
              <CardDescription className="text-xs">Models accessible through the current connection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {connection.availableModels.map((model, i) => (
                  <div key={model} className={cn(
                    'flex items-center justify-between rounded-lg border px-3 py-2 text-xs',
                    model === connection.model ? 'border-hermes/30 bg-hermes/5' : 'border-border'
                  )}>
                    <div className="flex items-center gap-2">
                      <Cpu className="h-3.5 w-3.5 text-hermes" />
                      <span className="font-mono text-[11px]">{model}</span>
                    </div>
                    {model === connection.model && (
                      <Badge variant="outline" className="text-[9px] border-hermes/30 text-hermes">Active</Badge>
                    )}
                    <Badge variant="secondary" className="text-[9px]">
                      {model.includes('405b') ? '405B' : model.includes('70b') ? '70B' : model.includes('8b') ? '8B' : model.includes('7b') ? '7B' : '?'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ─── Main HermesPage ─────────────────────────────────────────────────────────

export function HermesPage() {
  const [activeTab, setActiveTab] = useState('chat')

  const tabs = [
    { value: 'chat', label: 'AI Chat', icon: MessageSquare },
    { value: 'skills', label: 'Skills', icon: Brain },
    { value: 'memory', label: 'Memory', icon: Database },
    { value: 'tasks', label: 'Tasks', icon: Clock },
    { value: 'insights', label: 'Insights', icon: Lightbulb },
    { value: 'proactive-insights', label: 'Proactive', icon: Bell },
    { value: 'connection', label: 'Connection', icon: Plug },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-hermes/10 bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-hermes/10 border border-hermes/20">
                <Bot className="h-5 w-5 text-hermes" />
              </div>
              <div>
                <h1 className="text-lg font-bold flex items-center gap-2">
                  HERMES
                  <Badge variant="outline" className="text-[9px] border-hermes/30 text-hermes font-mono">AGENT</Badge>
                </h1>
                <p className="text-xs text-muted-foreground">Self-Improving AI Agent by Nous Research</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-green-500/20 bg-green-500/10 text-green-600 text-[10px]">
                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
                Online
              </Badge>
              <Badge variant="outline" className="text-[10px] border-hermes/20 text-hermes">
                <Sparkles className="h-2.5 w-2.5 mr-1" />
                8 Skills Active
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-hermes/10 bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-transparent h-auto p-0 gap-0">
              {tabs.map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    'relative rounded-none border-b-2 border-transparent px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-muted-foreground transition-colors data-[state=active]:text-hermes data-[state=active]:border-hermes data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-foreground'
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5 sm:mr-2" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="chat" className="mt-0 border-0">
              <ChatTab />
            </TabsContent>

            <TabsContent value="skills" className="mt-0 border-0 p-4 sm:p-6 lg:p-8">
              <SkillsTab />
            </TabsContent>

            <TabsContent value="memory" className="mt-0 border-0 p-4 sm:p-6 lg:p-8">
              <MemoryTab />
            </TabsContent>

            <TabsContent value="tasks" className="mt-0 border-0 p-4 sm:p-6 lg:p-8">
              <TasksTab />
            </TabsContent>

            <TabsContent value="insights" className="mt-0 border-0 p-4 sm:p-6 lg:p-8">
              <InsightsTab />
            </TabsContent>

            <TabsContent value="proactive-insights" className="mt-0 border-0 p-4 sm:p-6 lg:p-8">
              <HermesInsightsSection />
            </TabsContent>

            <TabsContent value="connection" className="mt-0 border-0 p-4 sm:p-6 lg:p-8">
              <ConnectionTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
