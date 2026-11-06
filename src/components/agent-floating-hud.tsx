'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  Bot,
  Play,
  Pause,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  Flame,
  Clock,
  Eye,
  Check,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useAppStore } from '@/store/app-store'
import { toast } from 'sonner'

export type AgentStage = 'observe' | 'plan' | 'batch' | 'verify'

export interface AgentTask {
  id: string
  title: string
  stage: AgentStage
  progress: number
  status: 'running' | 'paused' | 'waiting_approval' | 'completed'
  target: string
  details: string
  safetyActionRequired?: string
}

const INITIAL_TASKS: AgentTask[] = [
  {
    id: 'task-1',
    title: 'Shopee Live Flash Sale Scout',
    stage: 'observe',
    progress: 75,
    status: 'running',
    target: 'Beauty & Skincare (MY)',
    details: 'Scanning 48 trending products on Shopee MY with rating >= 4.8 & comm >= 10%',
  },
  {
    id: 'task-2',
    title: 'TikTok Viral Hook Batcher',
    stage: 'batch',
    progress: 40,
    status: 'running',
    target: 'Serum Vitamin C Brightening',
    details: 'Generating 3 BM santai video hooks + 10 hashtag sets with high CTR probability',
  },
  {
    id: 'task-3',
    title: 'Affiliate URL Verifier & Safety Gate',
    stage: 'verify',
    progress: 95,
    status: 'waiting_approval',
    target: 'Shortlink redirect check',
    details: 'Verified sub-id tracking parameters. Ready to schedule to Telegram channel.',
    safetyActionRequired: 'Broadcast to 14,200 Telegram subscribers?',
  },
]

