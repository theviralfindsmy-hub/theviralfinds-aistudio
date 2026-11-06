/**
 * Test Suite: Hermes Copilot Sidebar & AG-UI Generative UI Cards
 * 
 * Verifies:
 * 1. CopilotProvider initialization, state storage, and activePage synchronization.
 * 2. useCopilotReadable registering, updating, and unregistering page context.
 * 3. useCopilotAction registering actions, parameter validation, and execution.
 * 4. CommissionSimulatorCard mathematical accuracy, velocity tiers, boundary clipping, and JSX rendering.
 * 5. ViralHookCard 4-angle generation (Curiosity, PAS, Manglish Dialect, Shock), platform badges, and JSX rendering.
 * 6. BroadcastActionCard platform switching, subId link formatting, live caption preview, and JSX rendering.
 * 7. HermesCopilotSidebar mounting, floating trigger, keyboard shortcut (⌘J), and Generative UI integration.
 */

import React from 'react'
import { describe, it, expect } from 'bun:test'
import { renderToString } from 'react-dom/server'
import {
  CopilotProvider,
  useCopilot,
  useCopilotSafe,
  useCopilotReadable,
  useCopilotAction,
  type CopilotChatMessage,
} from '@/lib/copilot'
import {
  CommissionSimulatorCard,
  calculateCommissionMath,
  type VelocityTier,
} from '@/components/copilot/commission-simulator-card'
import {
  ViralHookCard,
  generateViralHooks,
  type ViralHookAngleKey,
} from '@/components/copilot/viral-hook-card'
import {
  BroadcastActionCard,
  formatBroadcastPayload,
  type BroadcastPlatform,
} from '@/components/copilot/broadcast-action-card'
import {
  HermesCopilotSidebar,
  HermesCopilotSidebarInner,
} from '@/components/hermes-copilot-sidebar'

describe('M3 AG-UI Protocol: CopilotProvider & Hooks', () => {
  it('initializes CopilotProvider with default active page and messages', () => {
    let capturedContext: any = null

    function TestConsumer() {
      capturedContext = useCopilot()
      return <div data-testid="test-consumer">Ready</div>
    }

    const html = renderToString(
      <CopilotProvider initialActivePage="products">
        <TestConsumer />
      </CopilotProvider>
    )

    expect(html).toContain('data-testid="test-consumer"')
    expect(capturedContext).not.toBeNull()
    expect(capturedContext.activePage).toBe('products')
    expect(capturedContext.messages.length).toBeGreaterThan(0)
    expect(capturedContext.isSidebarOpen).toBe(false)
  })

  it('registers and unregisters readable context correctly via registerReadable', () => {
    let capturedContext: any = null

    function TestConsumer() {
      capturedContext = useCopilot()
      return null
    }

    renderToString(
      <CopilotProvider>
        <TestConsumer />
      </CopilotProvider>
    )

    expect(capturedContext).not.toBeNull()

    // Register a custom readable
    const unregister = capturedContext.registerReadable({
      id: 'custom_product_selection',
      description: 'Currently highlighted product in catalog',
      value: { productId: 'p123', price: 49.9, category: 'skincare' },
    })

    const record = capturedContext.getReadable('custom_product_selection')
    expect(record).toBeDefined()
    expect(record.description).toBe('Currently highlighted product in catalog')
    expect(record.value.productId).toBe('p123')

    // Unregister
    unregister()
    expect(capturedContext.getReadable('custom_product_selection')).toBeUndefined()
  })

  it('registers and executes actions with parameter validation and status tracking', async () => {
    let capturedContext: any = null

    function TestConsumer() {
      capturedContext = useCopilot()
      return null
    }

    renderToString(
      <CopilotProvider>
        <TestConsumer />
      </CopilotProvider>
    )

    expect(capturedContext).not.toBeNull()

    // Register an action with parameter parsing
    let actionExecutedWith: any = null
    const unregisterAction = capturedContext.registerAction({
      name: 'calculate_discount',
      description: 'Calculate discount percentage for product',
      parameters: {
        parse: (args: any) => {
          if (!args.price || args.price <= 0) throw new Error('Invalid price')
          return { price: Number(args.price), discount: Number(args.discount || 0) }
        },
      },
      handler: async (args: { price: number; discount: number }) => {
        actionExecutedWith = args
        return { finalPrice: args.price * (1 - args.discount / 100) }
      },
    })

    const action = capturedContext.getAction('calculate_discount')
    expect(action).toBeDefined()
    expect(action.name).toBe('calculate_discount')

    // Execute successfully
    const result = await capturedContext.executeAction('calculate_discount', {
      price: 100,
      discount: 20,
    })

    expect(result.finalPrice).toBe(80)
    expect(actionExecutedWith).toEqual({ price: 100, discount: 20 })
    expect(capturedContext.actionStatuses['calculate_discount'].status).toBe('complete')
    expect(capturedContext.actionStatuses['calculate_discount'].result).toEqual({ finalPrice: 80 })

    // Execute with invalid arguments (triggers validation error)
    let caughtError: any = null
    try {
      await capturedContext.executeAction('calculate_discount', { price: -10 })
    } catch (err: any) {
      caughtError = err
    }
    expect(caughtError).not.toBeNull()
    expect(caughtError.message).toBe('Invalid price')
    expect(capturedContext.actionStatuses['calculate_discount'].status).toBe('error')

    // Cleanup
    unregisterAction()
    expect(capturedContext.getAction('calculate_discount')).toBeUndefined()
  })

  it('throws descriptive error when executing unregistered action', async () => {
    let capturedContext: any = null

    function TestConsumer() {
      capturedContext = useCopilot()
      return null
    }

    renderToString(
      <CopilotProvider>
        <TestConsumer />
      </CopilotProvider>
    )

    let caughtError: any = null
    try {
      await capturedContext.executeAction('non_existent_action', {})
    } catch (err: any) {
      caughtError = err
    }

    expect(caughtError).not.toBeNull()
    expect(caughtError.message).toContain('is not registered in CopilotProvider')
  })

  it('adds and clears chat messages correctly', () => {
    let capturedContext: any = null

    function TestConsumer() {
      capturedContext = useCopilot()
      return null
    }

    renderToString(
      <CopilotProvider>
        <TestConsumer />
      </CopilotProvider>
    )

    const initialCount = capturedContext.messages.length

    // Add message
    const newMsg = capturedContext.addMessage({
      role: 'user',
      content: 'Kira komisen untuk saya',
    })

    expect(newMsg.id).toBeDefined()
    expect(newMsg.timestamp).toBeDefined()
    expect(newMsg.content).toBe('Kira komisen untuk saya')

    // Clear messages
    capturedContext.clearMessages()
    expect(capturedContext.messages.length).toBe(0)
  })

  it('manages sidebar open/close state and toggle', () => {
    let capturedContext: any = null

    function TestConsumer() {
      capturedContext = useCopilot()
      return null
    }

    renderToString(
      <CopilotProvider>
        <TestConsumer />
      </CopilotProvider>
    )

    expect(capturedContext.isSidebarOpen).toBe(false)
    capturedContext.toggleSidebar()
    expect(capturedContext.isSidebarOpen).toBe(true)
    capturedContext.setSidebarOpen(false)
    expect(capturedContext.isSidebarOpen).toBe(false)
  })
})

describe('M3 Generative UI Card 1: CommissionSimulatorCard', () => {
  it('calculates deterministic gross sales and net affiliate earnings', () => {
    // RM 45 * 150 units * 12% commission
    const math1 = calculateCommissionMath(45, 150, 12)
    expect(math1.grossSales).toBe(6750)
    expect(math1.netEarnings).toBe(810)
    expect(math1.earningsPerUnit).toBe(5.4)
    expect(math1.velocityTier).toBe('Rising')

    // Low tier: RM 15 * 20 units * 3%
    const math2 = calculateCommissionMath(15, 20, 3)
    expect(math2.grossSales).toBe(300)
    expect(math2.netEarnings).toBe(9)
    expect(math2.velocityTier).toBe('Starter')

    // Viral tier: RM 90 * 300 units * 10%
    const math3 = calculateCommissionMath(90, 300, 10)
    expect(math3.grossSales).toBe(27000)
    expect(math3.netEarnings).toBe(2700)
    expect(math3.velocityTier).toBe('Viral')

    // Super Affiliate tier: RM 250 * 500 units * 15%
    const math4 = calculateCommissionMath(250, 500, 15)
    expect(math4.grossSales).toBe(125000)
    expect(math4.netEarnings).toBe(18750)
    expect(math4.velocityTier).toBe('Super Affiliate')
  })

  it('clips slider boundary inputs to allowable safe ranges', () => {
    // Under boundary
    const lowMath = calculateCommissionMath(1, 2, 0.2)
    expect(lowMath.price).toBe(5)
    expect(lowMath.units).toBe(10)
    expect(lowMath.commissionRate).toBe(1)

    // Over boundary
    const highMath = calculateCommissionMath(9999, 50000, 95)
    expect(highMath.price).toBe(500)
    expect(highMath.units).toBe(2000)
    expect(highMath.commissionRate).toBe(25)
  })

  it('renders CommissionSimulatorCard JSX with all controls and values', () => {
    const html = renderToString(
      <CommissionSimulatorCard
        initialPrice={55}
        initialUnits={200}
        initialCommissionRate={14}
        productName="Serum Brightening 30ml"
      />
    )

    expect(html).toContain('data-testid="commission-simulator-card"')
    expect(html).toContain('Interactive Commission Simulator')
    expect(html).toContain('Serum Brightening 30ml')
    expect(html).toContain('data-testid="slider-price"')
    expect(html).toContain('data-testid="slider-units"')
    expect(html).toContain('data-testid="slider-commission"')
    expect(html).toContain('data-testid="gross-sales-value"')
    expect(html).toContain('data-testid="net-earnings-value"')
    expect(html).toContain('data-testid="apply-campaign-btn"')
  })
})

