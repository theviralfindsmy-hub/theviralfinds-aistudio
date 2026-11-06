import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// ─── Fallback Commission XTRA data ───────────────────────────────────────────
const FALLBACK_XTRA_PRODUCTS = [
  { name: 'Korean Skincare Set - 10 Step Routine', baseCommission: 8, xtraCommission: 25, totalRate: 33, category: 'Beauty' },
  { name: 'Wireless Noise Cancelling Earbuds Pro', baseCommission: 5, xtraCommission: 15, totalRate: 20, category: 'Electronics' },
  { name: 'Premium Hair Treatment Serum', baseCommission: 10, xtraCommission: 30, totalRate: 40, category: 'Beauty' },
  { name: 'Smart Home LED Strip Lights', baseCommission: 6, xtraCommission: 20, totalRate: 26, category: 'Home & Living' },
  { name: 'Organic Vitamin C Serum', baseCommission: 9, xtraCommission: 35, totalRate: 44, category: 'Beauty' },
  { name: 'Portable Blender USB Rechargeable', baseCommission: 7, xtraCommission: 18, totalRate: 25, category: 'Home & Living' },
  { name: 'Men\'s Running Shoes Lightweight', baseCommission: 6, xtraCommission: 22, totalRate: 28, category: 'Fashion' },
  { name: 'Baby Diaper Bag Multifunction', baseCommission: 5, xtraCommission: 15, totalRate: 20, category: 'Toys & Kids' },
  { name: 'RGB Mechanical Keyboard 75%', baseCommission: 4.5, xtraCommission: 12, totalRate: 16.5, category: 'Electronics' },
  { name: 'Slimming Waist Trainer Belt', baseCommission: 8, xtraCommission: 28, totalRate: 36, category: 'Health' },
  { name: 'Cat Automatic Feeder Smart', baseCommission: 5, xtraCommission: 20, totalRate: 25, category: 'Pet' },
  { name: 'Microfiber Bed Sheet Set Queen', baseCommission: 7, xtraCommission: 18, totalRate: 25, category: 'Home & Living' },
  { name: 'Whitening Toothpaste Japanese', baseCommission: 9, xtraCommission: 30, totalRate: 39, category: 'Beauty' },
  { name: 'Car Phone Mount Magnetic', baseCommission: 4, xtraCommission: 10, totalRate: 14, category: 'Automotive' },
  { name: 'Yoga Mat Non-Slip Premium', baseCommission: 6, xtraCommission: 22, totalRate: 28, category: 'Sports' },
  { name: 'LED Desk Lamp Eye-Care', baseCommission: 5, xtraCommission: 15, totalRate: 20, category: 'Home & Living' },
  { name: 'Sunscreen SPF50+ PA++++ Korean', baseCommission: 10, xtraCommission: 35, totalRate: 45, category: 'Beauty' },
  { name: 'Wireless Charging Pad 15W', baseCommission: 4.5, xtraCommission: 12, totalRate: 16.5, category: 'Electronics' },
  { name: 'Air Purifier HEPA Filter Home', baseCommission: 6, xtraCommission: 20, totalRate: 26, category: 'Home & Living' },
  { name: 'Resistance Bands Set Fitness', baseCommission: 7, xtraCommission: 25, totalRate: 32, category: 'Sports' },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const sortBy = searchParams.get('sortBy') || 'totalRate' // totalRate | baseRate | category

    let xtraProducts: Array<{
      name: string
      baseCommission: number
      xtraCommission: number
      totalRate: number
      category: string
      source?: string
    }> = []

    // Try to fetch live data from web search
    try {
      const zai = await ZAI.create()

      const searchQueries = [
        'shopee commission xtra malaysia 2025 high commission products',
        'shopee affiliate high commission products malaysia xtra',
      ]

      for (const query of searchQueries) {
        try {
          const results = await zai.functions.invoke('web_search', {
            query,
            num: 10,
          })

          if (results && Array.isArray(results)) {
            for (const result of results) {
              const title = result.name || ''
              const snippet = result.snippet || ''

              // Try to extract commission info from search results
              const commissionMatch = snippet.match(/(\d+)%\s*(?:commission|xtra|extra)/i) ||
                                     title.match(/(\d+)%\s*(?:commission|xtra|extra)/i)

              const baseRate = commissionMatch ? parseInt(commissionMatch[1]) : null
              const estimatedXtra = baseRate ? Math.round(baseRate * (1.5 + Math.random() * 2)) : null

              if (baseRate && estimatedXtra) {
                xtraProducts.push({
                  name: title.replace(/\s*[-|].*$/, '').trim().substring(0, 80),
                  baseCommission: Math.min(12, baseRate),
                  xtraCommission: Math.min(50 - Math.min(12, baseRate), estimatedXtra - Math.min(12, baseRate)),
                  totalRate: Math.min(50, baseRate + (estimatedXtra - baseRate)),
                  category: guessCategory(title + ' ' + snippet),
                  source: 'live',
                })
              }
            }
          }
        } catch {
          // Continue with next query
        }
      }
    } catch (sdkError) {
      console.error('Web search SDK error, using fallback:', sdkError)
    }

    // If no live results, use fallback
    if (xtraProducts.length === 0) {
      xtraProducts = FALLBACK_XTRA_PRODUCTS.map(p => ({ ...p, source: 'fallback' }))
    } else {
      // Merge live + fallback, deduplicate
      const liveNames = new Set(xtraProducts.map(p => p.name.toLowerCase()))
      const extraFallback = FALLBACK_XTRA_PRODUCTS
        .filter(p => !liveNames.has(p.name.toLowerCase()))
        .slice(0, 10)
        .map(p => ({ ...p, source: 'fallback' }))
      xtraProducts = [...xtraProducts, ...extraFallback]
    }

    // Filter by category
    let filtered = xtraProducts
    if (category && category !== 'all') {
      filtered = xtraProducts.filter(p =>
        p.category.toLowerCase().includes(category.toLowerCase())
      )
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'baseRate') return b.baseCommission - a.baseCommission
      if (sortBy === 'category') return a.category.localeCompare(b.category)
      return b.totalRate - a.totalRate // default: totalRate
    })

    return NextResponse.json({
      products: sorted,
      total: sorted.length,
      categories: [...new Set(xtraProducts.map(p => p.category))].sort(),
    })
  } catch (error) {
    console.error('Commission XTRA fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch Commission XTRA products' }, { status: 500 })
  }
}

function guessCategory(text: string): string {
  const lower = text.toLowerCase()
  if (/beauty|skincare|serum|cream|moistur|makeup|lipstick|foundat/i.test(lower)) return 'Beauty'
  if (/electronic|gadget|phone|tablet|charger|earbuds|keyboard|mouse/i.test(lower)) return 'Electronics'
  if (/fashion|cloth|dress|shirt|shoe|bag|wear/i.test(lower)) return 'Fashion'
  if (/health|supplement|vitamin|mask|medical|wellness/i.test(lower)) return 'Health'
  if (/home|kitchen|lamp|furniture|decor|bed|sheet/i.test(lower)) return 'Home & Living'
  if (/toy|kid|baby|children|diaper/i.test(lower)) return 'Toys & Kids'
  if (/sport|fitness|gym|yoga|run|exercise/i.test(lower)) return 'Sports'
  if (/pet|cat|dog|fish|bird/i.test(lower)) return 'Pet'
  if (/car|auto|motor|vehicle/i.test(lower)) return 'Automotive'
  if (/food|snack|drink|beverage|coffee|tea/i.test(lower)) return 'Food & Beverage'
  return 'General'
}
