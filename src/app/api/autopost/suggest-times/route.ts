import { NextResponse } from 'next/server'

// Best posting times research data for Malaysian market (UTC+8)
const PLATFORM_BEST_TIMES: Record<string, {
  name: string
  color: string
  icon: string
  timeSlots: { start: number; end: number; label: string; engagement: number }[]
  bestDays: string[]
  characterLimit: number
}> = {
  tiktok: {
    name: 'TikTok',
    color: '#FF0050',
    icon: '🎵',
    timeSlots: [
      { start: 7, end: 9, label: '7AM - 9AM', engagement: 40 },
      { start: 12, end: 14, label: '12PM - 2PM', engagement: 55 },
      { start: 19, end: 23, label: '7PM - 11PM', engagement: 95 },
    ],
    bestDays: ['Friday', 'Saturday'],
    characterLimit: 2200,
  },
  instagram: {
    name: 'Instagram',
    color: '#E4405F',
    icon: '📸',
    timeSlots: [
      { start: 11, end: 13, label: '11AM - 1PM', engagement: 50 },
      { start: 19, end: 21, label: '7PM - 9PM', engagement: 90 },
    ],
    bestDays: ['Tuesday', 'Thursday'],
    characterLimit: 2200,
  },
  facebook: {
    name: 'Facebook',
    color: '#1877F2',
    icon: '👤',
    timeSlots: [
      { start: 9, end: 11, label: '9AM - 11AM', engagement: 85 },
      { start: 13, end: 16, label: '1PM - 4PM', engagement: 60 },
      { start: 19, end: 21, label: '7PM - 9PM', engagement: 45 },
    ],
    bestDays: ['Wednesday', 'Thursday'],
    characterLimit: 63206,
  },
  youtube: {
    name: 'YouTube',
    color: '#FF0000',
    icon: '🎬',
    timeSlots: [
      { start: 8, end: 11, label: '8AM - 11AM', engagement: 80 },
      { start: 14, end: 17, label: '2PM - 5PM', engagement: 55 },
    ],
    bestDays: ['Saturday', 'Sunday'],
    characterLimit: 5000,
  },
  twitter: {
    name: 'Twitter/X',
    color: '#0EA5E9',
    icon: '𝕏',
    timeSlots: [
      { start: 9, end: 10, label: '9AM - 10AM', engagement: 75 },
      { start: 12, end: 13, label: '12PM - 1PM', engagement: 80 },
      { start: 17, end: 18, label: '5PM - 6PM', engagement: 50 },
    ],
    bestDays: ['Wednesday', 'Friday'],
    characterLimit: 280,
  },
}

// Generate 24-hour engagement heatmap data for each platform
function generateHeatmapData() {
  const heatmap: Record<string, { hour: number; label: string; engagement: number }[]> = {}

  for (const [key, platform] of Object.entries(PLATFORM_BEST_TIMES)) {
    heatmap[key] = []
    for (let hour = 0; hour < 24; hour++) {
      let engagement = 15 + Math.random() * 10 // baseline

      for (const slot of platform.timeSlots) {
        if (hour >= slot.start && hour < slot.end) {
          // Gradually increase towards the middle of the slot
          const slotProgress = (hour - slot.start) / (slot.end - slot.start)
          const peakMultiplier = Math.sin(slotProgress * Math.PI)
          engagement = slot.engagement * (0.6 + 0.4 * peakMultiplier)
          break
        }
      }

      heatmap[key].push({
        hour,
        label: `${hour.toString().padStart(2, '0')}:00`,
        engagement: Math.round(engagement),
      })
    }
  }

  return heatmap
}

// GET /api/autopost/suggest-times
export async function GET() {
  try {
    const heatmap = generateHeatmapData()

    // Generate suggested times for the next 7 days
    const now = new Date()
    const malaysiaOffset = 8 * 60 * 60 * 1000
    const malaysiaNow = new Date(now.getTime() + malaysiaOffset)

    const suggestions: Record<string, {
      platform: string
      name: string
      color: string
      suggestedTimes: { date: string; time: string; datetime: string; reason: string }[]
    }> = {}

    for (const [key, platform] of Object.entries(PLATFORM_BEST_TIMES)) {
      const times: { date: string; time: string; datetime: string; reason: string }[] = []

      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const date = new Date(malaysiaNow)
        date.setDate(date.getDate() + dayOffset)

        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
        const isBestDay = platform.bestDays.includes(dayName)

        // Get the best time slot for this platform
        const bestSlot = platform.timeSlots.reduce((a, b) => a.engagement > b.engagement ? a : b)
        const bestHour = Math.floor((bestSlot.start + bestSlot.end) / 2)

        // Only suggest future times
        if (dayOffset === 0 && bestHour <= malaysiaNow.getHours()) {
          // Try the next best slot
          const nextSlot = platform.timeSlots
            .filter(s => s.start > malaysiaNow.getHours())
            .sort((a, b) => b.engagement - a.engagement)[0]

          if (nextSlot) {
            const nextHour = Math.floor((nextSlot.start + nextSlot.end) / 2)
            const suggestDate = new Date(date)
            suggestDate.setHours(nextHour, 0, 0, 0)
            // Convert back to UTC for ISO string
            const utcDate = new Date(suggestDate.getTime() - malaysiaOffset)

            times.push({
              date: date.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short' }),
              time: `${nextHour.toString().padStart(2, '0')}:00 MYT`,
              datetime: utcDate.toISOString(),
              reason: isBestDay ? `${dayName} is a top day for ${platform.name}` : `Next available slot today`,
            })
          }
          continue
        }

        const suggestDate = new Date(date)
        suggestDate.setHours(bestHour, 0, 0, 0)
        const utcDate = new Date(suggestDate.getTime() - malaysiaOffset)

        times.push({
          date: date.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short' }),
          time: `${bestHour.toString().padStart(2, '0')}:00 MYT`,
          datetime: utcDate.toISOString(),
          reason: isBestDay
            ? `${dayName} is a top day for ${platform.name}!`
            : `Regular slot for ${platform.name}`,
        })
      }

      suggestions[key] = {
        platform: key,
        name: platform.name,
        color: platform.color,
        suggestedTimes: times.slice(0, 5),
      }
    }

    return NextResponse.json({
      platforms: Object.fromEntries(
        Object.entries(PLATFORM_BEST_TIMES).map(([key, val]) => [
          key,
          {
            name: val.name,
            color: val.color,
            icon: val.icon,
            characterLimit: val.characterLimit,
            bestDays: val.bestDays,
            timeSlots: val.timeSlots,
          },
        ])
      ),
      heatmap,
      suggestions,
      timezone: 'Asia/Kuala_Lumpur',
      utcOffset: '+08:00',
      goldenWindow: {
        label: '7PM - 9PM MYT',
        description: 'Peak engagement across all platforms in Malaysia',
        hours: [19, 20, 21],
      },
      lunchWindow: {
        label: '12PM - 2PM MYT',
        description: 'Lunch break browsing spike',
        hours: [12, 13, 14],
      },
      impulseWindow: {
        label: '9PM - Midnight MYT',
        description: 'Late-night impulse buying window',
        hours: [21, 22, 23],
      },
    })
  } catch (error) {
    console.error('Error fetching suggest times:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suggested times' },
      { status: 500 }
    )
  }
}
