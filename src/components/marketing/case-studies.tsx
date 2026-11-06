'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BadgeCheck,
  Clock,
  TrendingUp,
  ArrowRight,
  Target,
  Lightbulb,
  Rocket,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { caseStudies, type CaseStudy } from '@/lib/community/mock-data'

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
}

function CaseStudyCard({
  study,
  onOpen,
  index,
}: {
  study: CaseStudy
  onOpen: () => void
  index: number
}) {
  return (
    <motion.div
      variants={fadeIn}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <Card className="h-full overflow-hidden border-border/60 card-hover">
        {/* Hero gradient header */}
        <div
          className={cn(
            'relative flex h-36 items-center justify-center bg-gradient-to-br p-4',
            study.heroGradient,
          )}
        >
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] [background-size:18px_18px]" />
          <div className="relative text-center text-white">
            <p className="text-3xl font-bold drop-shadow-sm sm:text-4xl">{study.heroStat}</p>
            <p className="mt-1 text-xs font-medium opacity-90">{study.heroStatLabel}</p>
          </div>
          <span className="absolute right-3 top-3 rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            Case #{index + 1}
          </span>
        </div>

        <CardHeader className="pb-2">
          <CardTitle className="text-base leading-snug">{study.title}</CardTitle>
          <CardDescription className="line-clamp-2">{study.summary}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 pb-2">
          {/* Author */}
          <div className="flex items-center gap-2">
            <Avatar className="size-8">
              <AvatarFallback className={cn('text-xs font-bold', study.authorAvatarColor)}>
                {study.authorInitials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="truncate text-sm font-medium">{study.author}</span>
                {study.verified && (
                  <BadgeCheck className="size-3.5 shrink-0 text-emerald-600" aria-label="Verified" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">Verified Affiliate</p>
            </div>
          </div>

          {/* Duration + earnings */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 text-xs">
              <Clock className="size-3" />
              {study.duration}
            </Badge>
            <Badge variant="outline" className="gap-1 border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
              <TrendingUp className="size-3" />
              {study.earnings}
            </Badge>
          </div>

          {/* Key strategies */}
          <ul className="space-y-1.5 pt-1">
            {study.strategies.map((strategy, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                <span className="leading-relaxed">{strategy}</span>
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter className="pt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 group"
            onClick={onOpen}
          >
            Read full story
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

function CaseStudySectionBlock({
  section,
  icon,
  color,
}: {
  section: { heading: string; body: string }
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div className={cn('flex size-7 items-center justify-center rounded-full', color)}>
          {icon}
        </div>
        <h4 className="text-sm font-semibold">{section.heading}</h4>
      </div>
      <p className="ml-9 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
    </div>
  )
}

export function CaseStudies() {
  const [openId, setOpenId] = useState<string | null>(null)
  const active = caseStudies.find((s) => s.id === openId) || null

  return (
    <section className="space-y-6">
      <motion.div {...fadeIn} className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-shopee/10 px-3 py-1 text-xs font-medium text-shopee">
          <Sparkles className="size-3" />
          Real Success Stories
        </div>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          How Real Malaysians Are Winning on Shopee
        </h2>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
          Three detailed case studies breaking down exactly how our top affiliates scaled their earnings — strategies, execution, and results.
        </p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
      >
        {caseStudies.map((study, i) => (
          <CaseStudyCard
            key={study.id}
            study={study}
            index={i}
            onOpen={() => setOpenId(study.id)}
          />
        ))}
      </motion.div>

      {/* Full case study modal */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-h-[88vh] max-w-2xl gap-0 p-0">
          {active && (
            <>
              {/* Hero header */}
              <div
                className={cn(
                  'relative flex h-32 items-center justify-center bg-gradient-to-br p-4',
                  active.heroGradient,
                )}
              >
                <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] [background-size:18px_18px]" />
                <div className="relative text-center text-white">
                  <p className="text-4xl font-bold drop-shadow-sm">{active.heroStat}</p>
                  <p className="mt-1 text-xs font-medium opacity-90">{active.heroStatLabel}</p>
                </div>
              </div>

              <DialogHeader className="px-6 pt-5 pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback className={cn('text-xs font-bold', active.authorAvatarColor)}>
                      {active.authorInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <DialogTitle className="text-base leading-tight">{active.title}</DialogTitle>
                    </div>
                    <DialogDescription className="flex items-center gap-2 mt-1">
                      <span className="font-medium text-foreground/80">{active.author}</span>
                      {active.verified && (
                        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-100/50 px-1.5 py-0 text-[10px] text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                          <BadgeCheck className="size-2.5" />
                          Verified
                        </Badge>
                      )}
                    </DialogDescription>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Clock className="size-3" />
                    {active.duration}
                  </Badge>
                  <Badge variant="outline" className="gap-1 border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                    <TrendingUp className="size-3" />
                    {active.earnings}
                  </Badge>
                </div>
              </DialogHeader>

              <ScrollArea className="max-h-[calc(88vh-260px)] px-6 pb-6">
                <div className="space-y-5">
                  <CaseStudySectionBlock
                    section={active.challenge}
                    icon={<Target className="size-3.5 text-rose-600" />}
                    color="bg-rose-100 dark:bg-rose-950/40"
                  />
                  <CaseStudySectionBlock
                    section={active.strategy}
                    icon={<Lightbulb className="size-3.5 text-amber-600" />}
                    color="bg-amber-100 dark:bg-amber-950/40"
                  />
                  <CaseStudySectionBlock
                    section={active.execution}
                    icon={<Rocket className="size-3.5 text-violet-600" />}
                    color="bg-violet-100 dark:bg-violet-950/40"
                  />
                  <CaseStudySectionBlock
                    section={active.results}
                    icon={<TrendingUp className="size-3.5 text-emerald-600" />}
                    color="bg-emerald-100 dark:bg-emerald-950/40"
                  />
                  <CaseStudySectionBlock
                    section={active.tips}
                    icon={<Sparkles className="size-3.5 text-shopee" />}
                    color="bg-shopee/10"
                  />
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}

export default CaseStudies