export function AgentFloatingHud() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [tasks, setTasks] = useState<AgentTask[]>(INITIAL_TASKS)
  const [activeLoop, setActiveLoop] = useState<AgentStage>('observe')
  const { setActivePage } = useAppStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Simulate Manus O-P-B-V autonomous loop progression
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.status === 'running') {
            const nextProgress = t.progress >= 100 ? 15 : t.progress + 5
            let nextStage = t.stage
            if (nextProgress < 25) nextStage = 'observe'
            else if (nextProgress < 50) nextStage = 'plan'
            else if (nextProgress < 85) nextStage = 'batch'
            else nextStage = 'verify'
            return {
              ...t,
              progress: nextProgress,
              stage: nextStage,
            }
          }
          return t
        })
      )
    }, 2800)

    return () => clearInterval(interval)
  }, [])

  const runningCount = tasks.filter((t) => t.status === 'running').length
  const approvalCount = tasks.filter((t) => t.status === 'waiting_approval').length

  const handleApprove = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          toast.success('Approved! Broadcast dispatched safely to Telegram queue.')
          return {
            ...t,
            status: 'completed',
            progress: 100,
            safetyActionRequired: undefined,
          }
        }
        return t
      })
    )
  }

  const handleToggleTaskStatus = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextStatus = t.status === 'running' ? 'paused' : 'running'
          toast.info(`Task ${nextStatus === 'running' ? 'resumed' : 'paused'}`)
          return { ...t, status: nextStatus }
        }
        return t
      })
    )
  }

  if (!mounted) return null

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-4 lg:left-28 z-40 font-sans select-none">
      {/* Minimized Pill HUD */}
      {!isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-card/95 backdrop-blur-md border border-shopee/40 text-card-foreground shadow-2xl rounded-full px-3 sm:px-4 py-1.5 sm:py-2 flex items-center gap-2 sm:gap-3 cursor-pointer hover:border-shopee transition-all group"
          onClick={() => setIsOpen(true)}
        >
          <div className="relative flex items-center justify-center">
            <span className="relative flex size-2.5 sm:size-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2.5 sm:size-3 bg-emerald-500" />
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-xs font-bold tracking-tight text-foreground flex items-center gap-1">
              <Bot className="w-3.5 h-3.5 text-shopee" />
              <span className="hidden sm:inline">MANUS O-P-B-V</span>
              <span className="sm:hidden font-mono text-[11px]">MANUS</span>
            </span>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
              <span className="text-emerald-500 font-semibold">{runningCount} <span className="hidden sm:inline">active</span></span>
              {approvalCount > 0 && (
                <span className="bg-amber-500/10 text-amber-500 px-1 sm:px-1.5 py-0.5 rounded text-[10px] font-bold animate-pulse">
                  {approvalCount} <span className="hidden sm:inline">gate</span>
                </span>
              )}
            </div>
          </div>

          <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-foreground transition-transform" />
        </motion.div>
      )}

      {/* Expanded Manus-Style Task Execution Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-[calc(100vw-32px)] max-w-sm sm:w-[400px] bg-card/98 backdrop-blur-xl border-2 border-shopee/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-card-foreground"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-shopee/10 via-background to-shopee/5 px-4 py-3 border-b border-border/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-shopee/10 text-shopee">
                  <Activity className="w-4 h-4 animate-spin" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold tracking-wide uppercase text-foreground">
                      Manus Execution HUD
                    </h4>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-shopee/40 text-shopee">
                      v2.1.0 MCP
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Autonomous E-Commerce Daemon</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* MCP Phase Indicators (Observe, Plan, Batch, Verify) */}
            <div className="px-4 py-2.5 bg-muted/40 border-b border-border/60">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Autonomous O-P-B-V Pipeline</span>
                <span className="text-[9px] text-emerald-500 font-mono">Live Loop</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-mono">
                {[
                  { id: 'observe', label: '1. OBSERVE', color: 'border-blue-500 text-blue-500' },
                  { id: 'plan', label: '2. PLAN', color: 'border-indigo-500 text-indigo-500' },
                  { id: 'batch', label: '3. BATCH', color: 'border-amber-500 text-amber-500' },
                  { id: 'verify', label: '4. VERIFY', color: 'border-emerald-500 text-emerald-500' },
                ].map((phase) => (
                  <div
                    key={phase.id}
                    className={`py-1 px-1 rounded border text-[9px] font-bold ${
                      phase.color
                    } bg-background/50`}
                  >
                    {phase.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Task Cards List */}
            <div className="p-3 space-y-2.5 max-h-[320px] overflow-y-auto">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-2.5 rounded-xl border border-border/70 bg-background/60 hover:border-shopee/40 transition-all text-xs"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <div className="font-semibold text-foreground text-[12px] flex items-center gap-1.5">
                        {task.title}
                        {task.status === 'completed' && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 inline" />
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <span className="font-medium text-foreground/80">{task.target}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase font-bold ${
                          task.stage === 'observe'
                            ? 'bg-blue-500/10 text-blue-500'
                            : task.stage === 'plan'
                            ? 'bg-indigo-500/10 text-indigo-500'
                            : task.stage === 'batch'
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-emerald-500/10 text-emerald-500'
                        }`}
                      >
                        {task.stage}
                      </span>

                      {task.status !== 'completed' && (
                        <button
                          onClick={() => handleToggleTaskStatus(task.id)}
                          className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                          title={task.status === 'running' ? 'Pause task' : 'Resume task'}
                        >
                          {task.status === 'running' ? (
                            <Pause className="w-3 h-3" />
                          ) : (
                            <Play className="w-3 h-3 text-emerald-500" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
                    {task.details}
                  </p>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                      <span>Execution Progress</span>
                      <span>{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} className="h-1.5 bg-muted" />
                  </div>

                  {/* Safety Gate Action Required */}
                  {task.safetyActionRequired && task.status === 'waiting_approval' && (
                    <div className="mt-2.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold text-[11px] mb-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Manus Safety Gate: Human Approval
                      </div>
                      <p className="text-[10px] text-foreground/80 mb-2">
                        {task.safetyActionRequired}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="h-6 text-[10px] px-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium"
                          onClick={() => handleApprove(task.id)}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Approve Action
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground"
                          onClick={() => handleToggleTaskStatus(task.id)}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Actions Footer */}
            <div className="p-2.5 bg-muted/30 border-t border-border/80 flex items-center justify-between text-xs">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] border-border text-foreground hover:border-shopee"
                onClick={() => {
                  setIsOpen(false)
                  setActivePage('addons')
                }}
              >
                <Zap className="w-3 h-3 mr-1 text-shopee" />
                10 Modular Addons
              </Button>

              <Button
                size="sm"
                className="h-7 text-[11px] bg-shopee hover:bg-shopee/90 text-white"
                onClick={() => {
                  setIsOpen(false)
                  setActivePage('hermes')
                }}
              >
                <Bot className="w-3 h-3 mr-1" />
                Hermes Studio
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
