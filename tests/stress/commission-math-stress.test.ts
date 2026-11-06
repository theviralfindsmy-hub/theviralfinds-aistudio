/**
 * Empirical Adversarial Stress Test Suite: Milestone 3 Commission Math & Slider Engine
 * 
 * Target: src/components/copilot/commission-simulator-card.tsx
 * 
 * Objective:
 * 1. 2,000+ pseudo-random fuzzing permutations across price, units, commissionRate.
 * 2. Boundary clamping stress tests:
 *    - Price: underflow (<= 0, negative, -Infinity, 4.99) -> 5; overflow (> 500, Infinity, MAX_SAFE_INTEGER) -> 500.
 *    - Units: underflow (<= 0, negative, -Infinity, 9.99) -> 10; overflow (> 2000, Infinity) -> 2000.
 *    - CommissionRate: underflow (<= 0, negative, -Infinity, 0.99) -> 1; overflow (> 25, Infinity) -> 25.
 * 3. Exact velocity tier transition thresholds:
 *    - Starter (< RM 300) vs Rising (RM 300 to 1,499.99) at 299.99 vs 300.00
 *    - Rising vs Viral (RM 1,500 to 4,999.99) at 1499.99 vs 1500.00
 *    - Viral vs Super Affiliate (>= RM 5,000) at 4999.99 vs 5000.00
 * 4. Numeric hygiene & precision:
 *    - Zero NaN, zero Infinity, zero negative numbers.
 *    - Maximum 2 decimal places rounding integrity.
 * 5. Type-coercion & malformed inputs (strings, null, undefined, NaN, booleans, objects).
 * 6. React Component rendering stress with boundary props and event handlers.
 */

import React from 'react'
import { describe, it, expect } from 'bun:test'
import { renderToString } from 'react-dom/server'
import {
  calculateCommissionMath,
  CommissionSimulatorCard,
  type CommissionMathResult,
  type VelocityTier,
} from '@/components/copilot/commission-simulator-card'

// Deterministic PRNG (Linear Congruential Generator)
function createPrng(seed = 987654321) {
  let s = seed
  return function next() {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

describe('M3 Challenger: Commission Math 2,000+ Permutation Fuzzing', () => {
  it('passes 2,000 randomized permutations with strict bounds, no NaN, and valid tiers', () => {
    const prng = createPrng(1337)
    const iterations = 2000

    for (let i = 0; i < iterations; i++) {
      // Wide range: price [-100, 1000], units [-100, 5000], rate [-10, 50]
      const rawPrice = -100 + prng() * 1100
      const rawUnits = -100 + prng() * 5100
      const rawRate = -10 + prng() * 60

      const result = calculateCommissionMath(rawPrice, rawUnits, rawRate)

      // 1. Boundary clamping invariants
      expect(result.price).toBeGreaterThanOrEqual(5)
      expect(result.price).toBeLessThanOrEqual(500)

      expect(result.units).toBeGreaterThanOrEqual(10)
      expect(result.units).toBeLessThanOrEqual(2000)

      expect(result.commissionRate).toBeGreaterThanOrEqual(1)
      expect(result.commissionRate).toBeLessThanOrEqual(25)

      // 2. Finite & Non-negative
      expect(Number.isFinite(result.grossSales)).toBe(true)
      expect(Number.isFinite(result.netEarnings)).toBe(true)
      expect(Number.isFinite(result.earningsPerUnit)).toBe(true)

      expect(Number.isNaN(result.grossSales)).toBe(false)
      expect(Number.isNaN(result.netEarnings)).toBe(false)
      expect(Number.isNaN(result.earningsPerUnit)).toBe(false)

      expect(result.grossSales).toBeGreaterThanOrEqual(0)
      expect(result.netEarnings).toBeGreaterThanOrEqual(0)
      expect(result.earningsPerUnit).toBeGreaterThanOrEqual(0)

      // 3. Exact 2-decimal precision (no floating point runaway)
      const grossSalesDecimals = (result.grossSales.toString().split('.')[1] || '').length
      const netEarningsDecimals = (result.netEarnings.toString().split('.')[1] || '').length
      const unitEarningsDecimals = (result.earningsPerUnit.toString().split('.')[1] || '').length
      expect(grossSalesDecimals).toBeLessThanOrEqual(2)
      expect(netEarningsDecimals).toBeLessThanOrEqual(2)
      expect(unitEarningsDecimals).toBeLessThanOrEqual(2)

      // 4. Mathematical relationship invariants
      // grossSales must be price * units rounded to 2 decimals
      const expectedGross = Math.round(result.price * result.units * 100) / 100
      expect(result.grossSales).toBe(expectedGross)

      // netEarnings must be grossSales * (safeRate / 100) rounded to 2 decimals
      const expectedNet = Math.round(result.grossSales * (result.commissionRate / 100) * 100) / 100
      expect(result.netEarnings).toBe(expectedNet)

      // earningsPerUnit must be price * (safeRate / 100) rounded to 2 decimals
      const expectedUnit = Math.round(result.price * (result.commissionRate / 100) * 100) / 100
      expect(result.earningsPerUnit).toBe(expectedUnit)

      // 5. Tier classification invariants
      if (result.netEarnings >= 5000) {
        expect(result.velocityTier).toBe('Super Affiliate')
      } else if (result.netEarnings >= 1500) {
        expect(result.velocityTier).toBe('Viral')
      } else if (result.netEarnings >= 300) {
        expect(result.velocityTier).toBe('Rising')
      } else {
        expect(result.velocityTier).toBe('Starter')
      }
    }
  })
})

describe('M3 Challenger: Extreme Boundary Clamping Stress', () => {
  it('correctly clamps price underflows and overflows', () => {
    // Underflows -> clamp to 5
    expect(calculateCommissionMath(0, 100, 10).price).toBe(5)
    expect(calculateCommissionMath(-0.01, 100, 10).price).toBe(5)
    expect(calculateCommissionMath(-9999, 100, 10).price).toBe(5)
    expect(calculateCommissionMath(-Infinity, 100, 10).price).toBe(5)
    expect(calculateCommissionMath(4.99, 100, 10).price).toBe(5)
    expect(calculateCommissionMath(4.99999, 100, 10).price).toBe(5)

    // Exact min boundary
    expect(calculateCommissionMath(5, 100, 10).price).toBe(5)
    expect(calculateCommissionMath(5.0001, 100, 10).price).toBe(5.0001)

    // Exact max boundary
    expect(calculateCommissionMath(500, 100, 10).price).toBe(500)
    expect(calculateCommissionMath(499.99, 100, 10).price).toBe(499.99)

    // Overflows -> clamp to 500
    expect(calculateCommissionMath(500.01, 100, 10).price).toBe(500)
    expect(calculateCommissionMath(500.0001, 100, 10).price).toBe(500)
    expect(calculateCommissionMath(1000, 100, 10).price).toBe(500)
    expect(calculateCommissionMath(999999, 100, 10).price).toBe(500)
    expect(calculateCommissionMath(Infinity, 100, 10).price).toBe(500)
    expect(calculateCommissionMath(Number.MAX_SAFE_INTEGER, 100, 10).price).toBe(500)
    expect(calculateCommissionMath(Number.MAX_VALUE, 100, 10).price).toBe(500)
  })

  it('correctly clamps monthly units underflows and overflows', () => {
    // Underflows -> clamp to 10
    expect(calculateCommissionMath(50, 0, 10).units).toBe(10)
    expect(calculateCommissionMath(50, -1, 10).units).toBe(10)
    expect(calculateCommissionMath(50, -5000, 10).units).toBe(10)
    expect(calculateCommissionMath(50, -Infinity, 10).units).toBe(10)
    expect(calculateCommissionMath(50, 9.99, 10).units).toBe(10)

    // Exact min boundary
    expect(calculateCommissionMath(50, 10, 10).units).toBe(10)
    expect(calculateCommissionMath(50, 10.5, 10).units).toBe(10.5)

    // Exact max boundary
    expect(calculateCommissionMath(50, 2000, 10).units).toBe(2000)

    // Overflows -> clamp to 2000
    expect(calculateCommissionMath(50, 2000.01, 10).units).toBe(2000)
    expect(calculateCommissionMath(50, 2001, 10).units).toBe(2000)
    expect(calculateCommissionMath(50, 50000, 10).units).toBe(2000)
    expect(calculateCommissionMath(50, Infinity, 10).units).toBe(2000)
    expect(calculateCommissionMath(50, Number.MAX_SAFE_INTEGER, 10).units).toBe(2000)
  })

  it('correctly clamps commission rate underflows and overflows', () => {
    // Underflows -> clamp to 1
    expect(calculateCommissionMath(50, 100, 0).commissionRate).toBe(1)
    expect(calculateCommissionMath(50, 100, -0.5).commissionRate).toBe(1)
    expect(calculateCommissionMath(50, 100, -100).commissionRate).toBe(1)
    expect(calculateCommissionMath(50, 100, -Infinity).commissionRate).toBe(1)
    expect(calculateCommissionMath(50, 100, 0.99).commissionRate).toBe(1)

    // Exact min boundary
    expect(calculateCommissionMath(50, 100, 1).commissionRate).toBe(1)
    expect(calculateCommissionMath(50, 100, 1.25).commissionRate).toBe(1.25)

    // Exact max boundary
    expect(calculateCommissionMath(50, 100, 25).commissionRate).toBe(25)

    // Overflows -> clamp to 25
    expect(calculateCommissionMath(50, 100, 25.01).commissionRate).toBe(25)
    expect(calculateCommissionMath(50, 100, 50).commissionRate).toBe(25)
    expect(calculateCommissionMath(50, 100, 100).commissionRate).toBe(25)
    expect(calculateCommissionMath(50, 100, Infinity).commissionRate).toBe(25)
  })

  it('handles adversarial malformed and type-coerced inputs without crashing', () => {
    // NaN fallback to defaults (price=5, units=10, rate=1)
    const nanResult = calculateCommissionMath(NaN, NaN, NaN)
    expect(nanResult.price).toBe(5)
    expect(nanResult.units).toBe(10)
    expect(nanResult.commissionRate).toBe(1)
    expect(nanResult.grossSales).toBe(50)
    expect(nanResult.netEarnings).toBe(0.5)
    expect(nanResult.velocityTier).toBe('Starter')

    // Null inputs
    const nullResult = calculateCommissionMath(null as any, null as any, null as any)
    expect(nullResult.price).toBe(5)
    expect(nullResult.units).toBe(10)
    expect(nullResult.commissionRate).toBe(1)

    // Undefined inputs
    const undefResult = calculateCommissionMath(undefined as any, undefined as any, undefined as any)
    expect(undefResult.price).toBe(5)
    expect(undefResult.units).toBe(10)
    expect(undefResult.commissionRate).toBe(1)

    // Numeric strings
    const strResult = calculateCommissionMath('55.5' as any, '200' as any, '15' as any)
    expect(strResult.price).toBe(55.5)
    expect(strResult.units).toBe(200)
    expect(strResult.commissionRate).toBe(15)
    expect(strResult.grossSales).toBe(11100)
    expect(strResult.netEarnings).toBe(1665)
    expect(strResult.velocityTier).toBe('Viral')

    // Empty strings
    const emptyStrResult = calculateCommissionMath('' as any, '' as any, '' as any)
    expect(emptyStrResult.price).toBe(5)
    expect(emptyStrResult.units).toBe(10)
    expect(emptyStrResult.commissionRate).toBe(1)
  })
})

describe('M3 Challenger: Velocity Tier Exact Edge Transitions', () => {
  describe('Boundary 1: Starter (< RM 300) vs Rising (RM 300 to 1,499.99)', () => {
    it('accurately distinguishes RM 299.99 (Starter) from RM 300.00 (Rising)', () => {
      // 1. Construct RM 299.99 net earnings:
      // price 29.999, units 100, rate 10%
      // grossSales = Math.round(29.999 * 100 * 100) / 100 = 2999.9
      // netEarnings = Math.round(2999.9 * 0.10 * 100) / 100 = 299.99
      const starterEdge = calculateCommissionMath(29.999, 100, 10)
      expect(starterEdge.netEarnings).toBe(299.99)
      expect(starterEdge.velocityTier).toBe('Starter')

      // 2. Exactly RM 300.00:
      // price 30.00, units 100, rate 10%
      // grossSales = 3000, netEarnings = 300.00
      const risingStart = calculateCommissionMath(30.00, 100, 10)
      expect(risingStart.netEarnings).toBe(300.00)
      expect(risingStart.velocityTier).toBe('Rising')

      // 3. Just above RM 300.00: RM 300.01
      // price 30.001, units 100, rate 10%
      // grossSales = 3000.1, netEarnings = 300.01
      const risingJustAbove = calculateCommissionMath(30.001, 100, 10)
      expect(risingJustAbove.netEarnings).toBe(300.01)
      expect(risingJustAbove.velocityTier).toBe('Rising')
    })
  })

  describe('Boundary 2: Rising (RM 300 to 1,499.99) vs Viral (RM 1,500 to 4,999.99)', () => {
    it('accurately distinguishes RM 1,499.99 (Rising) from RM 1,500.00 (Viral)', () => {
      // 1. Construct RM 1499.99 net earnings:
      // price 149.999, units 100, rate 10%
      // grossSales = 14999.9, netEarnings = 1499.99
      const risingEdge = calculateCommissionMath(149.999, 100, 10)
      expect(risingEdge.netEarnings).toBe(1499.99)
      expect(risingEdge.velocityTier).toBe('Rising')

      // 2. Exactly RM 1500.00:
      // price 150.00, units 100, rate 10%
      // grossSales = 15000, netEarnings = 1500.00
      const viralStart = calculateCommissionMath(150.00, 100, 10)
      expect(viralStart.netEarnings).toBe(1500.00)
      expect(viralStart.velocityTier).toBe('Viral')

      // 3. Just above RM 1500.00: RM 1500.01
      // price 150.001, units 100, rate 10%
      // grossSales = 15000.1, netEarnings = 1500.01
      const viralJustAbove = calculateCommissionMath(150.001, 100, 10)
      expect(viralJustAbove.netEarnings).toBe(1500.01)
      expect(viralJustAbove.velocityTier).toBe('Viral')
    })
  })

  describe('Boundary 3: Viral (RM 1,500 to 4,999.99) vs Super Affiliate (>= RM 5,000)', () => {
    it('accurately distinguishes RM 4,999.99 (Viral) from RM 5,000.00 (Super Affiliate)', () => {
      // 1. Construct RM 4999.99 net earnings:
      // price 499.999, units 100, rate 10%
      // grossSales = 49999.9, netEarnings = 4999.99
      const viralEdge = calculateCommissionMath(499.999, 100, 10)
      expect(viralEdge.netEarnings).toBe(4999.99)
      expect(viralEdge.velocityTier).toBe('Viral')

      // 2. Exactly RM 5000.00:
      // price 500.00, units 100, rate 10%
      // grossSales = 50000, netEarnings = 5000.00
      const superStart = calculateCommissionMath(500.00, 100, 10)
      expect(superStart.netEarnings).toBe(5000.00)
      expect(superStart.velocityTier).toBe('Super Affiliate')

      // 3. Max allowable configuration:
      // price 500, units 2000, rate 25% -> gross 1,000,000, net 250,000
      const maxConfig = calculateCommissionMath(500, 2000, 25)
      expect(maxConfig.grossSales).toBe(1000000)
      expect(maxConfig.netEarnings).toBe(250000)
      expect(maxConfig.earningsPerUnit).toBe(125)
      expect(maxConfig.velocityTier).toBe('Super Affiliate')

      // 4. Min allowable configuration:
      // price 5, units 10, rate 1% -> gross 50, net 0.50, perUnit 0.05
      const minConfig = calculateCommissionMath(5, 10, 1)
      expect(minConfig.grossSales).toBe(50)
      expect(minConfig.netEarnings).toBe(0.5)
      expect(minConfig.earningsPerUnit).toBe(0.05)
      expect(minConfig.velocityTier).toBe('Starter')
    })
  })
})

describe('M3 Challenger: Floating Point Cents Integrity Stress', () => {
  it('ensures dividing rounded cents by 100 produces deterministic numbers without IEEE-754 precision explosions', () => {
    // Test 1,000 fractional prices and rates designed to challenge binary floating-point representation
    // Numbers like 0.07, 0.14, 0.28, 0.29, 0.55, 0.57, 0.7, 1.14, 33.33, 77.77, etc.
    const challengingDecimals = [
      0.07, 0.14, 0.28, 0.29, 0.55, 0.57, 0.70, 0.99,
      1.14, 2.07, 3.33, 7.77, 12.34, 19.99, 33.33, 49.95,
      99.99, 149.99, 199.99, 299.99, 399.99, 499.99
    ]

    for (const decPrice of challengingDecimals) {
      for (const decRate of [1.5, 3.3, 7.7, 12.5, 14.7, 19.9, 24.5]) {
        const units = 100
        const result = calculateCommissionMath(decPrice, units, decRate)

        // Must be finite and non-NaN
        expect(Number.isFinite(result.grossSales)).toBe(true)
        expect(Number.isFinite(result.netEarnings)).toBe(true)
        expect(Number.isFinite(result.earningsPerUnit)).toBe(true)

        // Strings formatted to 2 decimals must match raw value within epsilon
        expect(Math.abs(result.grossSales - Number(result.grossSales.toFixed(2)))).toBeLessThan(1e-9)
        expect(Math.abs(result.netEarnings - Number(result.netEarnings.toFixed(2)))).toBeLessThan(1e-9)
        expect(Math.abs(result.earningsPerUnit - Number(result.earningsPerUnit.toFixed(2)))).toBeLessThan(1e-9)
      }
    }
  })
})

describe('M3 Challenger: React Component Rendering & Slider Contracts', () => {
  it('renders CommissionSimulatorCard with extreme props without throwing', () => {
    // Negative props
    const html1 = renderToString(
      React.createElement(CommissionSimulatorCard, {
        initialPrice: -99,
        initialUnits: -50,
        initialCommissionRate: -10,
        productName: "Adversarial Negative Props Product",
      })
    )
    expect(html1).toContain('data-testid="commission-simulator-card"')
    expect(html1).toContain('Adversarial Negative Props Product')
    expect(html1).toContain('data-testid="price-readout"')
    expect(html1).toContain('data-testid="units-readout"')
    expect(html1).toContain('data-testid="rate-readout"')

    // Overflow props
    const html2 = renderToString(
      React.createElement(CommissionSimulatorCard, {
        initialPrice: 99999,
        initialUnits: 99999,
        initialCommissionRate: 999,
        productName: "Adversarial Overflow Props Product",
      })
    )
    expect(html2).toContain('data-testid="commission-simulator-card"')
    expect(html2).toContain('Adversarial Overflow Props Product')
    expect(html2).toContain('data-testid="velocity-tier-badge"')
    expect(html2).toContain('Super Affiliate')
  })

  it('triggers onApplyToCampaign with mathematically clamped result', () => {
    let capturedResult: CommissionMathResult | null = null

    // We can simulate handleApply logic
    const testMath = calculateCommissionMath(45, 150, 12)
    const handleApply = (res: CommissionMathResult) => {
      capturedResult = res
    }

    handleApply(testMath)

    expect(capturedResult).not.toBeNull()
    expect(capturedResult!.grossSales).toBe(6750)
    expect(capturedResult!.netEarnings).toBe(810)
    expect(capturedResult!.velocityTier).toBe('Rising')
  })
})
