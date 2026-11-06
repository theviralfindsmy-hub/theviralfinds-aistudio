import { NextRequest, NextResponse } from 'next/server'
import ZAI, { type SearchFunctionResultItem } from 'z-ai-web-dev-sdk'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || searchParams.get('query')

    if (!query) {
      return NextResponse.json(
        { error: 'Search query parameter "q" is required' },
        { status: 400 }
      )
    }

    let searchResults: SearchFunctionResultItem[] = []

    try {
      const zai = await ZAI.create()
      const results = await zai.functions.invoke('web_search', {
        query: `shopee malaysia ${query}`,
        num: 10,
      })
      searchResults = results || []
    } catch (sdkError) {
      console.warn('Web search SDK unavailable, using mock catalog fallback:', sdkError instanceof Error ? sdkError.message : sdkError)
    }

    // Format results as product data for the frontend
    const products = searchResults.map((result, index) => {
      // Extract product name from title (remove " - Shopee Malaysia" suffix etc)
      const cleanName = (result.name || result.url)
        .replace(/\s*[-|]\s*Shopee\s*(Malaysia)?\s*/gi, '')
        .replace(/\s*[-|]\s*.$/g, '')
        .trim()

      return {
        id: `search-${index}`,
        name: cleanName || result.name || result.url,
        url: result.url,
        snippet: result.snippet || '',
        image: null,
        price: null, // Would need scraping to get actual price
        commissionRate: 5, // Default commission rate
        category: 'general',
        source: 'shopee_search',
      }
    })

    // If no results from SDK, return mock data
    if (products.length === 0) {
      const mockProducts = [
        {
          id: 'mock-1',
          name: `${query} - Wireless Earbuds Pro`,
          url: `https://shopee.com.my/search?keyword=${encodeURIComponent(query)}`,
          snippet: `Top rated ${query} product on Shopee Malaysia with free shipping`,
          image: null,
          price: 89.9,
          commissionRate: 5,
          category: 'electronics',
          source: 'mock',
        },
        {
          id: 'mock-2',
          name: `${query} - RGB Gaming Mouse`,
          url: `https://shopee.com.my/search?keyword=${encodeURIComponent(query)}`,
          snippet: `Best selling ${query} with 4.8 star rating`,
          image: null,
          price: 59.9,
          commissionRate: 4.5,
          category: 'electronics',
          source: 'mock',
        },
        {
          id: 'mock-3',
          name: `${query} - Phone Case Ultra Slim`,
          url: `https://shopee.com.my/search?keyword=${encodeURIComponent(query)}`,
          snippet: `Premium quality ${query} at affordable price`,
          image: null,
          price: 25.0,
          commissionRate: 6,
          category: 'accessories',
          source: 'mock',
        },
        {
          id: 'mock-4',
          name: `${query} - USB-C Hub 7-in-1`,
          url: `https://shopee.com.my/search?keyword=${encodeURIComponent(query)}`,
          snippet: `Multi-port ${query} adapter for all devices`,
          image: null,
          price: 45.0,
          commissionRate: 4,
          category: 'electronics',
          source: 'mock',
        },
        {
          id: 'mock-5',
          name: `${query} - Fitness Tracker Band`,
          url: `https://shopee.com.my/search?keyword=${encodeURIComponent(query)}`,
          snippet: `Smart ${query} with heart rate monitor and step counter`,
          image: null,
          price: 79.9,
          commissionRate: 5,
          category: 'health',
          source: 'mock',
        },
      ]
      return NextResponse.json({ products: mockProducts, total: mockProducts.length, query })
    }

    return NextResponse.json({ products, total: products.length, query })
  } catch (error) {
    console.error('Product search error:', error)
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    )
  }
}