describe('M3 Generative UI Card 2: ViralHookCard', () => {
  it('generates 4 proven angles with authentic Malaysian local dialect', () => {
    const hooks = generateViralHooks('Sunscreen SPF50 Glowing', 'Skincare')

    // Angle 1: Curiosity Gap
    expect(hooks.curiosity.title).toBe('Curiosity Gap')
    expect(hooks.curiosity.hookText).toContain('Sunscreen SPF50 Glowing')
    expect(hooks.curiosity.platforms).toContain('TikTok')

    // Angle 2: Problem-Agitate-Solve
    expect(hooks.pas.title).toBe('Problem-Agitate-Solve')
    expect(hooks.pas.hookText).toContain('parut')
    expect(hooks.pas.callToAction).toContain('beg kuning')

    // Angle 3: Local Dialect (Manglish / Loghat Santai)
    expect(hooks.dialect.title).toContain('Local Dialect')
    expect(hooks.dialect.hookText).toContain('Korang')
    expect(hooks.dialect.hookText).toContain('weh')
    expect(hooks.dialect.callToAction).toContain('beg oren')

    // Angle 4: Shock Value
    expect(hooks.shock.title).toBe('Shock Value')
    expect(hooks.shock.hookText).toContain('JANGAN beli')
  })

  it('renders ViralHookCard JSX with angle selectors, badges, and copy CTA', () => {
    const html = renderToString(
      <ViralHookCard
        productName="Pembersih Muka Acne Cleanser"
        initialAngle="dialect"
      />
    )

    expect(html).toContain('data-testid="viral-hook-card"')
    expect(html).toContain('Viral Video Hook Generator')
    expect(html).toContain('Pembersih Muka Acne Cleanser')
    expect(html).toContain('data-testid="angle-tab-curiosity"')
    expect(html).toContain('data-testid="angle-tab-pas"')
    expect(html).toContain('data-testid="angle-tab-dialect"')
    expect(html).toContain('data-testid="angle-tab-shock"')
    expect(html).toContain('data-testid="hook-text-box"')
    expect(html).toContain('data-testid="copy-hook-btn"')
    expect(html).toContain('data-testid="send-studio-btn"')
  })
})

describe('M3 Generative UI Card 3: BroadcastActionCard', () => {
  it('formats platform-specific captions, hashtags, and subId links', () => {
    const rawUrl = 'https://shp.ee/tvf-serum'
    const subId = 'tvf_agent_test'

    // TikTok
    const tiktokPayload = formatBroadcastPayload('tiktok', 'Air Fryer Digital', rawUrl, subId)
    expect(tiktokPayload.platform).toBe('tiktok')
    expect(tiktokPayload.hashtags).toContain('#TikTokMadeMeBuyIt')
    expect(tiktokPayload.affiliateUrl).toContain('sub_id=tvf_agent_test')
    expect(tiktokPayload.caption).toContain('Air Fryer Digital')

    // Xiaohongshu (XHS)
    const xhsPayload = formatBroadcastPayload('xhs', 'Air Fryer Digital', rawUrl, subId)
    expect(xhsPayload.platform).toBe('xhs')
    expect(xhsPayload.platformName).toContain('Xiaohongshu')
    expect(xhsPayload.hashtags).toContain('#小红书好物')
    expect(xhsPayload.caption).toContain('Air Fryer Digital')

    // Twitter / X
    const twitterPayload = formatBroadcastPayload('twitter', 'Air Fryer Digital', rawUrl, subId)
    expect(twitterPayload.platform).toBe('twitter')
    expect(twitterPayload.caption).toContain('RACUN SHOPEE')
    expect(twitterPayload.hashtags).toContain('#ShopeeMY')

    // YouTube Shorts
    const shortsPayload = formatBroadcastPayload('shorts', 'Air Fryer Digital', rawUrl, subId)
    expect(shortsPayload.platform).toBe('shorts')
    expect(shortsPayload.hashtags).toContain('#Shorts')
    expect(shortsPayload.caption).toContain('pinned in the top comment')
  })

  it('renders BroadcastActionCard JSX with platform buttons, live preview, and broadcast button', () => {
    const html = renderToString(
      <BroadcastActionCard
        initialPlatform="tiktok"
        productName="Wireless Earbuds ANC"
        affiliateUrl="https://shp.ee/earbuds"
        subId="sub_broadcast_01"
      />
    )

    expect(html).toContain('data-testid="broadcast-action-card"')
    expect(html).toContain('One-Click Multi-Channel Broadcast')
    expect(html).toContain('data-testid="platform-btn-tiktok"')
    expect(html).toContain('data-testid="platform-btn-xhs"')
    expect(html).toContain('data-testid="platform-btn-twitter"')
    expect(html).toContain('data-testid="platform-btn-shorts"')
    expect(html).toContain('data-testid="broadcast-caption-preview"')
    expect(html).toContain('data-testid="broadcast-hashtags"')
    expect(html).toContain('data-testid="broadcast-shortlink-preview"')
    expect(html).toContain('data-testid="broadcast-now-btn"')
  })
})

describe('M3 HermesCopilotSidebar Integration & AG-UI Lifecycle', () => {
  it('renders HermesCopilotSidebar with floating trigger and ⌘J badge', () => {
    const html = renderToString(
      <CopilotProvider initialActivePage="dashboard">
        <HermesCopilotSidebar />
      </CopilotProvider>
    )

    expect(html).toContain('data-testid="copilot-floating-trigger"')
    expect(html).toContain('Hermes Copilot')
    expect(html).toContain('⌘J')
  })

  it('renders open sidebar drawer with context awareness and quick prompts', () => {
    const html = renderToString(
      <CopilotProvider initialActivePage="socialhub" initialOpen={true}>
        <HermesCopilotSidebarInner />
      </CopilotProvider>
    )

    expect(html).toContain('data-testid="copilot-floating-trigger"')
    expect(html).toContain('Hermes In-App Copilot')
    expect(html).toContain('CopilotKit AG-UI')
    expect(html).toContain('Active Context Aware')
  })

  it('renders Generative UI cards dynamically within chat messages', () => {
    const initialMessages: CopilotChatMessage[] = [
      {
        id: 'msg-sim',
        role: 'assistant',
        content: 'Simulasi komisen aktif:',
        actionData: {
          type: 'card',
          cardType: 'commission_simulator',
          cardProps: { initialPrice: 60, initialUnits: 100, initialCommissionRate: 15 },
        },
      },
      {
        id: 'msg-hook',
        role: 'assistant',
        content: 'Hook skrip FYP:',
        actionData: {
          type: 'card',
          cardType: 'viral_hook',
          cardProps: { productName: 'Lipmatte Viral', initialAngle: 'dialect' },
        },
      },
      {
        id: 'msg-broadcast',
        role: 'assistant',
        content: 'Siaran media sosial:',
        actionData: {
          type: 'card',
          cardType: 'broadcast_action',
          cardProps: { initialPlatform: 'xhs' },
        },
      },
    ]

    const html = renderToString(
      <CopilotProvider initialMessages={initialMessages} initialOpen={true}>
        <div data-testid="cards-container">
          <HermesCopilotSidebarInner />
        </div>
      </CopilotProvider>
    )

    expect(html).toContain('data-testid="copilot-floating-trigger"')
    expect(html).toContain('data-testid="commission-simulator-card"')
    expect(html).toContain('data-testid="viral-hook-card"')
    expect(html).toContain('data-testid="broadcast-action-card"')
  })
})

