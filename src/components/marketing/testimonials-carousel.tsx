'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, ChevronLeft, ChevronRight, BadgeCheck, Quote } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { testimonials } from '@/lib/community/mock-data'

const AUTO_ROTATE_MS = 5000

interface TestimonialsCarouselProps {
  /** Override the default testimonials (optional, useful for narrow sections) */
  items?: typeof testimonials
  /** Limit number shown in rotation (defaults to all) */
  limit?: number
  className?: string
}

export function TestimonialsCarousel({
  items = testimonials,
  limit,
  className,
}: TestimonialsCarouselProps) {
  const list = limit ? items.slice(0, limit) : items
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % list.length)
  }, [list.length])

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + list.length) % list.length)
  }, [list.length])

  useEffect(() => {
    if (paused || list.length <= 1) return
    timerRef.current = setTimeout(next, AUTO_ROTATE_MS)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [index, paused, next, list.length])

  const current = list[index]

  return (
    <div
      className={cn('relative w-full', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Affiliate testimonials"
    >
      <div className="relative overflow-hidden rounded-xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card className="border-shopee/15 bg-gradient-to-br from-shopee/5 via-background to-background">
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
                  {/* Avatar + identity */}
                  <div className="flex items-center gap-4 sm:flex-col sm:items-start sm:gap-3">
                    <Avatar className="size-14 border-2 border-background shadow-md sm:size-16">
                      <AvatarFallback className={cn('text-base font-bold sm:text-lg', current.avatarColor)}>
                        {current.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="sm:text-center">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm sm:text-base">{current.name}</p>
                        {current.verifiedSeller && (
                          <BadgeCheck className="size-4 text-emerald-600" aria-label="Verified Shopee Seller" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{current.location}</p>
                    </div>
                  </div>

                  {/* Quote + meta */}
                  <div className="min-w-0 flex-1 space-y-4">
                    <Quote className="size-6 text-shopee/40 shrink-0" aria-hidden />
                    <blockquote className="text-base leading-relaxed text-foreground sm:text-lg">
                      &ldquo;{current.quote}&rdquo;
                    </blockquote>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Star rating */}
                      <div className="flex items-center gap-0.5" aria-label={`${current.rating} out of 5 stars`}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'size-4',
                              i < current.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-muted text-muted',
                            )}
                            aria-hidden
                          />
                        ))}
                      </div>

                      <span className="text-muted-foreground/40" aria-hidden>
                        &middot;
                      </span>

                      {/* Earnings stat */}
                      <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {current.earningsStat}
                      </span>

                      {current.verifiedSeller && (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 bg-emerald-100/50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                        >
                          <BadgeCheck className="size-3" />
                          Verified Shopee Seller
                        </Badge>
                      )}

                      <Badge variant="secondary" className="text-xs">
                        {current.niche}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation controls */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Choose testimonial">
          {list.map((t, i) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={i === index}
              aria-label={`Go to testimonial ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === index
                  ? 'w-6 bg-shopee'
                  : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50',
              )}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={prev}
            disabled={list.length <= 1}
            aria-label="Previous testimonial"
            className="size-9 rounded-full"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={next}
            disabled={list.length <= 1}
            aria-label="Next testimonial"
            className="size-9 rounded-full"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Paused indicator */}
      <AnimatePresence>
        {paused && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="pointer-events-none absolute -top-2 right-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur-sm"
          >
            Paused
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TestimonialsCarousel
