# Product Requirements Document (PRD)

# TheViralFindsMY — AI-Powered Multi-Platform Affiliate Manager

**Version:** 8.1  
**Date:** June 2025  
**Status:** Production (v8.0) — Improvements Planned
**Author:** TheViralFindsMY Team  
**Market:** Malaysia (Primary)  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Target Users](#3-target-users)
4. [Product Vision & Goals](#4-product-vision--goals)
5. [Feature Specifications](#5-feature-specifications)
   - 5.1 [Dashboard & Analytics](#51-dashboard--analytics)
   - 5.2 [Product Discovery & Affiliate Links](#52-product-discovery--affiliate-links)
   - 5.3 [Social Media Auto-Post](#53-social-media-auto-post)
   - 5.4 [AI Content Generator](#54-ai-content-generator)
   - 5.5 [Trend & Competitor Spy](#55-trend--competitor-spy)
   - 5.6 [Profit Optimizer](#56-profit-optimizer)
   - 5.7 [Content Studio (Mobile Creator)](#57-content-studio-mobile-creator)
   - 5.8 [HERMES AI Hub](#58-hermes-ai-hub)
   - 5.9 [Earnings & Payouts](#59-earnings--payouts)
   - 5.10 [Gamification System](#510-gamification-system)
6. [Technical Architecture](#6-technical-architecture)
7. [Data Models](#7-data-models)
8. [API Specifications](#8-api-specifications)
9. [Shopee Integration](#9-shopee-integration)
10. [HERMES AI Agent](#10-hermes-ai-agent)
11. [Non-Functional Requirements](#11-non-functional-requirements)
12. [Malaysian Market Requirements](#12-malaysian-market-requirements)
13. [Success Metrics](#13-success-metrics)
14. [Roadmap](#14-roadmap)
15. [Competitive Analysis](#15-competitive-analysis)
16. [Improvement Specifications](#16-improvement-specifications)
17. [Monetization Strategy](#17-monetization-strategy)
18. [Appendix](#18-appendix)

---

## 1. Executive Summary

### Product Overview

**TheViralFindsMY** is a comprehensive, AI-powered Shopee Affiliate management platform designed specifically for the Malaysian market. It provides affiliates with a unified dashboard to discover products, generate content, schedule social media posts, track earnings, and leverage AI intelligence — all optimized for Malaysian consumer behavior and the Shopee ecosystem.

### Key Value Propositions

| # | Value | Description |
|---|-------|-------------|
| 1 | **Discover & Score** | AI-powered product discovery with profitability scoring (0-100) to identify the best products to promote |
| 2 | **Create & Automate** | Generate marketing content in Manglish/Bahasa/English, schedule social media posts at optimal times |
| 3 | **Track & Optimize** | Real-time analytics, conversion tracking, commission monitoring, and AI-driven insights |
| 4 | **HERMES Intelligence** | Conversational AI assistant with skills, task automation, and persistent memory |
| 5 | **Malaysian-First** | Every feature tuned for Malaysian market — currency, language, peak times, seasonal events, Shopee-specific features |

### Business Model

The platform serves as a **productivity tool** for Shopee affiliates. Revenue generation depends on the affiliate's:

- Product selection strategy (high commission vs. high volume)
- Content quality and consistency
- Platform presence (TikTok, Shopee Live, Instagram, Facebook)
- Audience engagement and trust

> **Important Disclaimer:** This is a tool that empowers affiliates — it is not a money-making machine. Realistic earnings depend on effort, strategy, and market conditions.

---

## 2. Problem Statement

### Current Pain Points for Malaysian Shopee Affiliates

| # | Pain Point | Impact |
|---|-----------|--------|
| 1 | **Manual product research** — No systematic way to find high-commission products | Wastes 3-5 hours daily; misses Commission XTRA opportunities |
| 2 | **Content creation bottleneck** — Writing captions, scripts in multiple languages is time-consuming | Limits posting frequency; inconsistent quality |
| 3 | **No scheduling intelligence** — Posting at random times misses peak engagement windows | 30-50% lower engagement than optimized timing |
| 4 | **Scattered analytics** — Shopee dashboard + social media analytics are separate | No unified view of performance |
| 5 | **No competitor intelligence** — Blind to what top affiliates are promoting | Misses trend windows; reactive instead of proactive |
| 6 | **Commission optimization gaps** — Not tracking Commission XTRA products | Leaves 40-50% extra commission on the table |
| 7 | **Language barriers** — Need content in Manglish, Bahasa, and English | Limits audience reach; non-native content feels inauthentic |
| 8 | **No AI assistance** — Everything done manually | Slow decision-making; can't scale |

### Market Opportunity

- **Shopee Malaysia** is the #1 e-commerce platform with 50M+ monthly visits
- **Shopee Affiliate Program** has 100,000+ registered affiliates in Malaysia
- **Top affiliates** earn RM50,000-RM500,000+ per month
- **Average active affiliate** earns RM2,000-RM5,000/month
- **Commission XTRA** periods offer 2-5x normal commission rates
- **TikTok + Shopee** integration drives the highest conversion rates in Southeast Asia

---

## 3. Target Users

### Primary Persona: Malaysian Shopee Affiliate

| Attribute | Details |
|-----------|---------|
| **Name** | Aina, 27 |
| **Location** | Kuala Lumpur, Malaysia |
| **Occupation** | Full-time content creator / part-time affiliate |
| **Platforms** | TikTok (50K followers), Instagram (20K), Shopee Live |
| **Current Earnings** | RM3,000-5,000/month from affiliate commissions |
| **Pain Points** | Spends too much time on product research, struggles with content in multiple languages, posts at suboptimal times |
| **Goals** | Reach RM10,000/month, automate repetitive tasks, discover trending products before competitors |

### Secondary Persona: Aspiring Affiliate

| Attribute | Details |
|-----------|---------|
| **Name** | Hafiz, 22 |
| **Location** | Johor Bahru, Malaysia |
| **Occupation** | University student |
| **Platforms** | TikTok (5K followers), starting Instagram |
| **Current Earnings** | RM200-500/month |
| **Pain Points** | Doesn't know which products to promote, no content creation skills, limited time |
| **Goals** | Build affiliate income stream, learn strategies from top affiliates, use AI to compensate for lack of experience |

### Tertiary Persona: Power Affiliate

| Attribute | Details |
|-----------|---------|
| **Name** | Sabrina, 35 |
| **Location** | Penang, Malaysia |
| **Occupation** | Full-time affiliate marketer |
| **Platforms** | TikTok (500K+), Shopee Live, Instagram, YouTube |
| **Current Earnings** | RM50,000+/month |
| **Pain Points** | Managing multiple platforms is chaotic, needs team-level analytics, wants AI automation for scale |
| **Goals** | Scale to RM100K+/month, automate 80% of content creation, get real-time trend alerts |

---

## 4. Product Vision & Goals

### Vision Statement

> To be the definitive AI-powered platform that empowers every Malaysian Shopee affiliate — from beginners to power users — to discover, promote, and earn with intelligent automation, multilingual content, and data-driven insights.

### Product Goals

| # | Goal | Metric | Target |
|---|------|--------|--------|
| G1 | **Reduce product research time** | Time from search → link generation | < 30 seconds |
| G2 | **Increase content output** | Posts per week | 3x improvement |
| G3 | **Improve posting effectiveness** | Engagement rate at optimal times | +40% vs. random timing |
| G4 | **Maximize commission earnings** | Commission XTRA products found | 10+ per week |
| G5 | **Provide actionable insights** | AI insights acted upon | 50%+ action rate |
| G6 | **Enable multilingual content** | Languages supported | 3 (EN, BM, Manglish) |

### Design Principles

1. **Demo-First:** The app must be fully functional without any external API keys or accounts
2. **Malaysian-First:** All defaults, currencies, times, and content are Malaysian-market specific
3. **AI-Assisted, Human-Controlled:** AI suggests, humans decide — no autonomous financial actions
4. **Graceful Degradation:** Every feature has algorithmic fallback when AI services are unavailable
5. **Mobile-Responsive:** Full functionality on mobile devices (60%+ of Malaysian users)
6. **Real Data When Available:** Seamless switch between mock and real Shopee API data

---

## 5. Feature Specifications

### 5.1 Dashboard & Analytics

#### 5.1.1 Dashboard Page

**Purpose:** Provide an at-a-glance view of affiliate performance and quick access to key actions.

**User Stories:**
- As an affiliate, I want to see my total clicks, conversions, earnings, and conversion rate at a glance so I can quickly assess my performance
- As an affiliate, I want to see 30-day trend comparisons so I know if I'm improving
- As an affiliate, I want to see my recent activity so I can spot opportunities
- As an affiliate, I want to see my top-performing products so I can double down on what works

**Functional Requirements:**

| ID | Requirement | Priority |
|----|------------|----------|
| D-01 | Display 4 stats cards: Total Clicks, Total Conversions, Total Earnings (RM), Conversion Rate | Must |
| D-02 | Each stats card shows 30-day vs prior 30-day trend (up/down arrow + percentage) | Must |
| D-03 | Display recent activity feed (last 10 events: clicks, conversions, new links) | Must |
| D-04 | Display top 5 products by earnings with mini sparkline charts | Should |
| D-05 | Quick action buttons: Generate Link, Create Campaign, Post to Social | Should |
| D-06 | Show Shopee connection status indicator (Live/Demo) | Must |
| D-07 | Show HERMES AI connection status | Should |
| D-08 | Auto-refresh data every 60 seconds | Could |

**Data Flow:**
```
Dashboard Page → GET /api/dashboard → 
  ┌─ Query AffiliateLink (clicks, conversions, earnings aggregates)
  ├─ Query Conversion (recent orders)
  └─ Calculate 30-day trends
  → Return DashboardStats
```

**Fallback Behavior:** When no data exists, return realistic demo data with Malaysian market examples.

---

#### 5.1.2 Analytics Page

**Purpose:** Deep-dive performance analysis with customizable time periods and breakdowns.

**User Stories:**
- As an affiliate, I want to see clicks and conversions over time (7/30/90 days) so I can identify trends
- As an affiliate, I want to see which countries my clicks come from so I can target effectively
- As an affiliate, I want to see device breakdowns so I can optimize for mobile vs desktop
- As an affiliate, I want to see category performance so I know which niches to focus on

**Functional Requirements:**

| ID | Requirement | Priority |
|----|------------|----------|
| A-01 | Time period selector: 7 days, 30 days, 90 days | Must |
| A-02 | Line/area chart: Clicks and conversions over time (daily granularity) | Must |
| A-03 | Pie/donut chart: Clicks by country | Must |
| A-04 | Bar chart: Clicks by device (Desktop, Mobile, Tablet) | Must |
| A-05 | Horizontal bar chart: Clicks by product category | Should |
| A-06 | Conversion funnel visualization: Clicks → Conversions → Earnings | Should |
| A-07 | Export analytics data as CSV | Could |
| A-08 | Compare two time periods side-by-side | Could |

---

### 5.2 Product Discovery & Affiliate Links

#### 5.2.1 Products Page

**Purpose:** Search and discover Shopee products to promote as an affiliate.

**User Stories:**
- As an affiliate, I want to search for products by keyword so I can find items to promote
- As an affiliate, I want to see commission rates before promoting so I can choose profitable products
- As an affiliate, I want to generate an affiliate link with one click so I can start promoting immediately
- As an affiliate, I want to filter by category, price, and commission rate so I can find the best opportunities

**Functional Requirements:**

| ID | Requirement | Priority |
|----|------------|----------|
| P-01 | Search input with debounce (300ms) for product keyword search | Must |
| P-02 | Display product cards: image, name, price (RM), commission rate, shop name | Must |
| P-03 | One-click "Generate Link" button on each product card | Must |
| P-04 | Category filter dropdown | Should |
| P-05 | Price range filter (min/max) | Should |
| P-06 | Sort by: commission rate, price, popularity | Should |
| P-07 | Demo/Live data source badge on each product | Must |
| P-08 | Pagination or infinite scroll for results | Must |
| P-09 | Quick-view product details in modal/dialog | Could |
| P-10 | Add product to watchlist for monitoring | Could |

**Search Flow:**
```
User types keyword → Debounce 300ms → GET /api/shopee/products?q=keyword
  ┌─ If Shopee API connected: ShopeeGraphQLClient.searchProducts()
  └─ Else: ShopeeMockService.searchProducts()
  → Display results with source badge
```

---

#### 5.2.2 Affiliate Links Page

**Purpose:** Manage, track, and organize all generated affiliate links.

**User Stories:**
- As an affiliate, I want to see all my affiliate links in one place so I can manage them
- As an affiliate, I want to see click counts and conversion rates per link so I know what's working
- As an affiliate, I want to pause or expire links so I can control what's active
- As an affiliate, I want to organize links into campaigns so I can track campaign performance

**Functional Requirements:**

| ID | Requirement | Priority |
|----|------------|----------|
| L-01 | Table view of all links: name, short code, clicks, conversions, earnings, status | Must |
| L-02 | Create new link form: product URL, name, campaign, tags | Must |
| L-03 | Copy affiliate URL to clipboard with one click | Must |
| L-04 | Status management: Active, Paused, Expired | Must |
| L-05 | Filter by status, category, campaign | Should |
| L-06 | Search links by name or product | Should |
| L-07 | Click-through to detailed click analytics | Should |
| L-08 | Bulk actions: pause multiple, add to campaign | Could |
| L-09 | QR code generation for affiliate links | Could |

---

### 5.3 Social Media Auto-Post

**Purpose:** Schedule social media posts at optimal times with AI-generated content for Malaysian audiences.

**User Stories:**
- As an affiliate, I want to schedule posts across multiple platforms (TikTok, IG, FB, YouTube Shorts, Twitter/X) so I can maintain a consistent posting schedule
- As an affiliate, I want AI to generate captions in Manglish/Bahasa/English so I can reach diverse audiences
- As an affiliate, I want the system to auto-insert affiliate links into my posts so I don't forget
- As an affiliate, I want AI to suggest the best times to post so I get maximum engagement
- As an affiliate, I want to see an engagement heatmap so I understand Malaysian browsing patterns

**Functional Requirements:**

| ID | Requirement | Priority |
|----|------------|----------|
| AP-01 | Create scheduled post form: caption, platforms (multi-select), image, scheduled time | Must |
| AP-02 | Platform selection: TikTok, Instagram, Facebook, YouTube Shorts, Twitter/X | Must |
| AP-03 | AI caption generation with language/tone selection (Manglish, BM, English) | Must |
| AP-04 | Auto-insert affiliate link from product URL | Must |
| AP-05 | AI-suggested posting times per platform (Malaysian peak hours) | Must |
| AP-06 | 24-hour engagement heatmap visualization | Should |
| AP-07 | Next 7-day suggested posting windows | Should |
| AP-08 | Hashtag suggestions per platform (#RacunShopee, #Budol, etc.) | Must |
| AP-09 | Scheduled posts list with status: scheduled, publishing, published, failed | Must |
| AP-10 | Edit/delete scheduled posts | Must |
| AP-11 | Post preview per platform (how it will look) | Could |
| AP-12 | Post analytics after publishing (clicks, engagement) | Could |
| AP-13 | Bulk schedule (multiple time slots for same content) | Could |

**Malaysian Peak Time Algorithm:**

The system uses a weighted scoring model based on Malaysian consumer behavior data:

```
Engagement Score = Base_Score × Time_Weight × Day_Weight × Platform_Weight

Where:
  Time_Weight:
    7-9 PM  = 1.0  (Golden Hour — after work browsing)
    12-2 PM = 0.8  (Lunch Rush — lunch break scrolling)
    9 PM-12 AM = 0.75 (Impulse Hour — late night shopping)
    6-8 AM  = 0.5  (Morning Commute)
    Other   = 0.3  (Off-peak)

  Day_Weight:
    Friday  = 1.0  (Payday weekend)
    Saturday = 0.9 (Weekend shopping)
    Sunday  = 0.85 (Weekend preparation)
    Wednesday = 0.7 (Mid-week browsing)
    Other   = 0.6

  Platform_Weight:
    TikTok:   Peak 7-9 PM, strong 12-2 PM
    Instagram: Peak 7-9 PM, strong 6-8 AM
    Facebook: Peak 12-2 PM, strong 7-9 PM
    YouTube:  Peak 9 PM-12 AM
    Twitter/X: Peak 8-10 AM, 12-2 PM
```

**Data Model:**
```
ScheduledPost {
  id: String
  caption: String
  platforms: JSON[] (e.g., ["tiktok", "instagram"])
  productUrl?: String
  affiliateLink?: String
  imageUrl?: String
  hashtags?: JSON[]
  status: "scheduled" | "publishing" | "published" | "failed"
  scheduledAt: DateTime
  publishedAt?: DateTime
  result?: JSON (platform-specific results)
}
```

---

### 5.4 AI Content Generator

**Purpose:** Generate marketing content in Malaysian languages and styles for various platforms.

**User Stories:**
- As an affiliate, I want to generate video scripts (Hook→Problem→Solution→CTA) so I can create structured content
- As an affiliate, I want to generate social media captions in Manglish so they feel authentic to Malaysian audiences
- As an affiliate, I want to generate hashtags (#RacunShopee, #Budol, #SkincareMalaysia) so my content gets discovered
- As an affiliate, I want to generate Shopee Live scripts so I can run engaging live sessions
- As an affiliate, I want to save generated content to a library so I can reuse and iterate

**Functional Requirements:**

| ID | Requirement | Priority |
|----|------------|----------|
| CG-01 | Content type selector: Caption, Script, Hashtags, Live Script, Review, Comparison | Must |
| CG-02 | Platform selector: TikTok, Instagram, Facebook, YouTube, Shopee Live | Must |
| CG-03 | Language selector: English, Bahasa Malaysia, Manglish | Must |
| CG-04 | Tone selector: Casual, Professional, Excited, Funny | Must |
| CG-05 | Product/niche input field for context-aware generation | Must |
| CG-06 | Generate button with loading state | Must |
| CG-07 | Generated content display with copy button | Must |
| CG-08 | Save to library button | Must |
| CG-09 | Content library with search, filter by type/platform/favorite | Must |
| CG-10 | 8 pre-built templates for quick content creation | Should |
| CG-11 | Edit generated content before saving | Should |
| CG-12 | Multi-variant generation (generate 3 options) | Could |
| CG-13 | A/B testing suggestions | Could |

**Content Generation Pipeline:**
```
User selects type + platform + language + tone + product
  → POST /api/content/generate
  → z-ai-web-dev-sdk LLM chat completion with system prompt:
      "You are a Malaysian affiliate marketing content expert..."
  → Parse AI response into structured format
  → Return to frontend
  → User can save to library: POST /api/content/library
```

**Template Specifications:**

| Template | Structure | Duration | Platform |
|----------|-----------|----------|----------|
| Before/After | Problem → Product → Application → Result → CTA | 30-45s | TikTok |
| Unboxing | Teaser → Unbox → Feature → Demo → CTA | 45-60s | TikTok |
| Demo/Review | Hook → Feature → Benefit → Demo → CTA | 30-60s | TikTok |
| Try-On Haul | Intro → Try-On → Rating → Best Pick → CTA | 45-60s | Instagram Reels |
| Live Script | Opening → Product Intro → Demo → Q&A → Flash Sale | 15-30min | Shopee Live |
| Product Comparison | Problem → Option A → Option B → Verdict → CTA | 30-60s | Facebook |
| Price Reveal | Hook → Build-up → Reveal → Justify → CTA | 15-30s | TikTok/IG |
| Problem-Solution | Pain → Agitate → Solution → Result → CTA | 30-45s | All |

**Manglish Content Guidelines:**

Generated Manglish content should follow these patterns:
- Use "lah", "lor", "meh", "kan" particles naturally
- Mix English and Bahasa naturally: "This one best gila!"
- Use Malaysian slang: "kaw", "gila", "power", "kompom"
- Include Shopee-specific terms: "budol", "racun", "add to cart"
- Price mentions always in RM: "Only RM19.90 je!"

---

### 5.5 Trend & Competitor Spy

**Purpose:** Monitor market trends, discover trending products, track competitors, and detect seasonal opportunities.

**User Stories:**
- As an affiliate, I want to discover trending products on Shopee so I can promote what's hot right now
- As an affiliate, I want to track trending keywords with volume data so I can optimize my content
- As an affiliate, I want to analyze top affiliates' strategies so I can learn from the best
- As an affiliate, I want alerts for seasonal shopping events (Raya, 11.11) so I can prepare campaigns in advance

**Functional Requirements:**

| ID | Requirement | Priority |
|----|------------|----------|
| TS-01 | Trending products tab with trend direction indicators (↑ rising, → stable, ↓ declining) | Must |
| TS-02 | Trending keywords tab with volume, competition, and trend data | Must |
| TS-03 | Competitor analysis tab with top affiliate profiles and strategies | Should |
| TS-04 | Seasonal calendar showing upcoming Malaysian shopping events | Should |
| TS-05 | Category filter for trending products | Must |
| TS-06 | 30-minute cache for trend data (refresh on demand) | Must |
| TS-07 | "Add to watchlist" for trending products | Could |
| TS-08 | Email/notification alerts for new trends | Could |
| TS-09 | Historical trend comparison (this week vs last week) | Could |
| TS-10 | Export trend data | Could |

**Trend Discovery Pipeline:**
```
User opens Trend Spy → GET /api/trends/discover
  → Check 30-min cache
  → If expired: z-ai-web-dev-sdk web search for "trending products Shopee Malaysia"
  → AI analysis of search results
  → Extract product names, categories, trend directions
  → Return structured trend data
  → Save to cache
```

**Seasonal Calendar Data:**

| Event | Date | Preparation Start | Peak Commission |
|-------|------|-------------------|----------------|
| Chinese New Year | Jan 25 - Feb 10 | Dec 15 | 2-3x base |
| Ramadan | Variable (30 days) | 2 weeks before | 3-5x base |
| Hari Raya Aidilfitri | End of Ramadan | Ramadan start | 5-8x base |
| 6.6 Sale | June 6 | May 20 | 2-3x base |
| 7.7 Sale | July 7 | June 20 | 2-3x base |
| 8.8 Sale | August 8 | July 20 | 2-3x base |
| 9.9 Sale | September 9 | Aug 20 | 2-4x base |
| 10.10 Sale | October 10 | Sep 20 | 2-4x base |
| 11.11 Sale | November 11 | Oct 20 | 3-5x base |
| 12.12 Sale | December 12 | Nov 20 | 3-5x base |
| Year-End Sale | Dec 15-31 | Dec 1 | 2-3x base |

---

### 5.6 Profit Optimizer

**Purpose:** Score products for profitability, find Commission XTRA opportunities, and project earnings.

**User Stories:**
- As an affiliate, I want to score any product for profitability (0-100) so I can prioritize what to promote
- As an affiliate, I want to find Commission XTRA products with extra commission bonuses so I can maximize my earnings
- As an affiliate, I want to project my earnings based on clicks and conversion rates so I can set realistic goals
- As an affiliate, I want to calculate break-even points so I know how much effort is needed

**Functional Requirements:**

| ID | Requirement | Priority |
|----|------------|----------|
| PO-01 | Product scoring engine with 6 factors (Commission 25%, Conversion 30%, AOV 20%, Competition 10%, Sales 10%, Trend 5%) | Must |
| PO-02 | Score display with level: HOT (80-100), GOOD (60-79), AVERAGE (40-59), SKIP (0-39) | Must |
| PO-03 | Commission XTRA product finder with category filter | Must |
| PO-04 | Sort Commission XTRA by: commission rate, XTRA bonus, total potential | Must |
| PO-05 | Earnings calculator with same-shop/different-shop modes | Must |
| PO-06 | Projected earnings: daily, monthly, yearly | Must |
| PO-07 | Break-even analysis: clicks needed to reach target | Should |
| PO-08 | Goal milestones: "At X clicks you earn RM Y" | Should |
| PO-09 | Product comparison (side-by-side scoring) | Could |
| PO-10 | Historical score tracking (improving/declining) | Could |

**Product Scoring Algorithm:**

```typescript
interface ProductScoreInput {
  commissionRate: number      // 0-100% → weight 25%
  conversionRate: number      // 0-100% → weight 30%
  averageOrderValue: number   // RM      → weight 20%
  competitionLevel: number    // 0-100 (lower = better) → weight 10%
  salesVolume: number         // units/month → weight 10%
  trendDirection: number      // -1 to 1 → weight 5%
}

function calculateScore(input: ProductScoreInput): number {
  const commission = normalize(input.commissionRate, 0, 50) * 25
  const conversion = normalize(input.conversionRate, 0, 15) * 30
  const aov = normalize(input.averageOrderValue, 0, 500) * 20
  const competition = (1 - normalize(input.competitionLevel, 0, 100)) * 10
  const sales = normalize(input.salesVolume, 0, 10000) * 10
  const trend = ((input.trendDirection + 1) / 2) * 5

  return Math.round(commission + conversion + aov + competition + sales + trend)
}

// Score levels:
// 80-100: HOT → "Promote this NOW!"
// 60-79:  GOOD → "Strong potential"
// 40-59:  AVERAGE → "Consider carefully"
// 0-39:   SKIP → "Not worth the effort"
```

**Commission XTRA Data:**

Commission XTRA is a Shopee program that offers additional commission on top of the base rate during promotional periods:

```
Effective Commission = Base_Commission_Rate × (1 + XTRA_Percentage)

Example:
  Base rate: 8%
  XTRA: 40%
  Effective: 8% × 1.4 = 11.2%
  
  On RM100 product:
    Normal commission: RM8.00
    With XTRA: RM11.20 (+RM3.20)
```

**Earnings Calculator:**

```
Same-Shop Model (higher commission):
  Commission = Order_Amount × (Base_Rate + XTRA_Rate)
  If customer buys multiple items from same shop: commission applies to entire order

Different-Shop Model:
  Commission = Item_Price × Base_Rate (per item)
  Each item calculated independently

Projection:
  Daily_Earnings = (Daily_Clicks × Conversion_Rate) × Avg_Commission
  Monthly_Earnings = Daily_Earnings × 30
  Yearly_Earnings = Daily_Earnings × 365

Break-Even:
  Clicks_Needed = Target_Earnings / (Conversion_Rate × Avg_Commission)
```

---

### 5.7 Content Studio (Mobile Creator)

**Purpose:** Create video content with script templates, TTS voiceover, and timed captions optimized for mobile-first creation.

**User Stories:**
- As an affiliate, I want to generate video scripts with timed scenes so I know exactly what to say and when
- As an affiliate, I want TTS voiceover in Bahasa Malaysia so I can create videos without speaking
- As an affiliate, I want timed captions (SRT format) for my videos so they're accessible and engaging
- As an affiliate, I want ready-made script templates so I can create content quickly

**Functional Requirements:**

| ID | Requirement | Priority |
|----|------------|----------|
| CS-01 | Script template selector: 8 templates (Before/After, Unboxing, Demo, Price Reveal, Comparison, Problem-Solution, Testimonial, Top 5) | Must |
| CS-02 | Product/niche input for script customization | Must |
| CS-03 | Language selector: English, Bahasa, Manglish | Must |
| CS-04 | Tone selector: Casual, Professional, Excited, Funny | Must |
| CS-05 | Generated script with timed scenes (start, end, narration, visual direction) | Must |
| CS-06 | TTS voiceover generation | Should |
| CS-07 | Timed caption generation (SRT + JSON formats) | Should |
| CS-08 | Copy/download script, captions, and audio | Must |
| CS-09 | Preview script as storyboard | Could |
| CS-10 | Multi-language script variants | Could |

**Video Script Template Structure:**

```typescript
interface VideoScript {
  template: string
  title: string
  totalDuration: number // seconds
  scenes: {
    order: number
    title: string
    startSecond: number
    endSecond: number
    narration: string
    visualDirection: string
    overlayText?: string
  }[]
  hashtags: string[]
  cta: string
}
```

**TTS Specifications:**

| Property | Value |
|----------|-------|
| Languages | Bahasa Malaysia, English |
| Format | Base64 audio (mp3/wav) |
| Speed | 0.5x - 2.0x (default 1.0x) |
| Fallback | Mock audio with duration estimate |
| Max Length | 5 minutes per generation |

**Caption Format (SRT):**

```srt
1
00:00:00,000 --> 00:00:03,000
Best skincare untuk kulit berminyak!

2
00:00:03,000 --> 00:00:07,000
Masalah jerawat? Ni dia solution dia!
```

**Caption Format (JSON):**

```json
[
  { "index": 1, "start": 0, "end": 3, "text": "Best skincare untuk kulit berminyak!" },
  { "index": 2, "start": 3, "end": 7, "text": "Masalah jerawat? Ni dia solution dia!" }
]
```

---

### 5.8 HERMES AI Hub

**Purpose:** Provide an intelligent AI assistant that helps affiliates with strategies, insights, task automation, and skill management.

**User Stories:**
- As an affiliate, I want to chat with an AI assistant about my affiliate strategy so I can get personalized advice
- As an affiliate, I want the AI to generate business insights from my data so I can make better decisions
- As an affiliate, I want to create and manage AI skills that automate repetitive tasks
- As an affiliate, I want to schedule automated tasks (e.g., daily trend check) so I don't miss opportunities
- As an affiliate, I want the AI to remember my preferences and conversations so I don't have to repeat myself

**Functional Requirements:**

| ID | Requirement | Priority |
|----|------------|----------|
| H-01 | Chat interface with message history | Must |
| H-02 | New conversation creation | Must |
| H-03 | Conversation list with titles and message counts | Must |
| H-04 | AI insights tab with severity levels (info, warning, critical) | Must |
| H-05 | Skills management: create, activate, deactivate, archive | Must |
| H-06 | Task scheduler with cron expressions | Should |
| H-07 | Task execution log with last result | Should |
| H-08 | Memory browser: view and delete agent memories | Should |
| H-09 | Connection management: configure and test AI backend | Must |
| H-10 | Pre-built skills: Product Analyzer, Content Writer, Trend Monitor, Competitor Spy, Commission Finder | Should |
| H-11 | Typing indicator during AI response generation | Must |
| H-12 | Copy message content to clipboard | Must |
| H-13 | Clear conversation history | Should |
| H-14 | Export conversation as text | Could |
| H-15 | Voice input for chat messages | Could |

**HERMES Architecture:**

```
┌─────────────────────────────────────────────────────┐
│                   HERMES AI Hub                      │
├──────────┬──────────┬──────────┬────────────────────┤
│  Chat    │  Skills  │  Tasks   │    Insights         │
│  Engine  │  Engine  │  Engine  │    Engine           │
├──────────┴──────────┴──────────┴────────────────────┤
│                  z-ai-web-dev-sdk                     │
│            (LLM Chat Completions)                     │
├─────────────────────────────────────────────────────┤
│                   Prisma Database                    │
│  ┌────────────────┐  ┌────────────────┐             │
│  │ HermesConvo    │  │ HermesSkill    │             │
│  │ HermesMessage  │  │ HermesTask     │             │
│  │ AgentMemory    │  │ HermesInsight  │             │
│  └────────────────┘  └────────────────┘             │
└─────────────────────────────────────────────────────┘
```

**Insight Types:**

| Type | Example | Severity |
|------|---------|----------|
| Trend | "Skincare products trending +45% this week in Malaysia" | Info |
| Opportunity | "Commission XTRA active on beauty category: +40% until Sunday" | Info |
| Alert | "Your conversion rate dropped 30% this week — review your top links" | Warning |
| Recommendation | "Post more TikTok content 7-9 PM — your engagement is 3x higher during golden hour" | Info |

**Skill Schema:**

```typescript
interface HermesSkill {
  name: string
  description: string
  category: "analysis" | "content" | "automation" | "monitoring"
  code: string         // Skill logic/instructions
  trigger?: string     // Natural language trigger phrase
  status: "active" | "draft" | "archived" | "learning"
  usageCount: number
  successRate: number  // 0-100%
  version: number
}
```

**Task Schema:**

```typescript
interface HermesTask {
  name: string
  description?: string
  schedule?: string    // Cron expression
  skillId?: string     // Associated skill
  status: "scheduled" | "running" | "completed" | "failed"
  lastRunAt?: DateTime
  nextRunAt?: DateTime
  runCount: number
  lastResult?: string  // JSON
}
```

---

### 5.9 Earnings & Payouts

**Purpose:** Track all commission earnings, manage payouts, and set earning goals.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|------------|----------|
| E-01 | Earnings summary: Total, Pending, Confirmed, Paid amounts in RM | Must |
| E-02 | Daily earnings chart (line/area) with time range selector | Must |
| E-03 | Recent conversions list with order details and commission amounts | Must |
| E-04 | Payout history table with status tracking | Must |
| E-05 | Earning goals: create monthly/weekly/yearly targets | Should |
| E-06 | Goal progress visualization with percentage and amount | Should |
| E-07 | Commission breakdown by product category | Could |
| E-08 | Tax estimation calculator (Malaysian tax brackets) | Could |

---

### 5.10 Gamification System

**Purpose:** Motivate affiliates through achievements, competitive rankings, and referral tracking.

#### Achievements

| Category | Badges | Criteria |
|----------|--------|----------|
| Earnings | First RM1, RM100, RM1K, RM10K, RM100K | Cumulative earnings milestones |
| Clicks | 100, 1K, 10K, 100K Clicks | Cumulative click milestones |
| Conversions | First Sale, 10, 100, 1K Conversions | Cumulative conversion milestones |
| Streaks | 7-Day Post Streak, 30-Day Post Streak | Consecutive posting days |
| Platform | TikTok Star, IG Influencer, Live Pro | Platform-specific milestones |
| Social | First Referral, 10 Referrals, 100 Referrals | Referral milestones |

#### Leaderboard

| ID | Requirement | Priority |
|----|------------|----------|
| LB-01 | Period selector: Weekly, Monthly, All-Time | Must |
| LB-02 | Ranked list: Rank, Name, Earnings, Clicks, Conversions | Must |
| LB-03 | Highlight current user's position | Should |
| LB-04 | Top 3 special visual treatment (gold, silver, bronze) | Should |

#### Referrals

| ID | Requirement | Priority |
|----|------------|----------|
| RF-01 | Referral link generation | Must |
| RF-02 | Referral status tracking: Pending, Active, Converted | Must |
| RF-03 | Commission tracking for successful referrals | Must |
| RF-04 | Referral email invitation form | Could |

---

## 6. Technical Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                         │
│                                                                 │
│  React 19 + TypeScript 5                                        │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────────┐  │
│  │  Zustand   │ │ TanStack   │ │  Framer    │ │  shadcn/ui  │  │
│  │  Store     │ │  Query     │ │  Motion    │ │  (46 comps) │  │
│  │  (State)   │ │ (Server    │ │ (Animate)  │ │  (UI Kit)   │  │
│  │            │ │  State)    │ │            │ │             │  │
│  └────────────┘ └────────────┘ └────────────┘ └─────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Next.js 16 App Router                         │  │
│  │         (Client-side SPA via Zustand routing)              │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP (fetch)
┌────────────────────────────▼────────────────────────────────────┐
│                     Next.js 16 API Routes                       │
│                                                                 │
│  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌────────┐ ┌──────────┐  │
│  │ /shopee │ │ /hermes  │ │/trends │ │/content│ │ /profit  │  │
│  │ (8 rts) │ │ (6 rts)  │ │(3 rts) │ │(3 rts) │ │ (3 rts)  │  │
│  └────┬────┘ └────┬─────┘ └───┬────┘ └───┬────┘ └────┬─────┘  │
│       │           │           │          │           │          │
│  ┌────▼───────────▼───────────▼──────────▼───────────▼──────┐  │
│  │              z-ai-web-dev-sdk                              │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐   │  │
│  │  │ LLM Chat │ │Web Search│ │   TTS    │ │   Image    │   │  │
│  │  │Complete. │ │          │ │          │ │Generation  │   │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│       │                                                        │
│  ┌────▼─────────────────────────────────────────────────────┐  │
│  │              Prisma ORM (SQLite)                          │  │
│  │     18 Models | file:./db/custom.db                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │                                    │
    ┌────▼────┐                        ┌──────▼──────┐
    │ Shopee  │                        │   SQLite    │
    │ GraphQL │                        │  Database   │
    │   API   │                        │             │
    └─────────┘                        └─────────────┘
```

### Frontend Architecture

**Routing:** Single-page application using Zustand `activePage` state (not Next.js file-based routing)

```
page.tsx → AppContent()
  ├── AppSidebar (desktop navigation)
  ├── MobileSheet (mobile slide-out menu)
  ├── AppHeader (top bar)
  ├── <Suspense> → PageComponent (lazy-loaded)
  ├── MobileNav (bottom navigation)
  └── FAB (floating Hermes AI button)
```

**State Management:**

| Store | Purpose |
|-------|---------|
| Zustand `app-store` | UI state: activePage, sidebarOpen, shopeeConnected, hermesConnected |
| TanStack Query | Server state: API data with caching and auto-refresh |
| Local component state | Form inputs, modals, filters |

**Page Loading:**
- All 18 page components are lazy-loaded via `React.lazy()`
- Shared `<PageLoader>` skeleton component during loading
- Framer Motion for page transition animations

### Backend Architecture

**API Design:** RESTful API routes using Next.js App Router

**Pattern per route:**
```typescript
export async function GET(request: Request) {
  try {
    // 1. Parse query parameters
    // 2. Check cache (if applicable)
    // 3. Fetch from real API / database
    // 4. Fallback to mock/demo data if needed
    // 5. Return JSON response with source indicator
  } catch (error) {
    return Response.json({ error: 'Message' }, { status: 500 })
  }
}
```

**Caching Strategy:**

| Data Type | Cache TTL | Storage |
|-----------|-----------|---------|
| Shopee connection status | 5 minutes | In-memory |
| Trending products | 30 minutes | In-memory |
| Competitor analysis | 30 minutes | In-memory |
| Trending keywords | 30 minutes | In-memory |
| Dashboard/Analytics | No cache | Real-time |
| Earnings | No cache | Real-time |
| Content library | No cache | Database |

---

## 7. Data Models

### Complete Prisma Schema

```
┌──────────────────────────────────────────────────────────────┐
│                       PRISMA MODELS                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  User ◄─────────────── AffiliateLink ◄────── ClickRecord    │
│    │                      │                                  │
│    │                      └─── Conversion                    │
│    │                                                         │
│    └── Referral                                             │
│                                                              │
│  Campaign ◄──── AffiliateLink                               │
│  Payout          EarningGoal          Notification           │
│  AppSetting      Achievement          LeaderboardEntry       │
│                                                              │
│  ── HERMES ─────────────────────────────────────────────    │
│  HermesConnection ◄── HermesConversation ◄── HermesMessage  │
│  HermesSkill          HermesTask          HermesInsight      │
│  AgentMemory                                                │
│                                                              │
│  ── FEATURES ───────────────────────────────────────────    │
│  ScheduledPost          ContentLibrary                      │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                       ENUMS                                  │
│  LinkStatus: active | paused | expired                       │
│  CampaignStatus: active | paused | completed                 │
│  ConversionStatus: pending | confirmed | rejected | paid     │
│  PayoutStatus: pending | processing | completed | failed     │
│  GoalStatus: active | achieved | failed                      │
│  GoalPeriod: monthly | weekly | yearly | custom              │
│  UserRole: admin | affiliate | viewer                        │
│  HermesSkillStatus: active | draft | archived | learning    │
└──────────────────────────────────────────────────────────────┘
```

### Key Model Details

#### AffiliateLink

| Field | Type | Description |
|-------|------|-------------|
| id | String @cuid | Unique identifier |
| name | String | Display name |
| productUrl | String | Original Shopee product URL |
| affiliateUrl | String | Generated affiliate tracking URL |
| productId | String? | Shopee product ID |
| productName | String? | Product name |
| productImage | String? | Product thumbnail URL |
| productPrice | Decimal? | Product price in RM |
| commission | Decimal? | Estimated commission per sale |
| commissionRate | Decimal? | Commission percentage |
| category | String? | Product category |
| clicks | Int | Total click count |
| conversions | Int | Total conversion count |
| earnings | Decimal | Total earnings in RM |
| ctr | Decimal? | Click-through rate |
| status | LinkStatus | active / paused / expired |
| shortCode | String @unique | Unique short URL code |
| tags | String? | JSON array of tags |

#### ScheduledPost

| Field | Type | Description |
|-------|------|-------------|
| id | String @cuid | Unique identifier |
| caption | String | Post caption/content |
| platforms | String | JSON array: ["tiktok","instagram"] |
| productUrl | String? | Shopee product URL |
| affiliateLink | String? | Auto-generated affiliate link |
| imageUrl | String? | Post image URL |
| hashtags | String? | JSON array of hashtags |
| status | String | scheduled / publishing / published / failed |
| scheduledAt | DateTime | When to publish |
| publishedAt | DateTime? | When actually published |
| result | String? | JSON with platform-specific results |

#### ContentLibrary

| Field | Type | Description |
|-------|------|-------------|
| id | String @cuid | Unique identifier |
| type | String | caption / script / hashtags / live_script / review / comparison |
| platform | String | tiktok / instagram / facebook / youtube / shopee_live |
| niche | String? | Product niche/category |
| product | String? | Product name |
| content | String | Generated content text |
| language | String | english / bahasa / manglish |
| tone | String | casual / professional / excited / funny |
| usageCount | Int | Times used |
| isFavorite | Boolean | User favorite flag |

---

## 8. API Specifications

### API Design Principles

1. **RESTful** — Standard HTTP methods (GET, POST, PATCH, DELETE)
2. **JSON** — All request/response bodies are JSON
3. **Error Format** — `{ error: string, details?: any }` with appropriate HTTP status codes
4. **Source Indicator** — Shopee API responses include `source: "graphql_api" | "mock"`
5. **Graceful Fallback** — Every endpoint has demo data fallback
6. **No Authentication** — Currently no auth required (single-user mode)

### Shopee API Routes

| Endpoint | Method | Parameters | Response |
|----------|--------|------------|----------|
| `/api/shopee/config` | GET | - | `{ appId: string (masked), region: string, connected: boolean }` |
| `/api/shopee/config` | POST | `{ appId, secret, region }` | `{ success: boolean, status: ShopeeConnectionStatus }` |
| `/api/shopee/config` | DELETE | - | `{ success: boolean }` |
| `/api/shopee/status` | GET | - | `{ connected: boolean, source: string, status: string, lastChecked: string }` |
| `/api/shopee/products` | GET | `q, category, priceMin, priceMax, sort, page, limit` | `{ products: ShopeeProduct[], total, source }` |
| `/api/shopee/commissions` | GET | `startDate, endDate, status, page, limit` | `{ orders: CommissionOrder[], summary, source }` |
| `/api/shopee/stats` | GET | `period, granularity` | `{ stats: ClickStats, source }` |
| `/api/shopee/generate-link` | POST | `{ productId?, productUrl? }` | `{ link: AffiliateLink, source }` |
| `/api/shopee/webhook` | POST | Shopee webhook payload | `{ received: boolean }` |

### HERMES API Routes

| Endpoint | Method | Parameters | Response |
|----------|--------|------------|----------|
| `/api/hermes/chat` | POST | `{ message, conversationId? }` | `{ response, conversationId, messageId }` |
| `/api/hermes/connection` | GET | - | `{ connected, status, endpoint }` |
| `/api/hermes/connection` | POST | `{ endpoint, apiKey?, model }` | `{ connected, status, error? }` |
| `/api/hermes/insights` | GET | `type, severity, unreadOnly` | `{ insights: HermesInsight[] }` |
| `/api/hermes/skills` | GET | `category, status, search` | `{ skills: HermesSkill[] }` |
| `/api/hermes/skills` | POST | `{ name, description, category, code, trigger }` | `{ skill: HermesSkill }` |
| `/api/hermes/tasks` | GET | `status` | `{ tasks: HermesTask[] }` |
| `/api/hermes/tasks` | POST | `{ name, description, schedule, skillId }` | `{ task: HermesTask }` |
| `/api/hermes/memory` | GET | `agentId, sessionId, search` | `{ memories: AgentMemory[] }` |
| `/api/hermes/memory` | DELETE | `{ agentId? }` | `{ deleted: number }` |

### Trend API Routes

| Endpoint | Method | Parameters | Response |
|----------|--------|------------|----------|
| `/api/trends/discover` | GET | `category` | `{ products: TrendingProduct[], cached, timestamp }` |
| `/api/trends/competitor` | GET | - | `{ competitors: CompetitorProfile[], strategies: Strategy[], cached }` |
| `/api/trends/keywords` | GET | - | `{ keywords: TrendKeyword[], seasonal: SeasonalKeyword[], cached }` |

### Content API Routes

| Endpoint | Method | Parameters | Response |
|----------|--------|------------|----------|
| `/api/content/generate` | POST | `{ type, platform, language, tone, product, niche }` | `{ content, metadata }` |
| `/api/content/templates` | GET | - | `{ templates: ContentTemplate[] }` |
| `/api/content/library` | GET | `type, platform, favorite, search, page, limit` | `{ items: ContentLibrary[], total }` |
| `/api/content/library` | POST | `{ type, platform, content, language, tone, product }` | `{ item: ContentLibrary }` |
| `/api/content/library` | PATCH | `{ id, isFavorite?, content? }` | `{ item: ContentLibrary }` |
| `/api/content/library` | DELETE | `{ id }` | `{ deleted: boolean }` |

### Auto-Post API Routes

| Endpoint | Method | Parameters | Response |
|----------|--------|------------|----------|
| `/api/autopost` | POST | `{ caption, platforms[], productUrl?, scheduledAt, hashtags[] }` | `{ post: ScheduledPost }` |
| `/api/autopost` | GET | `status, page, limit` | `{ posts: ScheduledPost[], total }` |
| `/api/autopost/suggest-times` | GET | `platform` | `{ suggestions: TimeSuggestion[], heatmap: HeatmapData }` |
| `/api/autopost/[id]` | PATCH | `{ caption?, scheduledAt?, status? }` | `{ post: ScheduledPost }` |
| `/api/autopost/[id]` | DELETE | - | `{ deleted: boolean }` |

### Studio API Routes

| Endpoint | Method | Parameters | Response |
|----------|--------|------------|----------|
| `/api/studio/script` | POST | `{ template, product, language, tone, duration? }` | `{ script: VideoScript }` |
| `/api/studio/caption` | POST | `{ text, duration, format }` | `{ srt: string, captions: Caption[] }` |
| `/api/studio/tts` | POST | `{ text, language, speed }` | `{ audio: string (base64), duration: number }` |

### Profit API Routes

| Endpoint | Method | Parameters | Response |
|----------|--------|------------|----------|
| `/api/profit/score` | POST | `{ commissionRate, conversionRate, aov, competition, sales, trend }` | `{ score, level, breakdown, projectedEarnings }` |
| `/api/profit/calculator` | POST | `{ avgCommission, dailyClicks, conversionRate, targetEarnings }` | `{ daily, monthly, yearly, breakEven, milestones }` |
| `/api/profit/xtra` | GET | `category, sort` | `{ products: XtraProduct[], cached }` |

---

## 9. Shopee Integration

### Integration Architecture

```
┌──────────────┐     User Credentials     ┌──────────────┐
│  Settings    │ ────────────────────────► │  AppSetting  │
│  Page        │   (appId, secret, region) │  (Database)  │
└──────────────┘                           └──────┬───────┘
                                                  │
                                    ┌─────────────▼──────────────┐
                                    │  ShopeeAffiliateService     │
                                    │  (Singleton Factory)        │
                                    │                             │
                                    │  getConfigFromDB()          │
                                    │  if credentials present:    │
                                    │    testConnection()         │
                                    │    if success → GraphQL     │
                                    │    if fail → Mock           │
                                    │  else:                      │
                                    │    → Mock                   │
                                    └─────────────┬──────────────┘
                                                  │
                           ┌──────────────────────┼──────────────────────┐
                           │                      │                      │
                    ┌──────▼──────┐        ┌──────▼──────┐        ┌─────▼─────┐
                    │  GraphQL    │        │   Mock      │        │  Cache    │
                    │  Client     │        │   Service   │        │  (5 min)  │
                    │             │        │             │        │           │
                    │ HMAC-SHA256 │        │ 50+ products│        │ Status    │
                    │ Auth        │        │ 30 shops    │        │ checks    │
                    │             │        │ RM pricing  │        │           │
                    │ Regional    │        │ Malay/EN    │        │           │
                    │ Endpoints   │        │ names       │        │           │
                    └──────┬──────┘        └──────┬──────┘        └───────────┘
                           │                      │
                           └──────────┬───────────┘
                                      │
                            ┌─────────▼─────────┐
                            │ Unified Response  │
                            │ source:           │
                            │ "graphql_api" |   │
                            │ "mock"            │
                            └───────────────────┘
```

### GraphQL Client Specifications

**Authentication:** HMAC-SHA256 signature

```typescript
// Signature generation:
const timestamp = Math.floor(Date.now() / 1000)
const signString = `${appId}${timestamp}`
const signature = crypto
  .createHmac('sha256', secret)
  .update(signString)
  .hexdigest()
```

**Regional Endpoints:**

| Region | Base URL |
|--------|----------|
| Malaysia (MY) | `https://open.shopee.com.my/api/v2` |
| Singapore (SG) | `https://open.shopee.sg/api/v2` |
| Indonesia (ID) | `https://open.shopee.co.id/api/v2` |
| Thailand (TH) | `https://open.shopee.co.th/api/v2` |
| Philippines (PH) | `https://open.shopee.ph/api/v2` |
| Vietnam (VN) | `https://open.shopee.vn/api/v2` |

**GraphQL Operations:**

| Operation | Type | Description |
|-----------|------|-------------|
| `productSearch` | Query | Search products by keyword with filters |
| `productDetail` | Query | Get product details by ID |
| `generateAffiliateLink` | Mutation | Generate tracking link for product |
| `commissionOrders` | Query | Get commission order list |
| `commissionSummary` | Query | Get commission summary |
| `clickStats` | Query | Get click statistics |
| `affiliateProfile` | Query | Get affiliate profile info |

### Webhook Integration

**Endpoint:** `POST /api/shopee/webhook`

**Security:** HMAC-SHA256 signature verification

**Supported Events:**

| Event | Payload | Processing |
|-------|---------|------------|
| `order_conversion` | `{ orderId, amount, commission, linkId }` | Save Conversion record + create Notification |
| `click` | `{ linkId, ip, country, device, browser, os }` | Save ClickRecord + increment link.clicks |
| `commission_update` | `{ orderId, status, commission }` | Update Conversion.status |

---

## 10. HERMES AI Agent

### Overview

HERMES is an AI agent integration that provides intelligent assistance for affiliate marketing operations. It is powered by z-ai-web-dev-sdk's LLM chat completion API and maintains persistent memory across sessions.

### Core Capabilities

| Capability | Description | Implementation |
|-----------|-------------|----------------|
| **Chat** | Natural language conversations about affiliate marketing | z-ai-web-dev-sdk LLM chat with conversation history |
| **Skills** | Custom AI skills with triggers and execution logic | Database-backed skill definitions with category/type system |
| **Tasks** | Scheduled automated tasks (cron-based) | HermesTask model with schedule, status, and result tracking |
| **Insights** | AI-generated business insights from data | Analysis of DB stats → AI interpretation → structured insights |
| **Memory** | Persistent conversation and preference memory | AgentMemory model with agent/session/content indexing |

### Chat Flow

```
User sends message
  → POST /api/hermes/chat { message, conversationId? }
  → If no conversationId: create HermesConversation
  → Save user message as HermesMessage (role: "user")
  → Load conversation history (last 20 messages)
  → Build system prompt with context:
      "You are HERMES, an AI assistant for Malaysian Shopee affiliates..."
  → Call z-ai-web-dev-sdk LLM chat completion
  → Save AI response as HermesMessage (role: "assistant")
  → Return response to client
```

### Skills System

Skills are reusable AI capabilities that can be triggered by natural language or scheduled tasks:

| Pre-built Skill | Trigger | Capability |
|-----------------|---------|------------|
| Product Analyzer | "analyze product" | Score products for profitability |
| Content Writer | "write content" | Generate marketing content |
| Trend Monitor | "check trends" | Discover trending products |
| Competitor Spy | "spy competitor" | Analyze competitor strategies |
| Commission Finder | "find commission" | Locate Commission XTRA products |

### Task Automation

Tasks enable scheduled execution of skills:

```typescript
// Example task: Daily trend check
{
  name: "Daily Trend Check",
  schedule: "0 9 * * *",  // Every day at 9 AM
  skillId: "trend-monitor-skill-id",
  status: "scheduled"
}

// Execution flow:
// 1. Cron trigger fires
// 2. Task status → "running"
// 3. Execute associated skill
// 4. Save result to task.lastResult
// 5. Update task status → "completed" or "failed"
// 6. Increment task.runCount
```

### Insight Generation

```
GET /api/hermes/insights
  → Query database for current stats:
      - Total clicks, conversions, earnings
      - Recent performance trends
      - Top products and categories
  → Build analysis prompt with stats
  → Call z-ai-web-dev-sdk for insight generation
  → Parse and structure insights:
      { type, title, description, severity, data }
  → Save to HermesInsight table
  → Return insights
```

---

## 11. Non-Functional Requirements

### Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page load time (first contentful paint) | < 2 seconds | Lighthouse |
| API response time (cached) | < 200ms | Server timing |
| API response time (uncached) | < 3 seconds | Server timing |
| AI content generation | < 10 seconds | Client timing |
| Dashboard refresh | < 1 second | Client timing |

### Reliability

| Requirement | Specification |
|-------------|--------------|
| Uptime target | 99.5% |
| Graceful degradation | All features work with mock data when APIs unavailable |
| Error recovery | Automatic retry for transient API failures (max 3) |
| Data persistence | SQLite with Prisma ORM, automatic migrations |
| Cache invalidation | Time-based TTL + manual refresh option |

### Security

| Requirement | Implementation |
|-------------|---------------|
| API credential storage | AppSetting table (encrypted at rest via SQLite) |
| Credential masking | API responses mask secrets (show last 4 chars) |
| Webhook verification | HMAC-SHA256 signature validation |
| Input validation | Zod schemas on all POST endpoints |
| SQL injection prevention | Prisma parameterized queries |
| XSS prevention | React's built-in escaping + CSP headers |

### Accessibility

| Requirement | Implementation |
|-------------|---------------|
| WCAG 2.1 AA | Semantic HTML, ARIA labels, keyboard navigation |
| Screen reader support | sr-only labels, descriptive alt text |
| Color contrast | Minimum 4.5:1 contrast ratio |
| Touch targets | Minimum 44px for interactive elements |
| Focus indicators | Visible focus rings on all interactive elements |

### Responsiveness

| Breakpoint | Layout |
|-----------|--------|
| Mobile (< 640px) | Bottom nav, single column, FAB button |
| Tablet (640-1024px) | Collapsible sidebar, 2-column grid |
| Desktop (> 1024px) | Full sidebar, multi-column grids |

### Internationalization

| Language | Status |
|----------|--------|
| English | Full UI support |
| Bahasa Malaysia | Content generation support |
| Manglish | Content generation support (primary) |

---

## 12. Malaysian Market Requirements

### Currency & Pricing

- All monetary values displayed in **RM (Malaysian Ringgit)**
- Format: `RM XX.XX` (e.g., RM 19.90)
- Commission calculations always in RM

### Language & Content

| Requirement | Specification |
|-------------|---------------|
| UI Language | English (with Malaysian colloquialisms) |
| Content Generation | English, Bahasa Malaysia, Manglish |
| Product Names | Support Malay and English product names |
| Hashtag Strategy | Malaysian-specific: #RacunShopee, #Budol, #SkincareMalaysia |

### Peak Engagement Times (MYT, UTC+8)

| Time | Engagement | Description |
|------|-----------|-------------|
| 7:00-9:00 PM | **Highest** | Golden Hour — after work browsing |
| 12:00-2:00 PM | **High** | Lunch Rush — lunch break scrolling |
| 9:00 PM-12:00 AM | **Medium-High** | Impulse Hour — late night shopping |
| 6:00-8:00 AM | **Medium** | Morning Commute |
| 2:00-5:00 PM | **Low** | Work hours |

### Seasonal Events Calendar

All promotional planning must account for these Malaysian shopping events:

| Event | Period | Commission Impact | Preparation |
|-------|--------|------------------|-------------|
| Chinese New Year | Jan-Feb | 2-3x commission | Start Dec |
| Ramadan/Raya | Variable (30+7 days) | 3-5x commission | Start 2 weeks before |
| Mid-Year Sale | June-July | 2-3x commission | Start May |
| 9.9 Super Shopping Day | Sep 9 | 2-4x commission | Start Aug |
| 10.10 Sale | Oct 10 | 2-4x commission | Start Sep |
| 11.11 Big Sale | Nov 11 | 3-5x commission | Start Oct |
| 12.12 Year-End Sale | Dec 12 | 3-5x commission | Start Nov |

### Commission Structure (Shopee Malaysia)

| Category | Base Rate | XTRA Rate | Total Potential |
|----------|-----------|-----------|-----------------|
| Beauty & Personal Care | 8-12% | Up to +40% | Up to 16.8% |
| Health | 6-10% | Up to +35% | Up to 13.5% |
| Fashion | 5-8% | Up to +30% | Up to 10.4% |
| Home & Living | 4-7% | Up to +25% | Up to 8.75% |
| Electronics | 2.5-5% | Up to +20% | Up to 6% |
| Shopee Live | Variable | Up to +80% | Up to 80%+ |

### Platform Preferences (Malaysian Market)

| Platform | Monthly Active Users (MY) | Best For | Avg. Conversion Rate |
|----------|--------------------------|----------|---------------------|
| TikTok | 15M+ | Beauty, Fashion, Food | 3-8% |
| Shopee Live | 5M+ (shoppers) | Flash Sales, Demo | 5-15% |
| Instagram | 10M+ | Beauty, Lifestyle | 2-5% |
| Facebook | 20M+ | General, Family | 1-3% |
| YouTube | 15M+ | Reviews, Tutorials | 1-4% |

---

## 13. Success Metrics

### Key Performance Indicators

| KPI | Description | Target (3 months) | Target (6 months) |
|-----|-------------|-------------------|-------------------|
| **User Activation** | Users who generate first affiliate link | 80% | 90% |
| **Content Creation** | Average AI content generations per user per week | 5 | 10 |
| **Auto-Post Usage** | Users who schedule at least 5 posts/week | 40% | 60% |
| **Profit Score Usage** | Products scored before promotion | 50% | 75% |
| **Commission XTRA** | Users who find and promote XTRA products | 30% | 50% |
| **HERMES Engagement** | Users who chat with HERMES weekly | 60% | 80% |
| **Earnings Impact** | Average monthly earnings increase | +20% | +40% |
| **Retention** | Monthly active users | 70% | 80% |

### Feature Adoption Targets

| Feature | 1-Month Adoption | 3-Month Adoption |
|---------|------------------|------------------|
| Dashboard | 100% | 100% |
| Product Search | 90% | 95% |
| Link Generation | 85% | 95% |
| AI Content Generator | 50% | 75% |
| Auto-Post | 30% | 60% |
| Trend Spy | 40% | 65% |
| Profit Optimizer | 35% | 55% |
| Content Studio | 25% | 45% |
| HERMES Chat | 60% | 80% |

---

## 14. Roadmap

### v8.0 (Current) — Foundation

- [x] 18-page SPA with sidebar navigation
- [x] Shopee GraphQL API integration with mock fallback
- [x] HERMES AI Hub with chat, skills, tasks, insights
- [x] Product discovery and affiliate link management
- [x] Dashboard and analytics
- [x] Earnings tracking and payout management
- [x] Commission calculator
- [x] Campaign management
- [x] Achievement and leaderboard system
- [x] Social Media Auto-Post with smart scheduling
- [x] AI Content Generator (6 content types, 3 languages, 4 tones)
- [x] Trend Spy (products, keywords, competitors, seasonal)
- [x] Profit Optimizer (scoring, Commission XTRA, earnings calculator)
- [x] Content Studio (video scripts, TTS, timed captions)
- [x] Dark/light mode theme
- [x] Mobile-responsive design
- [x] Onboarding tour

### v8.1 (Planned) — Fix & Strengthen Core

- [ ] User authentication with NextAuth.js (email + social login)
- [ ] Real platform API posting (Facebook, Instagram at minimum)
- [ ] Real-time WebSocket notification system
- [ ] Mobile UX polish and PWA support
- [ ] Data export: CSV and PDF report generation
- [ ] Error handling and edge case hardening
- [ ] Comprehensive test coverage for API routes

### v9.0 (Planned) — Multi-Platform

- [ ] TikTok Shop Affiliate API integration
- [ ] Lazada Affiliate Network integration
- [ ] Shopee Live Dashboard (80% commission products)
- [ ] Multi-platform commission comparison view
- [ ] Unified earnings dashboard (all platforms)
- [ ] Cross-platform product matcher (find same product, pick best commission)
- [ ] Platform-specific link generation

### v10.0 (Planned) — AI Superpowers

- [ ] AI Product Recommender (audience-based suggestions)
- [ ] AI Video Thumbnail Generator
- [ ] Smart Commission XTRA Alert Bot (push notifications)
- [ ] AI A/B Content Testing (3 variants with predicted CTR)
- [ ] HERMES Proactive Insights (push instead of pull)
- [ ] AI Audience Analyzer (click data → audience insights)
- [ ] Auto-Hashtag Optimizer (track performance → suggest optimal mix)
- [ ] AI Content Calendar Generator (weekly plan based on trends + seasonal)

### v11.0 (Vision) — Monetize & Scale

- [ ] Freemium pricing model with Stripe/payment integration
- [ ] Affiliate Content Marketplace (buy/sell templates)
- [ ] Team/Agency multi-user dashboard with role-based access
- [ ] White-label option for enterprises
- [ ] API as a Service (developer access)
- [ ] React Native mobile app
- [ ] Advanced analytics with predictive forecasting
- [ ] Automated campaign optimization

---

## 15. Competitive Analysis

### Market Landscape

> **Key Finding:** NO existing platform combines Shopee-specific integration + AI content generation + Malaysian market optimization + multi-platform support. TheViralFindsMY has a significant first-mover advantage.

### Direct Competitors

| Competitor | Type | Strengths | Weaknesses | Price |
|-----------|------|-----------|-----------|-------|
| **Shopee Affiliate Dashboard** (Official) | Platform-native | Official data, real-time, free | No AI, no scheduling, no content gen, basic analytics | Free |
| **Involve Asia** | Affiliate network | Multi-brand, established in MY | Not Shopee-specific, no AI tools, no content gen, approval required | Free |
| **ShopBack** | Cashback platform | Large user base, brand trust | User-facing (buyers), not creator tools, no affiliate management | Free |

### Partial Competitors

| Competitor | Overlap | Gap vs Us | Price |
|-----------|---------|-----------|-------|
| **Hootsuite** | Social scheduling + analytics | No affiliate tracking, no Shopee, no AI content, no Malaysian focus | USD99-249/mo |
| **Blaze.ai** | AI content + social media | No Shopee, no affiliate links, no commission tracking, no MY market | USD79-899/mo |
| **ContentGenerator.io** | AI content automation | No Shopee, no affiliate management, no Malaysian market | USD29-99/mo |
| **ShopReel AI** | TikTok video automation | TikTok only, no Shopee, no MY market | Freemium |
| **Affilimate** | Analytics + revenue optimization | No Shopee support, no content gen, no social scheduling | USD99-499/mo |
| **Tapfiliate** | Affiliate tracking | For merchants (not affiliates), no AI, no content | USD69-249/mo |
| **Trackdesk** | Click/conversion tracking | For merchants, no AI, no content tools | USD67-327/mo |

### Competitive Advantage Matrix

| Capability | TheViralFindsMY | Shopee Official | Involve Asia | Hootsuite | Blaze.ai | Affilimate |
|-----------|-----------------|-----------------|--------------|-----------|----------|------------|
| Shopee API Integration | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| TikTok Shop Integration | 🔄 Planned | ❌ | ❌ | ❌ | ❌ | ❌ |
| AI Content (Manglish/BM/EN) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Auto-Post Scheduling | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Profit Scoring (0-100) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Commission XTRA Finder | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Trend & Competitor Spy | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| HERMES AI Agent | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Video Script Generator | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| TTS Voiceover (BM) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Malaysian Peak Times | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Seasonal Calendar | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gamification | ✅ | ❌ | Partial | ❌ | ❌ | ❌ |
| Demo Mode (No API needed) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Malaysian Market Focus | ✅ | ✅ | Partial | ❌ | ❌ | ❌ |

### Competitive Threats

| Threat | Likelihood | Impact | Mitigation |
|--------|-----------|--------|------------|
| Shopee upgrades official dashboard with AI | Medium | High | Move faster, add multi-platform (Shopee can't) |
| Involve Asia adds Shopee + AI features | Low | High | First-mover advantage, deeper Shopee integration |
| Global AI tools localise for SEA | Medium | Medium | Malaysian-specific features (Manglish, peak times, Raya) |
| New startup enters same niche | Low | Medium | Build community, lock in users with HERMES memory |

---

## 16. Improvement Specifications

### 16.1 User Authentication (NextAuth.js)

**Priority:** URGENT | **Fasa:** 1 | **Effort:** Medium

**Problem:** Without authentication, all users share the same data. No security, no multi-user capability, no monetization possible.

**Solution:** Implement NextAuth.js v4 with multiple providers.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|------------|----------|
| AUTH-01 | Email/password registration and login | Must |
| AUTH-02 | Google OAuth login | Must |
| AUTH-03 | Facebook OAuth login | Should |
| AUTH-04 | User session management with JWT tokens | Must |
| AUTH-05 | Protected API routes (middleware) | Must |
| AUTH-06 | User profile page (name, avatar, Shopee ID) | Must |
| AUTH-07 | Role-based access (admin, affiliate, viewer) | Should |
| AUTH-08 | Password reset via email | Could |
| AUTH-09 | Two-factor authentication | Could |
| AUTH-10 | Session activity logging | Could |

**Database Changes:**
- Update `User` model to include `emailVerified`, `image`, `accounts`, `sessions`
- Add `Account` and `Session` models for NextAuth.js

---

### 16.2 Real Platform API Posting

**Priority:** HIGH | **Fasa:** 1 | **Effort:** Large

**Problem:** Auto-Post currently saves to database but doesn't actually publish to social media platforms.

**Solution:** Implement real API connections for at least Facebook and Instagram, with draft sharing for TikTok.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|------------|----------|
| POST-01 | Facebook Graph API integration (Page posting) | Must |
| POST-02 | Instagram Graph API integration (Business account) | Must |
| POST-03 | TikTok draft/video upload via API | Should |
| POST-04 | Twitter/X API v2 posting | Should |
| POST-05 | YouTube Shorts upload | Could |
| POST-06 | OAuth connection flow per platform | Must |
| POST-07 | Platform credential management in Settings | Must |
| POST-08 | Post status tracking (scheduled → publishing → published/failed) | Must |
| POST-09 | Retry failed posts (max 3 attempts) | Should |
| POST-10 | Post analytics after publishing (reach, engagement) | Could |

**Database Changes:**
- Add `SocialAccount` model (platform, accessToken, refreshToken, expiresAt)
- Update `ScheduledPost` to include `platformPostIds` (JSON)

---

### 16.3 Real-Time WebSocket Notifications

**Priority:** HIGH | **Fasa:** 1 | **Effort:** Medium

**Problem:** Users don't know about conversions, clicks, or commission changes in real-time.

**Solution:** Socket.io-based notification service with mini-service architecture.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|------------|----------|
| WS-01 | Socket.io mini-service on separate port | Must |
| WS-02 | Real-time conversion alerts | Must |
| WS-03 | Real-time click notifications | Must |
| WS-04 | Commission XTRA activation alerts | Should |
| WS-05 | HERMES insight push notifications | Should |
| WS-06 | Browser push notification support | Could |
| WS-07 | Notification sound effects | Could |
| WS-08 | Connection status indicator in header | Must |

---

### 16.4 TikTok Shop Affiliate API Integration

**Priority:** URGENT | **Fasa:** 2 | **Effort:** Large

**Problem:** TikTok is #1 platform for Malaysian affiliates (highest organic reach), but we don't support it.

**Solution:** Integrate TikTok Shop Affiliate API for product search, link generation, and commission tracking.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|------------|----------|
| TTS-01 | TikTok Shop Partner API registration and auth | Must |
| TTS-02 | Product search via TikTok Shop API | Must |
| TTS-03 | Affiliate link generation for TikTok Shop | Must |
| TTS-04 | Commission order tracking | Must |
| TTS-05 | Cross-platform commission comparison (Shopee vs TikTok) | Must |
| TTS-06 | TikTok-specific content templates | Should |
| TTS-07 | TikTok Shop trend monitoring | Should |
| TTS-08 | TikTok video performance tracking | Could |

**Database Changes:**
- Add `TikTokShopAccount` model
- Add `platform` field to `AffiliateLink` (shopee/tiktok/lazada)
- Add `PlatformEarnings` model for unified dashboard

---

### 16.5 Shopee Live Dashboard

**Priority:** HIGH | **Fasa:** 2 | **Effort:** Large

**Problem:** Shopee Live offers up to 80% commission — the highest earning opportunity — but no tool helps affiliates manage and optimize live sessions.

**Solution:** Dedicated Shopee Live management dashboard.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|------------|----------|
| SL-01 | Live session scheduler and countdown | Must |
| SL-02 | Commission rate display (base + Live bonus) | Must |
| SL-03 | Product queue management for live sessions | Must |
| SL-04 | Live script generator (opening, demo, Q&A, flash sale) | Must |
| SL-05 | Real-time viewer and conversion tracking | Should |
| SL-06 | Flash sale timer integration | Should |
| SL-07 | Post-live analytics (viewers, conversions, earnings) | Should |
| SL-08 | Live session recording and replay | Could |

---

### 16.6 AI Superpowers (Fasa 3)

#### 16.6.1 AI Product Recommender

**Solution:** Based on user's audience profile (age, gender, interests from click data) and past conversion performance, recommend the best products to promote.

**Algorithm:**
```
Recommendation Score = Audience_Match (40%) + Commission_Potential (30%) + Trend_Signal (20%) + Competition_Gap (10%)

Where:
  Audience_Match = similarity(user_audience_profile, product_buyer_profile)
  Commission_Potential = commission_rate × avg_order_value × conversion_rate
  Trend_Signal = trending_direction × velocity
  Competition_Gap = 1 - normalized(number_of_competing_affiliates)
```

#### 16.6.2 Smart Commission XTRA Alert Bot

**Solution:** Monitor Commission XTRA availability and push alerts to users via WebSocket and email.

**Alert Types:**
| Alert | Trigger | Channel |
|-------|---------|---------|
| XTRA Activated | New Commission XTRA product in user's niche | WebSocket + Email |
| XTRA Expiring | Commission XTRA ending within 24 hours | WebSocket + Push |
| High-Value XTRA | Commission XTRA > 30% in user's category | WebSocket + Email + Push |
| Competitor XTRA | Top competitor promoting XTRA product | WebSocket |

#### 16.6.3 AI A/B Content Testing

**Solution:** Generate 3 content variants and predict performance using historical data.

```
For each generated content:
  1. Generate 3 variants (different hooks/CTAs/tone)
  2. Score each variant using AI (predicted CTR, engagement)
  3. Present to user with prediction scores
  4. After posting, track actual performance
  5. Feed results back to improve prediction model
```

---

## 17. Monetization Strategy

### Pricing Model: Freemium with Tiered Subscriptions

| Tier | Price (RM/month) | Target Segment | Conversion Rate | Key Value |
|------|------------------|---------------|-----------------|-----------|
| **Free** | RM0 | New affiliates, students | 100% (acquisition) | Basic tools to get started |
| **Pro** | RM49 | Active affiliates | 5-8% of Free | AI content + auto-post + insights |
| **Business** | RM149 | Agencies, power users | 8-12% of Pro | Multi-platform + team + analytics |
| **Enterprise** | Custom (RM2,000+) | Brands, networks | Negotiated | White-label + API + SLA |

### Feature Gate Matrix

| Feature | Free | Pro | Business | Enterprise |
|---------|------|-----|----------|------------|
| Dashboard & Analytics | ✅ Basic | ✅ Full | ✅ Full | ✅ Full |
| Product Search | ✅ 50/month | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited |
| Link Generation | ✅ 20/month | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited |
| AI Content Generation | ❌ | ✅ 50/month | ✅ Unlimited | ✅ Unlimited |
| Auto-Post Scheduling | ❌ | ✅ 3 platforms | ✅ All platforms | ✅ All platforms |
| Profit Scoring | ❌ | ✅ | ✅ | ✅ |
| Commission XTRA Finder | ❌ | ✅ | ✅ + Alerts | ✅ + Alerts |
| Trend Spy | ❌ | ✅ | ✅ | ✅ |
| HERMES AI Chat | ❌ | ✅ 50 msgs/day | ✅ Unlimited | ✅ Custom model |
| TikTok Shop Integration | ❌ | ❌ | ✅ | ✅ |
| Team Members | 1 | 1 | 5 | Unlimited |
| Data Export | ❌ | ✅ CSV | ✅ CSV + PDF | ✅ All formats |
| API Access | ❌ | ❌ | ❌ | ✅ |
| White-Label | ❌ | ❌ | ❌ | ✅ |
| Priority Support | ❌ | ❌ | ✅ | ✅ + SLA |

### Revenue Projections

```
Year 1 (Conservative):
  Free Users:     10,000
  Pro Users:        500 × RM49/mo  = RM24,500/mo → RM294,000/yr
  Business Users:    50 × RM149/mo = RM7,450/mo  → RM89,400/yr
  Enterprise:         5 × RM2,000/mo = RM10,000/mo → RM120,000/yr
  ──────────────────────────────────────────────
  Total Year 1: ~RM503,400

Year 2 (Growth):
  Free Users:     25,000
  Pro Users:      1,500 × RM49/mo  = RM73,500/mo → RM882,000/yr
  Business Users:   200 × RM149/mo = RM29,800/mo → RM357,600/yr
  Enterprise:        15 × RM2,000/mo = RM30,000/mo → RM360,000/yr
  ──────────────────────────────────────────────
  Total Year 2: ~RM1,599,600

Year 3 (Scale):
  Free Users:     50,000
  Pro Users:      3,000 × RM49/mo  = RM147,000/mo → RM1,764,000/yr
  Business Users:   500 × RM149/mo = RM74,500/mo  → RM894,000/yr
  Enterprise:        30 × RM2,000/mo = RM60,000/mo → RM720,000/yr
  ──────────────────────────────────────────────
  Total Year 3: ~RM3,378,000
```

### Payment Integration

- **Stripe** for international cards
- **Billplz** / **SenangPay** for Malaysian bank transfers and FPX
- **RevenueCat** for mobile in-app purchases (future)

---

## 18. Appendix

### A. Glossary

| Term | Definition |
|------|-----------|
| **Shopee** | Southeast Asia's leading e-commerce platform |
| **Shopee Affiliate** | Program where users earn commission by promoting Shopee products |
| **Commission XTRA** | Shopee's promotional program offering extra commission on selected products |
| **Commission XTRA** | Temporary commission boosts during campaigns (up to 40-50% extra) |
| **Manglish** | Malaysian English — a colloquial mix of English, Malay, and Chinese influences |
| **RM** | Malaysian Ringgit (currency) |
| **MYT** | Malaysia Time (UTC+8) |
| **HERMES** | The AI agent system integrated into the platform |
| **HMAC-SHA256** | Hash-based Message Authentication Code used for Shopee API security |
| **GraphQL** | Query language for APIs used by Shopee Affiliate Open API |
| **CTA** | Call to Action — prompt for user to take a specific action |
| **CTR** | Click-Through Rate — percentage of impressions that result in clicks |
| **AOV** | Average Order Value — average amount spent per order |
| **SRT** | SubRip Text — subtitle file format |
| **TTS** | Text-to-Speech — converting written text to spoken audio |
| **Racun** | Malay slang for "poison" — used in affiliate context to mean "irresistible product" |
| **Budol** | Filipino slang adopted in Malaysia meaning "influenced to buy" |

### B. Malaysian Market Data Sources

- Shopee Malaysia Affiliate Program documentation
- Malaysian Digital Economy Blueprint (MyDIGITAL)
- Statista: E-commerce penetration in Malaysia
- Google Trends: Malaysian shopping behavior
- Shopee Commission Rate Cards (internal)

### C. Top Malaysian Affiliate References

| Affiliate | Platform | Niche | Estimated Monthly Earnings |
|-----------|----------|-------|---------------------------|
| Sabrinabeautyhub | TikTok + Shopee | Beauty | RM50K+ |
| Faisaldotmy | TikTok | Multi-category | RM50K+ |
| Erawan1308 | Multi-platform | Home & Living | RM7.2K |
| JejakaTrend | TikTok | Fashion | RM5K-10K |
| CikguShopee | YouTube + Shopee Live | Education | RM3K-8K |

### D. Technology Decision Rationale

| Decision | Rationale |
|----------|-----------|
| Next.js 16 | App Router, API routes, SSR/SSG capabilities, React Server Components |
| SQLite | Zero-config, file-based, sufficient for single-user/small-team usage |
| Prisma | Type-safe ORM, excellent TypeScript support, easy migrations |
| shadcn/ui | High-quality, accessible, customizable components |
| Zustand | Minimal boilerplate, excellent TypeScript support, simple API |
| TanStack Query | Automatic caching, background refetching, optimistic updates |
| z-ai-web-dev-sdk | Integrated AI capabilities (LLM, TTS, Web Search) without external API keys |
| Framer Motion | Declarative animations, gesture support, layout animations |
| Tailwind CSS 4 | Utility-first, JIT compilation, excellent design system support |

### E. Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `file:./db/custom.db` | SQLite database path |
| `SHOPEE_APP_ID` | No | - | Shopee Affiliate API App ID |
| `SHOPEE_SECRET` | No | - | Shopee Affiliate API Secret |
| `SHOPEE_REGION` | No | `my` | Shopee region (my/sg/id/th/ph/vn) |
| `NEXTAUTH_SECRET` | No | - | NextAuth.js secret key |
| `NEXTAUTH_URL` | No | `http://localhost:3000` | NextAuth.js callback URL |

---

<p align="center">
  <strong>TheViralFindsMY — Product Requirements Document v8.1</strong><br/>
  <em>Last updated: June 2025</em>
</p>