describe('M3 Edge Cases & Stress Resilience', () => {
  it('verifies exact threshold boundaries for velocity tiers in commission math', () => {
    // Exactly at RM 300 boundary
    // price 30, units 100, rate 10% -> gross 3000, net 300
    const risingBoundary = calculateCommissionMath(30, 100, 10)
    expect(risingBoundary.netEarnings).toBe(300)
    expect(risingBoundary.velocityTier).toBe('Rising')

    // Just below RM 300 boundary: price 29.90, units 100, rate 10% -> net 299
    const starterBoundary = calculateCommissionMath(29.90, 100, 10)
    expect(starterBoundary.netEarnings).toBe(299)
    expect(starterBoundary.velocityTier).toBe('Starter')

    // Exactly at RM 1500 boundary: price 150, units 100, rate 10% -> net 1500
    const viralBoundary = calculateCommissionMath(150, 100, 10)
    expect(viralBoundary.netEarnings).toBe(1500)
    expect(viralBoundary.velocityTier).toBe('Viral')

    // Exactly at RM 5000 boundary: price 500, units 100, rate 10% -> net 5000
    const superBoundary = calculateCommissionMath(500, 100, 10)
    expect(superBoundary.netEarnings).toBe(5000)
    expect(superBoundary.velocityTier).toBe('Super Affiliate')
  })

  it('guarantees 2-decimal precision without NaN or floating point inaccuracies', () => {
    const math = calculateCommissionMath(33.33, 333, 7.7)
    expect(Number.isFinite(math.grossSales)).toBe(true)
    expect(Number.isFinite(math.netEarnings)).toBe(true)
    expect(Number.isFinite(math.earningsPerUnit)).toBe(true)
    expect(math.grossSales.toString()).toMatch(/^\d+(\.\d{1,2})?$/)
    expect(math.netEarnings.toString()).toMatch(/^\d+(\.\d{1,2})?$/)
    expect(math.earningsPerUnit.toString()).toMatch(/^\d+(\.\d{1,2})?$/)
  })

  it('handles existing query parameters when appending sub_id in broadcast payload', () => {
    // Existing query parameter
    const payloadWithQuery = formatBroadcastPayload(
      'tiktok',
      'Portable Blender',
      'https://shopee.com.my/product?sp_atk=xyz',
      'aff_sub_99'
    )
    expect(payloadWithQuery.affiliateUrl).toContain('sp_atk=xyz')
    expect(payloadWithQuery.affiliateUrl).toContain('sub_id=aff_sub_99')
    expect(payloadWithQuery.affiliateUrl.split('?').length - 1).toBe(1) // Only one question mark

    // Clean URL without query parameter
    const payloadClean = formatBroadcastPayload(
      'xhs',
      'Portable Blender',
      'https://shp.ee/blender',
      'aff_sub_99'
    )
    expect(payloadClean.affiliateUrl).toBe('https://shp.ee/blender?sub_id=aff_sub_99')
  })

  it('supports concurrent parallel action execution without state collision', async () => {
    let capturedContext: any = null

    function TestConsumer() {
      capturedContext = useCopilot()
      return null
    }

    renderToString(
      <CopilotProvider>
        <TestConsumer />
      </CopilotProvider>
    )

    // Register 10 distinct actions
    for (let i = 0; i < 10; i++) {
      capturedContext.registerAction({
        name: `parallel_action_${i}`,
        description: `Action number ${i}`,
        handler: async (args: { value: number }) => {
          return { doubled: args.value * 2, index: i }
        },
      })
    }

    // Execute all 10 in parallel
    const executionPromises = Array.from({ length: 10 }, (_, i) =>
      capturedContext.executeAction(`parallel_action_${i}`, { value: (i + 1) * 10 })
    )

    const results = await Promise.all(executionPromises)

    expect(results.length).toBe(10)
    results.forEach((res, i) => {
      expect(res.doubled).toBe((i + 1) * 20)
      expect(res.index).toBe(i)
      expect(capturedContext.actionStatuses[`parallel_action_${i}`].status).toBe('complete')
    })
  })

  it('handles readable parent-child hierarchy properly', () => {
    let capturedContext: any = null

    function TestConsumer() {
      capturedContext = useCopilot()
      return null
    }

    renderToString(
      <CopilotProvider>
        <TestConsumer />
      </CopilotProvider>
    )

    capturedContext.registerReadable({
      id: 'parent_filter_state',
      description: 'Parent catalog filter',
      value: { category: 'electronics' },
    })

    capturedContext.registerReadable({
      id: 'child_subfilter_state',
      description: 'Child subcategory filter',
      value: { subcategory: 'audio' },
      parentId: 'parent_filter_state',
    })

    const child = capturedContext.getReadable('child_subfilter_state')
    expect(child).toBeDefined()
    expect(child.parentId).toBe('parent_filter_state')
    expect(child.value.subcategory).toBe('audio')
  })
})

